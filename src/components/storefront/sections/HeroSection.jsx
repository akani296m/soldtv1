import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Star,
    Shield,
    Truck,
    Clock,
    Users,
    ChevronRight,
    Sparkles,
    Play
} from 'lucide-react';

/**
 * Hero Section Component - Conversion Optimized
 * Full-width hero banner with multiple layout variants, urgency elements,
 * social proof, and trust indicators for maximum conversion impact.
 */

// Countdown Timer Component
const CountdownTimer = ({ targetDate, textColor }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(targetDate) - new Date();
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    const TimeBlock = ({ value, label }) => (
        <div className="flex flex-col items-center">
            <div
                className="w-14 h-14 md:w-16 md:h-16 rounded-lg flex items-center justify-center text-xl md:text-2xl font-bold"
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
            >
                {String(value).padStart(2, '0')}
            </div>
            <span className="text-xs mt-1 opacity-70 uppercase tracking-wider">{label}</span>
        </div>
    );

    return (
        <div className="flex items-center gap-2 md:gap-3" style={{ color: textColor }}>
            <TimeBlock value={timeLeft.days} label="Days" />
            <span className="text-2xl font-light opacity-50">:</span>
            <TimeBlock value={timeLeft.hours} label="Hrs" />
            <span className="text-2xl font-light opacity-50">:</span>
            <TimeBlock value={timeLeft.minutes} label="Min" />
            <span className="text-2xl font-light opacity-50">:</span>
            <TimeBlock value={timeLeft.seconds} label="Sec" />
        </div>
    );
};

// Social Proof Badge
const SocialProofBadge = ({ count, text, icon: Icon, style }) => (
    <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
        style={style}
    >
        {Icon && <Icon size={16} />}
        <span className="font-semibold">{count}</span>
        <span className="opacity-80">{text}</span>
    </div>
);

// Trust Indicator
const TrustIndicator = ({ icon: Icon, text, textColor }) => (
    <div className="flex items-center gap-2 text-sm" style={{ color: textColor }}>
        <Icon size={16} className="opacity-70" />
        <span className="opacity-80">{text}</span>
    </div>
);

// Star Rating Component
const StarRating = ({ rating, reviewCount, textColor }) => (
    <div className="flex items-center gap-2" style={{ color: textColor }}>
        <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    size={16}
                    fill={i < Math.floor(rating) ? '#FBBF24' : 'transparent'}
                    stroke={i < Math.floor(rating) ? '#FBBF24' : 'currentColor'}
                    className="opacity-80"
                />
            ))}
        </div>
        <span className="text-sm opacity-70">({reviewCount.toLocaleString()} reviews)</span>
    </div>
);

export default function HeroSection({ settings = {}, basePath = '/store' }) {
    const {
        // Basic Content
        background_image = 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        badge_text = '✨ New Season Drop',
        title = 'Elevate Your\nEveryday Style',
        subtitle = 'Discover premium essentials crafted for modern living. Limited quantities available—shop before they\'re gone.',

        // Primary CTA
        button_text = 'Shop the Collection',
        button_link = '/products',
        button_style = 'solid', // 'solid', 'outline', 'gradient'

        // Secondary CTA
        secondary_button_enabled = true,
        secondary_button_text = 'Watch Video',
        secondary_button_link = '',
        secondary_button_icon = 'play', // 'play', 'arrow', 'none'

        // Layout & Appearance
        layout = 'centered', // 'centered', 'left', 'split'
        height = 'full', // 'medium', 'large', 'full'
        overlay_enabled = true,
        overlay_color = '#000000',
        overlay_opacity = 50,
        text_color = '#ffffff',
        accent_color = '#8B5CF6', // Purple accent

        // Urgency Elements
        countdown_enabled = false,
        countdown_label = 'Flash Sale Ends In',
        countdown_target_date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),

        // Social Proof
        social_proof_enabled = true,
        customer_count = '15,000+',
        customer_text = 'happy customers',

        // Rating
        rating_enabled = true,
        rating_value = 4.9,
        review_count = 2847,

        // Trust Elements
        trust_badges_enabled = true,
        trust_badge_1 = 'Free Shipping',
        trust_badge_2 = '30-Day Returns',
        trust_badge_3 = 'Secure Checkout',

        // Visual Effects
        animation_enabled = true,
        gradient_overlay_enabled = true,
        glassmorphism_enabled = true
    } = settings;

    const heightClasses = {
        medium: 'min-h-[60vh]',
        large: 'min-h-[80vh]',
        full: 'min-h-screen'
    };

    const alignmentClasses = {
        left: 'text-left items-start',
        centered: 'text-center items-center',
        split: 'text-left items-start md:w-1/2'
    };

    // Animation classes
    const fadeInUp = animation_enabled ? 'animate-fade-in-up' : '';
    const fadeIn = animation_enabled ? 'animate-fade-in' : '';

    // Button styles
    const getButtonStyle = (isPrimary = true) => {
        if (isPrimary) {
            switch (button_style) {
                case 'outline':
                    return {
                        backgroundColor: 'transparent',
                        color: text_color,
                        border: `2px solid ${text_color}`,
                    };
                case 'gradient':
                    return {
                        background: `linear-gradient(135deg, ${accent_color} 0%, #EC4899 100%)`,
                        color: '#ffffff',
                        border: 'none',
                    };
                default: // solid
                    return {
                        backgroundColor: '#ffffff',
                        color: '#111111',
                        border: 'none',
                    };
            }
        }
        return {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: text_color,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
        };
    };

    return (
        <section
            className={`relative ${heightClasses[height] || heightClasses.full} overflow-hidden`}
            style={{ backgroundColor: '#111111' }}
        >
            {/* Custom Animations */}
            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.4); }
                    50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.6); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.8s ease-out forwards;
                }
                .animate-fade-in {
                    animation: fadeIn 1s ease-out forwards;
                }
                .animate-pulse-glow {
                    animation: pulse-glow 2s ease-in-out infinite;
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                .delay-100 { animation-delay: 100ms; }
                .delay-200 { animation-delay: 200ms; }
                .delay-300 { animation-delay: 300ms; }
                .delay-400 { animation-delay: 400ms; }
                .delay-500 { animation-delay: 500ms; }
            `}</style>

            {/* Background Image */}
            <div className={`absolute inset-0 ${fadeIn}`}>
                <img
                    src={background_image}
                    alt="Hero Background"
                    className="w-full h-full object-cover"
                    loading="eager"
                />
            </div>

            {/* Gradient Overlay */}
            {gradient_overlay_enabled && (
                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(135deg, rgba(0,0,0,0.7) 0%, transparent 50%, rgba(${accent_color === '#8B5CF6' ? '139,92,246' : '236,72,153'},0.3) 100%)`
                    }}
                />
            )}

            {/* Standard Overlay */}
            {overlay_enabled && (
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundColor: overlay_color,
                        opacity: overlay_opacity / 100
                    }}
                />
            )}

            {/* Decorative Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Floating orbs */}
                <div
                    className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl animate-float"
                    style={{ backgroundColor: accent_color, opacity: 0.1 }}
                />
                <div
                    className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full blur-3xl animate-float delay-500"
                    style={{ backgroundColor: '#EC4899', opacity: 0.1 }}
                />
            </div>

            {/* Main Content */}
            <div className={`relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-center ${alignmentClasses[layout] || alignmentClasses.centered}`}>
                <div className={`${layout === 'centered' ? 'max-w-4xl mx-auto' : 'max-w-2xl'}`}>

                    {/* Badge */}
                    {badge_text && (
                        <div
                            className={`inline-flex items-center gap-2 mb-6 ${fadeInUp}`}
                            style={{
                                color: text_color,
                                animationDelay: '100ms',
                                opacity: animation_enabled ? 0 : 1
                            }}
                        >
                            {glassmorphism_enabled ? (
                                <span
                                    className="px-4 py-2 rounded-full text-sm font-medium"
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}
                                >
                                    {badge_text}
                                </span>
                            ) : (
                                <span className="text-sm font-bold tracking-widest uppercase text-gray-300">
                                    {badge_text}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Title */}
                    <h1
                        className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] ${fadeInUp}`}
                        style={{
                            color: text_color,
                            animationDelay: '200ms',
                            opacity: animation_enabled ? 0 : 1
                        }}
                        dangerouslySetInnerHTML={{
                            __html: title.replace(/\n/g, '<br />')
                        }}
                    />

                    {/* Rating */}
                    {rating_enabled && (
                        <div
                            className={`mb-4 ${layout === 'centered' ? 'flex justify-center' : ''} ${fadeInUp}`}
                            style={{
                                animationDelay: '250ms',
                                opacity: animation_enabled ? 0 : 1
                            }}
                        >
                            <StarRating
                                rating={rating_value}
                                reviewCount={review_count}
                                textColor={text_color}
                            />
                        </div>
                    )}

                    {/* Subtitle */}
                    {subtitle && (
                        <p
                            className={`text-lg md:text-xl mb-8 leading-relaxed ${layout === 'centered' ? 'max-w-2xl mx-auto' : 'max-w-lg'} ${fadeInUp}`}
                            style={{
                                color: text_color,
                                opacity: animation_enabled ? 0 : 0.85,
                                animationDelay: '300ms'
                            }}
                        >
                            {subtitle}
                        </p>
                    )}

                    {/* Countdown Timer */}
                    {countdown_enabled && (
                        <div
                            className={`mb-8 ${layout === 'centered' ? 'flex flex-col items-center' : ''} ${fadeInUp}`}
                            style={{
                                animationDelay: '350ms',
                                opacity: animation_enabled ? 0 : 1
                            }}
                        >
                            {countdown_label && (
                                <p
                                    className="text-sm font-medium mb-3 uppercase tracking-wider"
                                    style={{ color: text_color, opacity: 0.7 }}
                                >
                                    ⏱ {countdown_label}
                                </p>
                            )}
                            <CountdownTimer targetDate={countdown_target_date} textColor={text_color} />
                        </div>
                    )}

                    {/* CTA Buttons */}
                    <div
                        className={`flex flex-wrap gap-4 mb-8 ${layout === 'centered' ? 'justify-center' : ''} ${fadeInUp}`}
                        style={{
                            animationDelay: '400ms',
                            opacity: animation_enabled ? 0 : 1
                        }}
                    >
                        {/* Primary Button */}
                        <Link
                            to={button_link.startsWith('http') ? button_link : `${basePath}${button_link}`}
                            className="group inline-flex items-center gap-3 px-8 py-4 font-bold uppercase tracking-wider rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                            style={getButtonStyle(true)}
                        >
                            {button_text}
                            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                        </Link>

                        {/* Secondary Button */}
                        {secondary_button_enabled && secondary_button_text && (
                            <Link
                                to={secondary_button_link.startsWith('http') ? secondary_button_link : (secondary_button_link ? `${basePath}${secondary_button_link}` : '#')}
                                className="group inline-flex items-center gap-3 px-8 py-4 font-semibold rounded-lg transition-all duration-300 hover:scale-105"
                                style={getButtonStyle(false)}
                            >
                                {secondary_button_icon === 'play' && (
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                                    >
                                        <Play size={14} fill="currentColor" />
                                    </div>
                                )}
                                {secondary_button_text}
                                {secondary_button_icon === 'arrow' && (
                                    <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                                )}
                            </Link>
                        )}
                    </div>

                    {/* Social Proof */}
                    {social_proof_enabled && (
                        <div
                            className={`flex flex-wrap items-center gap-4 mb-6 ${layout === 'centered' ? 'justify-center' : ''} ${fadeInUp}`}
                            style={{
                                animationDelay: '450ms',
                                opacity: animation_enabled ? 0 : 1
                            }}
                        >
                            <SocialProofBadge
                                count={customer_count}
                                text={customer_text}
                                icon={Users}
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: text_color,
                                    backdropFilter: glassmorphism_enabled ? 'blur(10px)' : 'none',
                                    border: '1px solid rgba(255, 255, 255, 0.15)'
                                }}
                            />
                        </div>
                    )}

                    {/* Trust Badges */}
                    {trust_badges_enabled && (
                        <div
                            className={`flex flex-wrap gap-6 ${layout === 'centered' ? 'justify-center' : ''} ${fadeInUp}`}
                            style={{
                                animationDelay: '500ms',
                                opacity: animation_enabled ? 0 : 1
                            }}
                        >
                            {trust_badge_1 && (
                                <TrustIndicator icon={Truck} text={trust_badge_1} textColor={text_color} />
                            )}
                            {trust_badge_2 && (
                                <TrustIndicator icon={Clock} text={trust_badge_2} textColor={text_color} />
                            )}
                            {trust_badge_3 && (
                                <TrustIndicator icon={Shield} text={trust_badge_3} textColor={text_color} />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Scroll Indicator */}
            {height === 'full' && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                    <div
                        className="w-8 h-12 rounded-full border-2 flex items-start justify-center p-2"
                        style={{ borderColor: `rgba(255, 255, 255, 0.3)` }}
                    >
                        <div
                            className="w-1.5 h-3 rounded-full"
                            style={{ backgroundColor: text_color, opacity: 0.6 }}
                        />
                    </div>
                </div>
            )}
        </section>
    );
}

// Section metadata for the editor
HeroSection.sectionMeta = {
    type: 'hero',
    name: 'Hero Banner',
    description: 'Conversion-optimized hero section with countdown, social proof, and trust elements',
    icon: 'Image',
    defaultSettings: {
        // Basic Content
        background_image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        badge_text: '✨ New Season Drop',
        title: 'Elevate Your\nEveryday Style',
        subtitle: 'Discover premium essentials crafted for modern living. Limited quantities available—shop before they\'re gone.',

        // Primary CTA
        button_text: 'Shop the Collection',
        button_link: '/products',
        button_style: 'solid',

        // Secondary CTA
        secondary_button_enabled: true,
        secondary_button_text: 'Watch Video',
        secondary_button_link: '',
        secondary_button_icon: 'play',

        // Layout & Appearance
        layout: 'centered',
        height: 'full',
        overlay_enabled: true,
        overlay_color: '#000000',
        overlay_opacity: 50,
        text_color: '#ffffff',
        accent_color: '#8B5CF6',

        // Urgency Elements
        countdown_enabled: false,
        countdown_label: 'Flash Sale Ends In',
        countdown_target_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),

        // Social Proof
        social_proof_enabled: true,
        customer_count: '15,000+',
        customer_text: 'happy customers',

        // Rating
        rating_enabled: true,
        rating_value: 4.9,
        review_count: 2847,

        // Trust Elements
        trust_badges_enabled: true,
        trust_badge_1: 'Free Shipping',
        trust_badge_2: '30-Day Returns',
        trust_badge_3: 'Secure Checkout',

        // Visual Effects
        animation_enabled: true,
        gradient_overlay_enabled: true,
        glassmorphism_enabled: true
    },
    settingsSchema: [
        // Content Section
        { key: '_content_header', type: 'header', label: '📝 Content' },
        { key: 'background_image', type: 'image', label: 'Background Image', folder: 'hero' },
        { key: 'badge_text', type: 'text', label: 'Badge Text', placeholder: '✨ New Season Drop' },
        { key: 'title', type: 'textarea', label: 'Headline', placeholder: 'Your compelling headline...', hint: 'Press Enter for line breaks' },
        { key: 'subtitle', type: 'textarea', label: 'Subheadline', placeholder: 'Supporting text that drives action...' },

        // Primary CTA Section
        { key: '_cta_header', type: 'header', label: '🎯 Primary Button' },
        { key: 'button_text', type: 'text', label: 'Button Text', placeholder: 'Shop Now' },
        { key: 'button_link', type: 'text', label: 'Button Link', placeholder: '/products' },
        {
            key: 'button_style', type: 'select', label: 'Button Style', options: [
                { value: 'solid', label: 'Solid White' },
                { value: 'outline', label: 'Outline' },
                { value: 'gradient', label: 'Gradient (Premium)' }
            ]
        },

        // Secondary CTA Section
        { key: '_secondary_cta_header', type: 'header', label: '🔗 Secondary Button' },
        { key: 'secondary_button_enabled', type: 'toggle', label: 'Show Secondary Button' },
        { key: 'secondary_button_text', type: 'text', label: 'Button Text', placeholder: 'Learn More' },
        { key: 'secondary_button_link', type: 'text', label: 'Button Link', placeholder: '/about' },
        {
            key: 'secondary_button_icon', type: 'select', label: 'Button Icon', options: [
                { value: 'play', label: 'Play Icon' },
                { value: 'arrow', label: 'Arrow Icon' },
                { value: 'none', label: 'No Icon' }
            ]
        },

        // Layout Section
        { key: '_layout_header', type: 'header', label: '📐 Layout' },
        {
            key: 'layout', type: 'select', label: 'Content Alignment', options: [
                { value: 'centered', label: 'Centered' },
                { value: 'left', label: 'Left Aligned' },
                { value: 'split', label: 'Split (Left Half)' }
            ]
        },
        {
            key: 'height', type: 'select', label: 'Section Height', options: [
                { value: 'medium', label: 'Medium (60vh)' },
                { value: 'large', label: 'Large (80vh)' },
                { value: 'full', label: 'Full Screen' }
            ]
        },

        // Appearance Section
        { key: '_appearance_header', type: 'header', label: '🎨 Appearance' },
        { key: 'text_color', type: 'color', label: 'Text Color' },
        { key: 'accent_color', type: 'color', label: 'Accent Color' },
        { key: 'overlay_enabled', type: 'toggle', label: 'Enable Overlay' },
        { key: 'overlay_color', type: 'color', label: 'Overlay Color' },
        { key: 'overlay_opacity', type: 'range', label: 'Overlay Opacity', min: 0, max: 100 },

        // Urgency Section
        { key: '_urgency_header', type: 'header', label: '⏰ Urgency (Countdown)' },
        { key: 'countdown_enabled', type: 'toggle', label: 'Show Countdown Timer' },
        { key: 'countdown_label', type: 'text', label: 'Countdown Label', placeholder: 'Sale Ends In' },
        { key: 'countdown_target_date', type: 'datetime', label: 'End Date & Time' },

        // Social Proof Section
        { key: '_social_header', type: 'header', label: '👥 Social Proof' },
        { key: 'social_proof_enabled', type: 'toggle', label: 'Show Customer Count' },
        { key: 'customer_count', type: 'text', label: 'Customer Count', placeholder: '15,000+' },
        { key: 'customer_text', type: 'text', label: 'Customer Text', placeholder: 'happy customers' },

        // Rating Section
        { key: '_rating_header', type: 'header', label: '⭐ Ratings' },
        { key: 'rating_enabled', type: 'toggle', label: 'Show Rating' },
        { key: 'rating_value', type: 'range', label: 'Rating Value', min: 1, max: 5, step: 0.1 },
        { key: 'review_count', type: 'number', label: 'Review Count' },

        // Trust Section
        { key: '_trust_header', type: 'header', label: '🛡️ Trust Badges' },
        { key: 'trust_badges_enabled', type: 'toggle', label: 'Show Trust Badges' },
        { key: 'trust_badge_1', type: 'text', label: 'Badge 1', placeholder: 'Free Shipping' },
        { key: 'trust_badge_2', type: 'text', label: 'Badge 2', placeholder: '30-Day Returns' },
        { key: 'trust_badge_3', type: 'text', label: 'Badge 3', placeholder: 'Secure Checkout' },

        // Effects Section
        { key: '_effects_header', type: 'header', label: '✨ Visual Effects' },
        { key: 'animation_enabled', type: 'toggle', label: 'Enable Animations' },
        { key: 'gradient_overlay_enabled', type: 'toggle', label: 'Gradient Overlay' },
        { key: 'glassmorphism_enabled', type: 'toggle', label: 'Glassmorphism Style' }
    ]
};
