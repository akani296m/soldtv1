import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import * as Sentry from '@sentry/react';

// Admin Layouts & Components
import AdminLayout from './components/adminlayout';
import ProtectedRoute from './components/protectedRoute';
import RequireMerchant from './components/requireMerchant';

// Admin Pages
import HomePage from './pages/home';
import OrdersPage from './pages/orders';
import OrderDetail from './pages/orderdetail';
import ProductCreator from './pages/products';
import ProductsPage from './pages/productlisting';
import CustomersPage from './pages/customers';
import Onboarding from './pages/onboarding';
import Login from './pages/login';
import Signup from './pages/signup';
import SetupWizard from './pages/setupWizard';
import FacebookMarketing from './pages/marketing/Facebook';
import TikTokMarketing from './pages/marketing/TikTok';
import OmnisendMarketing from './pages/marketing/Omnisend';
import Pages from './pages/store/Pages';
import Navigation from './pages/store/Navigation';
import Collections from './pages/collections';
import CollectionEditor from './pages/collectionEditor';
import ReviewsPage from './pages/reviews';

// Settings Pages
import {
  SettingsLayout,
  GeneralSettings,
  FinanceSettings,
  BillingSettings,
  ManageStoreSettings,
  DomainsSettings,
  OrdersNotificationsSettings,
  ShippingSettings,
  TaxesSettings,
  DangerZoneSettings,
} from './pages/settings';
import BillingSuccess from './pages/settings/BillingSuccess';

// Storefront Editor
import { StorefrontEditor } from './pages/storefront-editor';

// Template Manager
import { TemplateManager, TemplateEditor } from './pages/templates';

// AI Store Builder (Demo)
import { AIStoreBuilder } from './pages/ai-builder';

// Storefront (new structure)
import {
  StorefrontLayout,
  StoreHome,
  Catalog,
  ProductDetail,
  Cart,
  Checkout,
  OrderConfirmation,
  PaymentResult,
  PolicyPage,
  CustomDomainStorefront
} from './storefront';

// List of domains that host the admin dashboard
const ADMIN_DOMAINS = [
  'merchants.io',
  'www.merchants.io',
  'soldt.co.za',           // Production admin domain
  'www.soldt.co.za',       // Production admin domain with www
  'myshop.soldt.co.za',     // Production admin subdomain
  'localhost',
  'localhost:5173',        // Vite dev server
  'localhost:5174',        // Vite dev server (alternate port)
];

/**
 * Determines if the current hostname is an admin domain
 */
function isAdminDomain(hostname) {
  return ADMIN_DOMAINS.some(domain =>
    hostname === domain || hostname.startsWith(`${domain}:`)
  );
}



/**
 * Main App Component
 * 
 * Routing Logic:
 * - If on a custom domain (e.g., shop.acme.com) → Render CustomDomainStorefront
 * - If on admin domain (merchants.io, localhost) → Render admin routes + /s/:slug storefront routes
 */
export default function App() {
  const [isCustomDomain, setIsCustomDomain] = useState(false);
  const [isCheckingDomain, setIsCheckingDomain] = useState(true);

  useEffect(() => {
    const hostname = window.location.hostname;
    const customDomain = !isAdminDomain(hostname);
    setIsCustomDomain(customDomain);
    setIsCheckingDomain(false);
  }, []);

  // Show nothing while checking domain (prevents flash of wrong content)
  if (isCheckingDomain) {
    return null;
  }

  // CUSTOM DOMAIN: Render storefront at root level
  if (isCustomDomain) {
    return <CustomDomainStorefront />;
  }

  // ADMIN DOMAIN: Render admin routes + /s/:slug storefront routes
  return (
    <>
      <Routes>

        {/* =========================================== */}
        {/* PUBLIC AUTH ROUTES                         */}
        {/* =========================================== */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* =========================================== */}
        {/* ONBOARDING (Protected but no merchant req) */}
        {/* =========================================== */}
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        } />

        {/* =========================================== */}
        {/* GROUP 1: ADMIN DASHBOARD ROUTES (PROTECTED)*/}
        {/* Requires authentication AND merchant        */}
        {/* =========================================== */}
        <Route element={
          <ProtectedRoute>
            <RequireMerchant>
              <AdminLayout />
            </RequireMerchant>
          </ProtectedRoute>
        }>
          <Route path="/" element={<HomePage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/create" element={<ProductCreator />} />
          <Route path="/products/collections" element={<Collections />} />
          <Route path="/products/collections/create" element={<CollectionEditor />} />
          <Route path="/products/collections/edit" element={<CollectionEditor />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/customers" element={<CustomersPage />} />

          {/* Marketing Routes */}
          <Route path="/marketing/email" element={<div className="p-8"><h1 className="text-2xl font-bold mb-2">Email Marketing</h1><p className="text-gray-500">Connect with your customers via email. Feature coming soon.</p></div>} />
          <Route path="/marketing/facebook" element={<FacebookMarketing />} />
          <Route path="/marketing/tiktok" element={<TikTokMarketing />} />
          <Route path="/marketing/omnisend" element={<OmnisendMarketing />} />

          {/* Template Manager */}
          <Route path="/store/templates" element={<TemplateManager />} />
          <Route path="/store/templates/:templateId/edit" element={<TemplateEditor />} />

          {/* AI Store Builder (Internal Demo) */}
          <Route path="/ai-builder" element={<AIStoreBuilder />} />
        </Route>

        {/* =========================================== */}
        {/* GROUP 2: PUBLIC STOREFRONT ROUTES          */}
        {/* Via /s/:merchantSlug/* (slug-based)        */}
        {/* =========================================== */}
        <Route path="/s/:merchantSlug" element={<StorefrontLayout />}>
          {/* /s/:merchantSlug → storefront home */}
          <Route index element={<StoreHome />} />

          {/* /s/:merchantSlug/products → product catalog */}
          <Route path="products" element={<Catalog />} />

          {/* /s/:merchantSlug/product/:productId → product detail */}
          <Route path="product/:productId" element={<ProductDetail />} />

          {/* /s/:merchantSlug/cart */}
          <Route path="cart" element={<Cart />} />

          {/* /s/:merchantSlug/checkout */}
          <Route path="checkout" element={<Checkout />} />

          {/* /s/:merchantSlug/order-confirmation/:orderId */}
          <Route path="order-confirmation/:orderId" element={<OrderConfirmation />} />

          {/* Yoco Payment Result Pages */}
          <Route path="payment-success" element={<PaymentResult />} />
          <Route path="payment-cancelled" element={<PaymentResult />} />
          <Route path="payment-failed" element={<PaymentResult />} />

          {/* Policy Pages (Shipping, Privacy, About Us) */}
          <Route path=":pageType" element={<PolicyPage />} />
        </Route>

        {/* =========================================== */}
        {/* STOREFRONT EDITOR (Protected + Merchant)   */}
        {/* =========================================== */}
        <Route path="/store/editor" element={
          <ProtectedRoute>
            <RequireMerchant>
              <StorefrontEditor />
            </RequireMerchant>
          </ProtectedRoute>
        } />

        {/* =========================================== */}
        {/* STORE PREVIEW (Protected + Merchant)       */}
        {/* =========================================== */}
        <Route path="/store" element={
          <ProtectedRoute>
            <RequireMerchant>
              <StorefrontLayout />
            </RequireMerchant>
          </ProtectedRoute>
        }>
          {/* Store preview routes - same as storefront but for logged-in merchant */}
          <Route index element={<StoreHome />} />
          <Route path="products" element={<Catalog />} />
          <Route path="product/:productId" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order-confirmation/:orderId" element={<OrderConfirmation />} />

          {/* Yoco Payment Result Pages */}
          <Route path="payment-success" element={<PaymentResult />} />
          <Route path="payment-cancelled" element={<PaymentResult />} />
          <Route path="payment-failed" element={<PaymentResult />} />

          {/* Policy Pages (Shipping, Privacy, About Us) */}
          <Route path=":pageType" element={<PolicyPage />} />
        </Route>

        {/* =========================================== */}
        {/* PAGES MANAGEMENT (Protected + Merchant)    */}
        {/* =========================================== */}
        <Route path="/store/pages" element={
          <ProtectedRoute>
            <RequireMerchant>
              <Pages />
            </RequireMerchant>
          </ProtectedRoute>
        } />

        {/* =========================================== */}
        {/* NAVIGATION SETTINGS (Protected + Merchant) */}
        {/* =========================================== */}
        <Route path="/store/navigation" element={
          <ProtectedRoute>
            <RequireMerchant>
              <Navigation />
            </RequireMerchant>
          </ProtectedRoute>
        } />

        {/* =========================================== */}
        {/* SETTINGS ROUTES (Protected, Custom Layout)*/}
        {/* =========================================== */}
        <Route path="/settings" element={
          <ProtectedRoute>
            <RequireMerchant>
              <SettingsLayout />
            </RequireMerchant>
          </ProtectedRoute>
        }>
          <Route path="general" element={<GeneralSettings />} />
          <Route path="finance" element={<FinanceSettings />} />
          <Route path="billing" element={<BillingSettings />} />
          <Route path="manage-store" element={<ManageStoreSettings />} />
          <Route path="domains" element={<DomainsSettings />} />
          <Route path="orders-notifications" element={<OrdersNotificationsSettings />} />
          <Route path="shipping" element={<ShippingSettings />} />
          <Route path="taxes" element={<TaxesSettings />} />
          <Route path="danger-zone" element={<DangerZoneSettings />} />
          {/* Default redirect to general settings */}
          <Route index element={<GeneralSettings />} />
        </Route>

        {/* =========================================== */}
        {/* BILLING SUCCESS (Protected + Merchant)     */}
        {/* Standalone route for Polar checkout success*/}
        {/* =========================================== */}
        <Route path="/billing/success" element={
          <ProtectedRoute>
            <RequireMerchant>
              <BillingSuccess />
            </RequireMerchant>
          </ProtectedRoute>
        } />

        {/* 404 Catch-all */}
        <Route path="*" element={<div className="min-h-screen flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1><p className="text-gray-600">The page you're looking for doesn't exist.</p></div></div>} />

      </Routes>
    </>
  );
}
