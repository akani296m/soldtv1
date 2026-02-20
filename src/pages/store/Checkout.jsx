import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, CreditCard, Truck, Lock, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/cartcontext';
import { supabase } from '../../lib/supabase';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, getSubtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const isCompletingOrder = useRef(false); // Track if we're completing an order

  // Form state
  const [formData, setFormData] = useState({
    // Customer Info
    email: '',
    firstName: '',
    lastName: '',
    phone: '',

    // Shipping Address
    address: '',
    city: '',
    province: '',
    postalCode: '',

    // Payment (placeholder - no real processing)
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',

    // Additional
    orderNotes: ''
  });

  // Redirect if cart is empty (but not while completing order)
  useEffect(() => {
    if (cartItems.length === 0 && !isCompletingOrder.current) {
      navigate('/store/cart');
    }
  }, [cartItems, navigate]);

  const subtotal = getSubtotal();
  const shipping = subtotal >= 1500 ? 0 : 150;
  const tax = subtotal * 0.15; // 15% VAT
  const total = subtotal + shipping + tax;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Required fields
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.province) newErrors.province = 'Province is required';
    if (!formData.postalCode) newErrors.postalCode = 'Postal code is required';

    // Payment validation (basic)
    if (!formData.cardNumber) {
      newErrors.cardNumber = 'Card number is required';
    } else if (formData.cardNumber.replace(/\s/g, '').length < 16) {
      newErrors.cardNumber = 'Card number must be 16 digits';
    }
    if (!formData.cardName) newErrors.cardName = 'Cardholder name is required';
    if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required';
    if (!formData.cvv) newErrors.cvv = 'CVV is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    isCompletingOrder.current = true; // Prevent redirect during order completion

    try {
      // Prepare order data
      const orderData = {
        // Customer info
        customer_email: formData.email,
        customer_name: `${formData.firstName} ${formData.lastName} `,
        customer_phone: formData.phone,

        // Shipping address
        shipping_address: {
          address: formData.address,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode
        },

        // Order details
        items: cartItems.map(item => ({
          product_id: item.id,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity
        })),

        // Totals
        subtotal: subtotal,
        shipping: shipping,
        tax: tax,
        total: total,

        // Status
        status: 'pending',
        payment_status: 'pending',

        // Notes
        notes: formData.orderNotes || null,

        // Timestamp
        created_at: new Date().toISOString()
      };

      // Insert order into Supabase
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;

      // Clear cart after successful order
      clearCart();

      // Navigate to confirmation page
      navigate('/store/order-confirmation', {
        state: {
          orderId: data.id,
          orderData: data
        }
      });

    } catch (error) {
      console.error('Error creating order:', error);
      alert('There was an error processing your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/store/cart"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition mb-4"
          >
            <ArrowLeft size={18} />
            Back to Cart
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Checkout</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">

              {/* Contact Information */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w - full px - 4 py - 3 border rounded - lg focus: ring - 2 focus: ring - blue - 500 focus: border - transparent outline - none ${errors.email ? 'border-red-500' : 'border-gray-300'
                        } `}
                      placeholder="you@example.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w - full px - 4 py - 3 border rounded - lg focus: ring - 2 focus: ring - blue - 500 focus: border - transparent outline - none ${errors.phone ? 'border-red-500' : 'border-gray-300'
                        } `}
                      placeholder="071 234 5678"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w - full px - 4 py - 3 border rounded - lg focus: ring - 2 focus: ring - blue - 500 focus: border - transparent outline - none ${errors.firstName ? 'border-red-500' : 'border-gray-300'
                        } `}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w - full px - 4 py - 3 border rounded - lg focus: ring - 2 focus: ring - blue - 500 focus: border - transparent outline - none ${errors.lastName ? 'border-red-500' : 'border-gray-300'
                        } `}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  Shipping Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w - full px - 4 py - 3 border rounded - lg focus: ring - 2 focus: ring - blue - 500 focus: border - transparent outline - none ${errors.address ? 'border-red-500' : 'border-gray-300'
                        } `}
                      placeholder="123 Main Street, Apartment 4B"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.address}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`w - full px - 4 py - 3 border rounded - lg focus: ring - 2 focus: ring - blue - 500 focus: border - transparent outline - none ${errors.city ? 'border-red-500' : 'border-gray-300'
                          } `}
                      />
                      {errors.city && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle size={14} /> {errors.city}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Province *
                      </label>
                      <select
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                        className={`w - full px - 4 py - 3 border rounded - lg focus: ring - 2 focus: ring - blue - 500 focus: border - transparent outline - none ${errors.province ? 'border-red-500' : 'border-gray-300'
                          } `}
                      >
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
                      {errors.province && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle size={14} /> {errors.province}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className={`w - full px - 4 py - 3 border rounded - lg focus: ring - 2 focus: ring - blue - 500 focus: border - transparent outline - none ${errors.postalCode ? 'border-red-500' : 'border-gray-300'
                          } `}
                        maxLength="4"
                      />
                      {errors.postalCode && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle size={14} /> {errors.postalCode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  Payment Information
                </h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                  <Lock className="text-blue-600 flex-shrink-0" size={20} />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Secure Payment</p>
                    <p className="text-blue-700">Your payment information is encrypted and secure.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number *
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className={`w - full px - 4 py - 3 border rounded - lg focus: ring - 2 focus: ring - blue - 500 focus: border - transparent outline - none ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                        } `}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                    />
                    {errors.cardNumber && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.cardNumber}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cardholder Name *
                    </label>
                    <input
                      type="text"
                      name="cardName"
                      value={formData.cardName}
                      onChange={handleInputChange}
                      className={`w - full px - 4 py - 3 border rounded - lg focus: ring - 2 focus: ring - blue - 500 focus: border - transparent outline - none ${errors.cardName ? 'border-red-500' : 'border-gray-300'
                        } `}
                      placeholder="Name on card"
                    />
                    {errors.cardName && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.cardName}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        className={`w - full px - 4 py - 3 border rounded - lg focus: ring - 2 focus: ring - blue - 500 focus: border - transparent outline - none ${errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                          } `}
                        placeholder="MM/YY"
                        maxLength="5"
                      />
                      {errors.expiryDate && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle size={14} /> {errors.expiryDate}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV *
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        className={`w - full px - 4 py - 3 border rounded - lg focus: ring - 2 focus: ring - blue - 500 focus: border - transparent outline - none ${errors.cvv ? 'border-red-500' : 'border-gray-300'
                          } `}
                        placeholder="123"
                        maxLength="4"
                      />
                      {errors.cvv && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle size={14} /> {errors.cvv}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Policy Links */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
                  <Link
                    to="/store/pages/shipping-policy"
                    className="hover:text-black transition flex items-center gap-1"
                  >
                    <Truck size={16} />
                    Shipping Policy
                  </Link>
                  <span className="text-gray-300">•</span>
                  <Link
                    to="/store/pages/refund-policy"
                    className="hover:text-black transition"
                  >
                    Refund Policy
                  </Link>
                  <span className="text-gray-300">•</span>
                  <Link
                    to="/store/pages/privacy-policy"
                    className="hover:text-black transition flex items-center gap-1"
                  >
                    <Lock size={16} />
                    Privacy Policy
                  </Link>
                </div>
              </div>

              {/* Order Notes */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Order Notes (Optional)</h2>
                <textarea
                  name="orderNotes"
                  value={formData.orderNotes}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Any special delivery instructions?"
                />
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6 shadow-sm sticky top-6">
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                {/* Cart Items */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3 pb-4 border-b">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="text-gray-400" size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.title}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        <p className="text-sm font-medium mt-1">
                          R {(item.price * item.quantity).toLocaleString('en-ZA', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>R {subtotal.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    {shipping === 0 ? (
                      <span className="text-green-600 font-medium">FREE</span>
                    ) : (
                      <span>R {shipping.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>VAT (15%)</span>
                    <span>R {tax.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>R {total.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white font-bold py-4 rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      Complete Order
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  By completing your order, you agree to our terms and conditions.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}