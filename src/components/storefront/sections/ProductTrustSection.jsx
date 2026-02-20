import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Clock, Star, Award, Headphones, Heart, CreditCard, Gift, Zap, ThumbsUp } from 'lucide-react';

// Icon mapping for dynamic icons
const ICON_MAP = {
    Truck, ShieldCheck, RefreshCw, Clock, Star, Award, Headphones, Heart, CreditCard, Gift, Zap, ThumbsUp
};

/**
 * Product Trust Badges Section
 * Trust signals displayed on product detail pages
 */
export default function ProductTrustSection({ settings = {}, basePath = '/store' }) {
    const {
        badges = [
            { icon: 'Truck', title: 'Free Shipping', subtitle: 'On orders over R 1,500' },
            { icon: 'ShieldCheck', title: 'Secure Payment', subtitle: 'Protected checkout & 30-day returns' }
        ],
        layout = 'vertical' // 'vertical', 'horizontal'
    } = settings;

    return (
        <section className="border-t border-gray-200 pt-6 space-y-4">
            {badges.map((badge, index) => {
                const IconComponent = ICON_MAP[badge.icon] || ShieldCheck;
                return (
                    <div key={index} className="flex items-center gap-3">
                        <IconComponent size={22} className="text-gray-800" />
                        <div>
                            <p className="font-medium text-gray-900 text-sm">{badge.title}</p>
                            {badge.subtitle && (
                                <p className="text-xs text-gray-600">{badge.subtitle}</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </section>
    );
}

// Export icon options
export const PRODUCT_TRUST_ICONS = [
    { value: 'Truck', label: '🚚 Shipping' },
    { value: 'ShieldCheck', label: '🛡️ Security' },
    { value: 'RefreshCw', label: '🔄 Returns' },
    { value: 'Clock', label: '⏰ Fast' },
    { value: 'Star', label: '⭐ Quality' },
    { value: 'CreditCard', label: '💳 Payment' }
];

// Section metadata
ProductTrustSection.sectionMeta = {
    type: 'product_trust',
    name: 'Product Trust Badges',
    description: 'Trust signals like shipping info and security badges for product pages',
    icon: 'ShieldCheck',
    pageTypes: ['product'], // Only available on product page
    zone: 'trust', // Renders in the trust signals area below add-to-cart
    defaultSettings: {
        badges: [
            { icon: 'Truck', title: 'Free Shipping', subtitle: 'On orders over R 1,500' },
            { icon: 'ShieldCheck', title: 'Secure Payment', subtitle: 'Protected checkout & 30-day returns' }
        ],
        layout: 'vertical'
    },
    settingsSchema: [
        {
            key: 'badges',
            type: 'array',
            label: 'Trust Badges',
            itemSchema: [
                { key: 'icon', type: 'select', label: 'Icon', options: PRODUCT_TRUST_ICONS },
                { key: 'title', type: 'text', label: 'Title', placeholder: 'Free Shipping' },
                { key: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'On orders over R 1,500' }
            ],
            maxItems: 4
        }
    ]
};
