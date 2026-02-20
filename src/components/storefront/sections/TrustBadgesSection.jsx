import React from 'react';
import {
    Truck,
    RefreshCw,
    ShieldCheck,
    Clock,
    Heart,
    Star,
    Award,
    Headphones,
    CreditCard,
    Gift,
    Zap,
    ThumbsUp
} from 'lucide-react';

// Icon mapping for dynamic icon selection
const ICON_MAP = {
    Truck,
    RefreshCw,
    ShieldCheck,
    Clock,
    Heart,
    Star,
    Award,
    Headphones,
    CreditCard,
    Gift,
    Zap,
    ThumbsUp
};

/**
 * Trust Badges/Guarantees Section Component
 * Displays trust indicators like shipping, returns, security info
 */
export default function TrustBadgesSection({ settings = {}, basePath = '/store' }) {
    const {
        badges = [
            { icon: 'Truck', title: 'Free Shipping', subtitle: 'On all orders over R 1,500' },
            { icon: 'RefreshCw', title: 'Free Returns', subtitle: '30 days money-back guarantee' },
            { icon: 'ShieldCheck', title: 'Secure Payment', subtitle: 'Protected by 256-bit SSL encryption' }
        ],
        layout = 'horizontal', // 'horizontal', 'vertical'
        show_border = true,
        columns = 3
    } = settings;

    const gridClasses = {
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-3',
        4: 'md:grid-cols-4'
    };

    return (
        <section className={`py-16 ${show_border ? 'border-b border-gray-100' : ''}`}>
            <div className={`max-w-7xl mx-auto px-6 grid grid-cols-1 ${gridClasses[columns] || gridClasses[3]} gap-8 text-center`}>
                {badges.map((badge, index) => {
                    const IconComponent = ICON_MAP[badge.icon] || ShieldCheck;

                    return (
                        <div
                            key={index}
                            className={`flex ${layout === 'vertical' ? 'flex-col' : 'flex-col'} items-center`}
                        >
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-700">
                                <IconComponent size={24} />
                            </div>
                            <h4 className="font-bold mb-2">{badge.title}</h4>
                            {badge.subtitle && (
                                <p className="text-sm text-gray-500">{badge.subtitle}</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

// Export icon options for the editor
export const TRUST_BADGE_ICONS = [
    { value: 'Truck', label: '🚚 Truck (Shipping)' },
    { value: 'RefreshCw', label: '🔄 Refresh (Returns)' },
    { value: 'ShieldCheck', label: '🛡️ Shield (Security)' },
    { value: 'Clock', label: '⏰ Clock (Fast)' },
    { value: 'Heart', label: '❤️ Heart (Love)' },
    { value: 'Star', label: '⭐ Star (Quality)' },
    { value: 'Award', label: '🏆 Award (Best)' },
    { value: 'Headphones', label: '🎧 Headphones (Support)' },
    { value: 'CreditCard', label: '💳 Card (Payment)' },
    { value: 'Gift', label: '🎁 Gift (Rewards)' },
    { value: 'Zap', label: '⚡ Zap (Speed)' },
    { value: 'ThumbsUp', label: '👍 Thumbs Up (Quality)' }
];

// Section metadata for the editor
TrustBadgesSection.sectionMeta = {
    type: 'trust_badges',
    name: 'Trust Badges',
    description: 'Display trust indicators like shipping info, guarantees, and security badges',
    icon: 'Shield',
    defaultSettings: {
        badges: [
            { icon: 'Truck', title: 'Free Shipping', subtitle: 'On all orders over R 1,500' },
            { icon: 'RefreshCw', title: 'Free Returns', subtitle: '30 days money-back guarantee' },
            { icon: 'ShieldCheck', title: 'Secure Payment', subtitle: 'Protected by 256-bit SSL encryption' }
        ],
        layout: 'horizontal',
        show_border: true,
        columns: 3
    },
    settingsSchema: [
        {
            key: 'badges',
            type: 'array',
            label: 'Badges',
            itemSchema: [
                { key: 'icon', type: 'select', label: 'Icon', options: TRUST_BADGE_ICONS },
                { key: 'title', type: 'text', label: 'Title', placeholder: 'Free Shipping' },
                { key: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'On all orders over R 1,500' }
            ],
            maxItems: 6
        },
        {
            key: 'columns', type: 'select', label: 'Columns', options: [
                { value: 2, label: '2 Columns' },
                { value: 3, label: '3 Columns' },
                { value: 4, label: '4 Columns' }
            ]
        },
        { key: 'show_border', type: 'toggle', label: 'Show Bottom Border' }
    ]
};
