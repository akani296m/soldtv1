import React, { createContext, useContext, useState, useEffect } from 'react';
import { trackTikTokEvent } from '../storefront/lib/tiktokPixel';
import {
    buildOmnisendEventId,
    buildOmnisendLineItems,
    getOmnisendCartId,
    resetOmnisendCartId,
    trackOmnisendEvent
} from '../lib/omnisend';

/**
 * @typedef {import('../types/variants').CartItem} CartItem
 * @typedef {import('../types/variants').AddToCartPayload} AddToCartPayload
 */

// Create Cart Context
const CartContext = createContext();

// Cart Provider Component
export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);

    // Migrate from old cart format (product-based) to new format (variant-based)
    function migrateOldCart() {
        const oldCart = localStorage.getItem('shopping_cart');
        if (oldCart) {
            try {
                const oldItems = JSON.parse(oldCart);
                // Convert old format to new format
                const migratedItems = oldItems.map(item => ({
                    cartItemId: `${item.id}`,
                    product_id: item.id,
                    variant_id: null,
                    title: item.title,
                    variant_title: null,
                    price: item.price,
                    image: item.image,
                    quantity: item.quantity,
                    stock_quantity: item.inventory || null,
                    sku: null,
                    option_values: null
                }));
                setCartItems(migratedItems);
                // Keep old cart as backup for now
                console.log('[Cart] Migrated', migratedItems.length, 'items from old cart format');
            } catch (error) {
                console.error('Error migrating old cart:', error);
            }
        }
    }

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('shopping_cart_v2');
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (error) {
                console.error('Error loading cart:', error);
                localStorage.removeItem('shopping_cart_v2');

                // Try to migrate from old cart format
                migrateOldCart();
            }
        } else {
            // Try to migrate from old cart format
            migrateOldCart();
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('shopping_cart_v2', JSON.stringify(cartItems));
    }, [cartItems]);

    /**
     * Add item to cart
     * Supports both old format (product object) and new format (CartItem)
     * 
     * @param {CartItem|Object} item - Cart item or legacy product object
     * @param {number} quantity - Quantity to add (for legacy calls)
     */
    const addToCart = (item, quantity = 1, tracking = {}) => {
        setCartItems(prevItems => {
            // Determine the cart item ID
            // New format: item has cartItemId
            // Old format: item only has id (product id)
            const cartItemId = item.cartItemId ||
                (item.variant_id ? `${item.product_id || item.id}-${item.variant_id}` : `${item.product_id || item.id}`);

            // Check if item already exists in cart
            const existingItemIndex = prevItems.findIndex(i => i.cartItemId === cartItemId);

            if (existingItemIndex > -1) {
                // Item exists - update quantity
                const updatedItems = [...prevItems];
                const newQuantity = updatedItems[existingItemIndex].quantity + (item.quantity || quantity);

                // Check stock limit if available
                const stockLimit = updatedItems[existingItemIndex].stock_quantity;
                const finalQuantity = stockLimit
                    ? Math.min(newQuantity, stockLimit)
                    : newQuantity;

                updatedItems[existingItemIndex] = {
                    ...updatedItems[existingItemIndex],
                    quantity: finalQuantity
                };
                return updatedItems;
            } else {
                // New item - normalize and add to cart
                const newItem = {
                    cartItemId,
                    product_id: item.product_id || item.id,
                    variant_id: item.variant_id || null,
                    title: item.title,
                    variant_title: item.variant_title || null,
                    price: item.price,
                    image: item.image,
                    quantity: item.quantity || quantity,
                    stock_quantity: item.stock_quantity ?? item.inventory ?? null,
                    sku: item.sku || null,
                    option_values: item.option_values || null
                };
                return [...prevItems, newItem];
            }
        });

        // Track TikTok AddToCart event
        const trackQuantity = item.quantity || quantity;
        trackTikTokEvent("AddToCart", {
            content_id: String(item.product_id || item.id),
            content_name: item.title,
            content_type: "product",
            quantity: trackQuantity,
            value: item.price * trackQuantity,
            currency: "ZAR"
        });

        const omnisendContext = tracking?.omnisend;
        if (omnisendContext?.merchantId) {
            const cartId = omnisendContext.cartId || getOmnisendCartId();
            const productId = item.product_id || item.id;
            void trackOmnisendEvent({
                merchantId: omnisendContext.merchantId,
                name: 'added product to cart',
                eventID: buildOmnisendEventId({
                    type: 'add_to_cart',
                    cartId,
                    productId,
                    quantity: trackQuantity,
                }),
                contact: omnisendContext.contact || {},
                properties: {
                    currency: 'ZAR',
                    value: Number(item.price || 0) * Number(trackQuantity || 1),
                    cartID: cartId,
                    lineItems: buildOmnisendLineItems([{
                        ...item,
                        product_id: productId,
                        quantity: trackQuantity,
                    }]),
                },
            });
        }
    };

    /**
     * Remove item from cart completely
     * @param {string} cartItemId - Cart item ID (format: "productId" or "productId-variantId")
     */
    const removeFromCart = (cartItemId) => {
        setCartItems(prevItems => prevItems.filter(item => item.cartItemId !== cartItemId));
    };

    /**
     * Legacy support: Remove by product ID (for non-variant products)
     * @param {number} productId - Product ID
     */
    const removeProductFromCart = (productId) => {
        setCartItems(prevItems => prevItems.filter(item =>
            item.product_id !== productId || item.variant_id !== null
        ));
    };

    /**
     * Update quantity of an item
     * @param {string} cartItemId - Cart item ID
     * @param {number} newQuantity - New quantity
     */
    const updateQuantity = (cartItemId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(cartItemId);
            return;
        }

        setCartItems(prevItems =>
            prevItems.map(item => {
                if (item.cartItemId !== cartItemId) return item;

                // Check stock limit if available
                const stockLimit = item.stock_quantity;
                const finalQuantity = stockLimit
                    ? Math.min(newQuantity, stockLimit)
                    : newQuantity;

                return { ...item, quantity: finalQuantity };
            })
        );
    };

    /**
     * Clear entire cart
     */
    const clearCart = () => {
        setCartItems([]);
        resetOmnisendCartId();
    };

    /**
     * Get total number of items in cart
     * @returns {number}
     */
    const getTotalItems = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    };

    /**
     * Get cart subtotal
     * @returns {number}
     */
    const getSubtotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    /**
     * Check if product/variant is in cart
     * @param {number} productId - Product ID
     * @param {number|null} variantId - Variant ID (optional)
     * @returns {boolean}
     */
    const isInCart = (productId, variantId = null) => {
        const cartItemId = variantId ? `${productId}-${variantId}` : `${productId}`;
        return cartItems.some(item => item.cartItemId === cartItemId);
    };

    /**
     * Get quantity of specific item in cart
     * @param {number} productId - Product ID
     * @param {number|null} variantId - Variant ID (optional)
     * @returns {number}
     */
    const getItemQuantity = (productId, variantId = null) => {
        const cartItemId = variantId ? `${productId}-${variantId}` : `${productId}`;
        const item = cartItems.find(i => i.cartItemId === cartItemId);
        return item ? item.quantity : 0;
    };

    /**
     * Legacy support: Get quantity by product ID only
     * @param {number} productId - Product ID
     * @returns {number}
     */
    const getProductQuantity = (productId) => {
        // Sum all quantities for this product (including variants)
        return cartItems
            .filter(item => item.product_id === productId)
            .reduce((total, item) => total + item.quantity, 0);
    };

    /**
     * Get all items for a specific product (including all variants)
     * @param {number} productId - Product ID
     * @returns {CartItem[]}
     */
    const getProductItems = (productId) => {
        return cartItems.filter(item => item.product_id === productId);
    };

    /**
     * Get display title for a cart item (includes variant info)
     * @param {CartItem} item - Cart item
     * @returns {string}
     */
    const getItemDisplayTitle = (item) => {
        if (item.variant_title) {
            return `${item.title} (${item.variant_title})`;
        }
        return item.title;
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            removeProductFromCart,
            updateQuantity,
            clearCart,
            getTotalItems,
            getSubtotal,
            isInCart,
            getItemQuantity,
            getProductQuantity,
            getProductItems,
            getItemDisplayTitle
        }}>
            {children}
        </CartContext.Provider>
    );
}

// Custom hook to use cart context
export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
