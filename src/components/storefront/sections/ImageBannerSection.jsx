import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * Image Banner Section Component
 * Full-width or contained image with optional overlay text and CTA
 */
export default function ImageBannerSection({ settings = {}, basePath = '/store' }) {
    const {
        image_url = '',
        title = '',
        subtitle = '',
        button_text = '',
        button_link = '',
        height = 'medium', // 'small', 'medium', 'large', 'full'
        overlay_enabled = true,
        overlay_color = '#000000',
        overlay_opacity = 40,
        text_color = '#ffffff',
        text_position = 'center', // 'left', 'center', 'right'
        full_width = true
    } = settings;

    const heightClasses = {
        small: 'h-48 md:h-64',
        medium: 'h-64 md:h-96',
        large: 'h-96 md:h-[500px]',
        full: 'h-[70vh]'
    };

    const positionClasses = {
        left: 'items-start text-left',
        center: 'items-center text-center',
        right: 'items-end text-right'
    };

    // If no image, show placeholder
    if (!image_url) {
        return (
            <section className={`${heightClasses[height] || heightClasses.medium} bg-gray-100 flex items-center justify-center`}>
                <div className="text-center text-gray-400">
                    <p className="text-lg">Add an image to this banner</p>
                </div>
            </section>
        );
    }

    return (
        <section
            className={`relative ${heightClasses[height] || heightClasses.medium} overflow-hidden ${full_width ? '' : 'max-w-7xl mx-auto px-6 my-8 rounded-lg'}`}
        >
            {/* Background Image */}
            <img
                src={image_url}
                alt={title || 'Banner'}
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlay */}
            {overlay_enabled && (
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundColor: overlay_color,
                        opacity: overlay_opacity / 100
                    }}
                />
            )}

            {/* Content */}
            {(title || subtitle || button_text) && (
                <div
                    className={`relative h-full flex flex-col justify-center ${positionClasses[text_position] || positionClasses.center} px-6 md:px-12`}
                    style={{ color: text_color }}
                >
                    <div className={`max-w-2xl ${text_position === 'center' ? 'mx-auto' : ''}`}>
                        {title && (
                            <h2 className="text-3xl md:text-5xl font-bold mb-4">{title}</h2>
                        )}
                        {subtitle && (
                            <p className="text-lg md:text-xl mb-6 opacity-90">{subtitle}</p>
                        )}
                        {button_text && button_link && (
                            <Link
                                to={button_link.startsWith('http') ? button_link : `${basePath}${button_link}`}
                                className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 font-bold rounded hover:bg-gray-100 transition"
                            >
                                {button_text}
                                <ArrowRight size={18} />
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

// Section metadata for the editor
ImageBannerSection.sectionMeta = {
    type: 'image_banner',
    name: 'Image Banner',
    description: 'Full-width image with optional text overlay and call-to-action',
    icon: 'ImageIcon',
    defaultSettings: {
        image_url: '',
        title: '',
        subtitle: '',
        button_text: '',
        button_link: '',
        height: 'medium',
        overlay_enabled: true,
        overlay_color: '#000000',
        overlay_opacity: 40,
        text_color: '#ffffff',
        text_position: 'center',
        full_width: true
    },
    settingsSchema: [
        { key: 'image_url', type: 'image', label: 'Banner Image', folder: 'banners' },
        { key: 'title', type: 'text', label: 'Title (optional)', placeholder: 'Banner headline...' },
        { key: 'subtitle', type: 'text', label: 'Subtitle (optional)', placeholder: 'Supporting text...' },
        { key: 'button_text', type: 'text', label: 'Button Text (optional)', placeholder: 'Shop Now' },
        { key: 'button_link', type: 'text', label: 'Button Link', placeholder: '/products' },
        {
            key: 'height', type: 'select', label: 'Banner Height', options: [
                { value: 'small', label: 'Small' },
                { value: 'medium', label: 'Medium' },
                { value: 'large', label: 'Large' },
                { value: 'full', label: 'Full Screen' }
            ]
        },
        {
            key: 'text_position', type: 'select', label: 'Text Position', options: [
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Right' }
            ]
        },
        { key: 'overlay_enabled', type: 'toggle', label: 'Enable Overlay' },
        { key: 'overlay_opacity', type: 'range', label: 'Overlay Darkness', min: 0, max: 100 },
        { key: 'full_width', type: 'toggle', label: 'Full Width' }
    ]
};
