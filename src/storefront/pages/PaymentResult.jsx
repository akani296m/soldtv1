import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, Loader, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useMerchant } from '../context/MerchantContext';
import { useCart } from '../../context/cartcontext';
import { supabase } from '../../lib/supabase';
import {
    buildOmnisendContact,
    buildOmnisendEventId,
    buildOmnisendLineItems,
    trackOmnisendEvent
} from '../../lib/omnisend';

export default function PaymentResult() {
    const navigate = useNavigate();
    const { merchantSlug } = useParams();
    const { isCustomDomain } = useMerchant();
    const { clearCart } = useCart();
    const [searchParams] = useSearchParams();
    const basePath = isCustomDomain ? '' : `/s/${merchantSlug}`;

    const [status, setStatus] = useState('processing'); // processing, success, cancelled, failed
    const [orderId, setOrderId] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const processPaymentResult = async () => {
            // Get URL parameters from Yoco redirect
            const checkoutId = searchParams.get('id') || searchParams.get('checkoutId');
            const paymentStatus = searchParams.get('status');
            const paymentId = searchParams.get('paymentId');

            // Check for stored pending order data
            const pendingOrderData = sessionStorage.getItem('pendingYocoOrder');

            // Determine status from URL path
            const path = window.location.pathname;
            let resultStatus = 'processing';

            if (path.includes('/payment-success') || paymentStatus === 'completed') {
                resultStatus = 'success';
            } else if (path.includes('/payment-cancelled') || paymentStatus === 'cancelled') {
                resultStatus = 'cancelled';
            } else if (path.includes('/payment-failed') || paymentStatus === 'failed') {
                resultStatus = 'failed';
            }

            setStatus(resultStatus);

            // Handle successful payment
            if (resultStatus === 'success' && pendingOrderData) {
                try {
                    const orderData = JSON.parse(pendingOrderData);

                    // Update order data with Yoco payment info
                    orderData.payment_status = 'paid';
                    orderData.payment_reference = paymentId || checkoutId;
                    orderData.payment_method = 'yoco';
                    orderData.status = 'processing';

                    // Create order in database
                    const { data: createdOrder, error: orderError } = await supabase
                        .from('orders')
                        .insert([orderData])
                        .select()
                        .single();

                    if (orderError) {
                        console.error('Error creating order:', orderError);
                        setError('Payment was successful but we had trouble creating your order. Please contact support with reference: ' + (paymentId || checkoutId));
                        setStatus('failed');
                        return;
                    }

                    const orderContact = buildOmnisendContact({
                        email: createdOrder.customer_email,
                        phone: createdOrder.customer_phone,
                        firstName: createdOrder.customer_name,
                    });
                    const eventProperties = {
                        orderID: String(createdOrder.id),
                        currency: 'ZAR',
                        totalPrice: Number(createdOrder.total || 0),
                        subtotalPrice: Number(createdOrder.subtotal || 0),
                        shippingPrice: Number(createdOrder.shipping || 0),
                        taxPrice: Number(createdOrder.tax || 0),
                        paymentStatus: createdOrder.payment_status || null,
                        fulfillmentStatus: createdOrder.status || null,
                        createdAt: createdOrder.created_at || new Date().toISOString(),
                        lineItems: buildOmnisendLineItems(createdOrder.items || []),
                    };

                    void trackOmnisendEvent({
                        merchantId: createdOrder.merchant_id,
                        name: 'placed order',
                        eventID: buildOmnisendEventId({
                            type: 'order_placed',
                            orderId: createdOrder.id,
                        }),
                        contact: orderContact,
                        eventVersion: 'v2',
                        properties: eventProperties,
                    });
                    void trackOmnisendEvent({
                        merchantId: createdOrder.merchant_id,
                        name: 'paid for order',
                        eventID: buildOmnisendEventId({
                            type: 'order_paid',
                            orderId: createdOrder.id,
                        }),
                        contact: orderContact,
                        eventVersion: 'v2',
                        properties: eventProperties,
                    });

                    // Clear cart and pending order data
                    clearCart();
                    sessionStorage.removeItem('pendingYocoOrder');

                    setOrderId(createdOrder.id);

                    // Redirect to order confirmation after a short delay
                    setTimeout(() => {
                        navigate(`${basePath}/order-confirmation/${createdOrder.id}`, {
                            state: { orderId: createdOrder.id, orderData: createdOrder },
                            replace: true
                        });
                    }, 2000);

                } catch (err) {
                    console.error('Error processing order:', err);
                    setError('An error occurred while processing your order.');
                    setStatus('failed');
                }
            } else if (resultStatus === 'success' && !pendingOrderData) {
                // Success but no pending order data - might be a duplicate or direct access
                setError('Order data not found. If you completed a payment, please contact support.');
            }
        };

        processPaymentResult();
    }, [searchParams, navigate, basePath, clearCart]);

    const renderContent = () => {
        switch (status) {
            case 'processing':
                return (
                    <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <Loader className="w-10 h-10 text-blue-600 animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment...</h1>
                        <p className="text-gray-600">Please wait while we confirm your payment.</p>
                    </div>
                );

            case 'success':
                return (
                    <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
                        <p className="text-gray-600 mb-6">
                            {orderId
                                ? 'Your order has been placed successfully. Redirecting to your order confirmation...'
                                : 'Processing your order...'}
                        </p>
                        {error && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                <p className="text-yellow-800 text-sm">{error}</p>
                            </div>
                        )}
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                            <Loader className="w-4 h-4 animate-spin" />
                            <span>Redirecting...</span>
                        </div>
                    </div>
                );

            case 'cancelled':
                return (
                    <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-10 h-10 text-yellow-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
                        <p className="text-gray-600 mb-6">
                            You cancelled the payment. No charges were made to your account.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                to={`${basePath}/checkout`}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                <ArrowLeft size={18} />
                                Return to Checkout
                            </Link>
                            <Link
                                to={`${basePath}/`}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <ShoppingBag size={18} />
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                );

            case 'failed':
                return (
                    <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
                        <p className="text-gray-600 mb-4">
                            Unfortunately, your payment could not be processed.
                        </p>
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                                <p className="text-red-800 text-sm">{error}</p>
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                to={`${basePath}/checkout`}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                Try Again
                            </Link>
                            <Link
                                to={`${basePath}/`}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <ShoppingBag size={18} />
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen flex items-center justify-center py-12 px-6">
            <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm p-8">
                {renderContent()}
            </div>
        </div>
    );
}
