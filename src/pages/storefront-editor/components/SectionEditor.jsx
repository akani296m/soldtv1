import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { getSectionSchema } from '../../../components/storefront/sections';
import ImageUploader from './ImageUploader';
import ColorPicker from './ColorPicker';
import { TRUST_BADGE_ICONS } from '../../../components/storefront/sections/TrustBadgesSection';
import { useCollections } from '../../../context/collectionContext';

/**
 * Section Editor Component
 * Dynamically renders form fields based on section schema
 */
export default function SectionEditor({
    section,
    onUpdateSetting,
    onBack,
    hideHeader = false
}) {
    const { collections, loading: collectionsLoading } = useCollections();

    if (!section) {
        return (
            <div className="p-4 text-center text-gray-500">
                <p>Select a section to edit</p>
            </div>
        );
    }

    const schema = getSectionSchema(section.type);
    const settings = section.settings || {};
    const isSectionLocked = !!section.is_locked;
    const isFieldEditable = (field) => !isSectionLocked || field.editableWhenLocked !== false;

    // Render a single field based on its type
    const renderField = (field) => {
        const value = settings[field.key];
        const fieldEditable = isFieldEditable(field);

        switch (field.type) {
            case 'text':
                return (
                    <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                        </label>
                        <input
                            type="text"
                            value={value || ''}
                            onChange={(e) => fieldEditable && onUpdateSetting(section.id, field.key, e.target.value)}
                            placeholder={field.placeholder || ''}
                            disabled={!fieldEditable}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        {field.hint && (
                            <p className="text-xs text-gray-400 mt-1">{field.hint}</p>
                        )}
                    </div>
                );

            case 'textarea':
                return (
                    <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                        </label>
                        <textarea
                            value={value || ''}
                            onChange={(e) => fieldEditable && onUpdateSetting(section.id, field.key, e.target.value)}
                            placeholder={field.placeholder || ''}
                            rows={field.rows || 3}
                            disabled={!fieldEditable}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                        />
                        {field.hint && (
                            <p className="text-xs text-gray-400 mt-1">{field.hint}</p>
                        )}
                    </div>
                );

            case 'number':
                return (
                    <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                        </label>
                        <input
                            type="number"
                            value={value || ''}
                            min={field.min}
                            max={field.max}
                            onChange={(e) => fieldEditable && onUpdateSetting(section.id, field.key, parseInt(e.target.value, 10) || 0)}
                            disabled={!fieldEditable}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                    </div>
                );

            case 'select':
                return (
                    <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                        </label>
                        <select
                            value={value || ''}
                            onChange={(e) => fieldEditable && onUpdateSetting(section.id, field.key, e.target.value)}
                            disabled={!fieldEditable}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                            {field.options?.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                );

            case 'toggle':
                return (
                    <div key={field.key} className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                            {field.label}
                        </label>
                        <button
                            type="button"
                            onClick={() => fieldEditable && onUpdateSetting(section.id, field.key, !value)}
                            disabled={!fieldEditable}
                            className={`
                                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                                ${value ? 'bg-blue-500' : 'bg-gray-300'}
                                ${!fieldEditable ? 'opacity-60 cursor-not-allowed' : ''}
                            `}
                        >
                            <span
                                className={`
                                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                    ${value ? 'translate-x-6' : 'translate-x-1'}
                                `}
                            />
                        </button>
                    </div>
                );

            case 'range':
                return (
                    <div key={field.key}>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-sm font-medium text-gray-700">
                                {field.label}
                            </label>
                            <span className="text-xs text-gray-500">{value || field.min || 0}%</span>
                        </div>
                        <input
                            type="range"
                            value={value || field.min || 0}
                            min={field.min || 0}
                            max={field.max || 100}
                            onChange={(e) => fieldEditable && onUpdateSetting(section.id, field.key, parseInt(e.target.value, 10))}
                            disabled={!fieldEditable}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                );

            case 'color':
                return (
                    <ColorPicker
                        key={field.key}
                        label={field.label}
                        value={value || '#000000'}
                        onChange={(color) => fieldEditable && onUpdateSetting(section.id, field.key, color)}
                    />
                );

            case 'color_with_opacity':
                return (
                    <ColorPicker
                        key={field.key}
                        label={field.label}
                        value={value || 'rgba(0, 0, 0, 0.5)'}
                        onChange={(color) => fieldEditable && onUpdateSetting(section.id, field.key, color)}
                        showOpacity={true}
                    />
                );

            case 'image':
                return (
                    <ImageUploader
                        key={field.key}
                        label={field.label}
                        value={value || ''}
                        onChange={(url) => fieldEditable && onUpdateSetting(section.id, field.key, url)}
                        folder={field.folder || 'sections'}
                        aspectRatio={field.aspectRatio || 'aspect-video'}
                        placeholder={field.placeholder || 'Upload image'}
                    />
                );

            case 'collection_select':
                const activeCollections = collections?.filter(c => c.is_active) || [];
                return (
                    <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {collectionsLoading ? (
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-400 text-sm">
                                Loading collections...
                            </div>
                        ) : activeCollections.length === 0 ? (
                            <div className="space-y-2">
                                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-sm">
                                    No collections available
                                </div>
                                <p className="text-xs text-gray-500">
                                    Create a collection first to use this section
                                </p>
                            </div>
                        ) : (
                            <select
                                value={value || ''}
                                onChange={(e) => fieldEditable && onUpdateSetting(section.id, field.key, e.target.value ? parseInt(e.target.value, 10) : null)}
                                disabled={!fieldEditable}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                                <option value="">Select a collection...</option>
                                {activeCollections.map((collection) => (
                                    <option key={collection.id} value={collection.id}>
                                        {collection.name} ({collection.collection_products?.length || 0} products)
                                    </option>
                                ))}
                            </select>
                        )}
                        {field.helperText && (
                            <p className="text-xs text-gray-500 mt-1">{field.helperText}</p>
                        )}
                    </div>
                );

            case 'array':
                // Special handling for arrays (like trust badges)
                return renderArrayField(field, value || []);

            default:
                return null;
        }
    };

    // Render array fields (like trust badges)
    const renderArrayField = (field, items) => {
        const canMutateItems = !(isSectionLocked && field.lockedMode !== 'full');

        const updateItem = (index, itemKey, itemValue) => {
            const newItems = [...items];
            newItems[index] = { ...newItems[index], [itemKey]: itemValue };
            onUpdateSetting(section.id, field.key, newItems);
        };

        const addItem = () => {
            if (!canMutateItems) return;
            const defaultItem = {};
            field.itemSchema?.forEach(itemField => {
                defaultItem[itemField.key] = '';
            });
            onUpdateSetting(section.id, field.key, [...items, defaultItem]);
        };

        const removeItem = (index) => {
            if (!canMutateItems) return;
            onUpdateSetting(section.id, field.key, items.filter((_, i) => i !== index));
        };

        return (
            <div key={field.key} className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                </label>

                {items.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500">
                                Item {index + 1}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('Remove this item?')) {
                                        removeItem(index);
                                    }
                                }}
                                disabled={!canMutateItems}
                                className={`text-xs ${canMutateItems ? 'text-red-500 hover:text-red-700' : 'text-gray-300 cursor-not-allowed'}`}
                            >
                                Remove
                            </button>
                        </div>

                        {field.itemSchema?.map(itemField => (
                            <div key={itemField.key}>
                                <label className="block text-xs text-gray-500 mb-1">
                                    {itemField.label}
                                </label>
                                {itemField.type === 'select' ? (
                                    <select
                                        value={item[itemField.key] || ''}
                                        onChange={(e) => updateItem(index, itemField.key, e.target.value)}
                                        disabled={isSectionLocked && itemField.editableWhenLocked === false}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                    >
                                        {(itemField.options || TRUST_BADGE_ICONS).map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={item[itemField.key] || ''}
                                        onChange={(e) => updateItem(index, itemField.key, e.target.value)}
                                        placeholder={itemField.placeholder || ''}
                                        disabled={isSectionLocked && itemField.editableWhenLocked === false}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ))}

                {(!field.maxItems || items.length < field.maxItems) && (
                    <button
                        type="button"
                        onClick={addItem}
                        disabled={!canMutateItems}
                        className={`w-full py-2 text-sm border border-dashed rounded-lg ${
                            canMutateItems
                                ? 'text-blue-500 hover:text-blue-700 border-gray-300 hover:border-blue-400'
                                : 'text-gray-300 border-gray-200 cursor-not-allowed'
                        }`}
                    >
                        + Add Item
                    </button>
                )}
                {isSectionLocked && !canMutateItems && (
                    <p className="text-xs text-gray-500">
                        This locked section allows editing existing items but does not allow adding/removing items.
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Header with Back Button - conditionally rendered */}
            {!hideHeader && (
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                    <button
                        onClick={onBack}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h3 className="font-medium text-gray-900 capitalize">
                            {section.type.replace(/_/g, ' ')}
                        </h3>
                        <p className="text-xs text-gray-500">Edit section settings</p>
                    </div>
                </div>
            )}

            {/* Dynamic Fields */}
            <div className="space-y-4">
                {schema.map(renderField)}
            </div>

            {/* No Schema Warning */}
            {schema.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No editable settings for this section type</p>
                </div>
            )}
        </div>
    );
}
