-- Migration: Add favicon_url column to merchants table
-- This allows each merchant to have their own custom favicon for their storefront

-- Add favicon_url column to merchants table
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN merchants.favicon_url IS 'URL of the merchant custom favicon image for their storefront';
