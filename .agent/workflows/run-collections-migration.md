---
description: Run the Collections Database Migration
---

# Run Collections Database Migration

This workflow runs the database migration to add the collections feature to your Supabase database.

## Steps

1. Open your Supabase project dashboard at https://supabase.com
2. Navigate to the SQL Editor in your project
3. Copy the contents of `/Users/akani/merchantsv1/migrations/add_collections.sql`
4. Paste into the SQL Editor
5. Click "Run" to execute the migration
6. Verify the migration succeeded by checking for these new tables:
   - `collections`
   - `collection_products`

## What this migration does

- Creates `collections` table to store collection metadata (name, description, image, etc.)
- Creates `collection_products` junction table for many-to-many relationship between collections and products
- Sets up indexes for optimal query performance
- Enables Row Level Security (RLS) on both tables
- Creates RLS policies so merchants can only access their own collections
- Adds policies to allow public viewing of active collections on the storefront
- Creates an updated_at trigger for collections

## After migration

Once the migration completes successfully:
1. The Collections menu item will appear under Products in the sidebar
2. Merchants can create collections at `/products/collections`
3. Collections can be manually created and products can be manually added to them
