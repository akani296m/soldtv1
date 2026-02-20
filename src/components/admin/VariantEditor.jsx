import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2, Save, Package, AlertCircle, ChevronDown, Image } from 'lucide-react';
import { uploadImage, deleteImage } from '../../lib/uploadImage';

/**
 * VariantEditor Component (Admin)
 * 
 * Allows merchants to create and manage up to 4 variants per product.
 * Supports up to 2 option types (e.g., Size, Color).
 * 
 * @param {Object} props
 * @param {Array} props.variants - Existing variants
 * @param {Array} props.optionTypes - Existing option types
 * @param {Object} props.management - useVariantManagement hook result
 * @param {Function} props.onVariantsChange - Callback when variants change
 * @param {number} props.basePrice - Product base price for reference
 */
export function VariantEditor({
    variants = [],
    optionTypes = [],
    management,
    onVariantsChange,
    basePrice = 0
}) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingVariant, setEditingVariant] = useState(null);
    const [newOptionType, setNewOptionType] = useState('');
    const [showOptionTypeForm, setShowOptionTypeForm] = useState(false);

    const canAddMoreVariants = variants.length < 4;
    const canAddMoreOptionTypes = optionTypes.length < 2;

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Package className="text-purple-500" size={20} />
                    <h3 className="font-semibold text-gray-900">Product Variants</h3>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        {variants.length}/4
                    </span>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">About Variants</p>
                <p className="text-blue-700">
                    Create up to 4 variants with different prices, stock levels, and images.
                    Define option types like "Size" or "Color" to organize your variants.
                </p>
            </div>

            {/* Option Types Section */}
            <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-700 text-sm">Option Types</h4>
                    {canAddMoreOptionTypes && (
                        <button
                            type="button"
                            onClick={() => setShowOptionTypeForm(true)}
                            className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
                        >
                            <Plus size={14} />
                            Add Option Type
                        </button>
                    )}
                </div>

                {optionTypes.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        No option types defined. Add types like "Size" or "Color" to organize your variants.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {optionTypes.map(opt => (
                            <div
                                key={opt.id}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg"
                            >
                                <span className="font-medium text-sm">{opt.name}</span>
                                <button
                                    type="button"
                                    onClick={() => management.deleteOptionType(opt.id).then(onVariantsChange)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Option Type Form */}
                {showOptionTypeForm && (
                    <div className="mt-3 flex gap-2">
                        <input
                            type="text"
                            value={newOptionType}
                            onChange={(e) => setNewOptionType(e.target.value)}
                            placeholder="e.g., Size, Color"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            maxLength={50}
                        />
                        <button
                            type="button"
                            onClick={async () => {
                                if (newOptionType.trim()) {
                                    await management.createOptionType(newOptionType.trim(), optionTypes.length);
                                    setNewOptionType('');
                                    setShowOptionTypeForm(false);
                                    onVariantsChange?.();
                                }
                            }}
                            disabled={!newOptionType.trim() || management.saving}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:bg-gray-300"
                        >
                            Add
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setNewOptionType('');
                                setShowOptionTypeForm(false);
                            }}
                            className="px-3 py-2 text-gray-500 hover:text-gray-700"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Variants List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-700 text-sm">Variants</h4>
                    {canAddMoreVariants && optionTypes.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowAddForm(true)}
                            className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
                        >
                            <Plus size={14} />
                            Add Variant
                        </button>
                    )}
                </div>

                {optionTypes.length === 0 && variants.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                        <Package className="mx-auto text-gray-300 mb-2" size={40} />
                        <p className="text-gray-500 text-sm">
                            Add option types first to create variants
                        </p>
                    </div>
                )}

                {variants.length === 0 && optionTypes.length > 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-gray-500 text-sm mb-3">
                            No variants yet. Add up to 4 variants.
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowAddForm(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                        >
                            <Plus size={16} />
                            Create First Variant
                        </button>
                    </div>
                )}

                {/* Variant Cards */}
                {variants.map(variant => (
                    <VariantCard
                        key={variant.id}
                        variant={variant}
                        optionTypes={optionTypes}
                        basePrice={basePrice}
                        onEdit={() => setEditingVariant(variant)}
                        onDelete={async () => {
                            if (confirm('Delete this variant?')) {
                                await management.deleteVariant(variant.id);
                                onVariantsChange?.();
                            }
                        }}
                    />
                ))}
            </div>

            {/* Add Variant Modal */}
            {showAddForm && (
                <VariantFormModal
                    optionTypes={optionTypes}
                    existingVariants={variants}
                    basePrice={basePrice}
                    management={management}
                    onClose={() => setShowAddForm(false)}
                    onSave={() => {
                        setShowAddForm(false);
                        onVariantsChange?.();
                    }}
                />
            )}

            {/* Edit Variant Modal */}
            {editingVariant && (
                <VariantFormModal
                    variant={editingVariant}
                    optionTypes={optionTypes}
                    existingVariants={variants}
                    basePrice={basePrice}
                    management={management}
                    onClose={() => setEditingVariant(null)}
                    onSave={() => {
                        setEditingVariant(null);
                        onVariantsChange?.();
                    }}
                />
            )}

            {/* Max Variants Warning */}
            {!canAddMoreVariants && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                    <AlertCircle size={16} />
                    <span>Maximum 4 variants reached</span>
                </div>
            )}
        </div>
    );
}


/**
 * VariantCard Component
 * Displays a single variant with its details
 */
function VariantCard({ variant, optionTypes, basePrice, onEdit, onDelete }) {
    const optionLabels = optionTypes
        .map(opt => variant.option_values?.[opt.name])
        .filter(Boolean)
        .join(' / ');

    const displayPrice = variant.price !== null ? variant.price : basePrice;
    const hasCustomPrice = variant.price !== null;

    return (
        <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition">
            <div className="flex items-start gap-4">
                {/* Variant Image or Placeholder */}
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {variant.image_url ? (
                        <img
                            src={variant.image_url}
                            alt={optionLabels}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Package className="text-gray-300" size={24} />
                        </div>
                    )}
                </div>

                {/* Variant Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <h5 className="font-medium text-gray-900">
                                {optionLabels || 'Unnamed Variant'}
                            </h5>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                <span className={hasCustomPrice ? 'text-purple-600 font-medium' : ''}>
                                    R {Number(displayPrice).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                    {hasCustomPrice && <span className="text-xs ml-1">(custom)</span>}
                                </span>
                                <span>•</span>
                                <span className={variant.stock_quantity === 0 ? 'text-red-500' : ''}>
                                    {variant.stock_quantity} in stock
                                </span>
                                {variant.sku && (
                                    <>
                                        <span>•</span>
                                        <span className="font-mono text-xs">{variant.sku}</span>
                                    </>
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
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
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
            </div>
        </div>
    );
}


/**
 * VariantFormModal Component
 * Form for creating/editing a variant
 */
function VariantFormModal({
    variant = null,
    optionTypes,
    existingVariants,
    basePrice,
    management,
    onClose,
    onSave
}) {
    const isEditing = !!variant;
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        option_values: variant?.option_values || {},
        price: variant?.price ?? '',
        stock_quantity: variant?.stock_quantity ?? 0,
        sku: variant?.sku || '',
        image_url: variant?.image_url || ''
    });
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState([]);

    // Initialize option values for new variants
    useEffect(() => {
        if (!variant && optionTypes.length > 0) {
            const initialOptions = {};
            optionTypes.forEach(opt => {
                initialOptions[opt.name] = '';
            });
            setFormData(prev => ({ ...prev, option_values: initialOptions }));
        }
    }, [optionTypes, variant]);

    const handleOptionChange = (optionName, value) => {
        setFormData(prev => ({
            ...prev,
            option_values: {
                ...prev.option_values,
                [optionName]: value
            }
        }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const result = await uploadImage(file);
            if (result.success) {
                setFormData(prev => ({ ...prev, image_url: result.url }));
            } else {
                alert('Failed to upload image: ' + result.error);
            }
        } catch (err) {
            alert('Error uploading image');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = async () => {
        if (formData.image_url && formData.image_url.includes('supabase')) {
            await deleteImage(formData.image_url);
        }
        setFormData(prev => ({ ...prev, image_url: '' }));
    };

    const handleSubmit = async () => {
        // Validate
        const validation = management.validateVariant(
            optionTypes,
            formData.option_values,
            existingVariants.filter(v => v.id !== variant?.id)
        );

        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        setErrors([]);

        const variantData = {
            option_values: formData.option_values,
            price: formData.price === '' ? null : Number(formData.price),
            stock_quantity: Number(formData.stock_quantity) || 0,
            sku: formData.sku || null,
            image_url: formData.image_url || null
        };

        let result;
        if (isEditing) {
            result = await management.updateVariant(variant.id, variantData);
        } else {
            result = await management.createVariant(variantData);
        }

        if (result.success) {
            onSave();
        } else {
            setErrors([result.error]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold text-lg">
                        {isEditing ? 'Edit Variant' : 'Add Variant'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="p-4 space-y-4">
                    {/* Errors */}
                    {errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            {errors.map((err, i) => (
                                <p key={i} className="text-sm text-red-700 flex items-center gap-2">
                                    <AlertCircle size={14} />
                                    {err}
                                </p>
                            ))}
                        </div>
                    )}

                    {/* Option Values */}
                    {optionTypes.map(opt => (
                        <div key={opt.id}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {opt.name} *
                            </label>
                            <input
                                type="text"
                                value={formData.option_values[opt.name] || ''}
                                onChange={(e) => handleOptionChange(opt.name, e.target.value)}
                                placeholder={`e.g., ${opt.name === 'Size' ? 'Large' : opt.name === 'Color' ? 'Blue' : 'Value'}`}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                disabled={isEditing} // Can't change options when editing
                            />
                        </div>
                    ))}

                    {/* Price Override */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price (leave empty to use product price: R {Number(basePrice).toLocaleString('en-ZA', { minimumFractionDigits: 2 })})
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">R</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.price}
                                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                placeholder="Use product price"
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Stock Quantity */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stock Quantity *
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={formData.stock_quantity}
                            onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>

                    {/* SKU */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            SKU (optional)
                        </label>
                        <input
                            type="text"
                            value={formData.sku}
                            onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                            placeholder="e.g., SHIRT-BLU-L"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            maxLength={100}
                        />
                    </div>

                    {/* Variant Image */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Variant Image (optional)
                        </label>
                        {formData.image_url ? (
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                                <img
                                    src={formData.image_url}
                                    alt="Variant"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500"
                            >
                                {uploading ? (
                                    <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Image size={24} />
                                        <span className="text-xs mt-1">Upload</span>
                                    </>
                                )}
                            </button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={management.saving}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 flex items-center gap-2"
                    >
                        <Save size={16} />
                        {management.saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Variant'}
                    </button>
                </div>
            </div>
        </div>
    );
}


export default VariantEditor;
