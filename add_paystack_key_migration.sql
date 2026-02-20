-- Add Paystack Public Key to Merchants Table
-- This allows each merchant to configure their own Paystack payment gateway

-- Add the updated_at column if it doesn't exist (required for update triggers)
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add the column to store Paystack public key
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS paystack_public_key TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN merchants.paystack_public_key IS 'Paystack public API key (pk_test_xxx or pk_live_xxx) for accepting payments on the storefront';

-- Optional: Add a check constraint to ensure only public keys are stored (not secret keys)
-- Note: Run this only if the constraint doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'paystack_key_format'
    ) THEN
        ALTER TABLE merchants
        ADD CONSTRAINT paystack_key_format CHECK (
            paystack_public_key IS NULL OR 
            paystack_public_key LIKE 'pk_%'
        );
    END IF;
END $$;
