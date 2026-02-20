import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles, Tag, Truck, Clock, Gift, Percent, Zap, Star } from 'lucide-react';

// Icon mapping for announcement types
const ICON_MAP = {
    none: null,
    sparkles: Sparkles,
    tag: Tag,
    truck: Truck,
    clock: Clock,
    gift: Gift,
    percent: Percent,
    zap: Zap,
    star: Star
};

/**
 * Announcement Bar Section Component
 * Displays promotional messages, sales, or important notices
 * Supports multiple announcements with auto-rotation
 */
export default function AnnouncementBarSection({ settings = {}, basePath = '/store' }) {
    const {
        announcements = [
            { text: 'Free shipping on orders over R1,500! 🚚', link: '', icon: 'truck' }
        ],
        background_style = 'solid', // 'solid', 'gradient', 'animated_gradient'
        background_color = '#111827',
        gradient_from = '#6366F1',
        gradient_to = '#8B5CF6',
        text_color = '#ffffff',
        text_size = 'medium', // 'small', 'medium', 'large'
        show_close_button = false,
        auto_rotate = true,
        rotation_speed = 5, // seconds
        sticky = false,
        height = 'normal' // 'compact', 'normal', 'tall'
    } = settings;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [isPaused, setIsPaused] = useState(false);

    // Auto-rotate announcements
    useEffect(() => {
        if (!auto_rotate || announcements.length <= 1 || isPaused) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % announcements.length);
        }, rotation_speed * 1000);

        return () => clearInterval(interval);
    }, [auto_rotate, announcements.length, rotation_speed, isPaused]);

    if (!isVisible || announcements.length === 0) return null;

    const currentAnnouncement = announcements[currentIndex] || announcements[0];
    const IconComponent = ICON_MAP[currentAnnouncement?.icon];

    // Height classes
    const heightClasses = {
        compact: 'py-2',
        normal: 'py-3',
        tall: 'py-4'
    };

    // Text size classes
    const textSizeClasses = {
        small: 'text-xs',
        medium: 'text-sm',
        large: 'text-base'
    };

    // Background styles
    const getBackgroundStyle = () => {
        switch (background_style) {
            case 'gradient':
                return {
                    background: `linear-gradient(135deg, ${gradient_from} 0%, ${gradient_to} 100%)`
                };
            case 'animated_gradient':
                return {
                    background: `linear-gradient(90deg, ${gradient_from}, ${gradient_to}, ${gradient_from})`,
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 3s linear infinite'
                };
            case 'solid':
            default:
                return {
                    backgroundColor: background_color
                };
        }
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
    };

    const content = (
        <div
            className={`relative ${heightClasses[height] || heightClasses.normal} px-4 ${sticky ? 'sticky top-0 z-50' : ''}`}
            style={{ ...getBackgroundStyle(), color: text_color }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Animated gradient keyframes */}
            {background_style === 'animated_gradient' && (
                <style>{`
                    @keyframes shimmer {
                        0% { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                    }
                `}</style>
            )}

            <div className="max-w-7xl mx-auto flex items-center justify-center">
                {/* Navigation - Previous */}
                {announcements.length > 1 && (
                    <button
                        onClick={handlePrev}
                        className="absolute left-4 p-1 rounded-full hover:bg-white/10 transition-colors"
                        aria-label="Previous announcement"
                    >
                        <ChevronLeft size={16} />
                    </button>
                )}

                {/* Announcement Content */}
                <div className={`flex items-center justify-center gap-2 ${textSizeClasses[text_size] || textSizeClasses.medium} font-medium`}>
                    {IconComponent && (
                        <IconComponent size={text_size === 'large' ? 18 : text_size === 'small' ? 14 : 16} className="flex-shrink-0" />
                    )}

                    {currentAnnouncement?.link ? (
                        <a
                            href={currentAnnouncement.link.startsWith('/') ? `${basePath}${currentAnnouncement.link}` : currentAnnouncement.link}
                            className="hover:underline transition-all"
                        >
                            {currentAnnouncement?.text}
                        </a>
                    ) : (
                        <span>{currentAnnouncement?.text}</span>
                    )}

                    {/* Dot indicators for multiple announcements */}
                    {announcements.length > 1 && (
                        <div className="flex items-center gap-1 ml-3">
                            {announcements.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentIndex(index)}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${index === currentIndex ? 'bg-white' : 'bg-white/40'
                                        }`}
                                    aria-label={`Go to announcement ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Navigation - Next */}
                {announcements.length > 1 && (
                    <button
                        onClick={handleNext}
                        className="absolute right-12 p-1 rounded-full hover:bg-white/10 transition-colors"
                        aria-label="Next announcement"
                    >
                        <ChevronRight size={16} />
                    </button>
                )}

                {/* Close Button */}
                {show_close_button && (
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
                        aria-label="Close announcement"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    );

    return content;
}

// Export icon options for the editor
export const ANNOUNCEMENT_ICONS = [
    { value: 'none', label: 'No Icon' },
    { value: 'sparkles', label: '✨ Sparkles' },
    { value: 'tag', label: '🏷️ Tag (Sale)' },
    { value: 'truck', label: '🚚 Truck (Shipping)' },
    { value: 'clock', label: '⏰ Clock (Limited Time)' },
    { value: 'gift', label: '🎁 Gift' },
    { value: 'percent', label: '% Percent (Discount)' },
    { value: 'zap', label: '⚡ Zap (Flash Sale)' },
    { value: 'star', label: '⭐ Star' }
];

// Section metadata for the editor
AnnouncementBarSection.sectionMeta = {
    type: 'announcement_bar',
    name: 'Announcement Bar',
    description: 'Display promotions, sales, or important notices at the top of your store',
    icon: 'Megaphone',
    defaultSettings: {
        announcements: [
            { text: 'Free shipping on orders over R1,500! 🚚', link: '', icon: 'truck' }
        ],
        background_style: 'solid',
        background_color: '#111827',
        gradient_from: '#6366F1',
        gradient_to: '#8B5CF6',
        text_color: '#ffffff',
        text_size: 'medium',
        show_close_button: false,
        auto_rotate: true,
        rotation_speed: 5,
        sticky: false,
        height: 'normal'
    },
    settingsSchema: [
        {
            key: 'announcements',
            type: 'array',
            label: 'Announcements',
            itemSchema: [
                { key: 'text', type: 'text', label: 'Message', placeholder: 'Free shipping on orders over R1,500!' },
                { key: 'link', type: 'text', label: 'Link (optional)', placeholder: '/products or https://...' },
                { key: 'icon', type: 'select', label: 'Icon', options: ANNOUNCEMENT_ICONS }
            ],
            maxItems: 5
        },
        {
            key: 'background_style', type: 'select', label: 'Background Style', options: [
                { value: 'solid', label: 'Solid Color' },
                { value: 'gradient', label: 'Gradient' },
                { value: 'animated_gradient', label: 'Animated Gradient' }
            ]
        },
        { key: 'background_color', type: 'color', label: 'Background Color (for solid)' },
        { key: 'gradient_from', type: 'color', label: 'Gradient Start Color' },
        { key: 'gradient_to', type: 'color', label: 'Gradient End Color' },
        { key: 'text_color', type: 'color', label: 'Text Color' },
        {
            key: 'text_size', type: 'select', label: 'Text Size', options: [
                { value: 'small', label: 'Small' },
                { value: 'medium', label: 'Medium' },
                { value: 'large', label: 'Large' }
            ]
        },
        {
            key: 'height', type: 'select', label: 'Height', options: [
                { value: 'compact', label: 'Compact' },
                { value: 'normal', label: 'Normal' },
                { value: 'tall', label: 'Tall' }
            ]
        },
        { key: 'auto_rotate', type: 'toggle', label: 'Auto-rotate announcements' },
        {
            key: 'rotation_speed', type: 'select', label: 'Rotation Speed', options: [
                { value: 3, label: 'Fast (3s)' },
                { value: 5, label: 'Normal (5s)' },
                { value: 8, label: 'Slow (8s)' },
                { value: 10, label: 'Very Slow (10s)' }
            ]
        },
        { key: 'show_close_button', type: 'toggle', label: 'Show close button' },
        { key: 'sticky', type: 'toggle', label: 'Sticky (stays at top when scrolling)' }
    ]
};
