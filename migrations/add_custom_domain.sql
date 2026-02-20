-- Migration: Add custom_domain column to merchants table
-- This enables merchants to configure their own custom domains for storefronts

-- Add the custom_domain column
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

-- Add index for fast domain lookups
CREATE INDEX IF NOT EXISTS idx_merchants_custom_domain 
ON merchants(custom_domain);

-- Add comment to document the column
COMMENT ON COLUMN merchants.custom_domain IS 
  'Custom domain for merchant storefront (e.g., shop.acme.com). Must be unique across all merchants.';

-- Optional: Add domain_verified column for domain verification status
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN merchants.custom_domain_verified IS 
  'Indicates whether the custom domain DNS configuration has been verified';

-- Optional: Add domain_configured_at timestamp
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS custom_domain_configured_at TIMESTAMPTZ;

COMMENT ON COLUMN merchants.custom_domain_configured_at IS 
  'Timestamp when the custom domain was first configured';
