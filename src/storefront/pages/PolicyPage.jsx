import React from 'react';
import { useParams } from 'react-router-dom';
import { useMerchant } from '../context/MerchantContext';

/**
 * PolicyPage
 * 
 * Displays policy pages (shipping, privacy, about us) for the storefront.
 * The page type is determined by the URL path.
 */
export default function PolicyPage() {
    const { pageType } = useParams();
    const { merchant, loading } = useMerchant();

    // Map URL path to merchant data field and display title
    const pageConfig = {
        'shipping-policy': {
            field: 'shipping_policy',
            title: 'Shipping Policy',
        },
        'privacy-policy': {
            field: 'privacy_policy',
            title: 'Privacy Policy',
        },
        'about-us': {
            field: 'about_us',
            title: 'About Us',
        },
    };

    const config = pageConfig[pageType];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!config) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
                    <p className="text-gray-600">The requested page does not exist.</p>
                </div>
            </div>
        );
    }

    const content = merchant?.[config.field];

    if (!content) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{config.title}</h1>
                    <p className="text-gray-600">This page has not been set up yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">{config.title}</h1>
            <div className="prose prose-lg max-w-none">
                {/* Render content with preserved whitespace and line breaks */}
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {content}
                </div>
            </div>
        </div>
    );
}
