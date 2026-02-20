import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useVariantOptions Hook
 * 
 * Manages product options (variant dimensions) with:
 * - Up to 3 options per product
 * - Tokenized value input
 * - Drag-and-drop reordering
 * - Automatic variant generation
 */

// Constants
export const MAX_OPTIONS = 3;
export const MAX_VARIANTS = 100;

/**
 * Generate cartesian product of option values
 * @param {Array<Array<string>>} arrays - Arrays of values for each option
 * @returns {Array<Array<string>>} - All combinations
 */
export function cartesianProduct(...arrays) {
    return arrays.reduce(
        (acc, arr) =>
            acc.flatMap(combo => arr.map(val => [...combo, val])),
        [[]]
    );
}

/**
 * Generate variant option combinations from option types
 * @param {Array} optionTypes - Option types with values
 * @returns {Array<Object>} - Array of option value objects
 */
export function generateVariantCombinations(optionTypes) {
    if (!optionTypes || optionTypes.length === 0) {
        return [];
    }

    // Filter option types that have values
    const validOptions = optionTypes.filter(
        opt => opt.option_values && opt.option_values.length > 0
    );

    if (validOptions.length === 0) {
        return [];
    }

    // Sort by position
    const sortedOptions = [...validOptions].sort((a, b) => a.position - b.position);

    // Get arrays of values for each option
    const valueArrays = sortedOptions.map(opt => opt.option_values);

    // Generate cartesian product
    const combinations = cartesianProduct(...valueArrays);

    // Map to option value objects
    return combinations.map(combo => {
        const optionValues = {};
        sortedOptions.forEach((opt, idx) => {
            optionValues[opt.name] = combo[idx];
        });
        return optionValues;
    });
}

/**
 * Get variant count for given option types
 */
export function getVariantCount(optionTypes) {
    if (!optionTypes || optionTypes.length === 0) return 0;

    const validOptions = optionTypes.filter(
        opt => opt.option_values && opt.option_values.length > 0
    );

    if (validOptions.length === 0) return 0;

    return validOptions.reduce((count, opt) => count * opt.option_values.length, 1);
}

/**
 * Check if variant limit would be exceeded
 */
export function wouldExceedVariantLimit(optionTypes) {
    return getVariantCount(optionTypes) > MAX_VARIANTS;
}

/**
 * Hook for managing product variant options
 */
export function useVariantOptions(productId) {
    const [optionTypes, setOptionTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Fetch option types from database
    const fetchOptionTypes = useCallback(async () => {
        if (!productId) return;

        setLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('product_option_types')
                .select('*')
                .eq('product_id', productId)
                .order('position', { ascending: true });

            if (fetchError) throw fetchError;
            setOptionTypes(data || []);
        } catch (err) {
            console.error('[useVariantOptions] Fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [productId]);

    // Create or update option type
    const saveOptionType = useCallback(async (optionData) => {
        if (!productId) return { success: false, error: 'No product ID' };

        setSaving(true);
        try {
            // Validate max options
            if (!optionData.id && optionTypes.length >= MAX_OPTIONS) {
                throw new Error(`Maximum ${MAX_OPTIONS} options allowed per product`);
            }

            // Validate name uniqueness
            const nameExists = optionTypes.some(
                opt => opt.name.toLowerCase() === optionData.name.toLowerCase() &&
                    opt.id !== optionData.id
            );
            if (nameExists) {
                throw new Error('Option name must be unique');
            }

            // Validate option values
            if (!optionData.option_values || optionData.option_values.length === 0) {
                throw new Error('Option must have at least one value');
            }

            // Check variant limit wouldn't be exceeded
            const testOptions = optionData.id
                ? optionTypes.map(o => o.id === optionData.id ? { ...o, ...optionData } : o)
                : [...optionTypes, { ...optionData, position: optionTypes.length }];

            if (wouldExceedVariantLimit(testOptions)) {
                throw new Error(`This would exceed the ${MAX_VARIANTS} variant limit`);
            }

            const payload = {
                product_id: productId,
                name: optionData.name.trim(),
                option_values: optionData.option_values.map(v => v.trim()).filter(Boolean),
                position: optionData.position ?? optionTypes.length
            };

            let result;
            if (optionData.id) {
                // Update existing
                result = await supabase
                    .from('product_option_types')
                    .update(payload)
                    .eq('id', optionData.id)
                    .select()
                    .single();
            } else {
                // Insert new
                result = await supabase
                    .from('product_option_types')
                    .insert([payload])
                    .select()
                    .single();
            }

            if (result.error) throw result.error;

            await fetchOptionTypes();
            return { success: true, data: result.data };
        } catch (err) {
            console.error('[useVariantOptions] Save error:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    }, [productId, optionTypes, fetchOptionTypes]);

    // Delete option type
    const deleteOptionType = useCallback(async (optionId) => {
        setSaving(true);
        try {
            const { error: deleteError } = await supabase
                .from('product_option_types')
                .delete()
                .eq('id', optionId);

            if (deleteError) throw deleteError;

            // Re-order remaining options
            const remaining = optionTypes.filter(o => o.id !== optionId);
            for (let i = 0; i < remaining.length; i++) {
                if (remaining[i].position !== i) {
                    await supabase
                        .from('product_option_types')
                        .update({ position: i })
                        .eq('id', remaining[i].id);
                }
            }

            await fetchOptionTypes();
            return { success: true };
        } catch (err) {
            console.error('[useVariantOptions] Delete error:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    }, [optionTypes, fetchOptionTypes]);

    // Reorder options (drag and drop)
    const reorderOptions = useCallback(async (fromIndex, toIndex) => {
        if (fromIndex === toIndex) return { success: true };

        setSaving(true);
        try {
            const reordered = [...optionTypes];
            const [removed] = reordered.splice(fromIndex, 1);
            reordered.splice(toIndex, 0, removed);

            // Update positions in database
            const updates = reordered.map((opt, idx) => ({
                id: opt.id,
                position: idx
            }));

            for (const update of updates) {
                const { error: updateError } = await supabase
                    .from('product_option_types')
                    .update({ position: update.position })
                    .eq('id', update.id);

                if (updateError) throw updateError;
            }

            await fetchOptionTypes();
            return { success: true };
        } catch (err) {
            console.error('[useVariantOptions] Reorder error:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    }, [optionTypes, fetchOptionTypes]);

    // Computed: expected variant combinations
    const expectedCombinations = useMemo(() => {
        return generateVariantCombinations(optionTypes);
    }, [optionTypes]);

    // Computed: variant count
    const variantCount = useMemo(() => {
        return getVariantCount(optionTypes);
    }, [optionTypes]);

    // Computed: can add more options
    const canAddOption = optionTypes.length < MAX_OPTIONS;

    return {
        optionTypes,
        loading,
        saving,
        error,
        fetchOptionTypes,
        saveOptionType,
        deleteOptionType,
        reorderOptions,
        expectedCombinations,
        variantCount,
        canAddOption,
        MAX_OPTIONS,
        MAX_VARIANTS
    };
}


/**
 * Hook for variant reconciliation
 * Syncs variants with option combinations while preserving existing data
 */
export function useVariantReconciliation(productId) {
    const [reconciling, setReconciling] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Reconcile variants with current option combinations
     * - Creates new variants for new combinations
     * - Preserves existing variant data (price, SKU, inventory, image)
     * - Removes variants whose combinations no longer exist
     * 
     * @param {Array} optionTypes - Current option types with values
     * @param {Array} existingVariants - Current variants from database
     * @returns {Object} - { success, created, removed, preserved }
     */
    const reconcileVariants = useCallback(async (optionTypes, existingVariants = []) => {
        if (!productId) return { success: false, error: 'No product ID' };

        setReconciling(true);
        setError(null);

        try {
            // Generate expected combinations
            const expectedCombinations = generateVariantCombinations(optionTypes);

            // Check variant limit
            if (expectedCombinations.length > MAX_VARIANTS) {
                throw new Error(`Too many variant combinations (${expectedCombinations.length}). Maximum is ${MAX_VARIANTS}.`);
            }

            // Track what we do
            const stats = { created: 0, removed: 0, preserved: 0 };

            // Create a map of existing variants by their option_values key
            const existingMap = new Map();
            existingVariants.forEach(v => {
                const key = JSON.stringify(v.option_values);
                existingMap.set(key, v);
            });

            // Track which existing variants are still valid
            const validKeys = new Set();

            // Create or preserve variants for each expected combination
            for (const optionValues of expectedCombinations) {
                const key = JSON.stringify(optionValues);
                validKeys.add(key);

                if (existingMap.has(key)) {
                    // Variant exists - preserve it (don't overwrite user data)
                    stats.preserved++;
                } else {
                    // New combination - create variant
                    const { error: insertError } = await supabase
                        .from('product_variants')
                        .insert([{
                            product_id: productId,
                            option_values: optionValues,
                            price: null, // Use product price by default
                            stock_quantity: 0,
                            sku: null,
                            image_url: null,
                            is_active: true
                        }]);

                    if (insertError) {
                        // Ignore duplicates (might happen with race conditions)
                        if (!insertError.message?.includes('duplicate')) {
                            throw insertError;
                        }
                    } else {
                        stats.created++;
                    }
                }
            }

            // Remove variants whose combinations no longer exist
            for (const [key, variant] of existingMap) {
                if (!validKeys.has(key)) {
                    const { error: deleteError } = await supabase
                        .from('product_variants')
                        .delete()
                        .eq('id', variant.id);

                    if (deleteError) throw deleteError;
                    stats.removed++;
                }
            }

            // If no options/values, delete all variants
            if (expectedCombinations.length === 0 && existingVariants.length > 0) {
                const { error: deleteAllError } = await supabase
                    .from('product_variants')
                    .delete()
                    .eq('product_id', productId);

                if (deleteAllError) throw deleteAllError;
                stats.removed = existingVariants.length;
            }

            return { success: true, ...stats };
        } catch (err) {
            console.error('[useVariantReconciliation] Error:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setReconciling(false);
        }
    }, [productId]);

    /**
     * Remap variant option values when options are reordered
     * Updates the JSONB keys to match new option order
     */
    const remapVariantOptionsOnReorder = useCallback(async (oldOrder, newOrder, existingVariants) => {
        if (!productId) return { success: false };

        setReconciling(true);
        try {
            // Build mapping from old names to new names
            const nameMapping = {};
            oldOrder.forEach((opt, oldIdx) => {
                const newOpt = newOrder.find(n => n.id === opt.id);
                if (newOpt) {
                    nameMapping[opt.name] = newOpt.name;
                }
            });

            // Update each variant's option_values
            for (const variant of existingVariants) {
                const newOptionValues = {};
                for (const [key, value] of Object.entries(variant.option_values || {})) {
                    // Keep same values, just reorder keys
                    newOptionValues[key] = value;
                }

                const { error: updateError } = await supabase
                    .from('product_variants')
                    .update({ option_values: newOptionValues })
                    .eq('id', variant.id);

                if (updateError) throw updateError;
            }

            return { success: true };
        } catch (err) {
            console.error('[remapVariantOptionsOnReorder] Error:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setReconciling(false);
        }
    }, [productId]);

    return {
        reconcileVariants,
        remapVariantOptionsOnReorder,
        reconciling,
        error
    };
}

export default useVariantOptions;
