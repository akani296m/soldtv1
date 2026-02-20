import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useMerchant } from '../context/MerchantContext';
import { useMerchantProducts } from '../hooks/useMerchantProducts';
import { useSections } from '../../hooks/useSections';
import SectionRenderer from '../../components/storefront/SectionRenderer';
import posthog from 'posthog-js';

/**
 * StoreHome - Dynamic Storefront Homepage
 * 
 * Renders merchant-specific sections fetched from the database.
 * Each merchant can have their own customized section layout.
 */
export default function StoreHome() {
    const { merchantSlug } = useParams();
    const { merchant, isCustomDomain, loading: merchantLoading } = useMerchant();

    // Fetch products for this merchant
    const { products, loading: productsLoading } = useMerchantProducts();

    // Fetch sections for this merchant
    const {
        sections,
        loading: sectionsLoading
    } = useSections(merchant?.id);

    // Base path for this merchant's storefront
    // If on custom domain, use root path. Otherwise use /s/:slug
    const basePath = isCustomDomain ? '' : `/s/${merchantSlug}`;

    // Track storefront page view in PostHog
    useEffect(() => {
        if (merchant?.id && !merchantLoading) {
            // Track storefront page view
            posthog.capture('Storefront Viewed', {
                store_id: merchant.id,
                store_name: merchant.name,
                store_slug: merchant.slug,
                is_custom_domain: isCustomDomain,
            });

            // Check if this is the first time this store has been visited (Store First Launch)
            const firstLaunchKey = `store_launched_${merchant.id}`;
            const hasLaunched = localStorage.getItem(firstLaunchKey);

            if (!hasLaunched) {
                posthog.capture('Store First Launch', {
                    store_id: merchant.id,
                    store_name: merchant.name,
                    store_slug: merchant.slug,
                });
                localStorage.setItem(firstLaunchKey, 'true');
            }
        }
    }, [merchant?.id, merchantLoading, isCustomDomain]);

    // Show loading state while merchant or sections are loading
    if (merchantLoading || sectionsLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={48} className="animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Loading store...</p>
                </div>
            </div>
        );
    }

    // Show error state if no merchant found
    if (!merchant) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h1>
                    <p className="text-gray-500">The store you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <SectionRenderer
            sections={sections}
            basePath={basePath}
            products={products}
            productsLoading={productsLoading}
        />
    );
}
