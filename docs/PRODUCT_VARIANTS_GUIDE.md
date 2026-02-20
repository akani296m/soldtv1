# Product Variants Implementation Guide

**Complete implementation of product variants for multi-tenant e-commerce SaaS**

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [TypeScript Types](#typescript-types)
4. [Storefront Integration](#storefront-integration)
5. [Admin Integration](#admin-integration)
6. [Cart & Checkout Integration](#cart--checkout-integration)
7. [Validation Rules](#validation-rules)
8. [Examples](#examples)

---

## Overview

### Scope & Constraints

- **Maximum 4 variants per product** (enforced at DB level)
- **Maximum 2 option types per product** (e.g., Size, Color)
- **Manual creation only** (no auto-combinator)
- **Variant-specific overrides:**
  - Price (optional, falls back to product price)
  - Stock quantity (required)
  - SKU (optional)
  - Image (optional, falls back to product image)
- **Cart & checkout reference `variantId`, not `productId`**

### Key Features

✅ Flexible JSON-based option storage  
✅ Database constraints for data integrity  
✅ Automatic stock validation  
✅ Backward compatibility with non-variant products  
✅ RLS policies for multi-tenant security  
✅ Helper functions for price & stock queries  

---

## Database Schema

### Tables Created

#### 1. `product_option_types`
Stores option type definitions (e.g., "Size", "Color")

```sql
CREATE TABLE product_option_types (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    position SMALLINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (product_id, name)
);
```

#### 2. `product_variants`
Stores variant data with JSONB option values

```sql
CREATE TABLE product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(10, 2),           -- NULL = use product.price
    stock_quantity INTEGER DEFAULT 0,
    sku VARCHAR(100),
    image_url TEXT,
    option_values JSONB NOT NULL DEFAULT '{}',  -- {"Size": "Large", "Color": "Blue"}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (product_id, option_values)
);
```

#### 3. Added to `products` table
```sql
ALTER TABLE products ADD COLUMN has_variants BOOLEAN DEFAULT FALSE;
```

### Database Constraints

**Enforced via triggers:**
- Max 4 variants per product
- Max 2 option types per product
- Unique option value combinations
- Auto-update `products.has_variants` flag

### Helper Functions

```sql
-- Get effective price (variant or product fallback)
SELECT get_variant_price(variant_id);

-- Check stock availability
SELECT is_variant_in_stock(variant_id, quantity);
```

### Migration File

**Location:** `/migrations/add_product_variants.sql`

**To run:**
```bash
# In Supabase Dashboard > SQL Editor, paste and execute the migration
```

---

## TypeScript Types

**Location:** `/src/types/variants.js`

### Core Types

```javascript
/**
 * @typedef {Object} Product
 * @property {number} id
 * @property {boolean} has_variants
 * @property {number} price - Base price
 * @property {ProductVariant[]} [variants]
 * @property {ProductOptionType[]} [option_types]
 */

/**
 * @typedef {Object} ProductVariant
 * @property {number} id
 * @property {number} product_id
 * @property {number|null} price - Override (null = use product price)
 * @property {number} stock_quantity
 * @property {string|null} sku
 * @property {string|null} image_url
 * @property {Object} option_values - {"Size": "Large", "Color": "Blue"}
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} CartItem
 * @property {string} cartItemId - "productId" or "productId-variantId"
 * @property {number} product_id
 * @property {number|null} variant_id
 * @property {string} variant_title - "Size: Large, Color: Blue"
 * @property {number} price
 * @property {number} quantity
 * @property {Object|null} option_values
 */
```

---

## Storefront Integration

### 1. Fetch Product with Variants

```javascript
import { useProductVariants } from '../hooks/useVariants';

function ProductDetail() {
    const { productId } = useParams();
    const { product } = useMerchantProduct(productId);
    const { variants, optionTypes, loading } = useProductVariants(productId);
    
    // Rest of component...
}
```

### 2. Add Variant Selection Hook

```javascript
import { useVariantSelection } from '../hooks/useVariants';

function ProductDetail() {
    const { product } = useMerchantProduct(productId);
    const { variants, optionTypes } = useProductVariants(productId);
    
    const {
        selectedOptions,
        isSelectionComplete,
        activeVariant,
        effectivePrice,
        effectiveImage,
        isInStock,
        stockQuantity,
        selectOption,
        getAvailableValuesForOption,
        getCartItemData,
        hasVariants
    } = useVariantSelection(product, variants, optionTypes);
    
    // Rest of component...
}
```

### 3. Display Variant Selector

```javascript
import { VariantSelector, VariantPriceDisplay, VariantStockBadge } 
    from '../components/VariantSelector';

// In your JSX:
<VariantPriceDisplay
    effectivePrice={effectivePrice}
    basePrice={product.price}
    hasVariants={hasVariants}
    isSelectionComplete={isSelectionComplete}
/>

<VariantSelector
    optionTypes={optionTypes}
    selectedOptions={selectedOptions}
    getAvailableValuesForOption={getAvailableValuesForOption}
    onSelectOption={selectOption}
    isSelectionComplete={isSelectionComplete}
    activeVariant={activeVariant}
/>

<VariantStockBadge
    stockQuantity={stockQuantity}
    isInStock={isInStock}
    hasVariants={hasVariants}
    isSelectionComplete={isSelectionComplete}
/>
```

### 4. Add to Cart with Variant

```javascript
const handleAddToCart = () => {
    if (hasVariants && !isSelectionComplete) {
        alert('Please select all options');
        return;
    }
    
    const cartItemData = getCartItemData(quantity);
    if (!cartItemData) {
        alert('Unable to add to cart');
        return;
    }
    
    addToCart(cartItemData);
};
```

---

## Admin Integration

### 1. Import Variant Editor

```javascript
import { VariantEditor } from '../../components/admin/VariantEditor';
import { useProductVariants, useVariantManagement } 
    from '../../hooks/useVariants';
```

### 2. Add to Product Form

```javascript
function ProductCreator() {
    const [productId, setProductId] = useState(editProduct?.id);
    
    const { variants, optionTypes, loading, refetch } = useProductVariants(productId);
    const management = useVariantManagement(productId);
    
    // After saving product, show variant editor
    return (
        <div>
            {/* ... existing product fields ... */}
            
            {productId && (
                <div className="border-t pt-6">
                    <VariantEditor
                        variants={variants}
                        optionTypes={optionTypes}
                        management={management}
                        onVariantsChange={refetch}
                        basePrice={price}
                    />
                </div>
            )}
        </div>
    );
}
```

### 3. Admin Operations

```javascript
// Create variant
await management.createVariant({
    option_values: { "Size": "Large", "Color": "Blue" },
    price: 299.99,
    stock_quantity: 10,
    sku: "SHIRT-BLU-L",
    image_url: "https://..."
});

// Update variant
await management.updateVariant(variantId, {
    stock_quantity: 5,
    price: 249.99
});

// Delete variant
await management.deleteVariant(variantId);

// Create option type
await management.createOptionType("Size", 0);

// Validate before creating
const validation = management.validateVariant(
    optionTypes,
    { "Size": "XL", "Color": "Red" },
    existingVariants
);
if (!validation.isValid) {
    console.error(validation.errors);
}
```

---

## Cart & Checkout Integration

### Updated Cart Context

The cart now uses **cartItemId** format:
- Non-variant product: `"123"` (just product ID)
- Variant product: `"123-456"` (productId-variantId)

### Cart Operations

```javascript
import { useCart } from '../context/cartcontext';

const { addToCart, cartItems, removeFromCart } = useCart();

// Add variant to cart
addToCart({
    cartItemId: "123-456",
    product_id: 123,
    variant_id: 456,
    title: "Cool T-Shirt",
    variant_title: "Size: Large, Color: Blue",
    price: 299.99,
    image: "https://...",
    quantity: 1,
    stock_quantity: 10,
    sku: "SHIRT-BLU-L",
    option_values: { "Size": "Large", "Color": "Blue" }
});

// Remove from cart
removeFromCart("123-456");

// Check if in cart
isInCart(123, 456); // productId, variantId
```

### Checkout Order Items

Update order creation to include variant data:

```javascript
const orderData = {
    // ... other order fields ...
    items: cartItems.map(item => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        title: item.title,
        variant_title: item.variant_title,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
        sku: item.sku,
        option_values: item.option_values
    }))
};
```

---

## Validation Rules

### Product Level
✅ Product can have 0-4 variants  
✅ Product can have 0-2 option types  
✅ If variants exist, `has_variants` must be TRUE  

### Variant Level
✅ All option type values must be provided  
✅ Option combinations must be unique per product  
✅ Stock quantity must be >= 0  
✅ Price can be NULL (uses product price)  
✅ Must reference valid product_id  

### Cart Level
✅ Products with variants REQUIRE variant selection  
✅ Non-variant products work with legacy cart format  
✅ Stock validation before checkout  

### Admin Level
✅ Cannot create variant without option types  
✅ Cannot exceed 4 variants per product  
✅ Cannot exceed 2 option types per product  
✅ Cannot create duplicate option combinations  

---

## Examples

### Example 1: T-Shirt with Size and Color

**Setup:**
```javascript
// Option Types
1. Size (position: 0)
2. Color (position: 1)

// Variants
1. { "Size": "Small", "Color": "Red" } - price: null, stock: 10
2. { "Size": "Small", "Color": "Blue" } - price: null, stock: 5
3. { "Size": "Large", "Color": "Red" } - price: 29.99, stock: 20
4. { "Size": "Large", "Color": "Blue" } - price: 29.99, stock: 0 (out of stock)
```

**Storefront Behavior:**
- User sees "From R 25.00" until selection complete
- Selecting "Large" + "Blue" shows "Out of Stock"
- Selecting "Large" + "Red" shows R 29.99 (custom price)
- Add to cart button disabled until both options selected

### Example 2: Book with Single Variant (Format)

**Setup:**
```javascript
// Option Types
1. Format (position: 0)

// Variants
1. { "Format": "Paperback" } - price: 150.00, stock: 50
2. { "Format": "Hardcover" } - price: 250.00, stock: 20
3. { "Format": "eBook" } - price: 99.00, stock: 999
```

### Example 3: Product without Variants (Legacy)

**Setup:**
```javascript
// No option types, no variants
product.has_variants = false
product.price = 199.99
product.inventory = 10
```

**Storefront Behavior:**
- Shows price directly (no "From")
- Add to cart uses product_id only
- Cart item: `{ cartItemId: "123", product_id: 123, variant_id: null }`

---

## Migration Checklist

- [ ] Run database migration in Supabase SQL Editor
- [ ] Verify tables created: `product_option_types`, `product_variants`
- [ ] Verify `products.has_variants` column added
- [ ] Test RLS policies (merchants can only see own variants)
- [ ] Update any existing products to set `has_variants = false`
- [ ] Test helper functions: `get_variant_price()`, `is_variant_in_stock()`
- [ ] Clear old cart data or run migration: `localStorage.removeItem('shopping_cart')`
- [ ] Update any hardcoded product queries to include variant joins
- [ ] Test admin variant creation with validation
- [ ] Test storefront variant selection and cart
- [ ] Test checkout with variant-based orders

---

## Troubleshooting

### Issue: "Maximum 4 variants per product" error
**Solution:** Delete an existing variant before creating a new one

### Issue: "A variant with these options already exists"
**Solution:** Change at least one option value to make it unique

### Issue: Variants not appearing on storefront
**Solution:** Check `is_active = true` and option types are defined

### Issue: Cart not accepting variant
**Solution:** Ensure `getCartItemData()` returns valid data with `cartItemId`

### Issue: Old cart items not working
**Solution:** Cart will auto-migrate, or clear localStorage

---

## Files Created

```
/migrations/add_product_variants.sql          # Database migration
/src/types/variants.js                        # TypeScript types
/src/hooks/useVariants.js                     # React hooks
/src/context/cartcontext.jsx                  # Updated cart (variant support)
/src/components/admin/VariantEditor.jsx       # Admin variant manager
/src/storefront/components/VariantSelector.jsx # Storefront selector
/docs/PRODUCT_VARIANTS_GUIDE.md              # This guide
```

---

## Next Steps

1. **Run the migration** in Supabase SQL Editor
2. **Test variant creation** in admin dashboard
3. **Test variant selection** on storefront
4. **Test checkout** with variant-based cart items
5. **Monitor** database constraints and triggers

---

**Implementation Complete! 🎉**

Your multi-tenant e-commerce SaaS now supports product variants with proper constraints, validation, and cart integration.
