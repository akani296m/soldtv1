-- Migration: Add Collections Feature
-- Creates collections table and junction table for product-collection relationships
-- Note: merchants.id uses UUID, products.id uses BIGINT

-- Step 1: Create the collections table
CREATE TABLE IF NOT EXISTS public.collections (
    id BIGSERIAL PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create junction table for many-to-many relationship between collections and products
CREATE TABLE IF NOT EXISTS public.collection_products (
    id BIGSERIAL PRIMARY KEY,
    collection_id BIGINT NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(collection_id, product_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_collections_merchant_id ON public.collections(merchant_id);
CREATE INDEX IF NOT EXISTS idx_collection_products_collection_id ON public.collection_products(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_products_product_id ON public.collection_products(product_id);

-- Step 4: Enable RLS on both tables
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for collections table
-- Allow merchants to view their own collections
CREATE POLICY "Merchants can view own collections"
ON public.collections
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.merchant_users
    WHERE merchant_users.merchant_id = collections.merchant_id
    AND merchant_users.user_id = auth.uid()
  )
);

-- Allow merchants to insert their own collections
CREATE POLICY "Merchants can create own collections"
ON public.collections
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.merchant_users
    WHERE merchant_users.merchant_id = collections.merchant_id
    AND merchant_users.user_id = auth.uid()
  )
);

-- Allow merchants to update their own collections
CREATE POLICY "Merchants can update own collections"
ON public.collections
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.merchant_users
    WHERE merchant_users.merchant_id = collections.merchant_id
    AND merchant_users.user_id = auth.uid()
  )
);

-- Allow merchants to delete their own collections
CREATE POLICY "Merchants can delete own collections"
ON public.collections
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.merchant_users
    WHERE merchant_users.merchant_id = collections.merchant_id
    AND merchant_users.user_id = auth.uid()
  )
);

-- Step 6: Create RLS policies for collection_products junction table
-- Allow access to collection products where user owns the collection
CREATE POLICY "Merchants can view own collection products"
ON public.collection_products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.collections c
    JOIN public.merchant_users mu ON c.merchant_id = mu.merchant_id
    WHERE c.id = collection_products.collection_id
    AND mu.user_id = auth.uid()
  )
);

CREATE POLICY "Merchants can add products to own collections"
ON public.collection_products
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.collections c
    JOIN public.merchant_users mu ON c.merchant_id = mu.merchant_id
    WHERE c.id = collection_products.collection_id
    AND mu.user_id = auth.uid()
  )
);

CREATE POLICY "Merchants can update own collection products"
ON public.collection_products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.collections c
    JOIN public.merchant_users mu ON c.merchant_id = mu.merchant_id
    WHERE c.id = collection_products.collection_id
    AND mu.user_id = auth.uid()
  )
);

CREATE POLICY "Merchants can remove products from own collections"
ON public.collection_products
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.collections c
    JOIN public.merchant_users mu ON c.merchant_id = mu.merchant_id
    WHERE c.id = collection_products.collection_id
    AND mu.user_id = auth.uid()
  )
);

-- Step 7: Allow anonymous users to view active collections (for storefront)
CREATE POLICY "Public can view active collections"
ON public.collections
FOR SELECT
TO anon
USING (is_active = true);

CREATE POLICY "Public can view products in active collections"
ON public.collection_products
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.collections
    WHERE collections.id = collection_products.collection_id
    AND collections.is_active = true
  )
);

-- Step 8: Add updated_at trigger for collections
CREATE OR REPLACE FUNCTION update_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_collections_updated_at ON public.collections;
CREATE TRIGGER trigger_collections_updated_at
    BEFORE UPDATE ON public.collections
    FOR EACH ROW
    EXECUTE FUNCTION update_collections_updated_at();

-- Done! Collections feature database setup complete.