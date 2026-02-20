-- ============================================================================
-- OMNISEND HARDENING MIGRATION
-- - Rename plaintext key column to api_key
-- - Add last_error_at
-- - Add server dedupe table
-- - Add cleanup function for dedupe TTL
-- ============================================================================

-- 1) integrations_omnisend column hardening
ALTER TABLE public.integrations_omnisend
ADD COLUMN IF NOT EXISTS api_key text NULL;

ALTER TABLE public.integrations_omnisend
ADD COLUMN IF NOT EXISTS last_error_at timestamptz NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'integrations_omnisend'
      AND column_name = 'api_key_enc'
  ) THEN
    EXECUTE '
      UPDATE public.integrations_omnisend
      SET api_key = COALESCE(api_key, api_key_enc)
      WHERE api_key IS NULL
        AND api_key_enc IS NOT NULL
    ';

    EXECUTE '
      ALTER TABLE public.integrations_omnisend
      DROP COLUMN api_key_enc
    ';
  END IF;
END $$;

-- 2) dedupe table for idempotency
CREATE TABLE IF NOT EXISTS public.integrations_omnisend_dedupe (
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  event_id text NOT NULL,
  event_name text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (merchant_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_integrations_omnisend_dedupe_created_at
ON public.integrations_omnisend_dedupe(created_at DESC);

-- 3) dedupe cleanup helper (invoke from cron/job)
CREATE OR REPLACE FUNCTION public.cleanup_integrations_omnisend_dedupe(retention_days integer DEFAULT 30)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count bigint;
BEGIN
  DELETE FROM public.integrations_omnisend_dedupe
  WHERE created_at < now() - make_interval(days => retention_days);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_integrations_omnisend_dedupe(integer) IS
'Deletes old Omnisend dedupe keys; call from scheduled job (recommended daily).';

-- 4) RLS for dedupe
ALTER TABLE public.integrations_omnisend_dedupe ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can read own omnisend dedupe" ON public.integrations_omnisend_dedupe;

CREATE POLICY "Merchants can read own omnisend dedupe"
ON public.integrations_omnisend_dedupe
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.merchant_users mu
    WHERE mu.merchant_id = integrations_omnisend_dedupe.merchant_id
      AND mu.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.merchants m
    WHERE m.id = integrations_omnisend_dedupe.merchant_id
      AND m.owner_id = auth.uid()
  )
);

-- Intentionally no INSERT/UPDATE/DELETE policies:
-- only service-role writes dedupe keys from server proxy.
