# Shopify-Style Product Variants

A comprehensive product variants feature similar to Shopify's implementation.

## Overview

This feature allows merchants to create products with multiple variants based on options like Size, Color, Material, etc.

### Key Features

- ✅ **Feature Toggle** - Variants disabled by default, merchant can enable via toggle
- ✅ **Up to 3 Options** - Define up to 3 product options (e.g., Size, Color, Length)
- ✅ **Tokenized Value Input** - Easy input for option values with Enter/comma to add
- ✅ **Drag-and-Drop Reordering** - Reorder options with drag and drop
- ✅ **Auto-Generated Variants** - Cartesian product of all option values
- ✅ **Smart Reconciliation** - Preserves existing variant data when options change
- ✅ **Inline Editing** - Edit variant prices, quantities, SKUs directly in table
- ✅ **Max 100 Variants** - Reasonable cap with validation
- ✅ **Dynamic Options** - No hardcoded "size" or "color"

---

## Database Migration

Run this migration in Supabase SQL Editor:

**File:** `/migrations/update_product_variants_shopify.sql`

### Changes Made

1. **Added `option_values` column** to `product_option_types`
   - Stores the possible values as TEXT array (e.g., `['Small', 'Medium', 'Large']`)

2. **Increased Limits**
   - Max option types: 2 → 3
   - Max variants: 4 → 100

3. **Added batch upsert function** for efficient reconciliation

---

## Components

### ShopifyVariantEditor

**Location:** `/src/components/admin/ShopifyVariantEditor.jsx`

The main component for managing variants. Includes:

- Variants toggle switch
- Option list with drag-and-drop
- Option form with tokenized input
- Variants table with inline editing

**Usage:**

```jsx
import { ShopifyVariantEditor } from '../components/admin/ShopifyVariantEditor';

<ShopifyVariantEditor
  productId={editProduct.id}
  hasVariants={editProduct.has_variants || false}
  basePrice={price}
  baseInventory={Number(inventory) || 0}
  onHasVariantsChange={(hasVariants) => {
    console.log('Variants enabled:', hasVariants);
  }}
  onVariantsChange={() => {
    console.log('Variants updated');
  }}
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `productId` | number | Required. The product ID |
| `hasVariants` | boolean | Initial state of variants toggle |
| `basePrice` | number | Product base price (fallback for variants) |
| `baseInventory` | number | Product base inventory |
| `onHasVariantsChange` | function | Called when toggle changes |
| `onVariantsChange` | function | Called when variants are updated |

---

## Hooks

### useVariantOptions

**Location:** `/src/hooks/useVariantOptions.js`

Manages product options with CRUD operations:

```javascript
import { useVariantOptions } from '../hooks/useVariantOptions';

const {
  optionTypes,          // Array of option types
  loading,
  saving,
  fetchOptionTypes,     // Fetch from database
  saveOptionType,       // Create or update
  deleteOptionType,     // Delete an option
  reorderOptions,       // Drag-and-drop reorder
  variantCount,         // Expected variant count
  canAddOption,         // Can add more options?
  MAX_OPTIONS,          // 3
  MAX_VARIANTS          // 100
} = useVariantOptions(productId);
```

### useVariantReconciliation

Syncs variants with option combinations:

```javascript
import { useVariantReconciliation } from '../hooks/useVariantOptions';

const { reconcileVariants, reconciling } = useVariantReconciliation(productId);

// After changing options:
const result = await reconcileVariants(optionTypes, existingVariants);
// Returns: { success, created, removed, preserved }
```

### Helper Functions

```javascript
import { 
  cartesianProduct,
  generateVariantCombinations,
  getVariantCount,
  wouldExceedVariantLimit 
} from '../hooks/useVariantOptions';

// Generate all combinations
const combinations = generateVariantCombinations(optionTypes);
// [{ Size: 'Small', Color: 'Red' }, { Size: 'Small', Color: 'Blue' }, ...]

// Check variant count
const count = getVariantCount(optionTypes);
// 6 (if Size has 2 values and Color has 3)

// Check limit
const wouldExceed = wouldExceedVariantLimit(optionTypes);
// true if count > 100
```

---

## Data Model

### product_option_types

```sql
id              BIGSERIAL PRIMARY KEY
product_id      BIGINT (FK to products)
name            VARCHAR(50) -- "Size", "Color"
option_values   TEXT[]      -- ['Small', 'Medium', 'Large']
position        SMALLINT    -- 0, 1, 2 (order)
created_at      TIMESTAMP
```

### product_variants

```sql
id              BIGSERIAL PRIMARY KEY
product_id      BIGINT (FK to products)
option_values   JSONB       -- {"Size": "Large", "Color": "Blue"}
price           DECIMAL     -- NULL = use product price
stock_quantity  INTEGER     -- Variant-specific stock
sku             VARCHAR(100)
image_url       TEXT
is_active       BOOLEAN
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### products (added column)

```sql
has_variants    BOOLEAN DEFAULT FALSE
```

---

## Variant Generation & Reconciliation

### How It Works

1. **Merchant defines options** with values
   - Option: "Size" → Values: ["Small", "Medium", "Large"]
   - Option: "Color" → Values: ["Red", "Blue"]

2. **System generates cartesian product**
   - Small/Red, Small/Blue, Medium/Red, Medium/Blue, Large/Red, Large/Blue

3. **Smart reconciliation runs**
   - New combinations → Create variant with defaults
   - Existing combinations → Preserve price, SKU, inventory, image
   - Removed combinations → Delete variant

### Example

```
Options:
  Size: [S, M, L]
  Color: [Red, Blue]

Variants Generated (6):
  { Size: S, Color: Red }
  { Size: S, Color: Blue }
  { Size: M, Color: Red }
  { Size: M, Color: Blue }
  { Size: L, Color: Red }
  { Size: L, Color: Blue }
```

If merchant removes "Blue" from Color:

```
Variants After Reconciliation (3):
  { Size: S, Color: Red }   ✓ Preserved
  { Size: M, Color: Red }   ✓ Preserved
  { Size: L, Color: Red }   ✓ Preserved
  { Size: S, Color: Blue }  ✗ Deleted
  { Size: M, Color: Blue }  ✗ Deleted
  { Size: L, Color: Blue }  ✗ Deleted
```

---

## UI Behavior

### Option Editor

1. Click "Add option"
2. Enter option name (e.g., "Size")
3. Type values and press Enter or comma
   - "Small" [Enter] "Medium" [Enter] "Large" [Enter]
4. Click "Add option" to save
5. Variants auto-generate

### Variants Table

- Click any cell to edit inline
- Price shows product price in gray if not overridden
- Quantity shows red if zero
- SKU shows dash if not set

### Reordering

- Drag options to reorder
- Variant option_values keys stay the same (by name)

---

## Validation

### Option Level

- ✅ Name required and unique per product
- ✅ At least one value required
- ✅ Values must be unique (case-insensitive check)
- ✅ Max 3 options per product

### Variant Level

- ✅ Max 100 variants per product
- ✅ Unique option combinations enforced
- ✅ Stock quantity >= 0

### UI Prevention

- Toggle disabled if would exceed 100 variant limit
- Warning shown when approaching limit
- Cannot add option if at max

---

## Integration with Storefront

The existing storefront components continue to work:

- **VariantSelector** - Displays option buttons
- **VariantPriceDisplay** - Shows "From" price when not selected
- **VariantStockBadge** - Shows stock status

The `useVariantSelection` hook handles selection state and cart integration.

---

## Files Created/Modified

### New Files

```
/migrations/update_product_variants_shopify.sql
/src/hooks/useVariantOptions.js
/src/components/admin/ShopifyVariantEditor.jsx
/docs/SHOPIFY_VARIANTS.md (this file)
```

### Modified Files

```
/src/hooks/useVariants.js - Fixed refetch function
/src/pages/products.jsx - Integrated ShopifyVariantEditor
```

---

## Migration Checklist

- [ ] Run `/migrations/update_product_variants_shopify.sql` in Supabase SQL Editor
- [ ] Verify `option_values` column exists on `product_option_types`
- [ ] Test creating a product and adding variants
- [ ] Test option reordering
- [ ] Test variant reconciliation (add/remove option values)
- [ ] Test inline editing in variants table
- [ ] Test storefront variant selection
- [ ] Verify cart/checkout works with variants

---

## Future Enhancements

- [ ] Bulk variant editing (select multiple, edit together)
- [ ] Variant image upload with swatch preview
- [ ] Import/export variants as CSV
- [ ] Variant barcode/QR code generation
- [ ] Inventory tracking per variant
- [ ] Low stock alerts per variant
