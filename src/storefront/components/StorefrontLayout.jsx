/**
 * Storefront Layout
 * Main layout wrapper for customer-facing storefronts
 * Integrates theme system with variant-based header/footer
 */

import React, { useMemo, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { useCart } from '../../context/cartcontext';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';
import { MerchantProvider, useMerchant } from '../context/MerchantContext';
import { useSections } from '../../hooks/useSections';
import { getSectionComponent } from '../../components/storefront/sections';
import { SECTION_ZONE_KEYS } from '../../lib/sectionZones';
import StorefrontNotFound from './StorefrontNotFound';
import Header from './Header';
import Footer from './Footer';
import { loadMetaPixel } from '../lib/metaPixel';
import { loadTikTokPixel } from '../lib/tiktokPixel';
import { loadOmnisendPixel } from '../lib/omnisendPixel';
import { parseFooterConfig } from '../../lib/footerConfig';

// Default menu items (used as fallback when no config is saved)
const DEFAULT_HEADER_ITEMS = [
    { id: 'home', label: 'Home', path: '/', enabled: true, order: 0 },
    { id: 'products', label: 'Catalog', path: '/products', enabled: true, order: 1 },
];

/**
 * Inner layout component - renders after theme is applied
 */
function StorefrontLayoutContent() {
    const { getTotalItems } = useCart();
    const { merchant, merchantSlug, loading, notFound, isCustomDomain } = useMerchant();
    useTheme(); // Initialize theme CSS variables
    const cartCount = getTotalItems();
    const location = useLocation();

    const { sections, loading: sectionsLoading } = useSections(merchant?.id);

    // Check if we're on a checkout-related page
    const isCheckoutPage = useMemo(() => {
        const path = location.pathname;
        return path.includes('/checkout') || path.includes('/order-confirmation');
    }, [location.pathname]);

    // Load marketing pixels if available and active
    useEffect(() => {
        if (!merchant) return;

        // Load Omnisend Pixel (always loaded for storefront)
        // TODO: Make this configurable per-merchant in the future
        loadOmnisendPixel("6988d14b27460b4ce15c5fdc");

        if (!merchant.pixels) return;

        // Load Meta Pixel
        const metaPixel = merchant.pixels.find(p => p.platform === "meta" && p.is_active);
        if (metaPixel?.pixel_id) {
            loadMetaPixel(metaPixel.pixel_id);
        }

        // Load TikTok Pixel
        const tiktokPixel = merchant.pixels.find(p => p.platform === "tiktok" && p.is_active);
        if (tiktokPixel?.pixel_id) {
            loadTikTokPixel(tiktokPixel.pixel_id);
        }
    }, [merchant]);

    // Update document title and favicon based on merchant data
    useEffect(() => {
        if (!merchant) return;

        // Update document title with store name
        const storeName = merchant.store_name || merchant.business_name || 'Store';
        document.title = storeName;

        // Update favicon if merchant has a custom one
        if (merchant.favicon_url) {
            // Find existing favicon link or create new one
            let faviconLink = document.querySelector("link[rel~='icon']");
            if (!faviconLink) {
                faviconLink = document.createElement('link');
                faviconLink.rel = 'icon';
                document.head.appendChild(faviconLink);
            }
            faviconLink.href = merchant.favicon_url;

            // Also update apple-touch-icon if present
            let appleTouchIcon = document.querySelector("link[rel='apple-touch-icon']");
            if (appleTouchIcon) {
                appleTouchIcon.href = merchant.favicon_url;
            }
        }

        // Cleanup: Reset title when component unmounts (navigating away from storefront)
        return () => {
            document.title = 'Soldt';
        };
    }, [merchant]);

    // Parse menu configuration
    const { headerItems, footerConfig } = useMemo(() => {
        let headerConfig = DEFAULT_HEADER_ITEMS;
        let menuConfig = null;

        if (merchant?.menu_config) {
            if (typeof merchant.menu_config === 'string') {
                try {
                    menuConfig = JSON.parse(merchant.menu_config);
                } catch {
                    menuConfig = null;
                }
            } else {
                menuConfig = merchant.menu_config;
            }

            if (menuConfig.header?.length > 0) headerConfig = menuConfig.header;
        }

        const enabledHeaderItems = headerConfig
            .filter(item => item.enabled)
            .sort((a, b) => a.order - b.order);

        return {
            headerItems: enabledHeaderItems,
            footerConfig: parseFooterConfig(menuConfig),
        };
    }, [merchant]);

    // Filter announcement bar sections
    const announcementBars = useMemo(() => {
        if (!sections || sections.length === 0) return [];
        return sections
            .filter(section =>
                section.visible &&
                (section.zone === SECTION_ZONE_KEYS.HEADER_ANNOUNCEMENT || section.type === 'announcement_bar')
            )
            .sort((a, b) => a.position - b.position);
    }, [sections]);

    // Loading state
    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-background)' }}
            >
                <Loader2
                    className="w-12 h-12 animate-spin"
                    style={{ color: 'var(--color-text-muted)' }}
                />
            </div>
        );
    }

    // Not found state
    if (notFound || !merchant) return <StorefrontNotFound />;

    const basePath = isCustomDomain ? '' : `/s/${merchantSlug}`;
    const storeName = merchant.store_name || merchant.business_name || 'Store';
    const logoUrl = merchant.logo_url;

    return (
        <div
            className="min-h-screen flex flex-col storefront-wrapper"
            style={{
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                fontFamily: 'var(--font-body)',
                fontWeight: 'var(--font-body-weight)'
            }}
        >
            {/* Global Typography Styles */}
            <style>{`
                .storefront-wrapper h1, 
                .storefront-wrapper h2, 
                .storefront-wrapper h3,
                .storefront-wrapper h4, 
                .storefront-wrapper h5, 
                .storefront-wrapper h6 {
                    font-family: var(--font-heading);
                    font-weight: var(--font-heading-weight);
                    color: var(--color-text);
                }
                .storefront-wrapper p, 
                .storefront-wrapper .product-description {
                    font-family: var(--font-paragraph);
                    font-weight: var(--font-paragraph-weight);
                }
                
                /* Surface utility class */
                .storefront-wrapper .surface {
                    background-color: var(--color-surface);
                }
                .storefront-wrapper .surface:hover {
                    background-color: var(--color-surface-hover);
                }
                
                /* Common button styles */
                .storefront-wrapper .btn-primary {
                    background-color: var(--color-primary);
                    color: var(--color-background);
                    padding: var(--button-padding);
                    font-size: var(--button-font-size);
                    border-radius: var(--button-radius);
                    font-weight: 600;
                    transition: opacity 0.2s;
                }
                .storefront-wrapper .btn-primary:hover {
                    opacity: 0.9;
                }
                .storefront-wrapper .btn-primary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .storefront-wrapper .btn-secondary {
                    background-color: transparent;
                    color: var(--color-primary);
                    padding: var(--button-padding);
                    font-size: var(--button-font-size);
                    border-radius: var(--button-radius);
                    border: 1px solid var(--color-primary);
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .storefront-wrapper .btn-secondary:hover {
                    background-color: var(--color-primary);
                    color: var(--color-background);
                }
                
                /* Card styles */
                .storefront-wrapper .card {
                    background-color: var(--color-surface);
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-sm);
                    padding: var(--spacing-card);
                }
                
                
                /* Section spacing - REMOVED: individual sections manage their own padding */
                
                /* Container width */
                .storefront-wrapper .container {
                    max-width: var(--spacing-container);
                    margin-left: auto;
                    margin-right: auto;
                    padding-left: 1.5rem;
                    padding-right: 1.5rem;
                }
            `}</style>

            {/* Announcement Bars */}
            {!isCheckoutPage && !sectionsLoading && announcementBars.length > 0 && (
                <div className="w-full">
                    {announcementBars.map((section) => {
                        const AnnouncementBarComponent = getSectionComponent(section.type);
                        if (!AnnouncementBarComponent) return null;
                        return (
                            <AnnouncementBarComponent
                                key={section.id}
                                settings={section.settings}
                                basePath={basePath}
                            />
                        );
                    })}
                </div>
            )}

            {/* Header */}
            {!isCheckoutPage && (
                <Header
                    storeName={storeName}
                    logoUrl={logoUrl}
                    basePath={basePath}
                    headerItems={headerItems}
                    cartCount={cartCount}
                />
            )}

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            {!isCheckoutPage && (
                <Footer
                    storeName={storeName}
                    logoUrl={logoUrl}
                    basePath={basePath}
                    footerConfig={footerConfig}
                />
            )}
        </div>
    );
}

/**
 * Theme wrapper - applies theme after merchant data is loaded
 */
function StorefrontLayoutWithTheme() {
    const { merchant, loading, notFound } = useMerchant();

    // Show loading while fetching merchant
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
            </div>
        );
    }

    // Handle not found before theme provider
    if (notFound || !merchant) {
        return <StorefrontNotFound />;
    }

    return (
        <ThemeProvider
            themePreset={merchant.theme}
            merchantSettings={merchant.theme_settings || {}}
        >
            <StorefrontLayoutContent />
        </ThemeProvider>
    );
}

/**
 * Main Storefront Layout export
 * Wraps with MerchantProvider first, then ThemeProvider
 */
export default function StorefrontLayout() {
    return (
        <MerchantProvider>
            <StorefrontLayoutWithTheme />
        </MerchantProvider>
    );
}
