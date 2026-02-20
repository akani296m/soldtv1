import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

/**
 * VariantSelector Component
 * 
 * Displays option type buttons for selecting product variants.
 * Shows availability status and handles selection state.
 * 
 * @param {Object} props
 * @param {Array} props.optionTypes - Available option types for the product
 * @param {Object} props.selectedOptions - Current selections { "Size": "Large", "Color": null }
 * @param {Function} props.getAvailableValuesForOption - Function to get available values with stock status
 * @param {Function} props.onSelectOption - Handler for option selection (optionName, value)
 * @param {boolean} props.isSelectionComplete - Whether all options are selected
 * @param {Object|null} props.activeVariant - The resolved variant (if selection complete)
 */
export function VariantSelector({
    optionTypes = [],
    selectedOptions = {},
    getAvailableValuesForOption,
    onSelectOption,
    isSelectionComplete = false,
    activeVariant = null
}) {
    if (!optionTypes || optionTypes.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            {optionTypes.map(optionType => {
                const availableValues = getAvailableValuesForOption(optionType.name);
                const selectedValue = selectedOptions[optionType.name];

                return (
                    <div key={optionType.id || optionType.name}>
                        {/* Option Type Label */}
                        <div className="flex items-center justify-between mb-2">
                            <label className="font-bold text-sm uppercase text-gray-900">
                                {optionType.name}
                            </label>
                            {selectedValue && (
                                <span className="text-sm text-gray-600">
                                    {selectedValue}
                                </span>
                            )}
                        </div>

                        {/* Option Values */}
                        <div className="flex flex-wrap gap-2">
                            {availableValues.map(({ value, inStock }) => {
                                const isSelected = selectedValue === value;

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => onSelectOption(optionType.name, value)}
                                        disabled={!inStock}
                                        className={`
                                            relative px-4 py-2 rounded-lg border-2 text-sm font-medium
                                            transition-all duration-150 min-w-[60px]
                                            ${isSelected
                                                ? 'border-black bg-black text-white'
                                                : inStock
                                                    ? 'border-gray-300 bg-white text-gray-900 hover:border-gray-500'
                                                    : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed line-through'
                                            }
                                        `}
                                        title={!inStock ? 'Out of stock' : undefined}
                                    >
                                        {value}

                                        {/* Selection Checkmark */}
                                        {isSelected && (
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-white border border-black rounded-full flex items-center justify-center">
                                                <Check size={10} className="text-black" />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Selection Status Message */}
            {!isSelectionComplete && optionTypes.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                    <AlertCircle size={16} />
                    <span>Please select {optionTypes.map(o => o.name.toLowerCase()).join(' and ')}</span>
                </div>
            )}

            {/* Out of Stock Warning */}
            {isSelectionComplete && activeVariant && activeVariant.stock_quantity === 0 && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                    <AlertCircle size={16} />
                    <span>This combination is currently out of stock</span>
                </div>
            )}

            {/* SKU Display */}
            {activeVariant?.sku && (
                <div className="text-xs text-gray-500 mt-2">
                    SKU: {activeVariant.sku}
                </div>
            )}
        </div>
    );
}


/**
 * VariantPriceDisplay Component
 * 
 * Shows the variant price with comparison to base price if different.
 */
export function VariantPriceDisplay({
    effectivePrice,
    basePrice,
    hasVariants = false,
    isSelectionComplete = false
}) {
    const priceChanged = effectivePrice !== basePrice;

    // Format price
    const formatPrice = (price) => {
        return Number(price).toLocaleString('en-ZA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // If has variants but not selected, show base price with "from" prefix
    if (hasVariants && !isSelectionComplete) {
        return (
            <div className="mb-6 pb-6 border-b">
                <span className="text-sm text-gray-500">From </span>
                <span className="text-3xl font-bold">
                    R {formatPrice(basePrice)}
                </span>
            </div>
        );
    }

    return (
        <div className="mb-6 pb-6 border-b">
            <span className="text-3xl font-bold">
                R {formatPrice(effectivePrice)}
            </span>

            {/* Show original price if variant price is different */}
            {priceChanged && (
                <span className="ml-3 text-lg text-gray-400 line-through">
                    R {formatPrice(basePrice)}
                </span>
            )}
        </div>
    );
}


/**
 * VariantStockBadge Component
 * 
 * Shows stock status for the selected variant.
 */
export function VariantStockBadge({
    stockQuantity,
    isInStock,
    hasVariants = false,
    isSelectionComplete = false,
    lowStockThreshold = 5
}) {
    // Don't show if has variants but not selected
    if (hasVariants && !isSelectionComplete) {
        return null;
    }

    if (!isInStock || stockQuantity === 0) {
        return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                Out of Stock
            </span>
        );
    }

    if (stockQuantity <= lowStockThreshold) {
        return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                Only {stockQuantity} left!
            </span>
        );
    }

    return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            In Stock
        </span>
    );
}


export default VariantSelector;
