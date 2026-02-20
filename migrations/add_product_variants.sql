-- ============================================================================
-- PRODUCT VARIANTS MIGRATION
-- ============================================================================
-- Implements a minimal but correct variant system:
-- - Maximum 4 variants per product
-- - Up to 2 option types per product (e.g., Size, Color)
-- - Each variant can override: price, stock, SKU, image
-- - Cart/checkout references variantId, not productId
-- ============================================================================

-- ============================================================================
-- 1. PRODUCT OPTION TYPES (e.g., "Size", "Color")
-- ============================================================================
-- Stores the option type definitions for a product
-- A product can have up to 2 option types

CREATE TABLE IF NOT EXISTS public.product_option_types (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- e.g., "Size", "Color"
    position SMALLINT DEFAULT 0, -- Order of display (0 or 1)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Composite unique: each product can have each option type name only once
    UNIQUE (product_id, name),
    
    -- Constraint: maximum 2 option types per product
    CONSTRAINT max_two_option_types CHECK (position >= 0 AND position <= 1)
);

-- Index for fast lookup by product
CREATE INDEX IF NOT EXISTS idx_product_option_types_product 
ON public.product_option_types(product_id);


-- ============================================================================
-- 2. PRODUCT VARIANTS
-- ============================================================================
-- Each variant represents a specific combination of options
-- Maximum 4 variants per product

CREATE TABLE IF NOT EXISTS public.product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    
    -- Variant-specific overrides (NULL means use product default)
    price DECIMAL(10, 2), -- Override price, NULL = use product.price
    stock_quantity INTEGER DEFAULT 0, -- Variant-specific stock
    sku VARCHAR(100), -- Optional SKU for this variant
    image_url TEXT, -- Optional variant-specific image
    
    -- Option values stored as JSON: {"Size": "Large", "Color": "Blue"}
    -- This allows flexible option combinations without joins
    option_values JSONB NOT NULL DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique option combinations per product
    UNIQUE (product_id, option_values)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_product_variants_product 
ON public.product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_active 
ON public.product_variants(product_id, is_active) 
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_product_variants_options 
ON public.product_variants USING GIN (option_values);


-- ============================================================================
-- 3. CONSTRAINT: MAXIMUM 4 VARIANTS PER PRODUCT
-- ============================================================================
-- Function to enforce max 4 variants per product

CREATE OR REPLACE FUNCTION check_max_variants_per_product()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    variant_count INTEGER;
BEGIN
    -- Count existing variants for this product (excluding current if update)
    SELECT COUNT(*) INTO variant_count
    FROM public.product_variants
    WHERE product_id = NEW.product_id
    AND (TG_OP = 'INSERT' OR id != NEW.id);
    
    -- Check limit
    IF variant_count >= 4 THEN
        RAISE EXCEPTION 'Maximum 4 variants allowed per product. Product ID: %', NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS enforce_max_variants ON public.product_variants;
CREATE TRIGGER enforce_max_variants
    BEFORE INSERT OR UPDATE ON public.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION check_max_variants_per_product();


-- ============================================================================
-- 4. CONSTRAINT: MAXIMUM 2 OPTION TYPES PER PRODUCT
-- ============================================================================
-- Function to enforce max 2 option types per product

CREATE OR REPLACE FUNCTION check_max_option_types_per_product()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    option_type_count INTEGER;
BEGIN
    -- Count existing option types for this product (excluding current if update)
    SELECT COUNT(*) INTO option_type_count
    FROM public.product_option_types
    WHERE product_id = NEW.product_id
    AND (TG_OP = 'INSERT' OR id != NEW.id);
    
    -- Check limit
    IF option_type_count >= 2 THEN
        RAISE EXCEPTION 'Maximum 2 option types allowed per product. Product ID: %', NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS enforce_max_option_types ON public.product_option_types;
CREATE TRIGGER enforce_max_option_types
    BEFORE INSERT OR UPDATE ON public.product_option_types
    FOR EACH ROW
    EXECUTE FUNCTION check_max_option_types_per_product();


-- ============================================================================
-- 5. AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_variant_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_variant_updated_at ON public.product_variants;
CREATE TRIGGER set_variant_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_variant_updated_at();


-- ============================================================================
-- 6. ADD has_variants FLAG TO PRODUCTS TABLE
-- ============================================================================
-- Quick lookup to know if a product has variants without a join

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT FALSE;

-- Function to update has_variants flag
CREATE OR REPLACE FUNCTION update_product_has_variants()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    variant_exists BOOLEAN;
BEGIN
    -- Determine which product_id to check
    IF TG_OP = 'DELETE' THEN
        SELECT EXISTS(
            SELECT 1 FROM public.product_variants 
            WHERE product_id = OLD.product_id AND is_active = TRUE
        ) INTO variant_exists;
        
        UPDATE public.products 
        SET has_variants = variant_exists 
        WHERE id = OLD.product_id;
    ELSE
        SELECT EXISTS(
            SELECT 1 FROM public.product_variants 
            WHERE product_id = NEW.product_id AND is_active = TRUE
        ) INTO variant_exists;
        
        UPDATE public.products 
        SET has_variants = variant_exists 
        WHERE id = NEW.product_id;
    END IF;
    
    RETURN NULL; -- Result is ignored for AFTER triggers
END;
$$;

DROP TRIGGER IF EXISTS sync_product_has_variants ON public.product_variants;
CREATE TRIGGER sync_product_has_variants
    AFTER INSERT OR UPDATE OR DELETE ON public.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_product_has_variants();


-- ============================================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on product_variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Merchants can manage their own variants (via product ownership)
CREATE POLICY "Merchants can manage own variants"
ON public.product_variants
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.products p
        JOIN public.merchant_users mu ON mu.merchant_id = p.merchant_id
        WHERE p.id = product_variants.product_id
        AND mu.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.products p
        JOIN public.merchant_users mu ON mu.merchant_id = p.merchant_id
        WHERE p.id = product_variants.product_id
        AND mu.user_id = auth.uid()
    )
);

-- Public can view active variants for storefront
CREATE POLICY "Public can view active variants"
ON public.product_variants
FOR SELECT
TO anon
USING (is_active = TRUE);


-- Enable RLS on product_option_types
ALTER TABLE public.product_option_types ENABLE ROW LEVEL SECURITY;

-- Merchants can manage their own option types
CREATE POLICY "Merchants can manage own option types"
ON public.product_option_types
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.products p
        JOIN public.merchant_users mu ON mu.merchant_id = p.merchant_id
        WHERE p.id = product_option_types.product_id
        AND mu.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.products p
        JOIN public.merchant_users mu ON mu.merchant_id = p.merchant_id
        WHERE p.id = product_option_types.product_id
        AND mu.user_id = auth.uid()
    )
);

-- Public can view option types for storefront
CREATE POLICY "Public can view option types"
ON public.product_option_types
FOR SELECT
TO anon
USING (TRUE);


-- ============================================================================
-- 8. HELPER FUNCTION: GET VARIANT PRICE
-- ============================================================================
-- Returns the effective price for a variant (variant price or product fallback)

CREATE OR REPLACE FUNCTION get_variant_price(p_variant_id BIGINT)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    variant_price DECIMAL(10, 2);
    product_price DECIMAL(10, 2);
BEGIN
    SELECT v.price, p.price
    INTO variant_price, product_price
    FROM public.product_variants v
    JOIN public.products p ON p.id = v.product_id
    WHERE v.id = p_variant_id;
    
    -- Return variant price if set, otherwise product price
    RETURN COALESCE(variant_price, product_price);
END;
$$;

-- Grant execute to authenticated and anon
GRANT EXECUTE ON FUNCTION get_variant_price(BIGINT) TO authenticated, anon;


-- ============================================================================
-- 9. HELPER FUNCTION: CHECK VARIANT STOCK
-- ============================================================================
-- Returns TRUE if variant has stock available

CREATE OR REPLACE FUNCTION is_variant_in_stock(p_variant_id BIGINT, p_quantity INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    available_stock INTEGER;
BEGIN
    SELECT stock_quantity INTO available_stock
    FROM public.product_variants
    WHERE id = p_variant_id AND is_active = TRUE;
    
    IF available_stock IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN available_stock >= p_quantity;
END;
$$;

-- Grant execute to authenticated and anon
GRANT EXECUTE ON FUNCTION is_variant_in_stock(BIGINT, INTEGER) TO authenticated, anon;


-- ============================================================================
-- 10. FUNCTION: VALIDATE DUPLICATE VARIANT OPTIONS
-- ============================================================================
-- Prevents creating variants with duplicate option combinations

CREATE OR REPLACE FUNCTION validate_variant_options()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    existing_id BIGINT;
BEGIN
    -- Check for existing variant with same options
    SELECT id INTO existing_id
    FROM public.product_variants
    WHERE product_id = NEW.product_id
    AND option_values = NEW.option_values
    AND (TG_OP = 'INSERT' OR id != NEW.id)
    LIMIT 1;
    
    IF existing_id IS NOT NULL THEN
        RAISE EXCEPTION 'A variant with these option values already exists for this product. Variant ID: %', existing_id;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_unique_variant_options ON public.product_variants;
CREATE TRIGGER enforce_unique_variant_options
    BEFORE INSERT OR UPDATE ON public.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION validate_variant_options();


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 
-- Summary of what was created:
-- 
-- Tables:
--   - product_option_types: Stores option type names (Size, Color) per product
--   - product_variants: Stores variant data with option values as JSONB
-- 
-- Columns added to products:
--   - has_variants: Boolean flag for quick variant check
-- 
-- Constraints:
--   - Max 4 variants per product (enforced via trigger)
--   - Max 2 option types per product (enforced via trigger)
--   - Unique option combinations per product (enforced via UNIQUE + trigger)
-- 
-- Helper functions:
--   - get_variant_price(variant_id): Returns effective price
--   - is_variant_in_stock(variant_id, quantity): Checks stock availability
-- 
-- RLS Policies:
--   - Merchants can manage variants for their own products
--   - Public can view active variants
-- 
-- ============================================================================
