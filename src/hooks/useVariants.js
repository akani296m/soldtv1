import { useState, useMemo, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * @typedef {import('../types/variants').Product} Product
 * @typedef {import('../types/variants').ProductVariant} ProductVariant
 * @typedef {import('../types/variants').ProductOptionType} ProductOptionType
 * @typedef {import('../types/variants').SelectedOptions} SelectedOptions
 * @typedef {import('../types/variants').VariantSelectionState} VariantSelectionState
 */

// =============================================================================
// useVariantSelection Hook
// =============================================================================
// Manages variant selection state for a product detail page

/**
 * Hook for managing variant selection state
 * @param {Product} product - The product with variants loaded
 * @param {ProductVariant[]} variants - Active variants for this product
 * @param {ProductOptionType[]} optionTypes - Option types for this product
 * @returns {Object} Variant selection state and handlers
 */
export function useVariantSelection(product, variants = [], optionTypes = []) {
    // Selected options state: { "Size": "Large", "Color": null }
    const [selectedOptions, setSelectedOptions] = useState({});

    // Initialize selected options when option types change
    useEffect(() => {
        if (optionTypes.length > 0) {
            const initialOptions = {};
            optionTypes.forEach(opt => {
                initialOptions[opt.name] = null;
            });
            setSelectedOptions(initialOptions);
        }
    }, [optionTypes]);

    // Get all unique values for each option type
    // Prefers option_values from optionTypes (Shopify-style) when available,
    // falls back to extracting from variants for backward compatibility
    const availableOptionValues = useMemo(() => {
        const values = {};

        optionTypes.forEach(optType => {
            // First, try to use option_values from the optionType itself (Shopify-style)
            if (optType.option_values && Array.isArray(optType.option_values) && optType.option_values.length > 0) {
                values[optType.name] = optType.option_values;
            } else {
                // Fallback: extract unique values from variants
                const uniqueValues = new Set();
                variants.forEach(variant => {
                    if (variant.option_values && variant.option_values[optType.name]) {
                        uniqueValues.add(variant.option_values[optType.name]);
                    }
                });
                values[optType.name] = Array.from(uniqueValues);
            }
        });

        return values;
    }, [variants, optionTypes]);

    // Check if selection is complete (all options selected)
    const isSelectionComplete = useMemo(() => {
        if (optionTypes.length === 0) return true;
        return optionTypes.every(opt => selectedOptions[opt.name] !== null);
    }, [selectedOptions, optionTypes]);

    // Resolve the active variant based on current selections
    const activeVariant = useMemo(() => {
        if (!isSelectionComplete) return null;

        return variants.find(variant => {
            if (!variant.option_values) return false;

            return optionTypes.every(opt => {
                const selected = selectedOptions[opt.name];
                const variantValue = variant.option_values[opt.name];
                return selected === variantValue;
            });
        }) || null;
    }, [selectedOptions, variants, optionTypes, isSelectionComplete]);

    // Check which values are available for each option given current selections
    // This disables out-of-stock combinations
    const getAvailableValuesForOption = useCallback((optionName) => {
        const availableValues = [];
        const otherSelections = { ...selectedOptions };
        delete otherSelections[optionName];

        // Get all possible values for this option
        const allValues = availableOptionValues[optionName] || [];

        allValues.forEach(value => {
            // Check if any variant exists with this value and current other selections
            const hasInStockVariant = variants.some(variant => {
                if (!variant.option_values || variant.option_values[optionName] !== value) {
                    return false;
                }

                // Check if other selections match (or are null)
                const otherOptionsMatch = Object.entries(otherSelections).every(([key, selectedValue]) => {
                    if (selectedValue === null) return true;
                    return variant.option_values[key] === selectedValue;
                });

                return otherOptionsMatch && variant.stock_quantity > 0;
            });

            availableValues.push({
                value,
                inStock: hasInStockVariant
            });
        });

        return availableValues;
    }, [selectedOptions, availableOptionValues, variants]);

    // Select an option value
    const selectOption = useCallback((optionName, value) => {
        setSelectedOptions(prev => ({
            ...prev,
            [optionName]: value
        }));
    }, []);

    // Clear all selections
    const clearSelections = useCallback(() => {
        const cleared = {};
        optionTypes.forEach(opt => {
            cleared[opt.name] = null;
        });
        setSelectedOptions(cleared);
    }, [optionTypes]);

    // Get effective price (variant price or product fallback)
    const effectivePrice = useMemo(() => {
        if (activeVariant && activeVariant.price !== null) {
            return activeVariant.price;
        }
        return product?.price || 0;
    }, [activeVariant, product]);

    // Get effective image (variant image or first product image)
    const effectiveImage = useMemo(() => {
        if (activeVariant && activeVariant.image_url) {
            return activeVariant.image_url;
        }
        if (product?.images && product.images.length > 0) {
            const firstImage = product.images[0];
            return typeof firstImage === 'string' ? firstImage : firstImage?.url || null;
        }
        return null;
    }, [activeVariant, product]);

    // Check if selected variant is in stock
    const isInStock = useMemo(() => {
        if (!activeVariant) {
            // If no variants, check product inventory
            if (!product?.has_variants) {
                return product?.inventory > 0;
            }
            return false;
        }
        return activeVariant.stock_quantity > 0;
    }, [activeVariant, product]);

    // Get stock quantity
    const stockQuantity = useMemo(() => {
        if (activeVariant) {
            return activeVariant.stock_quantity || 0;
        }
        if (!product?.has_variants) {
            return product?.inventory || 0;
        }
        return 0;
    }, [activeVariant, product]);

    // Generate cart item data
    const getCartItemData = useCallback((quantity = 1) => {
        if (product?.has_variants && !activeVariant) {
            return null; // Cannot add to cart without selecting variant
        }

        const variantTitle = activeVariant
            ? Object.entries(activeVariant.option_values || {})
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')
            : null;

        return {
            cartItemId: activeVariant
                ? `${product.id}-${activeVariant.id}`
                : `${product.id}`,
            product_id: product.id,
            variant_id: activeVariant?.id || null,
            title: product.title,
            variant_title: variantTitle,
            price: effectivePrice,
            image: effectiveImage,
            quantity,
            stock_quantity: stockQuantity,
            sku: activeVariant?.sku || null,
            option_values: activeVariant?.option_values || null
        };
    }, [product, activeVariant, effectivePrice, effectiveImage, stockQuantity]);

    return {
        // State
        selectedOptions,
        isSelectionComplete,
        activeVariant,
        effectivePrice,
        effectiveImage,
        isInStock,
        stockQuantity,

        // Available options
        optionTypes,
        availableOptionValues,
        getAvailableValuesForOption,

        // Actions
        selectOption,
        clearSelections,

        // Cart integration
        getCartItemData,

        // Helpers
        hasVariants: product?.has_variants || false
    };
}


// =============================================================================
// useProductVariants Hook
// =============================================================================
// Fetches variants for a product

/**
 * Hook for fetching product variants
 * @param {number} productId - Product ID to fetch variants for
 * @returns {Object} Variants data and loading state
 */
export function useProductVariants(productId) {
    const [variants, setVariants] = useState([]);
    const [optionTypes, setOptionTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    useEffect(() => {
        if (!productId) {
            setVariants([]);
            setOptionTypes([]);
            setLoading(false);
            return;
        }

        const fetchVariants = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch variants and option types in parallel
                const [variantsResult, optionTypesResult] = await Promise.all([
                    supabase
                        .from('product_variants')
                        .select('*')
                        .eq('product_id', productId)
                        .eq('is_active', true)
                        .order('created_at', { ascending: true }),
                    supabase
                        .from('product_option_types')
                        .select('*')
                        .eq('product_id', productId)
                        .order('position', { ascending: true })
                ]);

                if (variantsResult.error) throw variantsResult.error;
                if (optionTypesResult.error) throw optionTypesResult.error;

                setVariants(variantsResult.data || []);
                setOptionTypes(optionTypesResult.data || []);
            } catch (err) {
                console.error('[useProductVariants] Error fetching variants:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchVariants();
    }, [productId, refetchTrigger]);

    return {
        variants,
        optionTypes,
        loading,
        error,
        refetch: () => {
            setRefetchTrigger(prev => prev + 1);
        }
    };
}



// =============================================================================
// useVariantManagement Hook (Admin)
// =============================================================================
// CRUD operations for managing variants

/**
 * Hook for admin variant management
 * @param {number} productId - Product ID to manage variants for
 * @returns {Object} Variant CRUD operations
 */
export function useVariantManagement(productId) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Create a new variant
    const createVariant = useCallback(async (variantData) => {
        if (!productId) {
            return { success: false, error: 'No product ID provided' };
        }

        try {
            setSaving(true);
            setError(null);

            // Validate: max 4 variants (the DB trigger will also enforce this)
            const { count } = await supabase
                .from('product_variants')
                .select('*', { count: 'exact', head: true })
                .eq('product_id', productId);

            if (count >= 4) {
                throw new Error('Maximum 4 variants per product');
            }

            // Validate: check for duplicate option values
            const { data: existing } = await supabase
                .from('product_variants')
                .select('id')
                .eq('product_id', productId)
                .eq('option_values', variantData.option_values);

            if (existing && existing.length > 0) {
                throw new Error('A variant with these options already exists');
            }

            const { data, error: insertError } = await supabase
                .from('product_variants')
                .insert([{
                    product_id: productId,
                    option_values: variantData.option_values,
                    price: variantData.price ?? null,
                    stock_quantity: variantData.stock_quantity ?? 0,
                    sku: variantData.sku ?? null,
                    image_url: variantData.image_url ?? null,
                    is_active: true
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            return { success: true, data };
        } catch (err) {
            console.error('[useVariantManagement] Create error:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    }, [productId]);

    // Update a variant
    const updateVariant = useCallback(async (variantId, updates) => {
        try {
            setSaving(true);
            setError(null);

            const { data, error: updateError } = await supabase
                .from('product_variants')
                .update({
                    price: updates.price,
                    stock_quantity: updates.stock_quantity,
                    sku: updates.sku,
                    image_url: updates.image_url,
                    is_active: updates.is_active
                })
                .eq('id', variantId)
                .select()
                .single();

            if (updateError) throw updateError;

            return { success: true, data };
        } catch (err) {
            console.error('[useVariantManagement] Update error:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    }, []);

    // Delete a variant
    const deleteVariant = useCallback(async (variantId) => {
        try {
            setSaving(true);
            setError(null);

            const { error: deleteError } = await supabase
                .from('product_variants')
                .delete()
                .eq('id', variantId);

            if (deleteError) throw deleteError;

            return { success: true };
        } catch (err) {
            console.error('[useVariantManagement] Delete error:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    }, []);

    // Create option type
    const createOptionType = useCallback(async (name, position = 0) => {
        if (!productId) {
            return { success: false, error: 'No product ID provided' };
        }

        try {
            setSaving(true);
            setError(null);

            const { data, error: insertError } = await supabase
                .from('product_option_types')
                .insert([{
                    product_id: productId,
                    name,
                    position
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            return { success: true, data };
        } catch (err) {
            console.error('[useVariantManagement] Create option type error:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    }, [productId]);

    // Delete option type
    const deleteOptionType = useCallback(async (optionTypeId) => {
        try {
            setSaving(true);
            setError(null);

            const { error: deleteError } = await supabase
                .from('product_option_types')
                .delete()
                .eq('id', optionTypeId);

            if (deleteError) throw deleteError;

            return { success: true };
        } catch (err) {
            console.error('[useVariantManagement] Delete option type error:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    }, []);

    // Validate variant data before creation
    const validateVariant = useCallback((optionTypes, optionValues, existingVariants) => {
        const errors = [];

        // Check all option types have values
        optionTypes.forEach(opt => {
            if (!optionValues[opt.name]) {
                errors.push(`Please select a value for ${opt.name}`);
            }
        });

        // Check for duplicate
        if (errors.length === 0) {
            const isDuplicate = existingVariants.some(v => {
                return JSON.stringify(v.option_values) === JSON.stringify(optionValues);
            });
            if (isDuplicate) {
                errors.push('A variant with these options already exists');
            }
        }

        // Check max variants
        if (existingVariants.length >= 4) {
            errors.push('Maximum 4 variants per product');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }, []);

    return {
        createVariant,
        updateVariant,
        deleteVariant,
        createOptionType,
        deleteOptionType,
        validateVariant,
        saving,
        error
    };
}


export default useVariantSelection;
