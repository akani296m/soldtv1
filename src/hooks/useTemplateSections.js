import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAdminMerchant } from '../context/adminMerchantContext';
import { getSectionDefaults, PAGE_TYPES } from '../components/storefront/sections';
import {
    getDefaultZoneForNewSection,
    normalizeSections,
    normalizeZonePositions,
    reorderSectionsWithinZone
} from '../lib/sectionZones';

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
 * Create a new section with UUID
 */
const createSectionWithUUID = (type, position = 0, zone = null, isLocked = false) => ({
    id: generateUUID(),
    type,
    position,
    zone: zone || getDefaultZoneForNewSection(PAGE_TYPES.PRODUCT, type),
    is_locked: !!isLocked,
    visible: true,
    settings: getSectionDefaults(type)
});

/**
 * Hook to manage sections for a single template
 * Similar to useSections but works with template's embedded sections
 */
export function useTemplateSections(templateId) {
    const { merchantId, loading: merchantLoading } = useAdminMerchant();
    const [template, setTemplate] = useState(null);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalSections, setOriginalSections] = useState([]);
    const normalizeTemplateSections = useCallback((rawSections = []) => {
        const normalized = normalizeSections(rawSections, PAGE_TYPES.PRODUCT, getSectionDefaults);
        return normalizeZonePositions(normalized);
    }, []);

    // Fetch template on mount or when templateId changes
    useEffect(() => {
        if (merchantLoading) return;

        if (!merchantId || !templateId) {
            setTemplate(null);
            setSections([]);
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

            // Parse sections from template
            const templateSections = normalizeTemplateSections(data.sections || []);
            setSections(templateSections);
            setOriginalSections(templateSections);
        } catch (err) {
            console.error('[useTemplateSections] Error fetching template:', err);
            setError(err.message);
            setTemplate(null);
            setSections([]);
        } finally {
            setLoading(false);
        }
    };

    // Update template name
    const updateTemplateName = useCallback(async (newName) => {
        if (!merchantId || !templateId) {
            return { success: false, error: 'No template ID' };
        }

        try {
            const { error: updateError } = await supabase
                .from('product_page_templates')
                .update({ name: newName })
                .eq('id', templateId)
                .eq('merchant_id', merchantId);

            if (updateError) throw updateError;

            setTemplate(prev => ({ ...prev, name: newName }));
            return { success: true };
        } catch (err) {
            console.error('[useTemplateSections] Error updating name:', err);
            return { success: false, error: err.message };
        }
    }, [merchantId, templateId]);

    // Update a section's settings
    const updateSection = useCallback((sectionId, updates) => {
        setSections(prev => {
            const updated = prev.map(section =>
                section.id === sectionId
                    ? { ...section, ...updates }
                    : section
            );
            setHasChanges(JSON.stringify(updated) !== JSON.stringify(originalSections));
            return updated;
        });
    }, [originalSections]);

    // Update a specific setting within a section
    const updateSectionSetting = useCallback((sectionId, key, value) => {
        setSections(prev => {
            const updated = prev.map(section =>
                section.id === sectionId
                    ? { ...section, settings: { ...section.settings, [key]: value } }
                    : section
            );
            setHasChanges(JSON.stringify(updated) !== JSON.stringify(originalSections));
            return updated;
        });
    }, [originalSections]);

    // Toggle section visibility
    const toggleSectionVisibility = useCallback((sectionId) => {
        setSections(prev => {
            const updated = prev.map(section =>
                section.id === sectionId
                    ? { ...section, visible: !section.visible }
                    : section
            );
            setHasChanges(JSON.stringify(updated) !== JSON.stringify(originalSections));
            return updated;
        });
    }, [originalSections]);

    // Reorder sections
    const reorderSections = useCallback((startIndex, endIndex, zone = null) => {
        setSections(prev => {
            let updated;
            if (zone) {
                updated = reorderSectionsWithinZone(prev, zone, startIndex, endIndex);
            } else {
                const result = Array.from(prev).sort((a, b) => a.position - b.position);
                const [removed] = result.splice(startIndex, 1);
                result.splice(endIndex, 0, removed);
                updated = normalizeZonePositions(result);
            }

            setHasChanges(JSON.stringify(updated) !== JSON.stringify(originalSections));
            return updated;
        });
    }, [originalSections]);

    // Add a new section
    const addSection = useCallback((type, options = {}) => {
        setSections(prev => {
            const resolvedOptions = typeof options === 'number'
                ? { position: options }
                : (options || {});
            const zone = resolvedOptions.zone || getDefaultZoneForNewSection(PAGE_TYPES.PRODUCT, type);
            const zoneSections = prev
                .filter(section => section.zone === zone)
                .sort((a, b) => a.position - b.position);
            const insertPosition = resolvedOptions.position !== undefined && resolvedOptions.position !== null
                ? resolvedOptions.position
                : zoneSections.length;
            const newSection = createSectionWithUUID(type, insertPosition, zone, resolvedOptions.is_locked);

            const patched = prev.map(section => {
                if (section.zone !== zone || section.position < insertPosition) {
                    return section;
                }
                return { ...section, position: section.position + 1 };
            });

            const updated = normalizeZonePositions([...patched, newSection]);

            setHasChanges(true);
            return updated;
        });
    }, []);

    // Remove a section
    const removeSection = useCallback((sectionId) => {
        setSections(prev => {
            const sectionToRemove = prev.find(section => section.id === sectionId);
            if (!sectionToRemove || sectionToRemove.is_locked) {
                return prev;
            }

            const updated = prev
                .filter(section => section.id !== sectionId)
                .map((section) => ({ ...section }));
            const normalized = normalizeZonePositions(updated);

            setHasChanges(JSON.stringify(normalized) !== JSON.stringify(originalSections));
            return normalized;
        });
    }, [originalSections]);

    // Duplicate a section
    const duplicateSection = useCallback((sectionId) => {
        setSections(prev => {
            const sectionToDupe = prev.find(s => s.id === sectionId);
            if (!sectionToDupe || sectionToDupe.is_locked) return prev;

            const insertPosition = sectionToDupe.position + 1;
            const newSection = {
                ...sectionToDupe,
                id: generateUUID(),
                position: insertPosition
            };

            const patched = prev.map(section => {
                if (section.zone !== sectionToDupe.zone || section.position < insertPosition) {
                    return section;
                }
                return { ...section, position: section.position + 1 };
            });

            const updated = normalizeZonePositions([...patched, newSection]);

            setHasChanges(true);
            return updated;
        });
    }, []);

    // Save sections to the template
    const saveSections = useCallback(async () => {
        if (!merchantId || !templateId) {
            console.error('[useTemplateSections] Cannot save - no template ID');
            return { success: false, error: 'No template ID' };
        }

        try {
            setSaving(true);
            setError(null);

            console.log('[useTemplateSections] Saving sections for template:', templateId);
            const normalizedSections = normalizeZonePositions(sections);

            const { data, error: updateError } = await supabase
                .from('product_page_templates')
                .update({ sections: normalizedSections })
                .eq('id', templateId)
                .eq('merchant_id', merchantId)
                .select()
                .single();

            if (updateError) throw updateError;

            console.log('[useTemplateSections] Successfully saved sections');

            const savedSections = normalizeTemplateSections(data.sections || normalizedSections);
            setSections(savedSections);
            setOriginalSections(savedSections);
            setHasChanges(false);
            return { success: true };
        } catch (err) {
            console.error('[useTemplateSections] Error saving sections:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    }, [merchantId, templateId, sections, normalizeTemplateSections]);

    // Reset to original sections
    const resetSections = useCallback(() => {
        setSections(originalSections);
        setHasChanges(false);
    }, [originalSections]);

    return {
        template,
        sections,
        loading: loading || merchantLoading,
        saving,
        error,
        hasChanges,
        updateTemplateName,
        updateSection,
        updateSectionSetting,
        toggleSectionVisibility,
        reorderSections,
        addSection,
        removeSection,
        duplicateSection,
        saveSections,
        resetSections,
        refetch: fetchTemplate
    };
}
