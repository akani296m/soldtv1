# Onboarding Setup - Database Requirements

## Required Tables & Columns

### 1. `merchants` table
The onboarding flow expects these columns:

```sql
-- Check your merchants table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'merchants';
```

**Required columns:**
- `id` (UUID, primary key)
- `store_name` (VARCHAR/TEXT)
- `business_name` (VARCHAR/TEXT, nullable)
- `slug` (VARCHAR/TEXT, unique)
- `owner_id` (UUID, references auth.users, nullable)
- `logo_url` (TEXT, nullable)
- `onboarding_data` (JSONB, nullable) - stores onboarding preferences
- `created_at` (TIMESTAMP)

**If missing columns, add them:**
```sql
-- Add owner_id if missing
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Add onboarding_data if missing
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS onboarding_data JSONB;

-- Ensure slug has unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS merchants_slug_unique ON merchants(slug);
```

### 2. `merchant_users` table
Already created ✅

### 3. `products` table
Ensure it has merchant_id:

```sql
-- Check if merchant_id exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'merchant_id';

-- Add if missing
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_products_merchant_id ON products(merchant_id);
```

---

## Row Level Security (RLS) Policies

### Merchants Table

```sql
-- Enable RLS
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own merchant
CREATE POLICY "Users can view own merchant" ON merchants
  FOR SELECT
  USING (
    id IN (
      SELECT merchant_id FROM merchant_users WHERE user_id = auth.uid()
    )
    OR owner_id = auth.uid()
  );

-- Allow authenticated users to INSERT (for onboarding)
CREATE POLICY "Authenticated users can create merchant" ON merchants
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Allow owners/admins to UPDATE their merchant
CREATE POLICY "Owners can update own merchant" ON merchants
  FOR UPDATE
  USING (
    id IN (
      SELECT merchant_id FROM merchant_users WHERE user_id = auth.uid()
    )
    OR owner_id = auth.uid()
  );
```

### Merchant_Users Table

```sql
-- Enable RLS
ALTER TABLE merchant_users ENABLE ROW LEVEL SECURITY;

-- Users can read their own associations
CREATE POLICY "Users can view own merchant associations" ON merchant_users
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow INSERT during onboarding (system operation)
CREATE POLICY "Allow merchant association creation" ON merchant_users
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
```

### Products Table

```sql
-- Users can only view products from their merchant
CREATE POLICY "Users view own merchant products" ON products
  FOR SELECT
  USING (
    merchant_id IN (
      SELECT merchant_id FROM merchant_users WHERE user_id = auth.uid()
    )
  );

-- Users can only create products for their merchant
CREATE POLICY "Users create own merchant products" ON products
  FOR INSERT
  WITH CHECK (
    merchant_id IN (
      SELECT merchant_id FROM merchant_users WHERE user_id = auth.uid()
    )
  );

-- Users can only update products from their merchant
CREATE POLICY "Users update own merchant products" ON products
  FOR UPDATE
  USING (
    merchant_id IN (
      SELECT merchant_id FROM merchant_users WHERE user_id = auth.uid()
    )
  );

-- Users can only delete products from their merchant
CREATE POLICY "Users delete own merchant products" ON products
  FOR DELETE
  USING (
    merchant_id IN (
      SELECT merchant_id FROM merchant_users WHERE user_id = auth.uid()
    )
  );
```

---

## Testing the Onboarding Flow

1. **Clear any existing test data** (optional):
```sql
-- Remove test merchant-user relationships
DELETE FROM merchant_users WHERE user_id = auth.uid();

-- Remove test merchants (if you created any manually)
DELETE FROM merchants WHERE owner_id = auth.uid();
```

2. **Test the flow**:
   - Log out of your app
   - Log back in
   - You should be redirected to `/onboarding`
   - Complete the onboarding form
   - After "Creating your store...", you'll be redirected to dashboard
   - Dashboard should now have your merchant data

3. **Verify in database**:
```sql
-- Check merchant was created
SELECT id, store_name, slug, owner_id
FROM merchants
WHERE owner_id = auth.uid();

-- Check merchant_users relationship was created
SELECT mu.*, m.store_name
FROM merchant_users mu
JOIN merchants m ON m.id = mu.merchant_id
WHERE mu.user_id = auth.uid();
```

---

## Troubleshooting

### Issue: "Failed to create merchant"
**Check:**
1. Merchants table exists and has correct columns
2. RLS policies allow INSERT for authenticated users
3. No unique constraint violations on `slug`

### Issue: "User has no merchant association"
**Check:**
1. merchant_users record was created
2. RLS policy allows reading from merchant_users

### Issue: Products not showing
**Check:**
1. Products table has `merchant_id` column
2. Products have the correct merchant_id value
3. RLS policies allow SELECT on products

---

## Quick Setup Script (Run in Supabase SQL Editor)

```sql
-- 1. Ensure merchants table has required columns
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS onboarding_data JSONB;
CREATE UNIQUE INDEX IF NOT EXISTS merchants_slug_unique ON merchants(slug);

-- 2. Ensure products table has merchant_id
ALTER TABLE products ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id);
CREATE INDEX IF NOT EXISTS idx_products_merchant_id ON products(merchant_id);

-- 3. Enable RLS on merchants
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- 4. Create merchant policies
CREATE POLICY "Users can view own merchant" ON merchants
  FOR SELECT USING (
    id IN (SELECT merchant_id FROM merchant_users WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );

CREATE POLICY "Authenticated users can create merchant" ON merchants
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own merchant" ON merchants
  FOR UPDATE USING (
    id IN (SELECT merchant_id FROM merchant_users WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );

-- 5. Create merchant_users policies
CREATE POLICY "Users can view own merchant associations" ON merchant_users
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Allow merchant association creation" ON merchant_users
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Done! Test the onboarding flow now.
```
