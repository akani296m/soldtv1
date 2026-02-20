/**
 * SYSTEM DEFAULT THEME
 * Contains EVERY possible theme key with sensible defaults.
 * This is the ultimate fallback - no theme property should ever be undefined.
 * 
 * Resolution order: defaultTheme → presetTheme → merchantOverrides
 */

export const THEME_VERSION = 1;

export const defaultTheme = {
    version: THEME_VERSION,

    colors: {
        primary: '#000000',
        secondary: '#666666',
        accent: '#0066FF',
        background: '#FFFFFF',
        surface: '#F8F8F8',
        surfaceHover: '#F0F0F0',
        text: '#1A1A1A',
        textMuted: '#888888',
        border: '#E5E5E5',
        success: '#22C55E',
        error: '#EF4444',
        warning: '#F59E0B',
    },

    typography: {
        headingFont: 'Poppins',
        headingWeight: '700',
        bodyFont: 'Inter',
        bodyWeight: '400',
        paragraphFont: 'Inter',
        paragraphWeight: '400',
        scale: 'normal', // 'compact' | 'normal' | 'spacious'
    },

    spacing: {
        sectionPadding: '80',      // px - vertical padding for sections
        containerWidth: '1280',    // px - max-width for content
        gridGap: '24',             // px - gap between grid items
        cardPadding: '24',         // px - internal card padding
        density: 'normal',         // 'compact' | 'normal' | 'spacious'
    },

    layout: {
        headerVariant: 'minimal',      // 'minimal' | 'centered' | 'split'
        footerVariant: 'columns',      // 'simple' | 'columns' | 'minimal'
        productCardVariant: 'default', // 'default' | 'overlay' | 'minimal'
        borderRadius: 'md',            // 'none' | 'sm' | 'md' | 'lg' | 'full'
        shadowStyle: 'subtle',         // 'none' | 'subtle' | 'medium' | 'strong'
    },

    buttons: {
        primaryStyle: 'filled',    // 'filled' | 'outline' | 'ghost'
        secondaryStyle: 'outline',
        borderRadius: 'md',
        size: 'md',                // 'sm' | 'md' | 'lg'
    },

    productCard: {
        imageAspectRatio: '3:4',   // '1:1' | '3:4' | '4:5'
        showCategory: true,
        showBadges: true,
        showDescription: true,
        showTags: true,
        titleTruncation: 2,
        priceFormat: 'default',    // 'default' | 'fromPrice'
        hoverEffect: 'quickView',  // 'none' | 'zoom' | 'quickView'
    },
};

/**
 * Spacing scale multipliers based on density setting
 */
export const SPACING_SCALES = {
    compact: { multiplier: 0.75 },
    normal: { multiplier: 1 },
    spacious: { multiplier: 1.5 },
};

/**
 * Border radius values for each size
 */
export const BORDER_RADIUS = {
    none: { sm: '0', md: '0', lg: '0', full: '0' },
    sm: { sm: '2px', md: '4px', lg: '8px', full: '9999px' },
    md: { sm: '4px', md: '8px', lg: '16px', full: '9999px' },
    lg: { sm: '8px', md: '16px', lg: '24px', full: '9999px' },
    full: { sm: '9999px', md: '9999px', lg: '9999px', full: '9999px' },
};

/**
 * Shadow styles for each intensity level
 */
export const SHADOW_STYLES = {
    none: { sm: 'none', md: 'none', lg: 'none' },
    subtle: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px rgba(0,0,0,0.07)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
    },
    medium: {
        sm: '0 1px 3px rgba(0,0,0,0.1)',
        md: '0 4px 12px rgba(0,0,0,0.12)',
        lg: '0 10px 25px rgba(0,0,0,0.15)',
    },
    strong: {
        sm: '0 2px 4px rgba(0,0,0,0.15)',
        md: '0 8px 16px rgba(0,0,0,0.2)',
        lg: '0 15px 35px rgba(0,0,0,0.25)',
    },
};

/**
 * Typography scale multipliers
 */
export const TYPOGRAPHY_SCALES = {
    compact: {
        h1: '2rem',
        h2: '1.5rem',
        h3: '1.25rem',
        body: '0.875rem',
    },
    normal: {
        h1: '2.5rem',
        h2: '2rem',
        h3: '1.5rem',
        body: '1rem',
    },
    spacious: {
        h1: '3rem',
        h2: '2.25rem',
        h3: '1.75rem',
        body: '1.125rem',
    },
};

/**
 * Button size configurations
 */
export const BUTTON_SIZES = {
    sm: { padding: '8px 16px', fontSize: '0.875rem', height: '36px' },
    md: { padding: '12px 24px', fontSize: '1rem', height: '44px' },
    lg: { padding: '16px 32px', fontSize: '1.125rem', height: '52px' },
};
