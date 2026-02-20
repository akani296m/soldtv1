-- Add columns to merchants table for storing page content
-- Run this in your Supabase SQL Editor

-- Add page content columns
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS shipping_policy TEXT,
ADD COLUMN IF NOT EXISTS privacy_policy TEXT,
ADD COLUMN IF NOT EXISTS about_us TEXT;

-- Optional: Add indexes for better performance if these columns are frequently queried
-- CREATE INDEX IF NOT EXISTS idx_merchants_shipping_policy ON merchants(shipping_policy);
-- CREATE INDEX IF NOT EXISTS idx_merchants_privacy_policy ON merchants(privacy_policy);
-- CREATE INDEX IF NOT EXISTS idx_merchants_about_us ON merchants(about_us);
