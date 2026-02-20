-- Add Yoco Secret Key to Merchants Table
-- This allows each merchant to configure their own Yoco payment gateway
-- Note: Yoco Checkout API requires a secret key for server-side API calls

-- Add the column to store Yoco secret key
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS yoco_secret_key TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN merchants.yoco_secret_key IS 'Yoco secret API key (sk_test_xxx or sk_live_xxx) for creating checkout sessions server-side';

-- Optional: Add a check constraint to ensure only secret keys are stored
-- Note: Run this only if the constraint doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'yoco_key_format'
    ) THEN
        ALTER TABLE merchants
        ADD CONSTRAINT yoco_key_format CHECK (
            yoco_secret_key IS NULL OR 
            yoco_secret_key LIKE 'sk_%'
        );
    END IF;
END $$;

-- Also add a column to track which payment gateway is the primary/active one
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS active_payment_gateway TEXT DEFAULT 'paystack';

COMMENT ON COLUMN merchants.active_payment_gateway IS 'The currently active payment gateway (paystack, yoco, payfast, etc.)';
