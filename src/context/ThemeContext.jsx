/**
 * Theme Context
 * Provides resolved theme values throughout the storefront
 * Injects CSS variables and sets data-theme attribute on body
 */

import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { resolveTheme } from '../lib/theme/resolver';
import { generateCssVariables, getThemeSlug } from '../lib/theme/cssVariables';
import { defaultTheme } from '../lib/theme/defaults';
import { ensureGoogleFontsLoaded } from '../lib/theme/fonts';

const ThemeContext = createContext(null);

/**
 * Helper to determine if a color is dark
 * Used to detect dark mode themes
 */
function isColorDark(hexColor) {
    if (!hexColor || typeof hexColor !== 'string') return false;

    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance < 0.5;
}

/**
 * Default context value for use outside provider
 */
const DEFAULT_CONTEXT = {
    theme: defaultTheme,
    themeSlug: 'default',
    themePreset: null,
    cssVariables: {},
    headerVariant: 'minimal',
    footerVariant: 'columns',
    productCardVariant: 'default',
    colors: defaultTheme.colors,
    typography: defaultTheme.typography,
    spacing: defaultTheme.spacing,
    buttons: defaultTheme.buttons,
    isDarkMode: false,
};

/**
 * Theme Provider Component
 * Wraps storefront and provides theme context to all children
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} props.themePreset - Theme preset from themes table (with settings object)
 * @param {Object} props.merchantSettings - Merchant's theme overrides from merchants.theme_settings
 */
export function ThemeProvider({ children, themePreset = null, merchantSettings = {} }) {

    // Resolve theme with deep merge: defaults → preset → merchant
    const resolvedTheme = useMemo(() => {
        const presetSettings = themePreset?.settings || {};
        return resolveTheme(presetSettings, merchantSettings);
    }, [themePreset, merchantSettings]);

    // Generate CSS variables from resolved theme
    const cssVariables = useMemo(() => {
        return generateCssVariables(resolvedTheme);
    }, [resolvedTheme]);

    // Get theme slug for data-theme attribute
    const themeSlug = useMemo(() => {
        return getThemeSlug(themePreset, 'default');
    }, [themePreset]);

    // Apply data-theme attribute to body element
    useEffect(() => {
        document.body.setAttribute('data-theme', themeSlug);

        return () => {
            document.body.removeAttribute('data-theme');
        };
    }, [themeSlug]);

    // Inject CSS variables into document root
    useEffect(() => {
        const root = document.documentElement;

        // Apply all CSS variables
        Object.entries(cssVariables).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // Cleanup on unmount or when variables change
        return () => {
            Object.keys(cssVariables).forEach((property) => {
                root.style.removeProperty(property);
            });
        };
    }, [cssVariables]);

    // Ensure selected theme fonts are loaded from Google Fonts.
    useEffect(() => {
        ensureGoogleFontsLoaded([
            resolvedTheme?.typography?.headingFont,
            resolvedTheme?.typography?.bodyFont,
            resolvedTheme?.typography?.paragraphFont
        ]);
    }, [
        resolvedTheme?.typography?.headingFont,
        resolvedTheme?.typography?.bodyFont,
        resolvedTheme?.typography?.paragraphFont
    ]);

    // Context value with theme and helpers
    const contextValue = useMemo(() => ({
        // The fully resolved theme object
        theme: resolvedTheme,

        // Theme identifier
        themeSlug,
        themePreset,

        // Raw CSS variables (for inline style usage if needed)
        cssVariables,

        // Layout variant shortcuts
        headerVariant: resolvedTheme.layout?.headerVariant || 'minimal',
        footerVariant: resolvedTheme.layout?.footerVariant || 'columns',
        productCardVariant: resolvedTheme.layout?.productCardVariant || 'default',

        // Common color shortcuts
        colors: resolvedTheme.colors,

        // Typography shortcuts
        typography: resolvedTheme.typography,

        // Spacing shortcuts
        spacing: resolvedTheme.spacing,

        // Button style shortcuts
        buttons: resolvedTheme.buttons,

        // Helper to check if using dark mode theme
        isDarkMode: isColorDark(resolvedTheme.colors?.background || '#FFFFFF'),
    }), [resolvedTheme, themeSlug, themePreset, cssVariables]);

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
}

/**
 * Hook to access theme context
 * Returns default theme values if used outside provider (safe fallback)
 * 
 * @returns {Object} Theme context value
 * 
 * @example
 * const { theme, colors, headerVariant } = useTheme();
 * // Use colors.primary, colors.accent, etc.
 */
export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        // Return safe defaults if used outside provider
        console.warn('[useTheme] Used outside ThemeProvider, returning defaults');
        return DEFAULT_CONTEXT;
    }

    return context;
}
