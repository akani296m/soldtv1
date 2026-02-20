import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MerchantProvider } from '../context/MerchantContext';
import StorefrontLayout from '../components/StorefrontLayout';
import StoreHome from '../pages/StoreHome';
import Catalog from '../pages/Catalog';
import ProductDetail from '../pages/ProductDetail';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import OrderConfirmation from '../pages/OrderConfirmation';
import PaymentResult from '../pages/PaymentResult';
import PolicyPage from '../pages/PolicyPage';

/**
 * CustomDomainStorefront
 * 
 * This component handles storefronts accessed via custom domains.
 * It wraps the storefront routes with MerchantProvider configured for domain-based lookup.
 * 
 * Example: When a user visits "shop.acme.com", this component:
 * 1. Sets customDomain=true on MerchantProvider
 * 2. MerchantProvider detects hostname and fetches merchant by domain
 * 3. Renders storefront routes at root level (/, /products, /cart, etc.)
 */
export default function CustomDomainStorefront() {
    return (
        <MerchantProvider customDomain={true}>
            <Routes>
                <Route element={<StorefrontLayout />}>
                    {/* Root path shows store home */}
                    <Route index element={<StoreHome />} />

                    {/* Product catalog */}
                    <Route path="products" element={<Catalog />} />

                    {/* Individual product detail */}
                    <Route path="product/:productId" element={<ProductDetail />} />

                    {/* Shopping cart */}
                    <Route path="cart" element={<Cart />} />

                    {/* Checkout */}
                    <Route path="checkout" element={<Checkout />} />

                    {/* Order confirmation */}
                    <Route path="order-confirmation/:orderId" element={<OrderConfirmation />} />

                    {/* Yoco Payment Result Pages */}
                    <Route path="payment-success" element={<PaymentResult />} />
                    <Route path="payment-cancelled" element={<PaymentResult />} />
                    <Route path="payment-failed" element={<PaymentResult />} />

                    {/* Policy Pages (Shipping, Privacy, About Us) */}
                    <Route path=":pageType" element={<PolicyPage />} />
                </Route>
            </Routes>
        </MerchantProvider>
    );
}
