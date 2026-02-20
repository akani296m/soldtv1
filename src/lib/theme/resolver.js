/**
 * Theme Resolver
 * Deep-merges theme settings to ensure no undefined values
 * 
 * Resolution order: defaultTheme → presetSettings → merchantOverrides
 */

import { defaultTheme, THEME_VERSION } from './defaults';

/**
 * Check if a value is a plain object (not array, null, etc.)
 */
function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Deep merge utility that handles nested objects
 * Later sources override earlier sources
 */
function deepMerge(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) {
                    Object.assign(target, { [key]: {} });
                }
                deepMerge(target[key], source[key]);
            } else if (source[key] !== undefined && source[key] !== null) {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return deepMerge(target, ...sources);
}

/**
 * THEME RESOLVER
 * Deep-merges: defaultTheme → presetSettings → merchantOverrides
 * 
 * @param {Object} presetSettings - Theme preset from database (themes table)
 * @param {Object} merchantSettings - Merchant overrides (merchants.theme_settings)
 * @returns {Object} Fully resolved theme with no undefined values
 * 
 * @example
 * const resolved = resolveTheme(
 *   { colors: { primary: '#FF0000' } },  // preset
 *   { colors: { accent: '#00FF00' } }    // merchant override
 * );
 * // Result: all defaults + primary from preset + accent from merchant
 */
export function resolveTheme(presetSettings = {}, merchantSettings = {}) {
    // Start with a fresh deep copy of defaults
    const resolved = JSON.parse(JSON.stringify(defaultTheme));

    // Merge preset settings (from selected theme template)
    if (presetSettings && Object.keys(presetSettings).length > 0) {
        deepMerge(resolved, presetSettings);
    }

    // Merge merchant overrides (custom tweaks)
    if (merchantSettings && Object.keys(merchantSettings).length > 0) {
        deepMerge(resolved, merchantSettings);
    }

    // Ensure version is set
    resolved.version = resolved.version || THEME_VERSION;

    return resolved;
}

/**
 * Validate theme version compatibility
 * Major version must match for compatibility
 * 
 * @param {number} themeVersion - Version of the theme preset
 * @param {number} merchantVersion - Version the merchant is using
 * @returns {boolean} True if versions are compatible
 */
export function isThemeCompatible(themeVersion, merchantVersion) {
    // If either is missing, assume compatible
    if (!themeVersion || !merchantVersion) return true;

    // Major version (integer part) must match
    return Math.floor(themeVersion) === Math.floor(merchantVersion);
}

/**
 * Get a specific theme value with fallback
 * Useful for accessing deeply nested values safely
 * 
 * @param {Object} theme - Resolved theme object
 * @param {string} path - Dot-notation path (e.g., 'colors.primary')
 * @param {any} fallback - Fallback value if path doesn't exist
 * @returns {any} The value at path or fallback
 * 
 * @example
 * getThemeValue(theme, 'colors.primary', '#000000');
 */
export function getThemeValue(theme, path, fallback = null) {
    const keys = path.split('.');
    let current = theme;

    for (const key of keys) {
        if (current === null || current === undefined || !Object.prototype.hasOwnProperty.call(current, key)) {
            return fallback;
        }
        current = current[key];
    }

    return current ?? fallback;
}

/**
 * Create a partial theme override object
 * Filters out undefined/null values to keep overrides clean
 * 
 * @param {Object} overrides - Object with potential override values
 * @returns {Object} Cleaned override object
 */
export function createThemeOverride(overrides) {
    const cleaned = {};

    Object.entries(overrides).forEach(([key, value]) => {
        if (isObject(value)) {
            const nested = createThemeOverride(value);
            if (Object.keys(nested).length > 0) {
                cleaned[key] = nested;
            }
        } else if (value !== undefined && value !== null && value !== '') {
            cleaned[key] = value;
        }
    });

    return cleaned;
}
