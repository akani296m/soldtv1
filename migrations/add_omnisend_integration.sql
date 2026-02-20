-- ============================================================================
-- ADD OMNISEND INTEGRATION TABLES (MULTI-TENANT)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.integrations_omnisend (
  merchant_id uuid PRIMARY KEY REFERENCES public.merchants(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'disabled' CHECK (status IN ('connected', 'error', 'disabled')),
  auth_type text NOT NULL DEFAULT 'api_key' CHECK (auth_type IN ('oauth', 'api_key')),
  access_token_enc text NULL,
  refresh_token_enc text NULL,
  token_expires_at timestamptz NULL,
  api_key text NULL,
  scopes text[] NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_event_at timestamptz NULL,
  last_error text NULL,
  last_error_at timestamptz NULL
);

CREATE TABLE IF NOT EXISTS public.integrations_omnisend_logs (
  id bigserial PRIMARY KEY,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  direction text NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound')),
  kind text NOT NULL CHECK (kind IN ('event', 'contact', 'product', 'order')),
  name text NULL,
  status_code int NULL,
  request jsonb NULL,
  response jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_integrations_omnisend_logs_merchant_created
ON public.integrations_omnisend_logs(merchant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integrations_omnisend_logs_kind
ON public.integrations_omnisend_logs(kind);

CREATE OR REPLACE FUNCTION public.update_integrations_omnisend_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_integrations_omnisend_updated_at ON public.integrations_omnisend;
CREATE TRIGGER trg_integrations_omnisend_updated_at
BEFORE UPDATE ON public.integrations_omnisend
FOR EACH ROW
EXECUTE FUNCTION public.update_integrations_omnisend_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE public.integrations_omnisend ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations_omnisend_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can read own omnisend integration" ON public.integrations_omnisend;
DROP POLICY IF EXISTS "Merchants can insert own omnisend integration" ON public.integrations_omnisend;
DROP POLICY IF EXISTS "Merchants can update own omnisend integration" ON public.integrations_omnisend;
DROP POLICY IF EXISTS "Merchants can delete own omnisend integration" ON public.integrations_omnisend;

CREATE POLICY "Merchants can read own omnisend integration"
ON public.integrations_omnisend
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.merchant_users mu
    WHERE mu.merchant_id = integrations_omnisend.merchant_id
      AND mu.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.merchants m
    WHERE m.id = integrations_omnisend.merchant_id
      AND m.owner_id = auth.uid()
  )
);

CREATE POLICY "Merchants can insert own omnisend integration"
ON public.integrations_omnisend
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.merchant_users mu
    WHERE mu.merchant_id = integrations_omnisend.merchant_id
      AND mu.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.merchants m
    WHERE m.id = integrations_omnisend.merchant_id
      AND m.owner_id = auth.uid()
  )
);

CREATE POLICY "Merchants can update own omnisend integration"
ON public.integrations_omnisend
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.merchant_users mu
    WHERE mu.merchant_id = integrations_omnisend.merchant_id
      AND mu.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.merchants m
    WHERE m.id = integrations_omnisend.merchant_id
      AND m.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.merchant_users mu
    WHERE mu.merchant_id = integrations_omnisend.merchant_id
      AND mu.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.merchants m
    WHERE m.id = integrations_omnisend.merchant_id
      AND m.owner_id = auth.uid()
  )
);

CREATE POLICY "Merchants can delete own omnisend integration"
ON public.integrations_omnisend
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.merchant_users mu
    WHERE mu.merchant_id = integrations_omnisend.merchant_id
      AND mu.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.merchants m
    WHERE m.id = integrations_omnisend.merchant_id
      AND m.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Merchants can read own omnisend logs" ON public.integrations_omnisend_logs;

CREATE POLICY "Merchants can read own omnisend logs"
ON public.integrations_omnisend_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.merchant_users mu
    WHERE mu.merchant_id = integrations_omnisend_logs.merchant_id
      AND mu.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.merchants m
    WHERE m.id = integrations_omnisend_logs.merchant_id
      AND m.owner_id = auth.uid()
  )
);
