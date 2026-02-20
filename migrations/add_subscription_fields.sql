-- Migration: Add subscription fields to merchants table
-- This enables tracking merchant subscription plans and statuses

-- Add subscription_plan column (e.g., 'trial', 'launch', 'growth', null for free tier)
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'trial';

-- Add subscription_status column (e.g., 'active', 'inactive', 'cancelled', 'trial')
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial';

-- Add subscription_started_at timestamp
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE;

-- Add subscription_expires_at timestamp (for trial periods or billing cycles)
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient subscription queries
CREATE INDEX IF NOT EXISTS idx_merchants_subscription_plan 
ON merchants(subscription_plan);

CREATE INDEX IF NOT EXISTS idx_merchants_subscription_status 
ON merchants(subscription_status);

-- Add comments to explain the columns
COMMENT ON COLUMN merchants.subscription_plan IS 
  'The subscription plan tier: trial, launch, growth, or null for free tier';

COMMENT ON COLUMN merchants.subscription_status IS 
  'The subscription status: active, inactive, cancelled, trial, or expired';

COMMENT ON COLUMN merchants.subscription_started_at IS 
  'Timestamp when the current subscription period started';

COMMENT ON COLUMN merchants.subscription_expires_at IS 
  'Timestamp when the subscription expires (for trials or billing cycles)';
