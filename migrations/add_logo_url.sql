-- Migration: Add logo_url column to merchants table
-- This allows merchants to upload their store logo

-- Add logo_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'merchants' 
        AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE merchants 
        ADD COLUMN logo_url TEXT;
        
        COMMENT ON COLUMN merchants.logo_url IS 'URL of the merchant store logo image';
    END IF;
END $$;
