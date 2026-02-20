# Product Variants - Quick Reference

## 🎯 Quick Start (3 Steps)

### 1️⃣ Run Migration
```bash
# Copy /migrations/add_product_variants.sql
# Execute in Supabase SQL Editor
```

### 2️⃣ Admin: Create Variants
```jsx
import { VariantEditor } from '../components/admin/VariantEditor';
import { useProductVariants, useVariantManagement } from '../hooks/useVariants';

const { variants, optionTypes, refetch } = useProductVariants(productId);
const management = useVariantManagement(productId);

<VariantEditor
    variants={variants}
    optionTypes={optionTypes}
    management={management}
    onVariantsChange={refetch}
    basePrice={product.price}
/>
```

### 3️⃣ Storefront: Display Variants
```jsx
import { useVariantSelection } from '../hooks/useVariants';
import { VariantSelector, VariantPriceDisplay } from '../components/VariantSelector';

const {
    effectivePrice,
    isInStock,
    getCartItemData,
    selectOption,
    getAvailableValuesForOption
} = useVariantSelection(product, variants, optionTypes);

<VariantPriceDisplay effectivePrice={effectivePrice} basePrice={product.price} />
<VariantSelector onSelectOption={selectOption} {... } />
<button onClick={() => addToCart(getCartItemData(quantity))}>Add to Cart</button>
```

---

## 📊 Data Model (Simplified)

```
products
├── id
├── price (base price)
├── inventory (base inventory)
└── has_variants (boolean flag)

product_option_types (max 2 per product)
├── id
├── product_id
├── name ("Size", "Color")
└── position (0 or 1)

product_variants (max 4 per product)
├── id
├── product_id
├── option_values (JSONB: {"Size": "L", "Color": "Red"})
├── price (NULL = use product.price)
├── stock_quantity
├── sku
├── image_url
└── is_active
```

---

## 🔑 Key Concepts

### Cart Item ID Format
```javascript
// Non-variant product
cartItemId: "123"

// Variant product
cartItemId: "123-456"  // productId-variantId
```

### Effective Price
```javascript
// Variant price takes precedence
effectivePrice = variant.price ?? product.price
```

### Option Values (JSONB)
```javascript
// Flexible JSON storage
option_values: {
  "Size": "Large",
  "Color": "Blue"
}
```

---

## 🎨 UI Components

### Storefront
```jsx
import { 
  VariantSelector,
  VariantPriceDisplay,
  VariantStockBadge 
} from '../storefront/components/VariantSelector';
```

### Admin
```jsx
import { VariantEditor } from '../components/admin/VariantEditor';
```

---

## 🪝 React Hooks

### `useProductVariants(productId)`
**Fetch variants and option types**
```javascript
const { variants, optionTypes, loading, refetch } = useProductVariants(productId);
```

### `useVariantSelection(product, variants, optionTypes)`
**Manage storefront selection**
```javascript
const {
  selectedOptions,        // Current selections
  isSelectionComplete,    // All options selected?
  activeVariant,          // Resolved variant
  effectivePrice,         // Price to display
  isInStock,              // Stock availability
  selectOption,           // Handler: (name, value) => void
  getCartItemData         // Generate cart item
} = useVariantSelection(product, variants, optionTypes);
```

### `useVariantManagement(productId)`
**Admin CRUD operations**
```javascript
const {
  createVariant,          // (data) => Promise<result>
  updateVariant,          // (id, data) => Promise<result>
  deleteVariant,          // (id) => Promise<result>
  createOptionType,       // (name, position) => Promise<result>
  validateVariant,        // (types, values, existing) => {isValid, errors}
  saving                  // Boolean loading state
} = useVariantManagement(productId);
```

---

## ✅ Validation Rules

| Rule | Enforced By |
|------|-------------|
| Max 4 variants per product | DB trigger + hook |
| Max 2 option types per product | DB trigger + hook |
| Unique option combinations | DB unique constraint + trigger |
| All option values required | Hook validation |
| Product saved before variants | UI state (productId required) |

---

## 🔐 Security (RLS)

**Merchants:**
```sql
-- Can manage variants for own products only
WHERE EXISTS (
  SELECT 1 FROM products p
  JOIN merchant_users mu ON mu.merchant_id = p.merchant_id
  WHERE p.id = product_variants.product_id
  AND mu.user_id = auth.uid()
)
```

**Public:**
```sql
-- Can view active variants
WHERE is_active = TRUE
```

---

## 🛒 Cart Integration

### Add Variant to Cart
```javascript
const cartItemData = getCartItemData(quantity);
// Returns: {
//   cartItemId: "123-456",
//   product_id: 123,
//   variant_id: 456,
//   title: "Cool Shirt",
//   variant_title: "Size: Large, Color: Blue",
//   price: 299.99,
//   quantity: 1,
//   option_values: {"Size": "Large", "Color": "Blue"}
// }

addToCart(cartItemData);
```

### Check if in Cart
```javascript
isInCart(productId, variantId);
```

### Remove from Cart
```javascript
removeFromCart(cartItemId);
```

---

## 💾 Database Helpers

```sql
-- Get effective price
SELECT get_variant_price(456);  -- Returns 299.99

-- Check stock
SELECT is_variant_in_stock(456, 2);  -- Returns true/false
```

---

## 🐛 Common Errors & Fixes

### ❌ "Maximum 4 variants per product"
**Fix:** Delete an existing variant first, or choose a different product

### ❌ "A variant with these options already exists"
**Fix:** Change at least one option value to make it unique

### ❌ "Cannot add to cart without selecting all options"
**Fix:** Use `isSelectionComplete` to disable button until all options selected

### ❌ "Product ID required for variant management"
**Fix:** Save product first to get an ID before showing VariantEditor

---

## 📝 Example Usage

### Create Variant (Admin)
```javascript
await management.createVariant({
  option_values: { "Size": "Large", "Color": "Blue" },
  price: 299.99,        // NULL to use product price
  stock_quantity: 10,
  sku: "SHIRT-BLU-L",   // Optional
  image_url: "..."      // Optional
});
```

### Select Variant (Storefront)
```javascript
selectOption("Size", "Large");
selectOption("Color", "Blue");
// activeVariant is now resolved
```

### Add to Cart (Storefront)
```javascript
if (!isSelectionComplete) {
  alert("Please select all options");
  return;
}

const cartItem = getCartItemData(quantity);
addToCart(cartItem);
```

---

## 📂 File Locations

```
/migrations/add_product_variants.sql           # Run in Supabase
/src/types/variants.js                         # Type definitions
/src/hooks/useVariants.js                      # React hooks
/src/context/cartcontext.jsx                   # Updated cart
/src/components/admin/VariantEditor.jsx        # Admin UI
/src/storefront/components/VariantSelector.jsx # Storefront UI
/docs/PRODUCT_VARIANTS_GUIDE.md                # Full guide
/docs/examples/                                # Integration examples
```

---

## 🚀 Deployment Checklist

- [ ] Run migration in Supabase
- [ ] Verify tables & triggers created
- [ ] Test admin variant creation
- [ ] Test storefront variant selection
- [ ] Test cart with variants
- [ ] Test checkout with variants
- [ ] Clear old cart: `localStorage.removeItem('shopping_cart')`

---

**That's it! You're ready to use product variants.** 🎉

For full documentation, see `/docs/PRODUCT_VARIANTS_GUIDE.md`
