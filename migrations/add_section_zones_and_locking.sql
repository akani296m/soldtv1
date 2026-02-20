-- Add zone and lock metadata for storefront sections (non-breaking rollout)
ALTER TABLE storefront_sections
ADD COLUMN IF NOT EXISTS zone TEXT;

ALTER TABLE storefront_sections
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- Optimize zone-scoped reads and writes
CREATE INDEX IF NOT EXISTS idx_storefront_sections_zone_position
ON storefront_sections(merchant_id, page_type, zone, position);

-- Product rating summary for locked ProductCard rating row
ALTER TABLE products
ADD COLUMN IF NOT EXISTS rating_average NUMERIC(3,2);

ALTER TABLE products
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Protect locked sections at the DB layer
CREATE OR REPLACE FUNCTION enforce_locked_storefront_sections()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Service role can manage lock state and delete locked rows.
  IF auth.role() = 'service_role' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  -- Authenticated and anon clients cannot delete locked rows.
  IF TG_OP = 'DELETE' THEN
    IF OLD.is_locked THEN
      RAISE EXCEPTION 'Locked sections cannot be deleted';
    END IF;
    RETURN OLD;
  END IF;

  -- Authenticated and anon clients cannot change the lock state.
  IF TG_OP = 'UPDATE' THEN
    IF NEW.is_locked IS DISTINCT FROM OLD.is_locked THEN
      RAISE EXCEPTION 'is_locked cannot be modified by client role';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_locked_storefront_sections ON storefront_sections;

CREATE TRIGGER trg_enforce_locked_storefront_sections
BEFORE UPDATE OR DELETE ON storefront_sections
FOR EACH ROW
EXECUTE FUNCTION enforce_locked_storefront_sections();
