-- Migration: Add menu configuration column to merchants table
-- This enables merchants to customize their storefront header and footer navigation menus

-- Add menu_config JSONB column to store menu configuration
-- The JSON structure will be:
-- {
--   "header": [
--     { "id": "home", "label": "Home", "path": "/", "enabled": true, "order": 0 },
--     { "id": "products", "label": "Catalog", "path": "/products", "enabled": true, "order": 1 },
--     { "id": "about", "label": "About", "path": "/about", "enabled": false, "order": 2 },
--     ...
--   ],
--   "footer": [
--     { "id": "products", "label": "All Products", "section": "Shop", "path": "/products", "enabled": true, "order": 0 },
--     { "id": "shipping", "label": "Shipping Policy", "section": "Support", "path": "/shipping", "enabled": true, "order": 1 },
--     ...
--   ]
-- }

ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS menu_config JSONB DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN merchants.menu_config IS 
  'JSON configuration for storefront header and footer menus. Contains arrays of menu items with labels, paths, visibility, and order.';

-- Create a GIN index for JSONB queries (optional, for performance if needed)
CREATE INDEX IF NOT EXISTS idx_merchants_menu_config 
ON merchants USING GIN (menu_config);
