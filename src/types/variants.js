/**
 * Product Variants Type Definitions
 * 
 * This file contains TypeScript-style type definitions for the variant system.
 * These can be used with JSDoc for type hints in JavaScript or converted to .ts files.
 */

// =============================================================================
// CORE TYPES
// =============================================================================

/**
 * @typedef {Object} Product
 * @property {number} id - Product ID
 * @property {number} merchant_id - Merchant ID
 * @property {string} title - Product title
 * @property {string} [description] - Product description
 * @property {number} price - Base price (used when no variant selected)
 * @property {number} [inventory] - Base inventory (legacy, use variants for stock)
 * @property {string[]} [images] - Array of image URLs
 * @property {string} [category] - Product category
 * @property {string[]} [tags] - Product tags
 * @property {boolean} is_active - Whether product is active
 * @property {boolean} has_variants - Whether product has variants
 * @property {string} [template_id] - Product page template ID
 * @property {string} created_at - ISO timestamp
 * @property {string} [updated_at] - ISO timestamp
 * @property {ProductVariant[]} [variants] - Loaded variants (optional, from join)
 * @property {ProductOptionType[]} [option_types] - Loaded option types (optional, from join)
 */

/**
 * @typedef {Object} ProductOptionType
 * @property {number} id - Option type ID
 * @property {number} product_id - Parent product ID
 * @property {string} name - Option type name (e.g., "Size", "Color")
 * @property {number} position - Display order (0 or 1)
 * @property {string} created_at - ISO timestamp
 */

/**
 * @typedef {Object.<string, string>} VariantOptionValues
 * Option values as key-value pairs, e.g., { "Size": "Large", "Color": "Blue" }
 */

/**
 * @typedef {Object} ProductVariant
 * @property {number} id - Variant ID
 * @property {number} product_id - Parent product ID
 * @property {number|null} price - Override price (null = use product.price)
 * @property {number} stock_quantity - Stock available for this variant
 * @property {string|null} sku - Optional SKU
 * @property {string|null} image_url - Optional variant-specific image
 * @property {VariantOptionValues} option_values - Option selections (e.g., {"Size": "L", "Color": "Red"})
 * @property {boolean} is_active - Whether variant is active
 * @property {string} created_at - ISO timestamp
 * @property {string} [updated_at] - ISO timestamp
 */

/**
 * @typedef {Object} ProductWithVariants
 * @property {Product} product - The base product
 * @property {ProductVariant[]} variants - All active variants
 * @property {ProductOptionType[]} option_types - Available option types
 * @property {string[]} available_options - Map of option type to available values
 */


// =============================================================================
// CART TYPES
// =============================================================================

/**
 * @typedef {Object} CartItem
 * @property {string} cartItemId - Unique cart item ID (format: "productId" or "productId-variantId")
 * @property {number} product_id - Product ID
 * @property {number|null} variant_id - Variant ID (null for products without variants)
 * @property {string} title - Display title (product title + variant info)
 * @property {number} price - Effective price (variant price or product price)
 * @property {string|null} image - Image URL (variant image or first product image)
 * @property {number} quantity - Quantity in cart
 * @property {number|null} stock_quantity - Available stock for validation
 * @property {string|null} sku - SKU if available
 * @property {VariantOptionValues|null} option_values - Selected options (for display)
 */

/**
 * @typedef {Object} AddToCartPayload
 * @property {number} product_id - Product ID
 * @property {number|null} variant_id - Variant ID (required if product has variants)
 * @property {number} quantity - Quantity to add
 */


// =============================================================================
// VARIANT SELECTION STATE
// =============================================================================

/**
 * @typedef {Object.<string, string|null>} SelectedOptions
 * Current selections for each option type, e.g., { "Size": "Large", "Color": null }
 */

/**
 * @typedef {Object} VariantSelectionState
 * @property {SelectedOptions} selectedOptions - Current option selections
 * @property {ProductVariant|null} activeVariant - The resolved variant (null if incomplete selection)
 * @property {boolean} isComplete - Whether all options are selected
 * @property {boolean} isInStock - Whether selected variant is in stock
 * @property {number} effectivePrice - Price to display (variant or product fallback)
 * @property {string|null} effectiveImage - Image to display (variant or product fallback)
 */


// =============================================================================
// ADMIN TYPES
// =============================================================================

/**
 * @typedef {Object} CreateVariantPayload
 * @property {number} product_id - Parent product ID
 * @property {VariantOptionValues} option_values - Option selections
 * @property {number|null} [price] - Override price
 * @property {number} [stock_quantity] - Stock quantity (default 0)
 * @property {string|null} [sku] - Optional SKU
 * @property {string|null} [image_url] - Optional image
 */

/**
 * @typedef {Object} UpdateVariantPayload
 * @property {number|null} [price] - Override price
 * @property {number} [stock_quantity] - Stock quantity
 * @property {string|null} [sku] - Optional SKU
 * @property {string|null} [image_url] - Optional image
 * @property {boolean} [is_active] - Active status
 */

/**
 * @typedef {Object} CreateOptionTypePayload
 * @property {number} product_id - Parent product ID
 * @property {string} name - Option type name
 * @property {number} position - Display position (0 or 1)
 */

/**
 * @typedef {Object} VariantValidation
 * @property {boolean} isValid - Whether the variant can be created
 * @property {string[]} errors - Validation error messages
 */


// =============================================================================
// ORDER TYPES (Updated)
// =============================================================================

/**
 * @typedef {Object} OrderLineItem
 * @property {number} product_id - Product ID
 * @property {number|null} variant_id - Variant ID (null for non-variant products)
 * @property {string} title - Product title
 * @property {string|null} variant_title - Variant description (e.g., "Size: Large, Color: Blue")
 * @property {number} quantity - Ordered quantity
 * @property {number} price - Unit price at time of order
 * @property {number} subtotal - Line total (price * quantity)
 * @property {string|null} sku - SKU at time of order
 * @property {VariantOptionValues|null} option_values - Option selections (for reference)
 */


// =============================================================================
// EXPORT (for ES modules)
// =============================================================================

export { };
