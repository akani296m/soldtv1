-- Migration to add font customization columns to merchants table
-- Run this in your Supabase SQL Editor

-- Add font columns for headings, body, and paragraphs
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS font_heading TEXT DEFAULT 'Poppins',
ADD COLUMN IF NOT EXISTS font_body TEXT DEFAULT 'Poppins',
ADD COLUMN IF NOT EXISTS font_paragraph TEXT DEFAULT 'Poppins';

-- Add font weight/style columns for more control
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS font_heading_weight TEXT DEFAULT '700',
ADD COLUMN IF NOT EXISTS font_body_weight TEXT DEFAULT '400',
ADD COLUMN IF NOT EXISTS font_paragraph_weight TEXT DEFAULT '400';

-- Add a comment for documentation
COMMENT ON COLUMN merchants.font_heading IS 'Font family for store headings (h1-h6)';
COMMENT ON COLUMN merchants.font_body IS 'Font family for general body text';
COMMENT ON COLUMN merchants.font_paragraph IS 'Font family for paragraphs (p tags)';
COMMENT ON COLUMN merchants.font_heading_weight IS 'Font weight for headings (100-900)';
COMMENT ON COLUMN merchants.font_body_weight IS 'Font weight for body text (100-900)';
COMMENT ON COLUMN merchants.font_paragraph_weight IS 'Font weight for paragraphs (100-900)';

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'merchants' 
AND column_name LIKE 'font%';
