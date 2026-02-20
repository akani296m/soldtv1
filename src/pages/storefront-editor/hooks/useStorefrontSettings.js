import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

/**
 * Default settings structure for new merchants or as fallback
 */
const DEFAULT_SETTINGS = {
    // Hero Section
    hero_image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    hero_title: 'Redefine Your Everyday Style.',
    hero_subtitle: 'Premium products designed for comfort and quality. Discover the new collection before it sells out.',

    // Branding
    logo_url: '',
    primary_color: '#000000',
    accent_color: '#3b82f6',

    // Typography / Fonts
    font_heading: 'Poppins',
    font_body: 'Poppins',
    font_paragraph: 'Poppins',
    font_heading_weight: '700',
    font_body_weight: '400',
    font_paragraph_weight: '400',

    // Trust Badges
    trust_badges: [
        { icon: 'Truck', title: 'Free Shipping', subtitle: 'On all orders over R 1,500' },
        { icon: 'RefreshCw', title: 'Free Returns', subtitle: '30 days money-back guarantee' },
        { icon: 'ShieldCheck', title: 'Secure Payment', subtitle: 'Protected by 256-bit SSL encryption' }
    ],

    // Email Capture
    email_capture_title: 'Join the Movement',
    email_capture_subtitle: 'Sign up for our newsletter and get 15% off your first order, plus early access to new drops.',
    email_capture_button_text: 'Sign Up'
};

/**
 * Hook to fetch and save storefront settings from Supabase
 * @param {string} merchantId - The merchant's ID
 */
export function useStorefrontSettings(merchantId) {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalSettings, setOriginalSettings] = useState(null);

    // Fetch settings on mount
    useEffect(() => {
        async function fetchSettings() {
            if (!merchantId) {
                console.log('[useStorefrontSettings] No merchantId provided, skipping fetch');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                console.log('[useStorefrontSettings] Fetching settings for merchant:', merchantId);

                const { data, error: fetchError } = await supabase
                    .from('merchants')
                    .select(`
                        hero_image_url,
                        hero_title,
                        hero_subtitle,
                        logo_url,
                        primary_color,
                        accent_color,
                        font_heading,
                        font_body,
                        font_paragraph,
                        font_heading_weight,
                        font_body_weight,
                        font_paragraph_weight,
                        trust_badges,
                        email_capture_title,
                        email_capture_subtitle,
                        email_capture_button_text
                    `)
                    .eq('id', merchantId)
                    .single();

                if (fetchError) {
                    console.error('[useStorefrontSettings] Fetch error:', fetchError);
                    throw fetchError;
                }

                console.log('[useStorefrontSettings] Fetched data:', data);

                // Merge fetched data with defaults (in case some fields are null)
                const mergedSettings = {
                    ...DEFAULT_SETTINGS,
                    ...data,
                    // Parse trust_badges if it's a string
                    trust_badges: typeof data?.trust_badges === 'string'
                        ? JSON.parse(data.trust_badges)
                        : (data?.trust_badges || DEFAULT_SETTINGS.trust_badges)
                };

                console.log('[useStorefrontSettings] Merged settings:', mergedSettings);
                setSettings(mergedSettings);
                setOriginalSettings(mergedSettings);
            } catch (err) {
                console.error('[useStorefrontSettings] Error fetching storefront settings:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchSettings();
    }, [merchantId]);

    // Update a single setting
    const updateSetting = useCallback((key, value) => {
        setSettings(prev => {
            const updated = { ...prev, [key]: value };
            setHasChanges(JSON.stringify(updated) !== JSON.stringify(originalSettings));
            return updated;
        });
    }, [originalSettings]);

    // Update a trust badge
    const updateTrustBadge = useCallback((index, field, value) => {
        setSettings(prev => {
            const updatedBadges = [...prev.trust_badges];
            updatedBadges[index] = { ...updatedBadges[index], [field]: value };
            const updated = { ...prev, trust_badges: updatedBadges };
            setHasChanges(JSON.stringify(updated) !== JSON.stringify(originalSettings));
            return updated;
        });
    }, [originalSettings]);

    // Save settings to Supabase
    const saveSettings = useCallback(async () => {
        if (!merchantId) {
            console.error('[useStorefrontSettings] Cannot save - no merchant ID');
            return { success: false, error: 'No merchant ID' };
        }

        try {
            setSaving(true);
            setError(null);

            const updatePayload = {
                hero_image_url: settings.hero_image_url,
                hero_title: settings.hero_title,
                hero_subtitle: settings.hero_subtitle,
                logo_url: settings.logo_url,
                primary_color: settings.primary_color,
                accent_color: settings.accent_color,
                font_heading: settings.font_heading,
                font_body: settings.font_body,
                font_paragraph: settings.font_paragraph,
                font_heading_weight: settings.font_heading_weight,
                font_body_weight: settings.font_body_weight,
                font_paragraph_weight: settings.font_paragraph_weight,
                trust_badges: settings.trust_badges,
                email_capture_title: settings.email_capture_title,
                email_capture_subtitle: settings.email_capture_subtitle,
                email_capture_button_text: settings.email_capture_button_text
            };

            console.log('[useStorefrontSettings] Saving settings for merchant:', merchantId);
            console.log('[useStorefrontSettings] Update payload:', updatePayload);

            const { data, error: updateError } = await supabase
                .from('merchants')
                .update(updatePayload)
                .eq('id', merchantId)
                .select(); // Add .select() to return the updated row

            console.log('[useStorefrontSettings] Update result - data:', data, 'error:', updateError);

            if (updateError) {
                console.error('[useStorefrontSettings] Supabase update error:', updateError);
                throw updateError;
            }

            // Check if any rows were actually updated
            if (!data || data.length === 0) {
                console.error('[useStorefrontSettings] No rows updated! Check RLS policies or merchant ID:', merchantId);
                throw new Error('No rows updated - check that the merchant exists and RLS allows updates');
            }

            console.log('[useStorefrontSettings] Successfully updated merchant:', data[0]);

            setOriginalSettings(settings);
            setHasChanges(false);
            return { success: true };
        } catch (err) {
            console.error('[useStorefrontSettings] Error saving storefront settings:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    }, [merchantId, settings]);

    // Reset to original settings
    const resetSettings = useCallback(() => {
        if (originalSettings) {
            setSettings(originalSettings);
            setHasChanges(false);
        }
    }, [originalSettings]);

    return {
        settings,
        loading,
        saving,
        error,
        hasChanges,
        updateSetting,
        updateTrustBadge,
        saveSettings,
        resetSettings,
        DEFAULT_SETTINGS
    };
}
