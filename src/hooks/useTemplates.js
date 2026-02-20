import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAdminMerchant } from '../context/adminMerchantContext';
import { getSectionDefaults } from '../components/storefront/sections';
import { SECTION_ZONE_KEYS } from '../lib/sectionZones';

/**
 * Generate a UUID v4
 */
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

/**
 * Default sections for a new product page template
 */
const getDefaultTemplateSections = () => [
    {
        id: generateUUID(),
        type: 'product_trust',
        position: 0,
        zone: SECTION_ZONE_KEYS.PRODUCT_INFO_TRUST,
        is_locked: true,
        visible: true,
        settings: getSectionDefaults('product_trust')
    },
    {
        id: generateUUID(),
        type: 'related_products',
        position: 1,
        zone: SECTION_ZONE_KEYS.PRODUCT_BOTTOM,
        is_locked: false,
        visible: true,
        settings: getSectionDefaults('related_products')
    }
];

/**
 * Hook to manage product page templates
 */
export function useTemplates() {
    const { merchantId, loading: merchantLoading } = useAdminMerchant();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Fetch templates on mount or when merchantId changes
    useEffect(() => {
        if (merchantLoading) return;

        if (!merchantId) {
            setTemplates([]);
            setLoading(false);
            return;
        }

        fetchTemplates();
    }, [merchantId, merchantLoading]);

    const fetchTemplates = async () => {
        if (!merchantId) {
            setTemplates([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('product_page_templates')
                .select('*')
                .eq('merchant_id', merchantId)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            setTemplates(data || []);
        } catch (err) {
            console.error('[useTemplates] Error fetching templates:', err);
            setError(err.message);
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    };

    // Create a new template
    const createTemplate = useCallback(async (name, sections = null) => {
        if (!merchantId) {
            return { success: false, error: 'No merchant ID' };
        }

        try {
            setSaving(true);
            setError(null);

            const templateData = {
                id: generateUUID(),
                merchant_id: merchantId,
                name: name || 'New Template',
                is_default: templates.length === 0, // First template becomes default
                sections: sections || getDefaultTemplateSections()
            };

            const { data, error: insertError } = await supabase
                .from('product_page_templates')
                .insert([templateData])
                .select()
                .single();

            if (insertError) throw insertError;

            setTemplates(prev => [data, ...prev]);
            return { success: true, data };
        } catch (err) {
            console.error('[useTemplates] Error creating template:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    }, [merchantId, templates.length]);

    // Update a template
    const updateTemplate = useCallback(async (templateId, updates) => {
        if (!merchantId) {
            return { success: false, error: 'No merchant ID' };
        }

        try {
            setSaving(true);
            setError(null);

            const { data, error: updateError } = await supabase
                .from('product_page_templates')
                .update(updates)
                .eq('id', templateId)
                .eq('merchant_id', merchantId)
                .select()
                .single();

            if (updateError) throw updateError;

            setTemplates(prev => prev.map(t => t.id === templateId ? data : t));
            return { success: true, data };
        } catch (err) {
            console.error('[useTemplates] Error updating template:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    }, [merchantId]);

    // Delete a template
    const deleteTemplate = useCallback(async (templateId) => {
        if (!merchantId) {
            return { success: false, error: 'No merchant ID' };
        }

        try {
            setSaving(true);
            setError(null);

            // First, unassign any products using this template
            await supabase
                .from('products')
                .update({ template_id: null })
                .eq('template_id', templateId)
                .eq('merchant_id', merchantId);

            // Delete the template
            const { error: deleteError } = await supabase
                .from('product_page_templates')
                .delete()
                .eq('id', templateId)
                .eq('merchant_id', merchantId);

            if (deleteError) throw deleteError;

            setTemplates(prev => prev.filter(t => t.id !== templateId));
            return { success: true };
        } catch (err) {
            console.error('[useTemplates] Error deleting template:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    }, [merchantId]);

    // Duplicate a template
    const duplicateTemplate = useCallback(async (templateId) => {
        const templateToDupe = templates.find(t => t.id === templateId);
        if (!templateToDupe) {
            return { success: false, error: 'Template not found' };
        }

        // Create new sections with fresh IDs
        const newSections = (templateToDupe.sections || []).map(section => ({
            ...section,
            id: generateUUID()
        }));

        return createTemplate(
            `${templateToDupe.name} (Copy)`,
            newSections
        );
    }, [templates, createTemplate]);

    // Set a template as default
    const setDefaultTemplate = useCallback(async (templateId) => {
        if (!merchantId) {
            return { success: false, error: 'No merchant ID' };
        }

        try {
            setSaving(true);
            setError(null);

            // First, unset all defaults
            await supabase
                .from('product_page_templates')
                .update({ is_default: false })
                .eq('merchant_id', merchantId);

            // Then set the new default
            const { data, error: updateError } = await supabase
                .from('product_page_templates')
                .update({ is_default: true })
                .eq('id', templateId)
                .eq('merchant_id', merchantId)
                .select()
                .single();

            if (updateError) throw updateError;

            setTemplates(prev => prev.map(t => ({
                ...t,
                is_default: t.id === templateId
            })));

            return { success: true, data };
        } catch (err) {
            console.error('[useTemplates] Error setting default template:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    }, [merchantId]);

    // Get the count of products using a specific template
    const getProductCountForTemplate = useCallback(async (templateId) => {
        if (!merchantId) return 0;

        try {
            const { count, error } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('template_id', templateId)
                .eq('merchant_id', merchantId);

            if (error) throw error;
            return count || 0;
        } catch (err) {
            console.error('[useTemplates] Error getting product count:', err);
            return 0;
        }
    }, [merchantId]);

    return {
        templates,
        loading: loading || merchantLoading,
        saving,
        error,
        fetchTemplates,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        duplicateTemplate,
        setDefaultTemplate,
        getProductCountForTemplate
    };
}

/**
 * Hook to get a single template by ID
 */
export function useTemplate(templateId) {
    const { merchantId, loading: merchantLoading } = useAdminMerchant();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (merchantLoading) return;

        if (!merchantId || !templateId) {
            setTemplate(null);
            setLoading(false);
            return;
        }

        fetchTemplate();
    }, [merchantId, merchantLoading, templateId]);

    const fetchTemplate = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('product_page_templates')
                .select('*')
                .eq('id', templateId)
                .eq('merchant_id', merchantId)
                .single();

            if (fetchError) throw fetchError;

            setTemplate(data);
        } catch (err) {
            console.error('[useTemplate] Error fetching template:', err);
            setError(err.message);
            setTemplate(null);
        } finally {
            setLoading(false);
        }
    };

    return {
        template,
        loading: loading || merchantLoading,
        error,
        refetch: fetchTemplate
    };
}
