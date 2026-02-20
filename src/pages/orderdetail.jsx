import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, CreditCard, User, XCircle, Loader2, Save, AlertCircle, DollarSign, ExternalLink, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAdminMerchant } from '../context/adminMerchantContext';
import {
    buildOmnisendContact,
    buildOmnisendEventId,
    buildOmnisendLineItems,
    trackOmnisendEvent
} from '../lib/omnisend';

// South African courier services
const COURIER_SERVICES = [
    'The Courier Guy',
    'RAM Hand to Hand',
    'DHL',
    'FedEx',
    'Aramex',
    'PostNet',
    'Pargo',
    'Fastway Couriers',
    'Dawn Wing',
    'Other',
];

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { merchantId, loading: merchantLoading } = useAdminMerchant();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('');

    // Tracking number state
    const [trackingNumber, setTrackingNumber] = useState('');
    const [trackingCarrier, setTrackingCarrier] = useState('');
    const [trackingUrl, setTrackingUrl] = useState('');
    const [savingTracking, setSavingTracking] = useState(false);
    const [trackingSaved, setTrackingSaved] = useState(false);

    // Payment status state
    const [updatingPayment, setUpdatingPayment] = useState(false);
    const [copiedRef, setCopiedRef] = useState(false);

    // Fetch order from Supabase - scoped to merchant
    useEffect(() => {
        const fetchOrder = async () => {
            // Wait for merchant context
            if (merchantLoading || !merchantId) {
                if (!merchantLoading) {
                    setLoading(false);
                }
                return;
            }

            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', id)
                    .eq('merchant_id', merchantId) // ✅ Scope to current merchant
                    .single();

                if (error) throw error;
                setOrder(data);
                setSelectedStatus(data.status);

                // Initialize tracking data
                setTrackingNumber(data.tracking_number || '');
                setTrackingCarrier(data.tracking_carrier || '');
                setTrackingUrl(data.tracking_url || '');
            } catch (error) {
                console.error('Error fetching order:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id, merchantId, merchantLoading]);

    const formatCurrency = (value) => {
        return `R ${Number(value).toLocaleString('en-ZA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusConfig = (status) => {
        const configs = {
            'delivered': {
                bg: 'bg-green-100',
                text: 'text-green-700',
                icon: CheckCircle,
                border: 'border-green-200',
                label: 'Delivered'
            },
            'shipped': {
                bg: 'bg-blue-100',
                text: 'text-blue-700',
                icon: Truck,
                border: 'border-blue-200',
                label: 'Shipped'
            },
            'processing': {
                bg: 'bg-yellow-100',
                text: 'text-yellow-700',
                icon: Package,
                border: 'border-yellow-200',
                label: 'Processing'
            },
            'pending': {
                bg: 'bg-gray-100',
                text: 'text-gray-700',
                icon: Clock,
                border: 'border-gray-200',
                label: 'Pending'
            },
            'cancelled': {
                bg: 'bg-red-100',
                text: 'text-red-700',
                icon: XCircle,
                border: 'border-red-200',
                label: 'Cancelled'
            }
        };
        return configs[status?.toLowerCase()] || configs['pending'];
    };

    const handleUpdateStatus = async () => {
        if (selectedStatus === order.status) return;
        if (!merchantId) {
            alert('Unable to update - merchant not identified');
            return;
        }

        try {
            setUpdating(true);
            const { error } = await supabase
                .from('orders')
                .update({ status: selectedStatus })
                .eq('id', id)
                .eq('merchant_id', merchantId); // ✅ Security: ensure order belongs to this merchant

            if (error) throw error;

            const updatedOrder = { ...order, status: selectedStatus };
            setOrder(updatedOrder);
            alert('Order status updated successfully!');

            const contact = buildOmnisendContact({
                email: updatedOrder.customer_email,
                phone: updatedOrder.customer_phone,
                firstName: updatedOrder.customer_name,
            });

            let eventName = null;
            if (selectedStatus === 'cancelled') {
                eventName = 'order canceled';
            } else if (selectedStatus === 'shipped' || selectedStatus === 'delivered') {
                eventName = 'order fulfilled';
            }

            if (eventName) {
                const eventType = selectedStatus === 'cancelled' ? 'order_canceled' : 'order_fulfilled';
                void trackOmnisendEvent({
                    merchantId,
                    name: eventName,
                    eventID: buildOmnisendEventId({
                        type: eventType,
                        orderId: updatedOrder.id,
                        statusVersion: selectedStatus,
                    }),
                    contact,
                    eventVersion: 'v2',
                    properties: buildOrderEventProperties(updatedOrder, selectedStatus),
                });
            }
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Failed to update order status');
        } finally {
            setUpdating(false);
        }
    };

    // Handle saving tracking information
    const handleSaveTracking = async () => {
        if (!merchantId) {
            alert('Unable to update - merchant not identified');
            return;
        }

        try {
            setSavingTracking(true);
            const { error } = await supabase
                .from('orders')
                .update({
                    tracking_number: trackingNumber.trim() || null,
                    tracking_carrier: trackingCarrier || null,
                    tracking_url: trackingUrl.trim() || null,
                })
                .eq('id', id)
                .eq('merchant_id', merchantId);

            if (error) throw error;

            setOrder({
                ...order,
                tracking_number: trackingNumber.trim() || null,
                tracking_carrier: trackingCarrier || null,
                tracking_url: trackingUrl.trim() || null,
            });

            setTrackingSaved(true);
            setTimeout(() => setTrackingSaved(false), 3000);
        } catch (error) {
            console.error('Error saving tracking info:', error);
            alert('Failed to save tracking information');
        } finally {
            setSavingTracking(false);
        }
    };

    // Handle marking EFT order as paid
    const handleMarkAsPaid = async () => {
        if (!merchantId) {
            alert('Unable to update - merchant not identified');
            return;
        }

        const confirmPaid = window.confirm(
            'Are you sure you want to mark this order as PAID?\n\nOnly do this after you have verified the Proof of Payment (PoP) from the customer.'
        );

        if (!confirmPaid) return;

        try {
            setUpdatingPayment(true);
            const { error } = await supabase
                .from('orders')
                .update({
                    payment_status: 'paid',
                    status: order.status === 'pending' ? 'processing' : order.status, // Auto-advance to processing if pending
                })
                .eq('id', id)
                .eq('merchant_id', merchantId);

            if (error) throw error;

            setOrder({
                ...order,
                payment_status: 'paid',
                status: order.status === 'pending' ? 'processing' : order.status,
            });
            setSelectedStatus(order.status === 'pending' ? 'processing' : order.status);

            alert('Order has been marked as PAID! ✓');

            const paidOrder = {
                ...order,
                payment_status: 'paid',
                status: order.status === 'pending' ? 'processing' : order.status,
            };
            const contact = buildOmnisendContact({
                email: paidOrder.customer_email,
                phone: paidOrder.customer_phone,
                firstName: paidOrder.customer_name,
            });

            void trackOmnisendEvent({
                merchantId,
                name: 'paid for order',
                eventID: buildOmnisendEventId({
                    type: 'order_paid',
                    orderId: paidOrder.id,
                }),
                contact,
                eventVersion: 'v2',
                properties: buildOrderEventProperties(paidOrder),
            });
        } catch (error) {
            console.error('Error marking order as paid:', error);
            alert('Failed to update payment status');
        } finally {
            setUpdatingPayment(false);
        }
    };

    // Copy payment reference to clipboard
    const copyPaymentRef = () => {
        if (order.payment_reference) {
            navigator.clipboard.writeText(order.payment_reference);
            setCopiedRef(true);
            setTimeout(() => setCopiedRef(false), 2000);
        }
    };

    // Get payment status configuration
    const getPaymentStatusConfig = (status) => {
        const configs = {
            'paid': {
                bg: 'bg-green-100',
                text: 'text-green-700',
                label: 'Paid',
                icon: CheckCircle,
            },
            'awaiting_payment': {
                bg: 'bg-amber-100',
                text: 'text-amber-700',
                label: 'Awaiting Payment',
                icon: Clock,
            },
            'pending': {
                bg: 'bg-yellow-100',
                text: 'text-yellow-700',
                label: 'Pending',
                icon: Clock,
            },
            'failed': {
                bg: 'bg-red-100',
                text: 'text-red-700',
                label: 'Failed',
                icon: XCircle,
            },
        };
        return configs[status] || configs['pending'];
    };

    const buildOrderEventProperties = (currentOrder, statusOverride) => ({
        orderID: String(currentOrder.id),
        currency: 'ZAR',
        totalPrice: Number(currentOrder.total || 0),
        subtotalPrice: Number(currentOrder.subtotal || 0),
        shippingPrice: Number(currentOrder.shipping || 0),
        taxPrice: Number(currentOrder.tax || 0),
        paymentStatus: currentOrder.payment_status || null,
        fulfillmentStatus: statusOverride || currentOrder.status || null,
        createdAt: currentOrder.created_at || new Date().toISOString(),
        lineItems: buildOmnisendLineItems(currentOrder.items || []),
    });

    if (loading) {
        return (
            <div className="p-8 max-w-5xl mx-auto">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="p-8 max-w-5xl mx-auto">
                <div className="text-center py-20">
                    <Package className="mx-auto text-gray-300 mb-4" size={80} />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h3>
                    <p className="text-gray-500 mb-6">The order you're looking for doesn't exist.</p>
                    <button
                        onClick={() => navigate('/orders')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                    >
                        <ArrowLeft size={18} />
                        Back to Orders
                    </button>
                </div>
            </div>
        );
    }

    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;

    return (
        <div className="p-8 max-w-5xl mx-auto">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/orders')}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Order #{order.id}</h1>
                    <p className="text-sm text-gray-500">Placed on {formatDate(order.created_at)}</p>
                </div>
                <div className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border`}>
                    <StatusIcon size={18} />
                    <span className="font-semibold">{statusConfig.label}</span>
                </div>
            </div>

            {/* Status Update Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-700">Update Order Status:</label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <button
                        onClick={handleUpdateStatus}
                        disabled={updating || selectedStatus === order.status}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {updating ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Update Status
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Order Items */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items Card */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Package className="text-blue-500" size={20} />
                            Order Items
                        </h2>
                        <div className="space-y-4">
                            {order.items && order.items.length > 0 ? (
                                order.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                                    >
                                        <div>
                                            <p className="font-semibold text-gray-900">{item.title}</p>
                                            <p className="text-sm text-gray-500">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                                        </div>
                                        <p className="font-bold text-gray-900">{formatCurrency(item.subtotal)}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">No items found</p>
                            )}
                        </div>

                        {/* Order Summary */}
                        <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span>{formatCurrency(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Shipping</span>
                                <span>{order.shipping === 0 ? 'FREE' : formatCurrency(order.shipping)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>VAT (15%)</span>
                                <span>{formatCurrency(order.tax)}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                                <span className="text-gray-700">Total</span>
                                <span className="text-gray-900">{formatCurrency(order.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Status */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard className="text-blue-500" size={20} />
                            Payment Information
                        </h2>
                        <div className="space-y-3">
                            {/* Payment Status Badge */}
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Status:</span>
                                {(() => {
                                    const paymentConfig = getPaymentStatusConfig(order.payment_status);
                                    const PaymentIcon = paymentConfig.icon;
                                    return (
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${paymentConfig.bg} ${paymentConfig.text}`}>
                                            <PaymentIcon size={14} />
                                            {paymentConfig.label}
                                        </span>
                                    );
                                })()}
                            </div>

                            {/* Payment Method */}
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Method:</span>
                                <span className="font-medium text-gray-900 capitalize">
                                    {order.payment_method === 'manual_eft' ? '🏦 Manual EFT' :
                                        order.payment_method === 'paystack' ? '💳 Paystack' :
                                            order.payment_method === 'yoco' ? '💳 Yoco' :
                                                order.payment_method === 'whop' ? '🌐 Whop' :
                                                    order.payment_method === 'test_gateway' ? '🧪 Test Gateway' :
                                                        order.payment_method || 'Unknown'}
                                </span>
                            </div>

                            {/* Payment Reference */}
                            {order.payment_reference && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Reference:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm text-gray-700">{order.payment_reference}</span>
                                        <button
                                            onClick={copyPaymentRef}
                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                            title="Copy reference"
                                        >
                                            {copiedRef ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-gray-400" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Mark as Paid Button for EFT orders */}
                            {order.payment_method === 'manual_eft' && order.payment_status === 'awaiting_payment' && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                                            <div className="text-sm text-amber-800">
                                                <p className="font-medium mb-1">Awaiting Proof of Payment</p>
                                                <p>This order was placed with Manual EFT. Mark it as paid once you've received and verified the customer's PoP.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleMarkAsPaid}
                                        disabled={updatingPayment}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {updatingPayment ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <DollarSign size={18} />
                                                PoP Received - Mark as Paid
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Order Notes */}
                            {order.notes && (
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Order Notes:</p>
                                    <p className="text-gray-600 text-sm">{order.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tracking Information */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Truck className="text-blue-500" size={20} />
                            Tracking Information
                        </h2>

                        <div className="space-y-4">
                            {/* Display existing tracking if available */}
                            {order.tracking_number && !savingTracking && !trackingSaved && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle size={16} className="text-green-600" />
                                        <span className="font-medium text-green-800">Tracking Added</span>
                                    </div>
                                    <p className="text-sm text-green-700">
                                        <strong>{order.tracking_carrier}:</strong> {order.tracking_number}
                                    </p>
                                    {order.tracking_url && (
                                        <a
                                            href={order.tracking_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 mt-2"
                                        >
                                            Track Shipment <ExternalLink size={14} />
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Courier Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Courier Service
                                </label>
                                <select
                                    value={trackingCarrier}
                                    onChange={(e) => setTrackingCarrier(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                >
                                    <option value="">Select courier...</option>
                                    {COURIER_SERVICES.map(courier => (
                                        <option key={courier} value={courier}>{courier}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Tracking Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tracking Number
                                </label>
                                <input
                                    type="text"
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
                                    placeholder="e.g., TCG12345678"
                                />
                            </div>

                            {/* Tracking URL (optional) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tracking URL <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <input
                                    type="url"
                                    value={trackingUrl}
                                    onChange={(e) => setTrackingUrl(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                    placeholder="https://tracking.courier.com/..."
                                />
                            </div>

                            {/* Save Button */}
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={handleSaveTracking}
                                    disabled={savingTracking || (!trackingNumber && !trackingCarrier)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                                >
                                    {savingTracking ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            Save Tracking
                                        </>
                                    )}
                                </button>

                                {trackingSaved && (
                                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                        <CheckCircle size={16} />
                                        Saved!
                                    </span>
                                )}
                            </div>

                            <p className="text-xs text-gray-500 mt-2">
                                💡 Tip: Adding tracking info helps customers track their orders. Consider updating the order status to "Shipped" when you add tracking.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Customer & Shipping Info */}
                <div className="space-y-6">
                    {/* Customer Info Card */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="text-blue-500" size={20} />
                            Customer
                        </h2>
                        <div className="space-y-3">
                            <p className="font-semibold text-gray-900">{order.customer_name}</p>
                            <p className="text-sm text-gray-500">{order.customer_email}</p>
                            <p className="text-sm text-gray-500">{order.customer_phone}</p>
                        </div>
                    </div>

                    {/* Shipping Info Card */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <MapPin className="text-blue-500" size={20} />
                            Shipping Address
                        </h2>
                        <div className="text-gray-600 leading-relaxed text-sm">
                            <p>{order.shipping_address.address}</p>
                            <p>{order.shipping_address.city}, {order.shipping_address.province}</p>
                            <p>{order.shipping_address.postalCode}</p>
                        </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Order Timeline</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Created:</span>
                                <span className="text-gray-900">{formatDate(order.created_at)}</span>
                            </div>
                            {order.updated_at && order.updated_at !== order.created_at && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Last Updated:</span>
                                    <span className="text-gray-900">{formatDate(order.updated_at)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
