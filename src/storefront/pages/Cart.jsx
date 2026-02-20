import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft, Package } from 'lucide-react';
import { useCart } from '../../context/cartcontext';
import { useMerchant } from '../context/MerchantContext';
import { supabase } from '../../lib/supabase';

export default function Cart() {
    const navigate = useNavigate();
    const { merchantSlug } = useParams();
    const { merchant, isCustomDomain } = useMerchant();
    const { cartItems, removeFromCart, updateQuantity, clearCart, getTotalItems, getSubtotal } = useCart();
    const basePath = isCustomDomain ? '' : `/s/${merchantSlug}`;
    const [validating, setValidating] = useState(true);

    // Update document title with store name
    useEffect(() => {
        if (!merchant) return;
        const storeName = merchant.store_name || merchant.business_name || 'Store';
        document.title = `Cart | ${storeName}`;
    }, [merchant]);

    // Validate cart items - remove any products that have been deleted from the database
    useEffect(() => {
        async function validateCartItems() {
            if (cartItems.length === 0) {
                setValidating(false);
                return;
            }

            try {
                // Get all product IDs from cart (use product_id for new format, fallback to id for legacy)
                const productIds = cartItems
                    .map(item => item.product_id || item.id)
                    .filter(id => id !== undefined && id !== null);

                if (productIds.length === 0) {
                    setValidating(false);
                    return;
                }

                // Check which products still exist in the database
                const { data: existingProducts, error } = await supabase
                    .from('products')
                    .select('id')
                    .in('id', productIds);

                if (error) {
                    console.error('Error validating cart items:', error);
                    setValidating(false);
                    return;
                }

                // Get set of existing product IDs
                const existingIds = new Set(existingProducts?.map(p => p.id) || []);

                // Remove any cart items that no longer exist in the database
                for (const item of cartItems) {
                    const productId = item.product_id || item.id;
                    if (!existingIds.has(productId)) {
                        console.log('[Cart] Removing deleted product from cart:', productId, item.title);
                        removeFromCart(item.cartItemId || productId);
                    }
                }
            } catch (err) {
                console.error('Error validating cart:', err);
            } finally {
                setValidating(false);
            }
        }

        validateCartItems();
    }, []); // Run once on mount

    const subtotal = getSubtotal();
    const shipping = subtotal >= 1500 ? 0 : 150;
    const total = subtotal + shipping;

    // Show loading while validating cart items
    if (validating) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="text-center py-20">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading your cart...</p>
                </div>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="text-center py-20">
                    <ShoppingBag className="mx-auto text-gray-300 mb-6" size={80} strokeWidth={1.5} />
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
                    <p className="text-gray-500 mb-8 text-lg">Looks like you haven't added anything to your cart yet.</p>
                    <Link to={basePath} className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition font-medium">
                        <ArrowLeft size={20} /> Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
                    <p className="text-gray-600">{getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} in your cart</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex justify-end mb-2">
                            <button onClick={() => { if (window.confirm('Clear your entire cart?')) clearCart(); }} className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
                                <Trash2 size={16} /> Clear Cart
                            </button>
                        </div>

                        {cartItems.map((item) => {
                            // Support both new format (cartItemId, product_id) and legacy format (id)
                            const itemKey = item.cartItemId || item.id;
                            const productId = item.product_id || item.id;
                            const stockLimit = item.stock_quantity ?? item.inventory;

                            return (
                                <div key={itemKey} className="bg-white rounded-lg p-6 shadow-sm">
                                    <div className="flex gap-6">
                                        <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            {item.image ? <img src={item.image} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="text-gray-400" size={32} /></div>}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <Link to={`${basePath}/product/${productId}`} className="font-semibold text-lg text-gray-900 hover:text-blue-600 transition">
                                                    {item.title}
                                                    {item.variant_title && <span className="text-gray-500 font-normal text-sm ml-2">({item.variant_title})</span>}
                                                </Link>
                                                <p className="text-gray-600 mt-1">R {Number(item.price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                            <div className="flex items-center justify-between mt-4">
                                                <div className="flex items-center border border-gray-300 rounded-lg">
                                                    <button onClick={() => updateQuantity(itemKey, item.quantity - 1)} className="p-2 hover:bg-gray-50 rounded-l-lg"><Minus size={16} /></button>
                                                    <span className="px-4 py-2 font-medium min-w-[3rem] text-center">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(itemKey, item.quantity + 1)} className="p-2 hover:bg-gray-50 rounded-r-lg" disabled={stockLimit && item.quantity >= stockLimit}><Plus size={16} /></button>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-bold text-lg">R {(item.price * item.quantity).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                                                    <button onClick={() => removeFromCart(itemKey)} className="text-gray-400 hover:text-red-600 p-2"><Trash2 size={20} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg p-6 shadow-sm sticky top-6">
                            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>R {subtotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span></div>
                                <div className="flex justify-between text-gray-600"><span>Shipping</span>{shipping === 0 ? <span className="text-green-600 font-medium">FREE</span> : <span>R {shipping.toFixed(2)}</span>}</div>
                                {shipping > 0 && <div className="bg-blue-50 border border-blue-200 rounded-lg p-3"><p className="text-sm text-blue-800">Add R {(1500 - subtotal).toFixed(2)} more for free shipping!</p></div>}
                                <div className="border-t pt-4"><div className="flex justify-between text-lg font-bold"><span>Total</span><span>R {total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span></div></div>
                            </div>
                            <button onClick={() => navigate(`${basePath}/checkout`)} className="w-full bg-black text-white font-bold py-4 rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2 mb-4">Proceed to Checkout <ArrowRight size={20} /></button>
                            <Link to={basePath} className="block text-center text-gray-600 hover:text-black font-medium">Continue Shopping</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
