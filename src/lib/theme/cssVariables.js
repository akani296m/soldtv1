/**
 * CSS Variable Generator
 * Converts resolved theme to CSS custom properties
 * Includes RGB versions of colors for opacity utilities
 */

import { BORDER_RADIUS, SHADOW_STYLES, SPACING_SCALES, TYPOGRAPHY_SCALES, BUTTON_SIZES } from './defaults';

/**
 * Convert hex color to RGB values string
 * @param {string} hex - Hex color (e.g., '#FF0000' or '#F00')
 * @returns {string} RGB values as comma-separated string (e.g., '255, 0, 0')
 */
export function hexToRgb(hex) {
    if (!hex || typeof hex !== 'string') return '0, 0, 0';

    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Handle shorthand hex (e.g., #FFF)
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }

    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '0, 0, 0';
}

/**
 * Generate all CSS variables from resolved theme
 * Includes RGB versions of every color for opacity utilities
 * 
 * @param {Object} theme - Fully resolved theme object
 * @returns {Object} Object with CSS variable names as keys and values as values
 * 
 * @example
 * // Can use in styles:
 * // background: rgba(var(--color-primary-rgb), 0.1);
 */
export function generateCssVariables(theme) {
    const radius = BORDER_RADIUS[theme.layout?.borderRadius] || BORDER_RADIUS.md;
    const shadows = SHADOW_STYLES[theme.layout?.shadowStyle] || SHADOW_STYLES.subtle;
    const spacingMultiplier = SPACING_SCALES[theme.spacing?.density]?.multiplier || 1;
    const typographyScale = TYPOGRAPHY_SCALES[theme.typography?.scale] || TYPOGRAPHY_SCALES.normal;
    const buttonSize = BUTTON_SIZES[theme.buttons?.size] || BUTTON_SIZES.md;

    return {
        // ========== COLORS ==========
        '--color-primary': theme.colors.primary,
        '--color-primary-rgb': hexToRgb(theme.colors.primary),

        '--color-secondary': theme.colors.secondary,
        '--color-secondary-rgb': hexToRgb(theme.colors.secondary),

        '--color-accent': theme.colors.accent,
        '--color-accent-rgb': hexToRgb(theme.colors.accent),

        '--color-background': theme.colors.background,
        '--color-background-rgb': hexToRgb(theme.colors.background),

        '--color-surface': theme.colors.surface,
        '--color-surface-rgb': hexToRgb(theme.colors.surface),

        '--color-surface-hover': theme.colors.surfaceHover,
        '--color-surface-hover-rgb': hexToRgb(theme.colors.surfaceHover),

        '--color-text': theme.colors.text,
        '--color-text-rgb': hexToRgb(theme.colors.text),

        '--color-text-muted': theme.colors.textMuted,
        '--color-text-muted-rgb': hexToRgb(theme.colors.textMuted),

        '--color-border': theme.colors.border,
        '--color-border-rgb': hexToRgb(theme.colors.border),

        '--color-success': theme.colors.success,
        '--color-success-rgb': hexToRgb(theme.colors.success),

        '--color-error': theme.colors.error,
        '--color-error-rgb': hexToRgb(theme.colors.error),

        '--color-warning': theme.colors.warning,
        '--color-warning-rgb': hexToRgb(theme.colors.warning),

        // ========== TYPOGRAPHY ==========
        '--font-heading': `${theme.typography.headingFont}, sans-serif`,
        '--font-heading-weight': theme.typography.headingWeight,
        '--font-body': `${theme.typography.bodyFont}, sans-serif`,
        '--font-body-weight': theme.typography.bodyWeight,
        '--font-paragraph': `${theme.typography.paragraphFont}, sans-serif`,
        '--font-paragraph-weight': theme.typography.paragraphWeight,

        // Typography scale
        '--font-size-h1': typographyScale.h1,
        '--font-size-h2': typographyScale.h2,
        '--font-size-h3': typographyScale.h3,
        '--font-size-body': typographyScale.body,

        // ========== SPACING ==========
        '--spacing-section': `${Math.round(parseInt(theme.spacing.sectionPadding) * spacingMultiplier)}px`,
        '--spacing-container': `${theme.spacing.containerWidth}px`,
        '--spacing-grid-gap': `${Math.round(parseInt(theme.spacing.gridGap) * spacingMultiplier)}px`,
        '--spacing-card': `${Math.round(parseInt(theme.spacing.cardPadding) * spacingMultiplier)}px`,

        // Common spacing utilities
        '--spacing-xs': `${Math.round(4 * spacingMultiplier)}px`,
        '--spacing-sm': `${Math.round(8 * spacingMultiplier)}px`,
        '--spacing-md': `${Math.round(16 * spacingMultiplier)}px`,
        '--spacing-lg': `${Math.round(24 * spacingMultiplier)}px`,
        '--spacing-xl': `${Math.round(32 * spacingMultiplier)}px`,
        '--spacing-2xl': `${Math.round(48 * spacingMultiplier)}px`,

        // ========== BORDER RADIUS ==========
        '--radius-sm': radius.sm,
        '--radius-md': radius.md,
        '--radius-lg': radius.lg,
        '--radius-full': radius.full,

        // ========== SHADOWS ==========
        '--shadow-sm': shadows.sm,
        '--shadow-md': shadows.md,
        '--shadow-lg': shadows.lg,

        // ========== BUTTONS ==========
        '--button-padding': buttonSize.padding,
        '--button-font-size': buttonSize.fontSize,
        '--button-height': buttonSize.height,
        '--button-radius': BORDER_RADIUS[theme.buttons?.borderRadius]?.md || radius.md,
    };
}

/**
 * Get the data-theme attribute value from theme preset
 * @param {Object} themePreset - Theme preset object with slug
 * @param {string} fallback - Fallback slug if none provided
 * @returns {string} Theme slug for data-theme attribute
 */
export function getThemeSlug(themePreset, fallback = 'default') {
    return themePreset?.slug || fallback;
}

/**
 * Apply CSS variables to an element
 * @param {HTMLElement} element - Element to apply styles to
 * @param {Object} cssVariables - Object of CSS variable key-value pairs
 */
export function applyCssVariables(element, cssVariables) {
    Object.entries(cssVariables).forEach(([property, value]) => {
        element.style.setProperty(property, value);
    });
}

/**
 * Remove CSS variables from an element
 * @param {HTMLElement} element - Element to remove styles from
 * @param {Object} cssVariables - Object of CSS variable key-value pairs
 */
export function removeCssVariables(element, cssVariables) {
    Object.keys(cssVariables).forEach((property) => {
        element.style.removeProperty(property);
    });
}
