import React from 'react';
import { Check, X, Sparkles, Trophy, Target } from 'lucide-react';

/**
 * Us vs Them Section Component
 * A comparison section highlighting advantages over competitors
 * Great for persuasive marketing and conversion optimization
 */
export default function UsVsThemSection({ settings = {}, basePath = '/store' }) {
    const {
        title = 'Why Choose Us?',
        subtitle = 'See how we compare to the competition',
        us_label = 'Us',
        them_label = 'Others',
        comparison_items = [
            {
                feature: 'Premium Quality Products',
                us: true,
                them: false
            },
            {
                feature: 'Free Shipping on All Orders',
                us: true,
                them: false
            },
            {
                feature: '30-Day Money Back Guarantee',
                us: true,
                them: false
            },
            {
                feature: '24/7 Customer Support',
                us: true,
                them: false
            },
            {
                feature: 'Sustainable & Eco-Friendly',
                us: true,
                them: false
            }
        ],
        layout = 'side_by_side', // 'side_by_side', 'table', 'cards'
        style = 'modern', // 'modern', 'minimal', 'gradient'
        background_color = '#f8fafc',
        us_color = '#10B981', // Green for "us"
        them_color = '#EF4444', // Red for "them"
        accent_color = '#3B82F6',
        text_color = '#111827'
    } = settings;

    // Side by side comparison layout
    const renderSideBySide = () => (
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
            {/* Us Column */}
            <div
                className="relative rounded-3xl p-8 md:p-10 overflow-hidden"
                style={{
                    background: style === 'gradient'
                        ? `linear-gradient(135deg, ${us_color}15 0%, ${us_color}05 100%)`
                        : style === 'modern'
                            ? '#ffffff'
                            : 'transparent',
                    border: style === 'minimal' ? '2px solid #e5e7eb' : 'none',
                    boxShadow: style === 'modern' ? '0 25px 50px -12px rgba(0, 0, 0, 0.08)' : 'none'
                }}
            >
                {/* Decorative gradient orb */}
                {style === 'modern' && (
                    <div
                        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30"
                        style={{ backgroundColor: us_color }}
                    />
                )}

                {/* Header */}
                <div className="relative flex items-center gap-3 mb-8">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: `${us_color}20` }}
                    >
                        <Trophy size={24} style={{ color: us_color }} />
                    </div>
                    <div>
                        <h3
                            className="text-2xl font-bold"
                            style={{ color: us_color }}
                        >
                            {us_label}
                        </h3>
                        <p className="text-sm text-gray-500">What you get with us</p>
                    </div>
                </div>

                {/* Features List */}
                <div className="relative space-y-4">
                    {comparison_items.map((item, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${item.us ? 'bg-white/60' : 'bg-red-50/50'
                                }`}
                            style={{
                                border: item.us ? `1px solid ${us_color}25` : '1px solid #fee2e2'
                            }}
                        >
                            <div
                                className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${item.us ? '' : 'bg-red-100'
                                    }`}
                                style={{
                                    backgroundColor: item.us ? `${us_color}20` : undefined
                                }}
                            >
                                {item.us ? (
                                    <Check size={18} style={{ color: us_color }} strokeWidth={3} />
                                ) : (
                                    <X size={18} className="text-red-500" strokeWidth={3} />
                                )}
                            </div>
                            <span
                                className="font-medium"
                                style={{ color: text_color }}
                            >
                                {item.feature}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Bottom highlight */}
                {style === 'modern' && (
                    <div
                        className="mt-8 pt-6 border-t flex items-center gap-2"
                        style={{ borderColor: `${us_color}20` }}
                    >
                        <Sparkles size={18} style={{ color: us_color }} />
                        <span className="text-sm font-medium" style={{ color: us_color }}>
                            The better choice
                        </span>
                    </div>
                )}
            </div>

            {/* Them Column */}
            <div
                className="relative rounded-3xl p-8 md:p-10 overflow-hidden opacity-75"
                style={{
                    background: style === 'gradient'
                        ? `linear-gradient(135deg, ${them_color}08 0%, ${them_color}03 100%)`
                        : style === 'modern'
                            ? '#fafafa'
                            : 'transparent',
                    border: style === 'minimal' ? '2px solid #e5e7eb' : 'none',
                    boxShadow: style === 'modern' ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none'
                }}
            >
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <Target size={24} className="text-gray-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-400">
                            {them_label}
                        </h3>
                        <p className="text-sm text-gray-400">What others offer</p>
                    </div>
                </div>

                {/* Features List */}
                <div className="space-y-4">
                    {comparison_items.map((item, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${item.them ? 'bg-green-50/50' : 'bg-gray-50'
                                }`}
                            style={{
                                border: item.them ? `1px solid ${us_color}25` : '1px solid #f3f4f6'
                            }}
                        >
                            <div
                                className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${item.them ? '' : 'bg-gray-100'
                                    }`}
                                style={{
                                    backgroundColor: item.them ? `${us_color}20` : undefined
                                }}
                            >
                                {item.them ? (
                                    <Check size={18} style={{ color: us_color }} strokeWidth={3} />
                                ) : (
                                    <X size={18} className="text-gray-400" strokeWidth={3} />
                                )}
                            </div>
                            <span className="font-medium text-gray-400">
                                {item.feature}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // Table comparison layout
    const renderTable = () => (
        <div className="max-w-4xl mx-auto overflow-hidden rounded-3xl bg-white shadow-xl">
            {/* Table Header */}
            <div
                className="grid grid-cols-3 border-b"
                style={{ borderColor: '#e5e7eb' }}
            >
                <div className="p-6 font-semibold text-gray-500 text-sm uppercase tracking-wider">
                    Feature
                </div>
                <div
                    className="p-6 text-center font-bold text-lg border-x"
                    style={{
                        backgroundColor: `${us_color}10`,
                        borderColor: `${us_color}20`,
                        color: us_color
                    }}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Trophy size={20} />
                        {us_label}
                    </div>
                </div>
                <div className="p-6 text-center font-bold text-lg text-gray-400">
                    {them_label}
                </div>
            </div>

            {/* Table Body */}
            {comparison_items.map((item, index) => (
                <div
                    key={index}
                    className={`grid grid-cols-3 border-b last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                    style={{ borderColor: '#e5e7eb' }}
                >
                    <div
                        className="p-5 font-medium flex items-center"
                        style={{ color: text_color }}
                    >
                        {item.feature}
                    </div>
                    <div
                        className="p-5 flex items-center justify-center border-x"
                        style={{
                            backgroundColor: `${us_color}05`,
                            borderColor: `${us_color}15`
                        }}
                    >
                        {item.us ? (
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${us_color}20` }}
                            >
                                <Check size={22} style={{ color: us_color }} strokeWidth={3} />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                <X size={22} className="text-red-400" strokeWidth={3} />
                            </div>
                        )}
                    </div>
                    <div className="p-5 flex items-center justify-center">
                        {item.them ? (
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${us_color}20` }}
                            >
                                <Check size={22} style={{ color: us_color }} strokeWidth={3} />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <X size={22} className="text-gray-400" strokeWidth={3} />
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    // Cards comparison layout
    const renderCards = () => (
        <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
                {comparison_items.map((item, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                        style={{ border: '1px solid #e5e7eb' }}
                    >
                        <div className="flex items-center justify-between">
                            <span
                                className="font-semibold text-lg"
                                style={{ color: text_color }}
                            >
                                {item.feature}
                            </span>
                            <div className="flex items-center gap-4">
                                {/* Us Badge */}
                                <div
                                    className={`px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 ${item.us ? '' : 'bg-gray-100 text-gray-400'
                                        }`}
                                    style={{
                                        backgroundColor: item.us ? `${us_color}15` : undefined,
                                        color: item.us ? us_color : undefined
                                    }}
                                >
                                    {item.us ? (
                                        <Check size={16} strokeWidth={3} />
                                    ) : (
                                        <X size={16} strokeWidth={3} />
                                    )}
                                    {us_label}
                                </div>
                                {/* Them Badge */}
                                <div
                                    className={`px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 ${item.them ? '' : 'bg-gray-100 text-gray-400'
                                        }`}
                                    style={{
                                        backgroundColor: item.them ? `${us_color}15` : undefined,
                                        color: item.them ? us_color : undefined
                                    }}
                                >
                                    {item.them ? (
                                        <Check size={16} strokeWidth={3} />
                                    ) : (
                                        <X size={16} strokeWidth={3} />
                                    )}
                                    {them_label}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // Select layout renderer
    const renderComparison = () => {
        switch (layout) {
            case 'table':
                return renderTable();
            case 'cards':
                return renderCards();
            case 'side_by_side':
            default:
                return renderSideBySide();
        }
    };

    return (
        <section
            className="py-16 md:py-24 px-6"
            style={{ backgroundColor: background_color }}
        >
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-14">
                    <div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
                        style={{
                            backgroundColor: `${accent_color}15`,
                            color: accent_color
                        }}
                    >
                        <Trophy size={16} />
                        <span>Comparison</span>
                    </div>

                    <h2
                        className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
                        style={{ color: text_color }}
                    >
                        {title}
                    </h2>

                    {subtitle && (
                        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Comparison Content */}
                {renderComparison()}
            </div>
        </section>
    );
}

// Section metadata for the editor
UsVsThemSection.sectionMeta = {
    type: 'us_vs_them',
    name: 'Us vs Them',
    description: 'Compare your advantages against competitors',
    icon: 'Scale',
    // No pageTypes restriction = available on all pages
    defaultSettings: {
        title: 'Why Choose Us?',
        subtitle: 'See how we compare to the competition',
        us_label: 'Us',
        them_label: 'Others',
        comparison_items: [
            {
                feature: 'Premium Quality Products',
                us: true,
                them: false
            },
            {
                feature: 'Free Shipping on All Orders',
                us: true,
                them: false
            },
            {
                feature: '30-Day Money Back Guarantee',
                us: true,
                them: false
            },
            {
                feature: '24/7 Customer Support',
                us: true,
                them: false
            },
            {
                feature: 'Sustainable & Eco-Friendly',
                us: true,
                them: false
            }
        ],
        layout: 'side_by_side',
        style: 'modern',
        background_color: '#f8fafc',
        us_color: '#10B981',
        them_color: '#EF4444',
        accent_color: '#3B82F6',
        text_color: '#111827'
    },
    settingsSchema: [
        { key: 'title', type: 'text', label: 'Title', placeholder: 'Why Choose Us?' },
        { key: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'See how we compare...' },
        { key: 'us_label', type: 'text', label: '"Us" Label', placeholder: 'Us' },
        { key: 'them_label', type: 'text', label: '"Them" Label', placeholder: 'Others' },
        {
            key: 'comparison_items',
            type: 'array',
            label: 'Comparison Items',
            itemSchema: [
                { key: 'feature', type: 'text', label: 'Feature', placeholder: 'Premium Quality Products' },
                { key: 'us', type: 'toggle', label: 'We have this' },
                { key: 'them', type: 'toggle', label: 'They have this' }
            ],
            maxItems: 10
        },
        {
            key: 'layout', type: 'select', label: 'Layout', options: [
                { value: 'side_by_side', label: 'Side by Side' },
                { value: 'table', label: 'Table' },
                { value: 'cards', label: 'Cards' }
            ]
        },
        {
            key: 'style', type: 'select', label: 'Style', options: [
                { value: 'modern', label: 'Modern' },
                { value: 'minimal', label: 'Minimal' },
                { value: 'gradient', label: 'Gradient' }
            ]
        },
        { key: 'background_color', type: 'color', label: 'Background Color' },
        { key: 'us_color', type: 'color', label: '"Us" Accent Color' },
        { key: 'accent_color', type: 'color', label: 'Header Accent Color' },
        { key: 'text_color', type: 'color', label: 'Text Color' }
    ]
};
