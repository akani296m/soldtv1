import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, Mail, ArrowRight, Download } from 'lucide-react';

export default function OrderConfirmation() {
    const location = useLocation();
    const navigate = useNavigate();
    const { orderId, orderData } = location.state || {};

    // Redirect if no order data
    useEffect(() => {
        if (!orderId || !orderData) {
            navigate('/store');
        }
    }, [orderId, orderData, navigate]);

    if (!orderId || !orderData) {
        return null;
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="max-w-3xl mx-auto px-6">
                {/* Success Message */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                        <CheckCircle className="text-green-600" size={48} strokeWidth={2} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                        Order Confirmed!
                    </h1>
                    <p className="text-lg text-gray-600 mb-2">
                        Thank you for your purchase, <strong>{orderData.customer_name}</strong>
                    </p>
                    <p className="text-gray-500">
                        Your order <span className="font-mono font-medium">#{orderId}</span> has been received and is being processed.
                    </p>
                </div>

                {/* Order Details Card */}
                <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
                    <div className="flex items-center justify-between mb-6 pb-6 border-b">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-1">Order Details</h2>
                            <p className="text-sm text-gray-500">Order ID: #{orderId}</p>
                        </div>
                        <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                            <Download size={16} />
                            Download Receipt
                        </button>
                    </div>

                    {/* Order Items */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Items Ordered</h3>
                        <div className="space-y-3">
                            {orderData.items.map((item, index) => (
                                <div key={index} className="flex justify-between items-center py-3 border-b last:border-b-0">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{item.title}</p>
                                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                                    </div>
                                    <p className="font-medium">
                                        R {item.subtotal.toLocaleString('en-ZA', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>R {orderData.subtotal.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Shipping</span>
                                {orderData.shipping === 0 ? (
                                    <span className="text-green-600 font-medium">FREE</span>
                                ) : (
                                    <span>R {orderData.shipping.toFixed(2)}</span>
                                )}
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>VAT (15%)</span>
                                <span>R {orderData.tax.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total Paid</span>
                                    <span>R {orderData.total.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {orderData.customer_name}<br />
                                {orderData.shipping_address.address}<br />
                                {orderData.shipping_address.city}, {orderData.shipping_address.province}<br />
                                {orderData.shipping_address.postalCode}
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Email: {orderData.customer_email}<br />
                                Phone: {orderData.customer_phone}
                            </p>
                        </div>
                    </div>

                    {orderData.notes && (
                        <div className="mt-6 pt-6 border-t">
                            <h3 className="font-semibold text-gray-900 mb-2">Order Notes</h3>
                            <p className="text-gray-600 text-sm">{orderData.notes}</p>
                        </div>
                    )}
                </div>

                {/* What's Next */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Mail className="text-blue-600" size={20} />
                        What happens next?
                    </h3>
                    <div className="space-y-3 text-sm text-gray-700">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                            <p>You'll receive an order confirmation email at <strong>{orderData.customer_email}</strong></p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                            <p>We'll send you tracking information once your order ships</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                            <p>Estimated delivery: 3-5 business days</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                        to="/store"
                        className="flex-1 bg-black text-white font-bold py-4 rounded-lg hover:bg-gray-800 transition text-center flex items-center justify-center gap-2"
                    >
                        Continue Shopping
                        <ArrowRight size={18} />
                    </Link>
                    <Link
                        to={`/orders/${orderId}`}
                        className="flex-1 border-2 border-gray-300 text-gray-700 font-bold py-4 rounded-lg hover:border-gray-400 transition text-center flex items-center justify-center gap-2"
                    >
                        <Package size={18} />
                        Track Order
                    </Link>
                </div>

                {/* Support */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>Need help? <Link to="/support" className="text-blue-600 hover:underline">Contact our support team</Link></p>
                </div>
            </div>
        </div>
    );
}
