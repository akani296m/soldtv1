/**
 * Shared theme font configuration and Google Fonts loader.
 * Used by the side editor and storefront runtime.
 */

export const THEME_FONT_OPTIONS = [
    { value: 'Inter', label: 'Inter', category: 'Sans-serif' },
    { value: 'Roboto', label: 'Roboto', category: 'Sans-serif' },
    { value: 'Lato', label: 'Lato', category: 'Sans-serif' },
    { value: 'Arimo', label: 'Arimo', category: 'Sans-serif' },
    { value: 'Manrope', label: 'Manrope', category: 'Sans-serif' },
    { value: 'Outfit', label: 'Outfit', category: 'Sans-serif' },
    { value: 'IBM Plex Sans', label: 'IBM Plex Sans', category: 'Sans-serif' },
    { value: 'Jost', label: 'JOST', category: 'Sans-serif' },
    { value: 'Oswald', label: 'Oswald', category: 'Display' },
    { value: 'Inconsolata', label: 'Inconsolata', category: 'Monospace' },
    // Existing fonts kept for backward compatibility with current presets.
    { value: 'Poppins', label: 'Poppins', category: 'Sans-serif' },
    { value: 'DM Sans', label: 'DM Sans', category: 'Sans-serif' },
    { value: 'Space Grotesk', label: 'Space Grotesk', category: 'Sans-serif' },
    { value: 'Bebas Neue', label: 'Bebas Neue', category: 'Display' },
    { value: 'Playfair Display', label: 'Playfair Display', category: 'Serif' },
    { value: 'Lora', label: 'Lora', category: 'Serif' },
    { value: 'Merriweather', label: 'Merriweather', category: 'Serif' },
];

const GOOGLE_FONT_FAMILIES = new Set(THEME_FONT_OPTIONS.map((font) => font.value));

function normalizeFontFamily(fontFamily) {
    if (!fontFamily || typeof fontFamily !== 'string') return null;
    return fontFamily.split(',')[0].replace(/["']/g, '').trim();
}

function toGoogleFamilyParam(fontFamily) {
    return fontFamily.trim().replace(/\s+/g, '+');
}

/**
 * Loads Google font stylesheets for any provided font families
 * that are part of our theme font set.
 */
export function ensureGoogleFontsLoaded(fontFamilies = []) {
    if (typeof document === 'undefined') return;

    const uniqueFamilies = [...new Set(fontFamilies
        .map(normalizeFontFamily)
        .filter(Boolean)
        .filter((family) => GOOGLE_FONT_FAMILIES.has(family)))];

    uniqueFamilies.forEach((family) => {
        const linkId = `google-font-${family.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        if (document.getElementById(linkId)) return;

        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css?family=${toGoogleFamilyParam(family)}:300,400,500,600,700,800&display=swap`;
        document.head.appendChild(link);
    });
}
