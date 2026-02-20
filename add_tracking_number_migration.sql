-- Add Tracking Number Field to Orders Table
-- This allows merchants to add shipment tracking numbers to orders

-- Add tracking number column
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tracking_number TEXT;

-- Add tracking carrier column (e.g., 'The Courier Guy', 'DHL', 'Aramex', etc.)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tracking_carrier TEXT;

-- Add tracking URL column (optional - for direct tracking links)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tracking_url TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN orders.tracking_number IS 'Shipment tracking number provided by the carrier';
COMMENT ON COLUMN orders.tracking_carrier IS 'Shipping carrier name (e.g., The Courier Guy, DHL, Aramex)';
COMMENT ON COLUMN orders.tracking_url IS 'Direct URL to track the shipment';
