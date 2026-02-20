import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { defaultTheme, resolveTheme, THEME_PRESETS } from '../../../lib/theme';

/**
 * Hook to manage theme settings for a merchant
 * Handles both theme_id (preset selection) and theme_settings (custom overrides)
 * 
 * @param {string} merchantId - The merchant's ID
 */
export function useThemeSettings(merchantId) {
    // Theme preset from themes table
    const [themePreset, setThemePreset] = useState(null);
    const [themePresets, setThemePresets] = useState([]);

    // Custom theme overrides stored in merchants.theme_settings
    const [themeSettings, setThemeSettings] = useState({});

    // Resolved theme (defaultTheme + preset + overrides)
    const [resolvedTheme, setResolvedTheme] = useState(defaultTheme);

    // Loading and save states
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Original state for change detection
    const [originalState, setOriginalState] = useState({
        themeId: null,
        themeSettings: {}
    });

    // Fetch theme presets and merchant's current theme
    useEffect(() => {
        async function fetchThemeData() {
            if (!merchantId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Fetch all available theme presets
                const { data: presets, error: presetsError } = await supabase
                    .from('themes')
                    .select('*')
                    .eq('is_active', true)
                    .order('name');

                if (presetsError) throw presetsError;
                setThemePresets(presets || []);

                // Fetch merchant's current theme selection and overrides
                const { data: merchant, error: merchantError } = await supabase
                    .from('merchants')
                    .select(`
                        theme_id,
                        theme_settings,
                        theme:themes (*)
                    `)
                    .eq('id', merchantId)
                    .single();

                if (merchantError) throw merchantError;

                const currentPreset = merchant?.theme || null;
                const currentSettings = merchant?.theme_settings || {};

                setThemePreset(currentPreset);
                setThemeSettings(currentSettings);
                setOriginalState({
                    themeId: merchant?.theme_id || null,
                    themeSettings: currentSettings
                });

                // Resolve the complete theme
                const resolved = resolveTheme(
                    currentPreset?.settings || {},
                    currentSettings
                );
                setResolvedTheme(resolved);

            } catch (err) {
                console.error('[useThemeSettings] Error fetching theme data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchThemeData();
    }, [merchantId]);

    // Update resolved theme when preset or settings change
    useEffect(() => {
        const resolved = resolveTheme(
            themePreset?.settings || {},
            themeSettings
        );
        setResolvedTheme(resolved);

        // Check for changes
        const currentThemeId = themePreset?.id || null;
        const hasThemeChange = currentThemeId !== originalState.themeId;
        const hasSettingsChange = JSON.stringify(themeSettings) !== JSON.stringify(originalState.themeSettings);
        setHasChanges(hasThemeChange || hasSettingsChange);
    }, [themePreset, themeSettings, originalState]);

    /**
     * Select a theme preset
     */
    const selectPreset = useCallback((presetId) => {
        const preset = themePresets.find(p => p.id === presetId) || null;
        setThemePreset(preset);
        // Clear overrides when switching presets (optional - could keep them)
        // setThemeSettings({});
    }, [themePresets]);

    /**
     * Update a single setting in the theme overrides
     */
    const updateSetting = useCallback((path, value) => {
        setThemeSettings(prev => {
            const updated = { ...prev };

            // Handle nested paths like 'colors.primary'
            const parts = path.split('.');
            let current = updated;

            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) {
                    current[parts[i]] = {};
                }
                current = current[parts[i]];
            }

            current[parts[parts.length - 1]] = value;
            return updated;
        });
    }, []);

    /**
     * Update multiple settings at once
     */
    const updateSettings = useCallback((updates) => {
        setThemeSettings(prev => {
            const updated = { ...prev };

            Object.entries(updates).forEach(([path, value]) => {
                const parts = path.split('.');
                let current = updated;

                for (let i = 0; i < parts.length - 1; i++) {
                    if (!current[parts[i]]) {
                        current[parts[i]] = {};
                    }
                    current = current[parts[i]];
                }

                current[parts[parts.length - 1]] = value;
            });

            return updated;
        });
    }, []);

    /**
     * Clear all custom overrides
     */
    const clearOverrides = useCallback(() => {
        setThemeSettings({});
    }, []);

    /**
     * Save theme settings to Supabase
     */
    const saveTheme = useCallback(async () => {
        if (!merchantId) {
            return { success: false, error: 'No merchant ID' };
        }

        try {
            setSaving(true);
            setError(null);

            const { error: updateError } = await supabase
                .from('merchants')
                .update({
                    theme_id: themePreset?.id || null,
                    theme_settings: themeSettings
                })
                .eq('id', merchantId);

            if (updateError) throw updateError;

            // Update original state
            setOriginalState({
                themeId: themePreset?.id || null,
                themeSettings: themeSettings
            });
            setHasChanges(false);

            return { success: true };
        } catch (err) {
            console.error('[useThemeSettings] Error saving theme:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    }, [merchantId, themePreset, themeSettings]);

    /**
     * Reset to original saved state
     */
    const resetTheme = useCallback(() => {
        const originalPreset = themePresets.find(p => p.id === originalState.themeId) || null;
        setThemePreset(originalPreset);
        setThemeSettings(originalState.themeSettings);
        setHasChanges(false);
    }, [originalState, themePresets]);

    /**
     * Get a specific value from the resolved theme
     */
    const getThemeValue = useCallback((path) => {
        const parts = path.split('.');
        let value = resolvedTheme;

        for (const part of parts) {
            if (value && typeof value === 'object') {
                value = value[part];
            } else {
                return undefined;
            }
        }

        return value;
    }, [resolvedTheme]);

    /**
     * Check if a specific setting has been overridden
     */
    const isOverridden = useCallback((path) => {
        const parts = path.split('.');
        let value = themeSettings;

        for (const part of parts) {
            if (value && typeof value === 'object') {
                value = value[part];
            } else {
                return false;
            }
        }

        return value !== undefined;
    }, [themeSettings]);

    /**
     * Clear a specific override
     */
    const clearOverride = useCallback((path) => {
        setThemeSettings(prev => {
            const updated = JSON.parse(JSON.stringify(prev));
            const parts = path.split('.');
            let current = updated;

            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) return prev;
                current = current[parts[i]];
            }

            delete current[parts[parts.length - 1]];
            return updated;
        });
    }, []);

    return {
        // State
        themePreset,
        themePresets,
        themeSettings,
        resolvedTheme,
        loading,
        saving,
        error,
        hasChanges,

        // Actions
        selectPreset,
        updateSetting,
        updateSettings,
        clearOverrides,
        saveTheme,
        resetTheme,

        // Helpers
        getThemeValue,
        isOverridden,
        clearOverride
    };
}
