-- ============================================================================
-- ADD PRODUCT REVIEWS + AGGREGATES
-- Run in Supabase SQL Editor
-- ============================================================================

-- 1) Products aggregates (fast storefront rendering)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS rating_average numeric(3,2) NOT NULL DEFAULT 0;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0;

-- 2) Reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id bigserial PRIMARY KEY,
  product_id bigint NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL,
  reviewer_email text NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text NULL,
  body text NULL,
  photo_url text NULL,
  verified_purchase boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'manual',
  is_published boolean NOT NULL DEFAULT true,
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_published_date
ON public.product_reviews(product_id, is_published, reviewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_reviews_merchant_date
ON public.product_reviews(merchant_id, reviewed_at DESC);

-- 3) Triggers/functions

-- 3.1 Ensure merchant_id is correct + keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_product_review_merchant_and_timestamps()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_merchant_id uuid;
BEGIN
  SELECT p.merchant_id INTO v_merchant_id
  FROM public.products p
  WHERE p.id = NEW.product_id;

  IF v_merchant_id IS NULL THEN
    RAISE EXCEPTION 'Invalid product_id % (product not found or has no merchant_id)', NEW.product_id;
  END IF;

  NEW.merchant_id := v_merchant_id;
  NEW.updated_at := now();

  IF TG_OP = 'INSERT' THEN
    NEW.created_at := COALESCE(NEW.created_at, now());
  END IF;

  NEW.reviewed_at := COALESCE(NEW.reviewed_at, now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_reviews_set_merchant ON public.product_reviews;
CREATE TRIGGER trg_product_reviews_set_merchant
BEFORE INSERT OR UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.set_product_review_merchant_and_timestamps();

-- 3.2 Refresh aggregates (published reviews only)
CREATE OR REPLACE FUNCTION public.refresh_product_review_stats(p_product_id bigint)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_count integer;
  v_avg numeric(3,2);
BEGIN
  SELECT
    COUNT(*)::integer,
    COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0)::numeric(3,2)
  INTO v_count, v_avg
  FROM public.product_reviews r
  WHERE r.product_id = p_product_id
    AND r.is_published = true;

  UPDATE public.products
  SET rating_count = COALESCE(v_count, 0),
      rating_average = COALESCE(v_avg, 0)
  WHERE id = p_product_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_product_reviews_change_refresh_stats()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.refresh_product_review_stats(NEW.product_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_product_review_stats(OLD.product_id);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.product_id IS DISTINCT FROM OLD.product_id THEN
      PERFORM public.refresh_product_review_stats(OLD.product_id);
      PERFORM public.refresh_product_review_stats(NEW.product_id);
    ELSIF NEW.rating IS DISTINCT FROM OLD.rating OR NEW.is_published IS DISTINCT FROM OLD.is_published THEN
      PERFORM public.refresh_product_review_stats(NEW.product_id);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_reviews_refresh_stats ON public.product_reviews;
CREATE TRIGGER trg_product_reviews_refresh_stats
AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.on_product_reviews_change_refresh_stats();

-- 3.3 Backfill (safe if empty)
UPDATE public.products
SET rating_average = 0,
    rating_count = 0;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT product_id
    FROM public.product_reviews
  LOOP
    PERFORM public.refresh_product_review_stats(r.product_id);
  END LOOP;
END $$;

-- 4) RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Drop common policy names if they exist (safe re-run)
DROP POLICY IF EXISTS "Merchants can view own product reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Merchants can insert own product reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Merchants can update own product reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Merchants can delete own product reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Public can view published product reviews" ON public.product_reviews;

-- Authenticated: CRUD within merchant boundary
CREATE POLICY "Merchants can view own product reviews"
ON public.product_reviews
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.merchant_users mu
    WHERE mu.merchant_id = product_reviews.merchant_id
      AND mu.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.merchants m
    WHERE m.id = product_reviews.merchant_id
      AND m.owner_id = auth.uid()
  )
);

CREATE POLICY "Merchants can insert own product reviews"
ON public.product_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.products p
    JOIN public.merchant_users mu ON mu.merchant_id = p.merchant_id
    WHERE p.id = product_reviews.product_id
      AND mu.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.products p
    JOIN public.merchants m ON m.id = p.merchant_id
    WHERE p.id = product_reviews.product_id
      AND m.owner_id = auth.uid()
  )
);

CREATE POLICY "Merchants can update own product reviews"
ON public.product_reviews
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.merchant_users mu
    WHERE mu.merchant_id = product_reviews.merchant_id
      AND mu.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.merchants m
    WHERE m.id = product_reviews.merchant_id
      AND m.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.merchant_users mu
    WHERE mu.merchant_id = product_reviews.merchant_id
      AND mu.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.merchants m
    WHERE m.id = product_reviews.merchant_id
      AND m.owner_id = auth.uid()
  )
);

CREATE POLICY "Merchants can delete own product reviews"
ON public.product_reviews
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.merchant_users mu
    WHERE mu.merchant_id = product_reviews.merchant_id
      AND mu.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.merchants m
    WHERE m.id = product_reviews.merchant_id
      AND m.owner_id = auth.uid()
  )
);

-- Anon: published reviews for publicly-visible products
CREATE POLICY "Public can view published product reviews"
ON public.product_reviews
FOR SELECT
TO anon
USING (
  is_published = true
  AND EXISTS (
    SELECT 1
    FROM public.products p
    WHERE p.id = product_reviews.product_id
      AND (p.status = 'active' OR p.status IS NULL)
  )
);

