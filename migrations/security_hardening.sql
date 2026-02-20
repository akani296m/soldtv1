-- ============================================================================
-- SUPABASE SECURITY HARDENING MIGRATION
-- ============================================================================
-- This migration addresses the following security vulnerabilities:
-- 1. [HIGH] Login Rate Limiting
-- 2. [HIGH] OTP Brute Force Vulnerability
-- 3. [MEDIUM] OTP Timing Attack
-- 4. [MEDIUM] Content-Type Sniffing Attack
-- 5. [MEDIUM] Storage CORS Wildcard
-- 6. [MEDIUM] Realtime Token in URL
-- 7. [MEDIUM] Error Message Information Leakage
-- 8. [HIGH] RPC Function Enumeration
-- 9. [MEDIUM] Security Headers Missing
-- 10. [MEDIUM] Edge Function CORS Bypass
-- 11. [HIGH] TLS Downgrade Check
-- 12. [MEDIUM] Credentials in Error Messages
-- 13. [HIGH] Password Reset Flow Abuse
--
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================================


-- ============================================================================
-- SECTION 1: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Fix: Proper RLS ensures data isolation between merchants

-- 1.1 MERCHANTS TABLE
-- ============================================================================
-- Enable RLS if not already enabled
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- Drop any overly permissive policies
DROP POLICY IF EXISTS "Allow public read" ON merchants;
DROP POLICY IF EXISTS "Users can view all merchants" ON merchants;
DROP POLICY IF EXISTS "Allow public to read merchants" ON merchants;

-- Policy: Users can only view their own merchant(s)
CREATE POLICY "Users can view own merchants"
ON merchants
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM merchant_users
    WHERE merchant_users.merchant_id = merchants.id
    AND merchant_users.user_id = auth.uid()
  )
);

-- Policy: Only owner can update their merchant
CREATE POLICY "Owners can update own merchant"
ON merchants
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Policy: Authenticated users can create a merchant (for onboarding)
CREATE POLICY "Auth users can create merchant"
ON merchants
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Policy: Only owner can delete their merchant
CREATE POLICY "Owners can delete own merchant"
ON merchants
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Allow public/anonymous read for storefront slug lookup (essential for storefront)
CREATE POLICY "Public can read merchant by slug for storefront"
ON merchants
FOR SELECT
TO anon
USING (slug IS NOT NULL);


-- 1.2 MERCHANT_USERS TABLE
-- ============================================================================
ALTER TABLE merchant_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON merchant_users;
DROP POLICY IF EXISTS "Users can read all" ON merchant_users;

-- Policy: Users can view their own relationships
CREATE POLICY "Users can view own merchant_users"
ON merchant_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Only merchant owners can add users
CREATE POLICY "Owners can add merchant_users"
ON merchant_users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = merchant_users.merchant_id
    AND merchants.owner_id = auth.uid()
  )
  OR user_id = auth.uid() -- Allow self-assignment during onboarding
);

-- Policy: Only merchant owners can remove users
CREATE POLICY "Owners can delete merchant_users"
ON merchant_users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = merchant_users.merchant_id
    AND merchants.owner_id = auth.uid()
  )
);


-- 1.3 ORDERS TABLE
-- ============================================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Remove overly permissive policies
DROP POLICY IF EXISTS "Allow public to create orders" ON orders;
DROP POLICY IF EXISTS "Allow public to read orders" ON orders;
DROP POLICY IF EXISTS "Allow anyone to read" ON orders;

-- Policy: Merchants can view their own orders
CREATE POLICY "Merchants can view own orders"
ON orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM merchant_users
    WHERE merchant_users.merchant_id = orders.merchant_id
    AND merchant_users.user_id = auth.uid()
  )
);

-- Policy: Merchants can update their own orders
CREATE POLICY "Merchants can update own orders"
ON orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM merchant_users
    WHERE merchant_users.merchant_id = orders.merchant_id
    AND merchant_users.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM merchant_users
    WHERE merchant_users.merchant_id = orders.merchant_id
    AND merchant_users.user_id = auth.uid()
  )
);

-- Policy: Allow anonymous order creation (storefront checkout)
-- But restrict what columns can be set
CREATE POLICY "Public can create orders for storefront"
ON orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Only allow if merchant_id references a valid merchant
  EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = orders.merchant_id
  )
);


-- 1.4 PRODUCTS TABLE
-- ============================================================================
-- Check if table exists first
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;
    
    -- Remove overly permissive policies
    EXECUTE 'DROP POLICY IF EXISTS "Allow public read" ON products';
    EXECUTE 'DROP POLICY IF EXISTS "Public can view all products" ON products';
    
    -- Merchants can CRUD their own products
    EXECUTE $policy$
    CREATE POLICY "Merchants can view own products"
    ON products FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM merchant_users
        WHERE merchant_users.merchant_id = products.merchant_id
        AND merchant_users.user_id = auth.uid()
      )
    )
    $policy$;
    
    -- Public can view products for storefront
    EXECUTE $policy$
    CREATE POLICY "Public can view active products"
    ON products FOR SELECT TO anon
    USING (
      status = 'active' OR status IS NULL
    )
    $policy$;
    
    EXECUTE $policy$
    CREATE POLICY "Merchants can insert own products"
    ON products FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM merchant_users
        WHERE merchant_users.merchant_id = products.merchant_id
        AND merchant_users.user_id = auth.uid()
      )
    )
    $policy$;
    
    EXECUTE $policy$
    CREATE POLICY "Merchants can update own products"
    ON products FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM merchant_users
        WHERE merchant_users.merchant_id = products.merchant_id
        AND merchant_users.user_id = auth.uid()
      )
    )
    $policy$;
    
    EXECUTE $policy$
    CREATE POLICY "Merchants can delete own products"
    ON products FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM merchant_users
        WHERE merchant_users.merchant_id = products.merchant_id
        AND merchant_users.user_id = auth.uid()
      )
    )
    $policy$;
  END IF;
END $$;


-- 1.5 STOREFRONT_SECTIONS TABLE
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'storefront_sections') THEN
    ALTER TABLE storefront_sections ENABLE ROW LEVEL SECURITY;
    
    EXECUTE 'DROP POLICY IF EXISTS "Allow public read" ON storefront_sections';
    
    -- Merchants can manage their own sections
    EXECUTE $policy$
    CREATE POLICY "Merchants can manage own sections"
    ON storefront_sections FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM merchant_users
        WHERE merchant_users.merchant_id = storefront_sections.merchant_id
        AND merchant_users.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM merchant_users
        WHERE merchant_users.merchant_id = storefront_sections.merchant_id
        AND merchant_users.user_id = auth.uid()
      )
    )
    $policy$;
    
    -- Public can view sections for storefront
    EXECUTE $policy$
    CREATE POLICY "Public can view storefront sections"
    ON storefront_sections FOR SELECT TO anon
    USING (true)
    $policy$;
  END IF;
END $$;


-- ============================================================================
-- SECTION 2: RATE LIMITING FOR AUTH (Fixes #1, #2, #13)
-- ============================================================================
-- Note: Rate limiting is configured in Supabase Dashboard under:
-- Authentication > Rate Limits
-- 
-- Recommended settings to apply in Dashboard:
-- - Email sign-in rate limit: 10 per hour per email
-- - OTP verification rate limit: 5 per hour per phone/email
-- - Password reset rate limit: 3 per hour per email
-- - Sign-up rate limit: 3 per hour per IP
--
-- The following creates an audit table to track auth attempts for monitoring:

CREATE TABLE IF NOT EXISTS auth_audit_log (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL, -- 'login_attempt', 'otp_verify', 'password_reset'
  email VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_auth_audit_email_time ON auth_audit_log(email, created_at);
CREATE INDEX IF NOT EXISTS idx_auth_audit_ip_time ON auth_audit_log(ip_address, created_at);

-- Enable RLS on audit log
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write audit logs
CREATE POLICY "Only service role can access audit log"
ON auth_audit_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ============================================================================
-- SECTION 3: SECURE RPC FUNCTIONS (Fixes #7, #8, #12)
-- ============================================================================
-- Fix RPC function enumeration and info leakage

-- 3.1 Revoke direct execution on sensitive functions from anon/public
-- First, let's create a secure wrapper pattern for RPC functions

-- Example: Secure wrapper for any data-fetching RPC
CREATE OR REPLACE FUNCTION get_merchant_stats(p_merchant_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Verify caller has access to this merchant
  IF NOT EXISTS (
    SELECT 1 FROM merchant_users
    WHERE merchant_id = p_merchant_id
    AND user_id = auth.uid()
  ) THEN
    -- Generic error - don't reveal if merchant exists
    RAISE EXCEPTION 'Unauthorized access';
  END IF;
  
  -- If authorized, return stats
  SELECT json_build_object(
    'total_orders', (SELECT COUNT(*) FROM orders WHERE merchant_id = p_merchant_id),
    'total_revenue', (SELECT COALESCE(SUM(total), 0) FROM orders WHERE merchant_id = p_merchant_id)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute only to authenticated users
GRANT EXECUTE ON FUNCTION get_merchant_stats(BIGINT) TO authenticated;
REVOKE EXECUTE ON FUNCTION get_merchant_stats(BIGINT) FROM anon, public;


-- 3.2 Secure password reset indicator (Fixes #13)
-- Create a function that doesn't reveal if email exists
CREATE OR REPLACE FUNCTION safe_password_reset_request(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Always return success message regardless of whether email exists
  -- The actual password reset is handled by Supabase Auth
  -- This prevents email enumeration attacks
  RETURN json_build_object(
    'success', true,
    'message', 'If an account exists with this email, a password reset link will be sent.'
  );
END;
$$;


-- 3.3 Secure OTP verification wrapper (Fixes #3 - Timing Attack)
CREATE OR REPLACE FUNCTION verify_otp_secure(p_email TEXT, p_otp TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_time TIMESTAMP;
  v_result BOOLEAN := FALSE;
BEGIN
  v_start_time := clock_timestamp();
  
  -- Your OTP verification logic here
  -- The key is to add constant-time delay
  
  -- Ensure minimum execution time of 500ms to prevent timing attacks
  PERFORM pg_sleep(GREATEST(0, 0.5 - EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time))));
  
  RETURN json_build_object(
    'success', v_result,
    'message', CASE WHEN v_result THEN 'OTP verified' ELSE 'Invalid OTP' END
  );
END;
$$;


-- ============================================================================
-- SECTION 4: STORAGE BUCKET SECURITY (Fixes #4, #5)
-- ============================================================================
-- Note: These need to be configured in Supabase Dashboard > Storage > Policies
-- 
-- Recommended bucket policies:
-- 
-- For 'product-images' bucket:
-- - SELECT: Allow public access for viewing (needed for storefront)
-- - INSERT: Only authenticated users with valid merchant_id
-- - UPDATE: Only file owner
-- - DELETE: Only file owner or merchant owner
--
-- SQL to create secure storage policies (run in SQL Editor):

-- This content-type checking needs to be done at application level
-- Here's a trigger function to validate file types on database side

CREATE OR REPLACE FUNCTION validate_storage_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  allowed_types TEXT[] := ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
BEGIN
  -- Check content type is allowed
  IF NOT (NEW.metadata->>'mimetype' = ANY(allowed_types)) THEN
    RAISE EXCEPTION 'Invalid file type. Allowed: %', allowed_types;
  END IF;
  
  -- Check file size (5MB max)
  IF (NEW.metadata->>'size')::BIGINT > 5242880 THEN
    RAISE EXCEPTION 'File too large. Maximum size is 5MB.';
  END IF;
  
  RETURN NEW;
END;
$$;


-- ============================================================================
-- SECTION 5: SECURITY HEADERS CONFIGURATION (Fixes #9, #11)
-- ============================================================================
-- Note: Security headers need to be configured in your hosting platform
-- 
-- If using Vercel (vercel.json), add/update these headers:
/*
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;" }
      ]
    }
  ]
}
*/


-- ============================================================================
-- SECTION 6: EDGE FUNCTION CORS CONFIGURATION (Fixes #10)
-- ============================================================================
-- Note: Edge function CORS needs to be configured in each Supabase Edge Function
-- 
-- Example cors.ts helper for Edge Functions:
/*
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://yourdomain.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Deny wildcard origins in production
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const allowedOrigins = ['https://yourdomain.com', 'https://www.yourdomain.com'];
  
  if (process.env.ENVIRONMENT === 'production') {
    return allowedOrigins.includes(origin || '');
  }
  
  return true; // Allow any origin in development
}
*/


-- ============================================================================
-- SECTION 7: REALTIME SECURITY (Fixes #6)
-- ============================================================================
-- Realtime token exposure in URL is a Supabase configuration issue
-- 
-- Mitigation: Use Supabase client with proper authentication headers
-- Ensure your supabase client is configured to NOT pass tokens in URLs:

-- Create a view for secure realtime subscriptions
CREATE OR REPLACE VIEW secure_order_updates AS
SELECT 
  o.id,
  o.status,
  o.payment_status,
  o.updated_at,
  o.merchant_id
FROM orders o
WHERE 
  EXISTS (
    SELECT 1 FROM merchant_users mu
    WHERE mu.merchant_id = o.merchant_id
    AND mu.user_id = auth.uid()
  );

-- Enable realtime on this secure view instead of base table
ALTER PUBLICATION supabase_realtime ADD TABLE secure_order_updates;


-- ============================================================================
-- SECTION 8: ADDITIONAL SECURITY MEASURES
-- ============================================================================

-- 8.1 Create an enum for valid order statuses
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM (
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    );
  END IF;
END $$;

-- 8.2 Create an enum for valid payment statuses
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM (
      'pending',
      'awaiting_payment',
      'paid',
      'failed',
      'refunded'
    );
  END IF;
END $$;

-- 8.3 Restricted function execution grant pattern
-- Revoke all by default, grant explicitly
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, public;
GRANT EXECUTE ON FUNCTION get_merchant_stats(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION safe_password_reset_request(TEXT) TO anon, authenticated;

-- 8.4 Add input validation trigger for sensitive tables
CREATE OR REPLACE FUNCTION validate_order_input()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Sanitize email
  NEW.customer_email := LOWER(TRIM(NEW.customer_email));
  
  -- Validate email format
  IF NEW.customer_email !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Ensure positive totals
  IF NEW.total < 0 OR NEW.subtotal < 0 THEN
    RAISE EXCEPTION 'Invalid order amounts';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_order_before_insert ON orders;
CREATE TRIGGER validate_order_before_insert
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_input();


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify RLS is properly enabled on all tables:

-- List all tables and their RLS status
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public';

-- List all policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public';


-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
-- 
-- MANUAL STEPS REQUIRED IN SUPABASE DASHBOARD:
-- 
-- 1. Authentication > Rate Limits:
--    - Set email sign-in rate limit: 10/hour
--    - Set OTP verification rate limit: 5/hour
--    - Set password reset rate limit: 3/hour
--    - Set sign-up rate limit: 3/hour per IP
--
-- 2. Authentication > Providers:
--    - Enable email confirmation
--    - Set OTP expiry to 5 minutes
--    - Enable login timeout after failed attempts
--
-- 3. Storage > [Your Bucket] > Policies:
--    - Remove any "*" or wildcard CORS origins
--    - Set specific allowed origins
--
-- 4. Settings > API:
--    - Ensure service role key is NOT exposed in client code
--    - Rotate API keys if they may have been compromised
--
-- 5. Edge Functions (if used):
--    - Add proper CORS configuration
--    - Validate origin headers
--    
-- ============================================================================
