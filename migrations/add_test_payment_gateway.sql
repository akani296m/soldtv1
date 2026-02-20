-- Migration: Add Test Payment Gateway field to merchants table
-- This allows merchants to enable a test/bogus payment gateway for testing purposes

ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS test_gateway_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN merchants.test_gateway_enabled IS 'Whether the test/bogus payment gateway is enabled for testing purposes. Card number 1 = success, 2 = failure';
