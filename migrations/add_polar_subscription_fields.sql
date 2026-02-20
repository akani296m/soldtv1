-- Migration: Add Polar payment integration fields to merchants table
-- This enables tracking Polar subscription IDs and customer IDs

-- Add polar_customer_id column to store Polar's customer reference
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS polar_customer_id VARCHAR(255);

-- Add polar_subscription_id column to store the active subscription ID
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS polar_subscription_id VARCHAR(255);

-- Add polar_product_id column to store which product they're subscribed to
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS polar_product_id VARCHAR(255);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_merchants_polar_customer_id 
ON merchants(polar_customer_id);

CREATE INDEX IF NOT EXISTS idx_merchants_polar_subscription_id 
ON merchants(polar_subscription_id);

-- Add comment for documentation
COMMENT ON COLUMN merchants.polar_customer_id IS 'Polar payment platform customer ID';
COMMENT ON COLUMN merchants.polar_subscription_id IS 'Polar active subscription ID';
COMMENT ON COLUMN merchants.polar_product_id IS 'Polar product/plan ID the merchant is subscribed to';
