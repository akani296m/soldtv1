/**
 * Theme Library
 * Central exports for the theme system
 */

// Defaults and constants
export {
    defaultTheme,
    THEME_VERSION,
    SPACING_SCALES,
    BORDER_RADIUS,
    SHADOW_STYLES,
    TYPOGRAPHY_SCALES,
    BUTTON_SIZES,
} from './defaults';

// Theme resolver
export {
    resolveTheme,
    isThemeCompatible,
    getThemeValue,
    createThemeOverride,
} from './resolver';

// CSS variable utilities
export {
    hexToRgb,
    generateCssVariables,
    getThemeSlug,
    applyCssVariables,
    removeCssVariables,
} from './cssVariables';

// Pre-built presets
export {
    THEME_PRESETS,
    getPresetBySlug,
    getPresetsByCategory,
    getFreePresets,
} from './presets';
