import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Plus, X, Trash2, Save, Package, AlertCircle, GripVertical,
    ChevronDown, ChevronUp, Image, Edit2, Check
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { uploadImage, deleteImage } from '../../lib/uploadImage';
import {
    useVariantOptions,
    useVariantReconciliation,
    MAX_OPTIONS,
    MAX_VARIANTS,
    getVariantCount
} from '../../hooks/useVariantOptions';
import { useProductVariants, useVariantManagement } from '../../hooks/useVariants';

/**
 * ShopifyVariantEditor Component
 * 
 * Shopify-style variant management with:
 * - Feature toggle (variants enabled/disabled)
 * - Up to 3 product options with tokenized value input
 * - Drag-and-drop option reordering
 * - Auto-generated variants table from cartesian product
 * - Smart reconciliation preserving existing data
 * - Inline variant editing
 */
export function ShopifyVariantEditor({
    productId,
    hasVariants: initialHasVariants = false,
    basePrice = 0,
    baseInventory = 0,
    onHasVariantsChange,
    onVariantsChange
}) {
    // Variant toggle state
    const [hasVariants, setHasVariants] = useState(initialHasVariants);
    const [isTogglingVariants, setIsTogglingVariants] = useState(false);

    // Option management
    const {
        optionTypes,
        loading: optionsLoading,
        saving: optionsSaving,
        fetchOptionTypes,
        saveOptionType,
        deleteOptionType,
        reorderOptions,
        variantCount,
        canAddOption
    } = useVariantOptions(productId);

    // Variant management  
    const {
        variants,
        loading: variantsLoading,
        refetch: refetchVariants
    } = useProductVariants(productId);

    const {
        updateVariant,
        saving: variantSaving
    } = useVariantManagement(productId);

    const {
        reconcileVariants,
        reconciling
    } = useVariantReconciliation(productId);

    // UI state
    const [showAddOption, setShowAddOption] = useState(false);
    const [editingOptionId, setEditingOptionId] = useState(null);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [expandedOptions, setExpandedOptions] = useState({});

    // Load options on mount
    useEffect(() => {
        if (productId) {
            fetchOptionTypes();
        }
    }, [productId, fetchOptionTypes]);

    // Sync has_variants with options
    useEffect(() => {
        setHasVariants(initialHasVariants || optionTypes.length > 0);
    }, [initialHasVariants, optionTypes.length]);

    // Toggle variants on/off
    const handleToggleVariants = async (enabled) => {
        setIsTogglingVariants(true);
        try {
            if (!enabled) {
                // Turning off variants - delete all options and variants
                for (const opt of optionTypes) {
                    await deleteOptionType(opt.id);
                }
                // Delete all variants
                await supabase
                    .from('product_variants')
                    .delete()
                    .eq('product_id', productId);
            }

            // Update product has_variants flag
            await supabase
                .from('products')
                .update({ has_variants: enabled })
                .eq('id', productId);

            setHasVariants(enabled);
            onHasVariantsChange?.(enabled);

            if (!enabled) {
                onVariantsChange?.();
            }
        } catch (err) {
            console.error('Error toggling variants:', err);
        } finally {
            setIsTogglingVariants(false);
        }
    };

    // Handle option save and reconcile variants
    const handleSaveOption = async (optionData) => {
        const result = await saveOptionType(optionData);
        if (result.success) {
            // Reconcile variants after option change
            setTimeout(async () => {
                await fetchOptionTypes();
                const { data: freshOptions } = await supabase
                    .from('product_option_types')
                    .select('*')
                    .eq('product_id', productId)
                    .order('position');

                const { data: freshVariants } = await supabase
                    .from('product_variants')
                    .select('*')
                    .eq('product_id', productId);

                await reconcileVariants(freshOptions || [], freshVariants || []);
                refetchVariants();
                onVariantsChange?.();
            }, 100);
        }
        return result;
    };

    // Handle option delete
    const handleDeleteOption = async (optionId) => {
        if (!confirm('Delete this option? All variants will be removed.')) return;

        const result = await deleteOptionType(optionId);
        if (result.success) {
            setTimeout(async () => {
                const { data: freshOptions } = await supabase
                    .from('product_option_types')
                    .select('*')
                    .eq('product_id', productId)
                    .order('position');

                const { data: freshVariants } = await supabase
                    .from('product_variants')
                    .select('*')
                    .eq('product_id', productId);

                await reconcileVariants(freshOptions || [], freshVariants || []);
                refetchVariants();
                onVariantsChange?.();
            }, 100);
        }
    };

    // Drag and drop handlers
    const handleDragStart = (index) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
    };

    const handleDrop = async (e, toIndex) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === toIndex) {
            setDraggedIndex(null);
            return;
        }

        await reorderOptions(draggedIndex, toIndex);
        // Note: Variant option_values keys will still work since they reference by name
        setDraggedIndex(null);
        refetchVariants();
    };

    const loading = optionsLoading || variantsLoading || reconciling;

    // Check if would exceed limit
    const wouldExceedLimit = variantCount > MAX_VARIANTS;

    return (
        <div className="space-y-6 border-t pt-6 mt-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Package className="text-purple-500" size={22} />
                    <div>
                        <h3 className="font-semibold text-gray-900">Product Variants</h3>
                        <p className="text-sm text-gray-500">
                            Create variants for products with different options like size or color
                        </p>
                    </div>
                </div>
            </div>

            {/* Variants Toggle */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div>
                    <label className="font-medium text-gray-900">
                        This product has variants
                    </label>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Enable if this product comes in multiple options (size, color, etc.)
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => handleToggleVariants(!hasVariants)}
                    disabled={isTogglingVariants}
                    className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${hasVariants ? 'bg-purple-600' : 'bg-gray-300'}
                        ${isTogglingVariants ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                    `}
                >
                    <span
                        className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${hasVariants ? 'translate-x-6' : 'translate-x-1'}
                        `}
                    />
                </button>
            </div>

            {/* Variants Content (when enabled) */}
            {hasVariants && (
                <div className="space-y-6">
                    {/* Options Section */}
                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900">
                                    Options
                                    <span className="ml-2 text-sm text-gray-500 font-normal">
                                        ({optionTypes.length}/{MAX_OPTIONS})
                                    </span>
                                </h4>
                                {canAddOption && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAddOption(true)}
                                        className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
                                    >
                                        <Plus size={16} />
                                        Add option
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="divide-y">
                            {/* Option List */}
                            {optionTypes.map((option, index) => (
                                <div
                                    key={option.id}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDrop={(e) => handleDrop(e, index)}
                                    className={`
                                        bg-white transition-all
                                        ${draggedIndex === index ? 'opacity-50' : ''}
                                    `}
                                >
                                    {editingOptionId === option.id ? (
                                        <OptionForm
                                            option={option}
                                            optionTypes={optionTypes}
                                            onSave={async (data) => {
                                                const result = await handleSaveOption({ ...data, id: option.id });
                                                if (result.success) setEditingOptionId(null);
                                                return result;
                                            }}
                                            onCancel={() => setEditingOptionId(null)}
                                            saving={optionsSaving}
                                        />
                                    ) : (
                                        <OptionRow
                                            option={option}
                                            onEdit={() => setEditingOptionId(option.id)}
                                            onDelete={() => handleDeleteOption(option.id)}
                                            expanded={expandedOptions[option.id]}
                                            onToggleExpand={() => setExpandedOptions(prev => ({
                                                ...prev,
                                                [option.id]: !prev[option.id]
                                            }))}
                                        />
                                    )}
                                </div>
                            ))}

                            {/* Add Option Form */}
                            {showAddOption && (
                                <OptionForm
                                    optionTypes={optionTypes}
                                    onSave={async (data) => {
                                        const result = await handleSaveOption(data);
                                        if (result.success) setShowAddOption(false);
                                        return result;
                                    }}
                                    onCancel={() => setShowAddOption(false)}
                                    saving={optionsSaving}
                                />
                            )}

                            {/* Empty State */}
                            {optionTypes.length === 0 && !showAddOption && (
                                <div className="p-8 text-center">
                                    <p className="text-gray-500 mb-4">
                                        Add options like "Size" or "Color" to create variants
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddOption(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                    >
                                        <Plus size={18} />
                                        Add first option
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Variant Limit Warning */}
                    {wouldExceedLimit && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            <AlertCircle size={18} />
                            <span className="text-sm">
                                Too many variants ({variantCount}). Maximum is {MAX_VARIANTS}.
                                Remove some option values to proceed.
                            </span>
                        </div>
                    )}

                    {/* Variants Table */}
                    {variants.length > 0 && !wouldExceedLimit && (
                        <VariantsTable
                            variants={variants}
                            optionTypes={optionTypes}
                            basePrice={basePrice}
                            onUpdate={async (variantId, updates) => {
                                await updateVariant(variantId, updates);
                                refetchVariants();
                                onVariantsChange?.();
                            }}
                            saving={variantSaving}
                        />
                    )}

                    {/* Variant Count */}
                    {variantCount > 0 && !wouldExceedLimit && (
                        <div className="text-sm text-gray-500 text-center">
                            {variants.length} variant{variants.length !== 1 ? 's' : ''}
                            {reconciling && <span className="ml-2 text-purple-600">Updating...</span>}
                        </div>
                    )}
                </div>
            )}

            {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}


/**
 * OptionRow - Displays a single option with its values
 */
function OptionRow({ option, onEdit, onDelete, expanded, onToggleExpand }) {
    const values = option.option_values || [];

    return (
        <div className="p-4">
            <div className="flex items-center gap-3">
                {/* Drag Handle */}
                <div className="cursor-grab text-gray-400 hover:text-gray-600">
                    <GripVertical size={18} />
                </div>

                {/* Option Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{option.name}</span>
                        <button
                            type="button"
                            onClick={onToggleExpand}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </div>

                    {/* Values Preview */}
                    <div className="mt-1 flex flex-wrap gap-1">
                        {values.slice(0, expanded ? undefined : 5).map((val, idx) => (
                            <span
                                key={idx}
                                className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-sm rounded"
                            >
                                {val}
                            </span>
                        ))}
                        {!expanded && values.length > 5 && (
                            <span className="text-sm text-gray-500">
                                +{values.length - 5} more
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}


/**
 * OptionForm - Form for creating/editing an option
 */
function OptionForm({ option, optionTypes = [], onSave, onCancel, saving }) {
    const [name, setName] = useState(option?.name || '');
    const [values, setValues] = useState(option?.option_values || []);
    const [valueInput, setValueInput] = useState('');
    const [errors, setErrors] = useState([]);
    const inputRef = useRef(null);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Add value on Enter or comma
    const handleValueKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addValue();
        }
    };

    const addValue = () => {
        const trimmed = valueInput.trim().replace(/,/g, '');
        if (trimmed && !values.includes(trimmed)) {
            setValues(prev => [...prev, trimmed]);
        }
        setValueInput('');
    };

    const removeValue = (idx) => {
        setValues(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        const errs = [];

        if (!name.trim()) {
            errs.push('Option name is required');
        }

        // Check name uniqueness (except current option)
        const nameExists = optionTypes.some(
            opt => opt.name.toLowerCase() === name.toLowerCase().trim() &&
                opt.id !== option?.id
        );
        if (nameExists) {
            errs.push('Option name must be unique');
        }

        if (values.length === 0) {
            errs.push('Add at least one value');
        }

        // Check for duplicate values
        const uniqueValues = [...new Set(values.map(v => v.toLowerCase()))];
        if (uniqueValues.length !== values.length) {
            errs.push('Option values must be unique');
        }

        if (errs.length > 0) {
            setErrors(errs);
            return;
        }

        setErrors([]);
        const result = await onSave({
            name: name.trim(),
            option_values: values,
            position: option?.position ?? optionTypes.length
        });

        if (!result.success) {
            setErrors([result.error]);
        }
    };

    return (
        <div className="p-4 bg-purple-50 border-l-4 border-purple-500">
            {/* Errors */}
            {errors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    {errors.map((err, i) => (
                        <p key={i} className="text-sm text-red-700 flex items-center gap-2">
                            <AlertCircle size={14} />
                            {err}
                        </p>
                    ))}
                </div>
            )}

            <div className="space-y-4">
                {/* Option Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Option name
                    </label>
                    <input
                        ref={inputRef}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Size, Color, Material"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        maxLength={50}
                    />
                </div>

                {/* Option Values */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Option values
                    </label>

                    {/* Values Display */}
                    <div className="flex flex-wrap gap-2 mb-2">
                        {values.map((val, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded-full text-sm"
                            >
                                {val}
                                <button
                                    type="button"
                                    onClick={() => removeValue(idx)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
                    </div>

                    {/* Value Input */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={valueInput}
                            onChange={(e) => setValueInput(e.target.value)}
                            onKeyDown={handleValueKeyDown}
                            onBlur={() => valueInput.trim() && addValue()}
                            placeholder="Type value and press Enter"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                        <button
                            type="button"
                            onClick={addValue}
                            disabled={!valueInput.trim()}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                        >
                            Add
                        </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        Press Enter or comma to add values
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check size={16} />
                                {option ? 'Save changes' : 'Add option'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}


/**
 * VariantsTable - Editable table of all variants
 */
function VariantsTable({ variants, optionTypes, basePrice, onUpdate, saving }) {
    const [editingCell, setEditingCell] = useState(null);
    const [editValue, setEditValue] = useState('');

    // Sort variants by option values
    const sortedVariants = [...variants].sort((a, b) => {
        for (const opt of optionTypes) {
            const aVal = a.option_values?.[opt.name] || '';
            const bVal = b.option_values?.[opt.name] || '';
            if (aVal < bVal) return -1;
            if (aVal > bVal) return 1;
        }
        return 0;
    });

    const handleCellClick = (variantId, field, currentValue) => {
        setEditingCell({ variantId, field });
        setEditValue(currentValue ?? '');
    };

    const handleCellBlur = async () => {
        if (!editingCell) return;

        const { variantId, field } = editingCell;
        let value = editValue;

        // Convert types
        if (field === 'price') {
            value = editValue === '' ? null : parseFloat(editValue);
        } else if (field === 'stock_quantity') {
            value = parseInt(editValue) || 0;
        }

        await onUpdate(variantId, { [field]: value });
        setEditingCell(null);
        setEditValue('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleCellBlur();
        } else if (e.key === 'Escape') {
            setEditingCell(null);
            setEditValue('');
        }
    };

    // Get variant title from option values
    const getVariantTitle = (variant) => {
        return optionTypes
            .map(opt => variant.option_values?.[opt.name])
            .filter(Boolean)
            .join(' / ');
    };

    return (
        <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
                <h4 className="font-medium text-gray-900">Variants</h4>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                                Variant
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 w-32">
                                Price
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 w-28">
                                Quantity
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 w-36">
                                SKU
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedVariants.map(variant => (
                            <tr key={variant.id} className="hover:bg-gray-50">
                                {/* Variant Name */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        {/* Image Thumbnail */}
                                        <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                            {variant.image_url ? (
                                                <img
                                                    src={variant.image_url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <Image size={16} />
                                                </div>
                                            )}
                                        </div>
                                        <span className="font-medium text-gray-900">
                                            {getVariantTitle(variant)}
                                        </span>
                                    </div>
                                </td>

                                {/* Price */}
                                <td className="px-4 py-3">
                                    {editingCell?.variantId === variant.id && editingCell?.field === 'price' ? (
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={handleCellBlur}
                                            onKeyDown={handleKeyDown}
                                            autoFocus
                                            className="w-full px-2 py-1 border border-purple-500 rounded focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleCellClick(variant.id, 'price', variant.price)}
                                            className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                                        >
                                            {variant.price !== null
                                                ? `R ${Number(variant.price).toFixed(2)}`
                                                : <span className="text-gray-400">R {Number(basePrice).toFixed(2)}</span>
                                            }
                                        </button>
                                    )}
                                </td>

                                {/* Stock Quantity */}
                                <td className="px-4 py-3">
                                    {editingCell?.variantId === variant.id && editingCell?.field === 'stock_quantity' ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={handleCellBlur}
                                            onKeyDown={handleKeyDown}
                                            autoFocus
                                            className="w-full px-2 py-1 border border-purple-500 rounded focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleCellClick(variant.id, 'stock_quantity', variant.stock_quantity)}
                                            className={`w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm
                                                ${variant.stock_quantity === 0 ? 'text-red-500' : ''}`}
                                        >
                                            {variant.stock_quantity}
                                        </button>
                                    )}
                                </td>

                                {/* SKU */}
                                <td className="px-4 py-3">
                                    {editingCell?.variantId === variant.id && editingCell?.field === 'sku' ? (
                                        <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={handleCellBlur}
                                            onKeyDown={handleKeyDown}
                                            autoFocus
                                            className="w-full px-2 py-1 border border-purple-500 rounded focus:ring-2 focus:ring-purple-500 outline-none"
                                            maxLength={100}
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleCellClick(variant.id, 'sku', variant.sku)}
                                            className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm font-mono"
                                        >
                                            {variant.sku || <span className="text-gray-400">—</span>}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


export default ShopifyVariantEditor;
