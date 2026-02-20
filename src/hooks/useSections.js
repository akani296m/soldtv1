import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getSectionDefaults, PAGE_TYPES, getDefaultSectionsForPage } from '../components/storefront/sections';
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
const createSectionWithUUID = (type, pageType, position = 0, zone = null, isLocked = false) => ({
    id: generateUUID(),
    type,
    position,
    zone: zone || getDefaultZoneForNewSection(pageType, type),
    is_locked: !!isLocked,
    visible: true,
    settings: getSectionDefaults(type)
});

/**
 * Hook to fetch and manage storefront sections
 * @param {string} merchantId - The merchant's ID
 * @param {string} pageType - The page type ('home', 'catalog', 'product')
 * @returns {Object} Sections state and management functions
 */
export function useSections(merchantId, pageType = PAGE_TYPES.HOME) {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalSections, setOriginalSections] = useState([]);

    // Fetch sections on mount or when merchantId/pageType changes
    useEffect(() => {
        async function fetchSections() {
            const normalizeForPage = (rawSections = []) => {
                const normalized = normalizeSections(rawSections, pageType, getSectionDefaults);
                return normalizeZonePositions(normalized);
            };

            if (!merchantId) {
                console.log('[useSections] No merchantId provided, using defaults');
                const defaults = getDefaultSectionsForPage(pageType);
                const normalizedDefaults = normalizeForPage(defaults);
                setSections(normalizedDefaults);
                setOriginalSections(normalizedDefaults);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                console.log('[useSections] Fetching sections for merchant:', merchantId, 'page:', pageType);

                const { data, error: fetchError } = await supabase
                    .from('storefront_sections')
                    .select('*')
                    .eq('merchant_id', merchantId)
                    .eq('page_type', pageType)
                    .order('position', { ascending: true });

                if (fetchError) {
                    console.error('[useSections] Fetch error:', fetchError);
                    throw fetchError;
                }

                console.log('[useSections] Fetched sections:', data);

                if (!data || data.length === 0) {
                    console.log('[useSections] No sections found, using defaults for', pageType);
                    const defaults = getDefaultSectionsForPage(pageType);
                    const normalizedDefaults = normalizeForPage(defaults);
                    setSections(normalizedDefaults);
                    setOriginalSections(normalizedDefaults);
                } else {
                    const parsedSections = data.map(section => ({
                        id: section.id,
                        type: section.section_type,
                        position: section.position,
                        visible: section.is_visible,
                        settings: section.settings,
                        zone: section.zone || null,
                        is_locked: !!section.is_locked
                    }));
                    const normalizedSections = normalizeForPage(parsedSections);
                    setSections(normalizedSections);
                    setOriginalSections(normalizedSections);
                }
            } catch (err) {
                console.error('[useSections] Error fetching sections:', err);
                setError(err.message);
                const defaults = getDefaultSectionsForPage(pageType);
                const normalizedDefaults = normalizeZonePositions(normalizeSections(defaults, pageType, getSectionDefaults));
                setSections(normalizedDefaults);
                setOriginalSections(normalizedDefaults);
            } finally {
                setLoading(false);
            }
        }

        fetchSections();
    }, [merchantId, pageType]);

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
            if (zone) {
                const updated = reorderSectionsWithinZone(prev, zone, startIndex, endIndex);
                setHasChanges(JSON.stringify(updated) !== JSON.stringify(originalSections));
                return updated;
            }

            const result = Array.from(prev).sort((a, b) => a.position - b.position);
            const [removed] = result.splice(startIndex, 1);
            result.splice(endIndex, 0, removed);
            const updated = normalizeZonePositions(result);

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
            const zone = resolvedOptions.zone || getDefaultZoneForNewSection(pageType, type);
            const zoneSections = prev
                .filter(section => section.zone === zone)
                .sort((a, b) => a.position - b.position);
            const insertPosition = resolvedOptions.position !== undefined && resolvedOptions.position !== null
                ? resolvedOptions.position
                : zoneSections.length;
            const newSection = createSectionWithUUID(type, pageType, insertPosition, zone, resolvedOptions.is_locked);

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
    }, [pageType]);

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

    // Save sections to database
    const saveSections = useCallback(async () => {
        if (!merchantId) {
            console.error('[useSections] Cannot save - no merchant ID');
            return { success: false, error: 'No merchant ID' };
        }

        try {
            setSaving(true);
            setError(null);

            console.log('[useSections] Saving sections for merchant:', merchantId, 'page:', pageType);

            // Persist all current sections (zone + lock aware)
            const normalizedSections = normalizeZonePositions(sections);
            const sectionsToUpsert = normalizedSections.map(section => ({
                id: section.id,
                merchant_id: merchantId,
                page_type: pageType,
                section_type: section.type,
                position: section.position,
                is_visible: section.visible,
                settings: section.settings,
                zone: section.zone || getDefaultZoneForNewSection(pageType, section.type),
                is_locked: !!section.is_locked
            }));

            const idsToKeep = new Set(normalizedSections.map(section => section.id));
            const removedUnlockedIds = originalSections
                .filter(section => !idsToKeep.has(section.id) && !section.is_locked)
                .map(section => section.id);

            if (removedUnlockedIds.length > 0) {
                const { error: deleteError } = await supabase
                    .from('storefront_sections')
                    .delete()
                    .eq('merchant_id', merchantId)
                    .eq('page_type', pageType)
                    .in('id', removedUnlockedIds);

                if (deleteError) {
                    console.error('[useSections] Delete error:', deleteError);
                    throw deleteError;
                }
            }

            console.log('[useSections] Upserting sections:', sectionsToUpsert);

            const { data, error: upsertError } = await supabase
                .from('storefront_sections')
                .upsert(sectionsToUpsert, { onConflict: 'id' })
                .select();

            if (upsertError) {
                console.error('[useSections] Upsert error:', upsertError);
                throw upsertError;
            }

            console.log('[useSections] Successfully saved sections:', data);

            const savedSections = normalizeZonePositions(normalizeSections(data.map(section => ({
                id: section.id,
                type: section.section_type,
                position: section.position,
                visible: section.is_visible,
                settings: section.settings,
                zone: section.zone || null,
                is_locked: !!section.is_locked
            })), pageType, getSectionDefaults));

            setSections(savedSections);
            setOriginalSections(savedSections);
            setHasChanges(false);
            return { success: true };
        } catch (err) {
            console.error('[useSections] Error saving sections:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    }, [merchantId, pageType, sections, originalSections]);

    // Reset to original sections
    const resetSections = useCallback(() => {
        setSections(originalSections);
        setHasChanges(false);
    }, [originalSections]);

    return {
        sections,
        loading,
        saving,
        error,
        hasChanges,
        pageType,
        updateSection,
        updateSectionSetting,
        toggleSectionVisibility,
        reorderSections,
        addSection,
        removeSection,
        duplicateSection,
        saveSections,
        resetSections
    };
}
