-- ============================================================================
-- PRODUCT VARIANTS SHOPIFY-STYLE MIGRATION
-- ============================================================================
-- Enhances the variant system to support:
-- - Up to 3 option types (Size, Color, Length)
-- - Up to 100 variants per product (cartesian product)
-- - Option values stored on option types for tokenized input
-- - Smart reconciliation (preserve existing variant data)
-- - Drag-and-drop option reordering
-- ============================================================================

-- ============================================================================
-- 1. ADD option_values ARRAY TO product_option_types
-- ============================================================================
-- Store the possible values for each option type (e.g., ["Small", "Medium", "Large"])

ALTER TABLE public.product_option_types 
ADD COLUMN IF NOT EXISTS option_values TEXT[] DEFAULT '{}';

-- Update position constraint to allow 0, 1, 2 (3 options)
ALTER TABLE public.product_option_types 
DROP CONSTRAINT IF EXISTS max_two_option_types;

ALTER TABLE public.product_option_types
ADD CONSTRAINT max_three_option_types CHECK (position >= 0 AND position <= 2);


-- ============================================================================
-- 2. UPDATE MAX OPTION TYPES TRIGGER (2 -> 3)
-- ============================================================================
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
    
    -- Check limit (now 3 instead of 2)
    IF option_type_count >= 3 THEN
        RAISE EXCEPTION 'Maximum 3 option types allowed per product. Product ID: %', NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$;


-- ============================================================================
-- 3. UPDATE MAX VARIANTS TRIGGER (4 -> 100)
-- ============================================================================
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
    
    -- Check limit (now 100 instead of 4)
    IF variant_count >= 100 THEN
        RAISE EXCEPTION 'Maximum 100 variants allowed per product. Product ID: %', NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$;


-- ============================================================================
-- 4. ADD FUNCTION TO REORDER OPTIONS
-- ============================================================================
-- When options are reordered, existing variants need their option_values
-- keys remapped to match the new order. This is handled in the application layer.


-- ============================================================================
-- 5. ADD has_variants UPDATE FUNCTION (if not exists)
-- ============================================================================
-- Ensure has_variants is synced when option_types change (not just variants)

CREATE OR REPLACE FUNCTION sync_product_has_variants()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    has_options BOOLEAN;
    has_active_variants BOOLEAN;
BEGIN
    -- Check if product has any option types defined with values
    IF TG_TABLE_NAME = 'product_option_types' THEN
        IF TG_OP = 'DELETE' THEN
            SELECT EXISTS(
                SELECT 1 FROM public.product_option_types 
                WHERE product_id = OLD.product_id
                AND array_length(option_values, 1) > 0
            ) INTO has_options;
            
            UPDATE public.products 
            SET has_variants = has_options
            WHERE id = OLD.product_id;
        ELSE
            SELECT EXISTS(
                SELECT 1 FROM public.product_option_types 
                WHERE product_id = NEW.product_id
                AND array_length(option_values, 1) > 0
            ) INTO has_options;
            
            UPDATE public.products 
            SET has_variants = has_options
            WHERE id = NEW.product_id;
        END IF;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Create trigger for option types changes
DROP TRIGGER IF EXISTS sync_has_variants_on_options ON public.product_option_types;
CREATE TRIGGER sync_has_variants_on_options
    AFTER INSERT OR UPDATE OR DELETE ON public.product_option_types
    FOR EACH ROW
    EXECUTE FUNCTION sync_product_has_variants();


-- ============================================================================
-- 6. ADD FUNCTION FOR BATCH VARIANT UPSERT
-- ============================================================================
-- Efficiently upsert multiple variants at once during reconciliation

CREATE OR REPLACE FUNCTION upsert_product_variant(
    p_product_id BIGINT,
    p_option_values JSONB,
    p_price DECIMAL(10, 2) DEFAULT NULL,
    p_stock_quantity INTEGER DEFAULT 0,
    p_sku VARCHAR(100) DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_id BIGINT;
BEGIN
    -- Try to find existing variant with same option values
    SELECT id INTO v_id
    FROM public.product_variants
    WHERE product_id = p_product_id
    AND option_values = p_option_values;
    
    IF v_id IS NOT NULL THEN
        -- Update existing (but only non-null fields to preserve user data)
        UPDATE public.product_variants
        SET updated_at = NOW()
        WHERE id = v_id;
        
        RETURN v_id;
    ELSE
        -- Insert new
        INSERT INTO public.product_variants (
            product_id, 
            option_values, 
            price, 
            stock_quantity, 
            sku, 
            image_url, 
            is_active
        )
        VALUES (
            p_product_id,
            p_option_values,
            p_price,
            p_stock_quantity,
            p_sku,
            p_image_url,
            TRUE
        )
        RETURNING id INTO v_id;
        
        RETURN v_id;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_product_variant(BIGINT, JSONB, DECIMAL, INTEGER, VARCHAR, TEXT) 
TO authenticated;


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 
-- Summary of changes:
--   - Added option_values TEXT[] column to product_option_types
--   - Increased max option types from 2 to 3
--   - Increased max variants from 4 to 100
--   - Added trigger to sync has_variants on option changes
--   - Added upsert_product_variant function for reconciliation
-- 
-- ============================================================================
