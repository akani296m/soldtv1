/**
 * Pre-built Theme Presets
 * These configurations should match records in the themes table
 * Used for local reference and seeding the database
 */

export const THEME_PRESETS = [
    {
        name: 'Clean',
        slug: 'clean',
        category: 'minimal',
        description: 'Minimal white design with subtle shadows and clean lines',
        thumbnail_url: null,
        is_free: true,
        version: 1,
        settings: {
            colors: {
                primary: '#000000',
                secondary: '#555555',
                accent: '#2563EB',
                background: '#FFFFFF',
                surface: '#FAFAFA',
                surfaceHover: '#F5F5F5',
                text: '#111111',
                textMuted: '#666666',
                border: '#E5E7EB',
                success: '#22C55E',
                error: '#EF4444',
                warning: '#F59E0B',
            },
            typography: {
                headingFont: 'Inter',
                headingWeight: '700',
                bodyFont: 'Inter',
                bodyWeight: '400',
                paragraphFont: 'Inter',
                paragraphWeight: '400',
                scale: 'normal',
            },
            spacing: {
                sectionPadding: '80',
                containerWidth: '1280',
                gridGap: '24',
                cardPadding: '24',
                density: 'normal',
            },
            layout: {
                headerVariant: 'minimal',
                footerVariant: 'columns',
                productCardVariant: 'default',
                borderRadius: 'md',
                shadowStyle: 'subtle',
            },
            buttons: {
                primaryStyle: 'filled',
                secondaryStyle: 'outline',
                borderRadius: 'md',
                size: 'md',
            },
        },
    },

    {
        name: 'Bold',
        slug: 'bold',
        category: 'bold',
        description: 'High contrast with sharp edges and strong shadows',
        thumbnail_url: null,
        is_free: true,
        version: 1,
        settings: {
            colors: {
                primary: '#000000',
                secondary: '#1A1A1A',
                accent: '#7C3AED',
                background: '#FFFFFF',
                surface: '#F3F4F6',
                surfaceHover: '#E5E7EB',
                text: '#000000',
                textMuted: '#4B5563',
                border: '#000000',
                success: '#10B981',
                error: '#EF4444',
                warning: '#F59E0B',
            },
            typography: {
                headingFont: 'Poppins',
                headingWeight: '800',
                bodyFont: 'Inter',
                bodyWeight: '500',
                paragraphFont: 'Inter',
                paragraphWeight: '400',
                scale: 'normal',
            },
            spacing: {
                sectionPadding: '100',
                containerWidth: '1400',
                gridGap: '32',
                cardPadding: '28',
                density: 'spacious',
            },
            layout: {
                headerVariant: 'split',
                footerVariant: 'columns',
                productCardVariant: 'overlay',
                borderRadius: 'none',
                shadowStyle: 'strong',
            },
            buttons: {
                primaryStyle: 'filled',
                secondaryStyle: 'filled',
                borderRadius: 'none',
                size: 'lg',
            },
        },
    },

    {
        name: 'Luxury',
        slug: 'luxury',
        category: 'luxury',
        description: 'Elegant serif typography with muted tones and refined spacing',
        thumbnail_url: null,
        is_free: true,
        version: 1,
        settings: {
            colors: {
                primary: '#1F2937',
                secondary: '#4B5563',
                accent: '#B8860B',
                background: '#FEFEFE',
                surface: '#F9FAFB',
                surfaceHover: '#F3F4F6',
                text: '#1F2937',
                textMuted: '#6B7280',
                border: '#E5E7EB',
                success: '#059669',
                error: '#DC2626',
                warning: '#D97706',
            },
            typography: {
                headingFont: 'Playfair Display',
                headingWeight: '600',
                bodyFont: 'Inter',
                bodyWeight: '400',
                paragraphFont: 'Lora',
                paragraphWeight: '400',
                scale: 'spacious',
            },
            spacing: {
                sectionPadding: '120',
                containerWidth: '1200',
                gridGap: '32',
                cardPadding: '32',
                density: 'spacious',
            },
            layout: {
                headerVariant: 'centered',
                footerVariant: 'simple',
                productCardVariant: 'minimal',
                borderRadius: 'sm',
                shadowStyle: 'subtle',
            },
            buttons: {
                primaryStyle: 'filled',
                secondaryStyle: 'outline',
                borderRadius: 'sm',
                size: 'md',
            },
        },
    },

    {
        name: 'Urban',
        slug: 'urban',
        category: 'urban',
        description: 'Streetwear vibes with dark mode and neon accents',
        thumbnail_url: null,
        is_free: true,
        version: 1,
        settings: {
            colors: {
                primary: '#FFFFFF',
                secondary: '#A3A3A3',
                accent: '#22C55E',
                background: '#0A0A0A',
                surface: '#171717',
                surfaceHover: '#262626',
                text: '#FFFFFF',
                textMuted: '#A3A3A3',
                border: '#262626',
                success: '#22C55E',
                error: '#EF4444',
                warning: '#FBBF24',
            },
            typography: {
                headingFont: 'Bebas Neue',
                headingWeight: '400',
                bodyFont: 'Inter',
                bodyWeight: '400',
                paragraphFont: 'Inter',
                paragraphWeight: '400',
                scale: 'normal',
            },
            spacing: {
                sectionPadding: '60',
                containerWidth: '1400',
                gridGap: '20',
                cardPadding: '20',
                density: 'compact',
            },
            layout: {
                headerVariant: 'minimal',
                footerVariant: 'minimal',
                productCardVariant: 'overlay',
                borderRadius: 'lg',
                shadowStyle: 'none',
            },
            buttons: {
                primaryStyle: 'filled',
                secondaryStyle: 'ghost',
                borderRadius: 'lg',
                size: 'md',
            },
        },
    },

    {
        name: 'Soft',
        slug: 'soft',
        category: 'playful',
        description: 'Rounded corners with pastel colors and playful vibes',
        thumbnail_url: null,
        is_free: true,
        version: 1,
        settings: {
            colors: {
                primary: '#EC4899',
                secondary: '#F472B6',
                accent: '#06B6D4',
                background: '#FDF2F8',
                surface: '#FFFFFF',
                surfaceHover: '#FCE7F3',
                text: '#831843',
                textMuted: '#9D174D',
                border: '#FBCFE8',
                success: '#10B981',
                error: '#F43F5E',
                warning: '#F59E0B',
            },
            typography: {
                headingFont: 'Outfit',
                headingWeight: '700',
                bodyFont: 'Outfit',
                bodyWeight: '400',
                paragraphFont: 'Outfit',
                paragraphWeight: '400',
                scale: 'normal',
            },
            spacing: {
                sectionPadding: '80',
                containerWidth: '1280',
                gridGap: '24',
                cardPadding: '24',
                density: 'normal',
            },
            layout: {
                headerVariant: 'centered',
                footerVariant: 'simple',
                productCardVariant: 'default',
                borderRadius: 'full',
                shadowStyle: 'medium',
            },
            buttons: {
                primaryStyle: 'filled',
                secondaryStyle: 'outline',
                borderRadius: 'full',
                size: 'md',
            },
        },
    },
];

/**
 * Get a preset by slug
 * @param {string} slug - Theme slug
 * @returns {Object|null} Theme preset or null if not found
 */
export function getPresetBySlug(slug) {
    return THEME_PRESETS.find(preset => preset.slug === slug) || null;
}

/**
 * Get all presets in a category
 * @param {string} category - Category name
 * @returns {Array} Array of matching presets
 */
export function getPresetsByCategory(category) {
    return THEME_PRESETS.filter(preset => preset.category === category);
}

/**
 * Get all free presets
 * @returns {Array} Array of free presets
 */
export function getFreePresets() {
    return THEME_PRESETS.filter(preset => preset.is_free);
}
