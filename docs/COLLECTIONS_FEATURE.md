# Collections Feature Documentation

## Overview

The Collections feature allows merchants to organize their products into themed groups or categories. This makes it easier for customers to browse related products and improves product discoverability.

## Features Implemented

### 1. **Database Schema**
- **Collections Table**: Stores collection metadata
  - `id`: Unique identifier
  - `merchant_id`: Links collection to merchant
  - `name`: Collection name
  - `description`: Optional description
  - `image_url`: Optional collection image
  - `is_active`: Controls visibility on storefront
  - `sort_order`: For manual ordering
  - `created_at`, `updated_at`: Timestamps

- **Collection Products Junction Table**: Many-to-many relationship
  - Links collections to products
  - Supports manual product ordering within collections
  - Allows products to belong to multiple collections

### 2. **Backend Context**
- `CollectionProvider` in `src/context/collectionContext.jsx`
- Provides CRUD operations:
  - `addCollection()`: Create new collection
  - `editCollection()`: Update existing collection
  - `deleteCollection()`: Remove collection
  - `addProductsToCollection()`: Add products to collection
  - `removeProductsFromCollection()`: Remove products from collection
  - `syncCollectionProducts()`: Replace all products in collection
  - `getCollection()`: Fetch single collection with products

### 3. **User Interface**

#### Collections Listing Page (`/products/collections`)
- Grid view of all collections
- Shows collection image or product preview grid
- Search functionality
- Bulk selection
- Product count for each collection
- Active/Draft status badges
- Quick edit and delete actions

#### Collection Editor (`/products/collections/create` and `/products/collections/edit`)
- Create or edit collections
- Add collection name and description
- Upload collection image (optional)
- Manual product selection via modal picker
- Drag-and-drop product ordering (UI ready, backend supports it)
- Toggle collection active status
- Live product count display

#### Sidebar Navigation
- Collections added as submenu under Products
- Shows:
  - All Products
  - Collections

### 4. **Security**
- Row Level Security (RLS) enabled
- Merchants can only:
  - View their own collections
  - Create collections for their store
  - Edit their own collections
  - Delete their own collections
- Public users can:
  - View active collections (for storefront display)
  - View products in active collections

## File Structure

```
migrations/
  └── add_collections.sql              # Database migration

src/
  ├── context/
  │   └── collectionContext.jsx        # Collection state management
  ├── pages/
  │   ├── collections.jsx              # Collections listing page
  │   └── collectionEditor.jsx         # Collection create/edit page
  └── components/
      └── sidebar.jsx                  # Updated with Collections menu

.agent/workflows/
  └── run-collections-migration.md     # Migration workflow guide
```

## Usage Guide

### For Merchants

#### Creating a Collection
1. Navigate to Products → Collections in the sidebar
2. Click "Create Collection" button
3. Enter collection name (required)
4. Add optional description
5. Upload optional collection image
6. Click "Add Products" to select products
7. Search and select products from the modal
8. Click "Save" to create the collection

#### Editing a Collection
1. Go to Products → Collections
2. Click on a collection card to edit
3. Modify name, description, or image
4. Add or remove products
5. Toggle active status on/off
6. Click "Save" to update

#### Managing Products in a Collection
- Click "Add Products" to open product picker
- Search for products by name
- Click on products to select/deselect
- Selected products appear in the main editor
- Remove products by clicking the X icon
- Products can be reordered (drag feature UI ready)

#### Deleting a Collection
- Click the trash icon on a collection card
- Confirm deletion
- Note: Products are NOT deleted, only the collection

### Collection States
- **Active**: Visible on storefront (customers can see it)
- **Draft**: Hidden from customers (merchant can see it)

## Next Steps / Future Enhancements

### Storefront Integration (Not Included)
To display collections on the storefront, you'll need to:
1. Create a Collections page component in `/src/storefront/pages/`
2. Add route in `App.jsx` for `/s/:merchantSlug/collections`
3. Fetch collections using the collection context
4. Display collection products with filtering

### Additional Features to Consider
- Automatic collections (based on product tags, category, price range)
- Collection sorting options (newest, price, name)
- Featured collections
- Collection-specific SEO metadata
- Collection analytics (views, clicks, conversions)
- Scheduled collections (auto-activate on specific dates)

## API Reference

### CollectionContext Hook

```javascript
const {
  collections,              // Array of all collections
  addCollection,           // (collectionData) => Promise
  editCollection,          // (id, collectionData) => Promise
  deleteCollection,        // (id) => Promise
  addProductsToCollection, // (collectionId, productIds) => Promise
  removeProductsFromCollection, // (collectionId, productIds) => Promise
  syncCollectionProducts,  // (collectionId, productIds) => Promise
  getCollection,           // (id) => Promise
  loading,                 // Boolean
  error,                   // String or null
  merchantId,              // Current merchant ID
  refetch                  // () => void - Refresh collections
} = useCollections();
```

### Collection Data Structure

```javascript
{
  id: "uuid",
  merchant_id: "uuid",
  name: "Summer Collection",
  description: "Hot summer picks",
  image_url: "https://...",
  is_active: true,
  sort_order: 0,
  created_at: "2026-01-21T...",
  updated_at: "2026-01-21T...",
  collection_products: [
    {
      id: "uuid",
      product_id: "uuid",
      sort_order: 0,
      products: {
        id: "uuid",
        title: "Product Name",
        price: 99.99,
        images: [...],
        is_active: true
      }
    }
  ]
}
```

## Migration Instructions

See the workflow guide at `.agent/workflows/run-collections-migration.md` or run:

```
/run-collections-migration
```

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Navigate to Products → Collections
- [ ] Create a new collection
- [ ] Add products to collection
- [ ] Edit collection name and description
- [ ] Upload collection image
- [ ] Toggle collection active status
- [ ] Remove products from collection
- [ ] Delete a collection
- [ ] Verify RLS policies (try accessing another merchant's collections)
- [ ] Test search functionality
- [ ] Test bulk selection

## Troubleshooting

### Collections menu item not showing
- Check that `sidebar.jsx` was updated correctly
- Verify the Products menu has `hasSubmenu: true`

### Migration fails
- Ensure you have the latest Supabase schema
- Check if tables already exist
- Verify RLS is supported in your Supabase plan

### Products not loading in picker
- Verify `ProductProvider` is wrapping the app
- Check `useProducts()` hook is returning data
- Look for errors in browser console

### Context not available
- Ensure `CollectionProvider` is in `main.jsx`
- Verify it wraps the components that need it
- Check import paths are correct
