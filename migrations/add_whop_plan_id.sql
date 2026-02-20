-- Migration: Add Whop Plan ID to merchants table
-- This allows merchants to configure Whop as a payment gateway

-- Add the whop_plan_id column to the merchants table
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS whop_plan_id TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN merchants.whop_plan_id IS 'Whop Plan ID for embedded checkout (e.g., plan_XXXXXXXXX)';

-- Optional: Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_merchants_whop_plan_id ON merchants(whop_plan_id) WHERE whop_plan_id IS NOT NULL;
