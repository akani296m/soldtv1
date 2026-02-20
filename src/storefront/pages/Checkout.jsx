import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Lock, AlertCircle } from 'lucide-react';
import PaystackPop from '@paystack/inline-js';
import { WhopCheckoutEmbed } from '@whop/checkout/react';
import { useCart } from '../../context/cartcontext';
import { useMerchant } from '../context/MerchantContext';
import { supabase } from '../../lib/supabase';
import {
    buildOmnisendEventId,
    buildOmnisendContact,
    buildOmnisendLineItems,
    getOmnisendCartId,
    saveOmnisendContactHint,
    trackOmnisendEvent
} from '../../lib/omnisend';

// Payment provider logos
import YocoLogo from '../../assets/icons/yoco.svg';
import PaystackLogo from '../../assets/icons/Paystack.svg';
import PayfastLogo from '../../assets/icons/Payfast.svg';
import OzowLogo from '../../assets/icons/Ozow.svg';
import TestGatewayLogo from '../../assets/icons/testgateway.svg';

// Helper function for consistent currency formatting
const formatCurrency = (amount) => {
    return Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

// InputField component defined OUTSIDE the main component to prevent re-creation on every render
const InputField = ({ name, label, type = 'text', placeholder = '', maxLength, value, onChange, error }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label} *</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${error ? 'border-red-500' : 'border-gray-300'}`}
        />
        {error && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} /> {error}</p>}
    </div>
);

export default function Checkout() {
    const navigate = useNavigate();
    const { merchantSlug } = useParams();
    const { merchant, isCustomDomain } = useMerchant();
    const { cartItems, getSubtotal, clearCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const isCompletingOrder = useRef(false);
    const basePath = isCustomDomain ? '' : `/s/${merchantSlug}`;

    const [formData, setFormData] = useState({
        email: '', firstName: '', lastName: '', phone: '',
        address: '', city: '', province: '', postalCode: '',
        orderNotes: ''
    });

    // Test Gateway Modal State
    const [showTestGatewayModal, setShowTestGatewayModal] = useState(false);
    const [testCardDetails, setTestCardDetails] = useState({
        cardNumber: '',
        expiryDate: '',
        cvv: ''
    });

    // Determine available payment gateways - memoized to prevent recreation on every render
    const availableGateways = useMemo(() => {
        const gateways = [];
        if (merchant?.yoco_secret_key) {
            gateways.push({
                id: 'yoco',
                name: 'Yoco',
                logo: YocoLogo,
                meta: 'Pay securely'
            });
        }
        if (merchant?.paystack_public_key) {
            gateways.push({
                id: 'paystack',
                name: 'Paystack',
                logo: PaystackLogo,
                meta: 'Pay with Card, Instant EFT'
            });
        }
        if (merchant?.payfast_merchant_id) {
            gateways.push({
                id: 'payfast',
                name: 'PayFast',
                logo: PayfastLogo,
                meta: 'Pay Card Payments, Instant EFT,SnapScan'
            });
        }
        if (merchant?.ozow_site_code) {
            gateways.push({
                id: 'ozow',
                name: 'Ozow',
                logo: OzowLogo,
                meta: 'Pay securely'
            });
        }
        if (merchant?.whop_plan_id) {
            gateways.push({
                id: 'whop',
                name: 'Whop',
                logo: null,
                meta: 'Pay securely'
            });
        }
        if (merchant?.eft_enabled && merchant?.eft_bank_name && merchant?.eft_account_number) {
            gateways.push({
                id: 'manual_eft',
                name: 'Bank Transfer',
                logo: null,
                meta: 'Pay via EFT'
            });
        }
        if (merchant?.test_gateway_enabled) {
            gateways.push({
                id: 'test_gateway',
                name: 'Test Gateway',
                logo: TestGatewayLogo,
                meta: 'Test payments (Dev only)'
            });
        }
        return gateways;
    }, [
        merchant?.yoco_secret_key,
        merchant?.paystack_public_key,
        merchant?.payfast_merchant_id,
        merchant?.ozow_site_code,
        merchant?.whop_plan_id,
        merchant?.eft_enabled,
        merchant?.eft_bank_name,
        merchant?.eft_account_number,
        merchant?.test_gateway_enabled
    ]);

    // Default to first available gateway
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

    // Generate payment reference once and keep it stable
    const [paymentReference] = useState(() =>
        Math.random().toString(36).substring(2, 7).toUpperCase()
    );

    // Set default payment method when gateways are loaded
    useEffect(() => {
        if (availableGateways.length > 0 && !selectedPaymentMethod) {
            setSelectedPaymentMethod(availableGateways[0].id);
        }
    }, [availableGateways, selectedPaymentMethod]);

    useEffect(() => {
        if (cartItems.length === 0 && !isCompletingOrder.current) {
            navigate(`${basePath}/cart`);
        }
    }, [cartItems, navigate, basePath]);

    // Update document title with store name
    useEffect(() => {
        if (!merchant) return;
        const storeName = merchant.store_name || merchant.business_name || 'Store';
        document.title = `Checkout | ${storeName}`;
    }, [merchant]);

    const subtotal = getSubtotal();
    const shipping = subtotal >= 1500 ? 0 : 150;
    const tax = subtotal * 0.15;
    const total = subtotal + shipping + tax;
    const cartId = getOmnisendCartId();

    const getCheckoutContact = () => buildOmnisendContact({
        email: formData.email,
        phone: formData.phone,
        firstName: formData.firstName,
        lastName: formData.lastName,
    });

    const buildOrderEventProperties = (orderRecord) => ({
        orderID: String(orderRecord.id || orderRecord.payment_reference || paymentReference),
        currency: 'ZAR',
        totalPrice: Number(orderRecord.total || total),
        subtotalPrice: Number(orderRecord.subtotal || subtotal),
        shippingPrice: Number(orderRecord.shipping || shipping),
        taxPrice: Number(orderRecord.tax || tax),
        paymentStatus: orderRecord.payment_status || null,
        fulfillmentStatus: orderRecord.status || null,
        createdAt: orderRecord.created_at || new Date().toISOString(),
        lineItems: buildOmnisendLineItems(orderRecord.items || cartItems),
    });

    const trackOrderOmnisendEvents = async (orderRecord) => {
        if (!merchant?.id) return;

        const contact = getCheckoutContact();
        saveOmnisendContactHint(contact);

        const properties = buildOrderEventProperties(orderRecord);
        const orderId = orderRecord.id || orderRecord.payment_reference || paymentReference;

        await trackOmnisendEvent({
            merchantId: merchant.id,
            name: 'placed order',
            eventID: buildOmnisendEventId({
                type: 'order_placed',
                orderId,
            }),
            contact,
            eventVersion: 'v2',
            properties,
        });

        if (orderRecord.payment_status === 'paid') {
            await trackOmnisendEvent({
                merchantId: merchant.id,
                name: 'paid for order',
                eventID: buildOmnisendEventId({
                    type: 'order_paid',
                    orderId,
                }),
                contact,
                eventVersion: 'v2',
                properties,
            });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));

        if (['email', 'phone', 'firstName', 'lastName'].includes(name)) {
            const nextFormData = { ...formData, [name]: value };
            if (name === 'email') {
                saveOmnisendContactHint(buildOmnisendContact(nextFormData), { requireValidEmail: true });
            } else {
                saveOmnisendContactHint(buildOmnisendContact(nextFormData));
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.firstName) newErrors.firstName = 'First name is required';
        if (!formData.lastName) newErrors.lastName = 'Last name is required';
        if (!formData.phone) newErrors.phone = 'Phone is required';
        if (!formData.address) newErrors.address = 'Address is required';
        if (!formData.city) newErrors.city = 'City is required';
        if (!formData.province) newErrors.province = 'Province is required';
        if (!formData.postalCode) newErrors.postalCode = 'Postal code is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePaystackSuccess = async (reference) => {
        isCompletingOrder.current = true;

        try {
            const orderData = {
                merchant_id: merchant?.id,
                customer_email: formData.email,
                customer_name: `${formData.firstName} ${formData.lastName}`,
                customer_phone: formData.phone,
                shipping_address: {
                    address: formData.address,
                    city: formData.city,
                    province: formData.province,
                    postalCode: formData.postalCode
                },
                items: cartItems.map(item => ({
                    product_id: item.product_id || item.id,
                    variant_id: item.variant_id || null,
                    title: item.title,
                    variant_title: item.variant_title || null,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.price * item.quantity
                })),
                subtotal,
                shipping,
                tax,
                total,
                status: 'processing',
                payment_status: 'paid',
                payment_reference: reference.reference,
                payment_method: 'paystack',
                notes: formData.orderNotes || null,
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase.from('orders').insert([orderData]).select().single();
            if (error) throw error;

            void trackOrderOmnisendEvents(data);
            clearCart();
            navigate(`${basePath}/order-confirmation/${data.id}`, {
                state: { orderId: data.id, orderData: data }
            });
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Payment successful but order creation failed. Please contact support with reference: ' + reference.reference);
        } finally {
            setLoading(false);
        }
    };

    // Validate that cart items still exist in the database
    const validateCartItems = async () => {
        if (cartItems.length === 0) return { valid: false, removedItems: [] };

        try {
            const productIds = cartItems
                .map(item => item.product_id || item.id)
                .filter(id => id !== undefined && id !== null);

            if (productIds.length === 0) {
                return { valid: false, error: 'No valid products in cart' };
            }

            const { data: existingProducts, error } = await supabase
                .from('products')
                .select('id')
                .in('id', productIds);

            if (error) {
                console.error('Error validating cart items:', error);
                return { valid: false, error: 'Unable to validate cart' };
            }

            const existingIds = new Set(existingProducts?.map(p => p.id) || []);
            const removedItems = cartItems.filter(item => !existingIds.has(item.product_id || item.id));

            return {
                valid: removedItems.length === 0,
                removedItems
            };
        } catch (err) {
            console.error('Error validating cart:', err);
            return { valid: false, error: 'Unable to validate cart' };
        }
    };

    const handleYocoPayment = async () => {
        isCompletingOrder.current = true;

        try {
            // Prepare order data to store temporarily
            const orderData = {
                merchant_id: merchant?.id,
                customer_email: formData.email,
                customer_name: `${formData.firstName} ${formData.lastName}`,
                customer_phone: formData.phone,
                shipping_address: {
                    address: formData.address,
                    city: formData.city,
                    province: formData.province,
                    postalCode: formData.postalCode
                },
                items: cartItems.map(item => ({
                    product_id: item.product_id || item.id,
                    variant_id: item.variant_id || null,
                    title: item.title,
                    variant_title: item.variant_title || null,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.price * item.quantity
                })),
                subtotal,
                shipping,
                tax,
                total,
                notes: formData.orderNotes || null,
                created_at: new Date().toISOString()
            };

            // Store order data temporarily in sessionStorage
            sessionStorage.setItem('pendingYocoOrder', JSON.stringify(orderData));

            // Build callback URLs
            const baseUrl = window.location.origin;
            const successUrl = `${baseUrl}${basePath}/payment-success`;
            const cancelUrl = `${baseUrl}${basePath}/payment-cancelled`;
            const failureUrl = `${baseUrl}${basePath}/payment-failed`;

            // Call our Edge Function to create Yoco checkout
            const response = await fetch('/api/create-yoco-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    merchantId: merchant.id,
                    amount: Math.round(total * 100), // Amount in cents
                    currency: 'ZAR',
                    successUrl,
                    cancelUrl,
                    failureUrl,
                    customerEmail: formData.email,
                    customerName: `${formData.firstName} ${formData.lastName}`,
                    customerPhone: formData.phone,
                    metadata: {
                        orderNotes: formData.orderNotes || '',
                    },
                    lineItems: cartItems.map(item => ({
                        title: item.title,
                        quantity: item.quantity,
                        price: item.price,
                        description: item.description || item.title,
                    })),
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to create checkout session');
            }

            // Redirect to Yoco checkout page
            window.location.href = data.redirectUrl;

        } catch (error) {
            console.error('Error creating Yoco checkout:', error);
            alert(error.message || 'There was an error processing your payment. Please try again.');
            setLoading(false);
            isCompletingOrder.current = false;
            sessionStorage.removeItem('pendingYocoOrder');
        }
    };

    // Handle successful Whop payment completion
    const handleWhopComplete = async (planId, receiptId) => {
        isCompletingOrder.current = true;
        setLoading(true);

        try {
            const orderData = {
                merchant_id: merchant?.id,
                customer_email: formData.email,
                customer_name: `${formData.firstName} ${formData.lastName}`,
                customer_phone: formData.phone,
                shipping_address: {
                    address: formData.address,
                    city: formData.city,
                    province: formData.province,
                    postalCode: formData.postalCode
                },
                items: cartItems.map(item => ({
                    product_id: item.product_id || item.id,
                    variant_id: item.variant_id || null,
                    title: item.title,
                    variant_title: item.variant_title || null,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.price * item.quantity
                })),
                subtotal,
                shipping,
                tax,
                total,
                status: 'processing',
                payment_status: 'paid',
                payment_reference: receiptId,
                payment_method: 'whop',
                notes: formData.orderNotes || null,
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase.from('orders').insert([orderData]).select().single();
            if (error) throw error;

            void trackOrderOmnisendEvents(data);
            clearCart();
            navigate(`${basePath}/order-confirmation/${data.id}`, {
                state: { orderId: data.id, orderData: data }
            });
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Payment successful but order creation failed. Please contact support with receipt: ' + receiptId);
        } finally {
            setLoading(false);
        }
    };

    // Handle Manual EFT order creation
    const handleManualEFTOrder = async () => {
        isCompletingOrder.current = true;
        setLoading(true);

        try {
            const orderData = {
                merchant_id: merchant?.id,
                customer_email: formData.email,
                customer_name: `${formData.firstName} ${formData.lastName}`,
                customer_phone: formData.phone,
                shipping_address: {
                    address: formData.address,
                    city: formData.city,
                    province: formData.province,
                    postalCode: formData.postalCode
                },
                items: cartItems.map(item => ({
                    product_id: item.product_id || item.id,
                    variant_id: item.variant_id || null,
                    title: item.title,
                    variant_title: item.variant_title || null,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.price * item.quantity
                })),
                subtotal,
                shipping,
                tax,
                total,
                status: 'pending',
                payment_status: 'awaiting_payment',
                payment_reference: `EFT-${Date.now()}`,
                payment_method: 'manual_eft',
                notes: formData.orderNotes || null,
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase.from('orders').insert([orderData]).select().single();
            if (error) throw error;

            void trackOrderOmnisendEvents(data);
            clearCart();
            navigate(`${basePath}/order-confirmation/${data.id}`, {
                state: { orderId: data.id, orderData: data, isManualEFT: true }
            });
        } catch (error) {
            console.error('Error creating order:', error);
            alert('There was an error creating your order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle Test Gateway Payment
    const handleTestGatewayPayment = async () => {
        const cardNumber = testCardDetails.cardNumber.trim();

        // Validate card number
        if (!cardNumber) {
            alert('Please enter a card number');
            return;
        }

        // Card number "1" = success, "2" = failure
        const isSuccess = cardNumber === '1';
        const isFailure = cardNumber === '2';

        if (!isSuccess && !isFailure) {
            alert('Invalid test card number. Use "1" for success or "2" for failure.');
            return;
        }

        setShowTestGatewayModal(false);
        setLoading(true);
        isCompletingOrder.current = true;

        // Simulate payment failure
        if (isFailure) {
            setTimeout(() => {
                setLoading(false);
                isCompletingOrder.current = false;
                alert('Test payment failed! Card number "2" simulates a failed payment.');
            }, 1000);
            return;
        }

        // Simulate successful payment
        try {
            const orderData = {
                merchant_id: merchant?.id,
                customer_email: formData.email,
                customer_name: `${formData.firstName} ${formData.lastName}`,
                customer_phone: formData.phone,
                shipping_address: {
                    address: formData.address,
                    city: formData.city,
                    province: formData.province,
                    postalCode: formData.postalCode
                },
                items: cartItems.map(item => ({
                    product_id: item.product_id || item.id,
                    variant_id: item.variant_id || null,
                    title: item.title,
                    variant_title: item.variant_title || null,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.price * item.quantity
                })),
                subtotal,
                shipping,
                tax,
                total,
                status: 'processing',
                payment_status: 'paid',
                payment_reference: `TEST-${Date.now()}`,
                payment_method: 'test_gateway',
                notes: formData.orderNotes || null,
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase.from('orders').insert([orderData]).select().single();
            if (error) throw error;

            void trackOrderOmnisendEvents(data);
            clearCart();
            navigate(`${basePath}/order-confirmation/${data.id}`, {
                state: { orderId: data.id, orderData: data }
            });
        } catch (error) {
            console.error('Error creating test order:', error);
            alert('There was an error creating your test order. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // Check if any payment gateway is configured
        if (availableGateways.length === 0) {
            alert('Payment gateway not configured. Please contact the store owner.');
            return;
        }

        // Validate payment method is selected
        if (!selectedPaymentMethod) {
            alert('Please select a payment method.');
            return;
        }

        // Whop uses embedded checkout - no form submit needed
        if (selectedPaymentMethod === 'whop') {
            alert('Please complete your payment using the Whop checkout form below.');
            return;
        }

        setLoading(true);

        // Validate cart items still exist before processing payment
        const cartValidation = await validateCartItems();
        if (!cartValidation.valid) {
            if (cartValidation.removedItems?.length > 0) {
                const removedNames = cartValidation.removedItems.map(item => item.title).join(', ');
                alert(`Some items in your cart are no longer available: ${removedNames}. Please go back to your cart to update it.`);
            } else {
                alert('Unable to validate your cart. Please refresh and try again.');
            }
            setLoading(false);
            navigate(`${basePath}/cart`);
            return;
        }

        const checkoutContact = getCheckoutContact();
        saveOmnisendContactHint(checkoutContact);
        void trackOmnisendEvent({
            merchantId: merchant?.id,
            name: 'started checkout',
            eventID: buildOmnisendEventId({
                type: 'checkout_started',
                cartId,
            }),
            contact: checkoutContact,
            properties: {
                currency: 'ZAR',
                value: Number(total),
                cartID: cartId,
                checkoutURL: window.location.href,
                lineItems: buildOmnisendLineItems(cartItems),
            },
        });

        // Process payment based on customer's selected method
        if (selectedPaymentMethod === 'test_gateway') {
            // Open test gateway modal for card details
            setLoading(false);
            setShowTestGatewayModal(true);
        } else if (selectedPaymentMethod === 'manual_eft') {
            await handleManualEFTOrder();
        } else if (selectedPaymentMethod === 'yoco') {
            await handleYocoPayment();
        } else if (selectedPaymentMethod === 'paystack') {
            try {
                const paystack = new PaystackPop();

                paystack.newTransaction({
                    key: merchant.paystack_public_key,
                    email: formData.email,
                    amount: Math.round(total * 100), // Paystack expects amount in kobo (cents)
                    currency: 'ZAR',
                    ref: `${merchant.slug}-${Date.now()}`,
                    metadata: {
                        custom_fields: [
                            {
                                display_name: 'Customer Name',
                                variable_name: 'customer_name',
                                value: `${formData.firstName} ${formData.lastName}`
                            },
                            {
                                display_name: 'Phone',
                                variable_name: 'phone',
                                value: formData.phone
                            }
                        ]
                    },
                    onSuccess: (transaction) => {
                        handlePaystackSuccess(transaction);
                    },
                    onCancel: () => {
                        setLoading(false);
                        isCompletingOrder.current = false;
                    }
                });
            } catch (error) {
                console.error('Error initializing payment:', error);
                alert('There was an error processing your payment. Please try again.');
                setLoading(false);
            }
        }
    };

    if (cartItems.length === 0) return null;

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-8">
                    <Link to={`${basePath}/cart`} className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-4"><ArrowLeft size={18} /> Back to Cart</Link>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Checkout</h1>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-lg p-6 shadow-sm">
                                <h2 className="text-xl font-bold mb-4">Contact Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField name="email" label="Email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} error={errors.email} />
                                    <InputField name="phone" label="Phone" placeholder="071 234 5678" value={formData.phone} onChange={handleInputChange} error={errors.phone} />
                                    <InputField name="firstName" label="First Name" value={formData.firstName} onChange={handleInputChange} error={errors.firstName} />
                                    <InputField name="lastName" label="Last Name" value={formData.lastName} onChange={handleInputChange} error={errors.lastName} />
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-6 shadow-sm">
                                <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
                                <div className="space-y-4">
                                    <InputField name="address" label="Street Address" placeholder="123 Main Street" value={formData.address} onChange={handleInputChange} error={errors.address} />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <InputField name="city" label="City" value={formData.city} onChange={handleInputChange} error={errors.city} />
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Province *</label>
                                            <select name="province" value={formData.province} onChange={handleInputChange}
                                                className={`w-full px-4 py-3 border rounded-lg outline-none ${errors.province ? 'border-red-500' : 'border-gray-300'}`}>
                                                <option value="">Select</option>
                                                <option value="Gauteng">Gauteng</option>
                                                <option value="Western Cape">Western Cape</option>
                                                <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                                                <option value="Eastern Cape">Eastern Cape</option>
                                                <option value="Free State">Free State</option>
                                                <option value="Limpopo">Limpopo</option>
                                                <option value="Mpumalanga">Mpumalanga</option>
                                                <option value="Northern Cape">Northern Cape</option>
                                                <option value="North West">North West</option>
                                            </select>
                                        </div>
                                        <InputField name="postalCode" label="Postal Code" maxLength="4" value={formData.postalCode} onChange={handleInputChange} error={errors.postalCode} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-6 shadow-sm">
                                <h2 className="text-xl font-bold mb-4">Payment Method</h2>

                                {availableGateways.length === 0 ? (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <p className="text-yellow-800 text-sm">No payment methods available. Please contact the store owner.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {availableGateways.map((gateway) => (
                                            <div
                                                key={gateway.id}
                                                onClick={() => setSelectedPaymentMethod(gateway.id)}
                                                className={`h-[68px] px-6 border rounded-xl cursor-pointer transition-colors flex items-center justify-between w-full focus-within:ring-2 focus-within:ring-gray-900/20 focus-within:ring-offset-2 focus-within:ring-offset-white ${selectedPaymentMethod === gateway.id
                                                    ? 'border-gray-900 bg-gray-50'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {/* Hidden radio for accessibility */}
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value={gateway.id}
                                                    checked={selectedPaymentMethod === gateway.id}
                                                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                                    className="sr-only"
                                                    aria-label={gateway.name}
                                                />

                                                {/* Left cluster: Logo + Name */}
                                                <div className="flex items-center gap-4">
                                                    {/* Logo container */}
                                                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                                                        {gateway.logo ? (
                                                            <img
                                                                src={gateway.logo}
                                                                alt={`${gateway.name} logo`}
                                                                className="w-6 h-6 object-contain"
                                                            />
                                                        ) : (
                                                            <span className="text-gray-400 text-sm font-medium">
                                                                {gateway.name.charAt(0)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* Provider name */}
                                                    <span className="text-[16px] font-semibold text-gray-900">
                                                        {gateway.name}
                                                    </span>
                                                </div>

                                                {/* Right meta text */}
                                                <span className="text-sm text-gray-500 text-right">
                                                    {gateway.meta}
                                                </span>
                                            </div>
                                        ))}

                                        {/* Security notice */}
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                                            <Lock size={14} className="text-gray-400 flex-shrink-0" />
                                            <p className="text-xs text-gray-500">
                                                Your payment is encrypted and secure.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Whop Checkout Embed - Shows when Whop is selected */}
                            {selectedPaymentMethod === 'whop' && merchant?.whop_plan_id && (
                                <div className="bg-white rounded-lg p-6 shadow-sm">
                                    <h2 className="text-xl font-bold mb-4">Complete Payment</h2>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Fill in the form above, then complete your payment below. Your order will be processed once payment is confirmed.
                                    </p>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                                        <WhopCheckoutEmbed
                                            planId={merchant.whop_plan_id}
                                            theme="light"
                                            prefill={{ email: formData.email || undefined }}
                                            hideEmail={!!formData.email}
                                            onComplete={(planId, receiptId) => handleWhopComplete(planId, receiptId)}
                                            fallback={
                                                <div className="flex items-center justify-center h-64">
                                                    <div className="text-center">
                                                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                                        <p className="text-gray-500 text-sm">Loading payment form...</p>
                                                    </div>
                                                </div>
                                            }
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3 text-center">
                                        Powered by Whop • Secure payment processing
                                    </p>
                                </div>
                            )}

                            {/* Manual EFT Banking Details - Shows when Manual EFT is selected */}
                            {selectedPaymentMethod === 'manual_eft' && merchant?.eft_enabled && (
                                <div className="bg-white rounded-lg p-6 shadow-sm">
                                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <span className="text-2xl">🏦</span>
                                        Bank Transfer Details
                                    </h2>

                                    <p className="text-sm text-gray-600 mb-4">
                                        Please make a payment to the following bank account and send your Proof of Payment (PoP) to the seller.
                                    </p>

                                    {/* Banking Details Card */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-4">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <span className="text-sm text-gray-500">Bank Name</span>
                                                <span className="font-semibold text-gray-900">{merchant.eft_bank_name}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <span className="text-sm text-gray-500">Account Holder</span>
                                                <span className="font-semibold text-gray-900">{merchant.eft_account_holder}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <span className="text-sm text-gray-500">Account Number</span>
                                                <span className="font-mono font-semibold text-gray-900">{merchant.eft_account_number}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <span className="text-sm text-gray-500">Branch Code</span>
                                                <span className="font-mono font-semibold text-gray-900">{merchant.eft_branch_code}</span>
                                            </div>
                                            {merchant.eft_account_type && (
                                                <div className="flex justify-between items-center py-2">
                                                    <span className="text-sm text-gray-500">Account Type</span>
                                                    <span className="font-semibold text-gray-900 capitalize">{merchant.eft_account_type}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Reference to use */}
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <p className="text-sm text-gray-500 mb-1">Use this reference for your payment:</p>
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center justify-between">
                                                <span className="font-mono font-bold text-blue-700">
                                                    {formData.firstName ? `${formData.firstName.toUpperCase().slice(0, 3)}${formData.lastName ? formData.lastName.toUpperCase().slice(0, 3) : ''}` : 'YOUR NAME'}-{paymentReference}
                                                </span>
                                                <span className="text-xs text-blue-600">Copy this!</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Amount to Pay */}
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-green-800">Amount to Pay:</span>
                                            <span className="text-2xl font-bold text-green-700">R {formatCurrency(total)}</span>
                                        </div>
                                    </div>

                                    {/* Warning Box */}
                                    <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                                            <div>
                                                <p className="font-semibold text-amber-800 mb-2">Important: Don't forget to send your Proof of Payment!</p>
                                                <ul className="text-sm text-amber-700 space-y-1.5">
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-amber-500 mt-0.5">•</span>
                                                        <span>After making your payment, <strong>send your PoP (Proof of Payment)</strong> to the seller via email or WhatsApp.</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-amber-500 mt-0.5">•</span>
                                                        <span>Your order will only be processed once payment is verified.</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-red-500 mt-0.5">⚠️</span>
                                                        <span className="text-red-700"><strong>Orders without PoP may be cancelled after 48 hours.</strong></span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-500 mt-4 text-center">
                                        Your order will be created with "Awaiting Payment" status
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg p-6 shadow-sm sticky top-6">
                                <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                                    {cartItems.map((item) => {
                                        const itemKey = item.cartItemId || `${item.product_id || item.id}-${item.variant_id || 'default'}`;
                                        return (
                                            <div key={itemKey} className="flex gap-3 pb-4 border-b">
                                                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    {item.image ? <img src={item.image} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="text-gray-400" size={24} /></div>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">
                                                        {item.title}
                                                        {item.variant_title && <span className="text-gray-500"> ({item.variant_title})</span>}
                                                    </p>
                                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                    <p className="text-sm font-medium mt-1">R {formatCurrency(item.price * item.quantity)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>R {formatCurrency(subtotal)}</span></div>
                                    <div className="flex justify-between text-gray-600"><span>Shipping</span>{shipping === 0 ? <span className="text-green-600 font-medium">FREE</span> : <span>R {formatCurrency(shipping)}</span>}</div>
                                    <div className="flex justify-between text-gray-600"><span>VAT (15%)</span><span>R {formatCurrency(tax)}</span></div>
                                    <div className="border-t pt-3"><div className="flex justify-between text-lg font-bold"><span>Total</span><span>R {formatCurrency(total)}</span></div></div>
                                </div>
                                {selectedPaymentMethod === 'whop' ? (
                                    <div className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-lg text-center flex items-center justify-center gap-2">
                                        <span className="text-lg">🌐</span>
                                        <span>Complete payment in the Whop checkout above</span>
                                    </div>
                                ) : selectedPaymentMethod === 'manual_eft' ? (
                                    <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-4 rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-400 flex items-center justify-center gap-2">
                                        {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Creating Order...</> : <><span className="text-lg">🏦</span> Place Order & Pay via EFT</>}
                                    </button>
                                ) : (
                                    <button type="submit" disabled={loading} className="w-full bg-black text-white font-bold py-4 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 flex items-center justify-center gap-2">
                                        {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Processing...</> : <><Lock size={18} /> Complete Order</>}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </form>

                {/* Test Gateway Modal */}
                {showTestGatewayModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <img src={TestGatewayLogo} alt="Test Gateway" className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Test Payment</h2>
                                    <p className="text-sm text-gray-500">Enter test card details</p>
                                </div>
                            </div>

                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                                <p className="text-xs text-purple-800 font-medium mb-1">Test Card Numbers:</p>
                                <ul className="text-xs text-purple-700 space-y-0.5">
                                    <li>• Card <strong>"1"</strong> = Success ✓</li>
                                    <li>• Card <strong>"2"</strong> = Failure ✗</li>
                                </ul>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                                    <input
                                        type="text"
                                        value={testCardDetails.cardNumber}
                                        onChange={(e) => setTestCardDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                                        placeholder="1 or 2"
                                        maxLength="1"
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                                        <input
                                            type="text"
                                            value={testCardDetails.expiryDate}
                                            onChange={(e) => setTestCardDetails(prev => ({ ...prev, expiryDate: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                                            placeholder="MM/YY"
                                            maxLength="5"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                                        <input
                                            type="text"
                                            value={testCardDetails.cvv}
                                            onChange={(e) => setTestCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                                            placeholder="123"
                                            maxLength="3"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => {
                                            setShowTestGatewayModal(false);
                                            setTestCardDetails({ cardNumber: '', expiryDate: '', cvv: '' });
                                        }}
                                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleTestGatewayPayment}
                                        className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Lock size={16} />
                                        Pay R {formatCurrency(total)}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
