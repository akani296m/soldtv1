-- Add Manual EFT Banking Fields to Merchants Table
-- This allows merchants to accept manual EFT/bank transfer payments

-- Add bank name column
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS eft_bank_name TEXT;

-- Add account holder name column
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS eft_account_holder TEXT;

-- Add account number column
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS eft_account_number TEXT;

-- Add branch code column
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS eft_branch_code TEXT;

-- Add account type column (e.g., 'cheque', 'savings', 'transmission')
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS eft_account_type TEXT;

-- Add flag to enable/disable manual EFT payments
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS eft_enabled BOOLEAN DEFAULT FALSE;

-- Add comments to document the columns
COMMENT ON COLUMN merchants.eft_bank_name IS 'Bank name for manual EFT payments (e.g., Standard Bank, FNB)';
COMMENT ON COLUMN merchants.eft_account_holder IS 'Account holder name for manual EFT payments';
COMMENT ON COLUMN merchants.eft_account_number IS 'Bank account number for manual EFT payments';
COMMENT ON COLUMN merchants.eft_branch_code IS 'Bank branch code for manual EFT payments';
COMMENT ON COLUMN merchants.eft_account_type IS 'Type of bank account (cheque, savings, transmission)';
COMMENT ON COLUMN merchants.eft_enabled IS 'Whether manual EFT payments are enabled for this merchant';
