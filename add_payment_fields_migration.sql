-- Add Payment Fields to Orders Table
-- This tracks Paystack payment references and payment methods

-- Add payment reference column (stores Paystack transaction reference)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- Add payment method column (e.g., 'paystack', 'stripe', etc.)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Add comment to document the columns
COMMENT ON COLUMN orders.payment_reference IS 'Payment gateway transaction reference (e.g., Paystack reference)';
COMMENT ON COLUMN orders.payment_method IS 'Payment method used (e.g., paystack, stripe, cash_on_delivery)';

-- Optional: Create index for faster lookups by payment reference
CREATE INDEX IF NOT EXISTS orders_payment_reference_idx ON orders(payment_reference);
