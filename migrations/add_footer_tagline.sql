-- Migration: Add footer_tagline column to merchants table
-- This allows merchants to customize the tagline shown in their storefront footer

-- Add the footer_tagline column
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS footer_tagline TEXT DEFAULT 'Redefining modern commerce.';

-- Add a comment for documentation
COMMENT ON COLUMN merchants.footer_tagline IS 'Custom tagline text displayed in the storefront footer';
