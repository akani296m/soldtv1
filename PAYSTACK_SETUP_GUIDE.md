# Paystack Payment Gateway Setup Guide

## ✅ What Was Done

### 1. **Updated Finance Settings Page** (`src/pages/settings/Finance.jsx`)
- ✅ Added Paystack configuration section with public key input
- ✅ Added show/hide toggle for the API key
- ✅ Integrated with `useAdminMerchant` context to load/save merchant data
- ✅ Added save functionality to update the `merchants` table
- ✅ Added visual feedback (success/error states)
- ✅ Added "Connected" badge when Paystack is configured
- ✅ Added security warnings about using only public keys
- ✅ Added direct link to Paystack dashboard for getting API keys

### 2. **Created Database Migration** (`add_paystack_key_migration.sql`)
- ✅ Adds `paystack_public_key` column to `merchants` table
- ✅ Includes validation constraint to ensure only public keys (starting with `pk_`) are stored
- ✅ Prevents accidental storage of secret keys

---

## 🚀 Setup Instructions

### Step 1: Run the Database Migration

Execute the SQL migration in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `add_paystack_key_migration.sql`
4. Run the query

**Or run it directly:**

```sql
-- Add Paystack Public Key to Merchants Table
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS paystack_public_key TEXT;

COMMENT ON COLUMN merchants.paystack_public_key IS 'Paystack public API key (pk_test_xxx or pk_live_xxx) for accepting payments on the storefront';

ALTER TABLE merchants
ADD CONSTRAINT paystack_key_format CHECK (
    paystack_public_key IS NULL OR 
    paystack_public_key LIKE 'pk_%'
);
```

### Step 2: Get Your Paystack Public Key

1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Sign up or log in
3. Navigate to **Settings → API Keys & Webhooks**
4. Copy your **Public Key** (starts with `pk_test_` for test mode or `pk_live_` for live mode)

⚠️ **Important:** Never use your Secret Key in the frontend!

### Step 3: Configure Paystack in Your App

1. Navigate to **Settings → Finance** in your admin dashboard
2. Scroll to the **Payment Gateway** section
3. Paste your Paystack Public Key in the input field
4. Click **Save Configuration**
5. You should see a "Connected" badge appear

---

## 🔍 How It Works

### Data Flow

```
Finance Settings Page
    ↓
useAdminMerchant Context (gets current merchant)
    ↓
User enters Paystack Public Key
    ↓
Save button → Updates merchants.paystack_public_key
    ↓
Merchant data refreshed via refetch()
    ↓
"Connected" badge appears
```

### Security Features

1. **Public Key Only**: The database constraint ensures only keys starting with `pk_` can be stored
2. **Password Field**: The key is hidden by default (can be toggled with eye icon)
3. **Per-Merchant Keys**: Each merchant has their own Paystack account/key
4. **No Secret Keys**: Frontend never touches secret keys

---

## 📝 Next Steps

Now that merchants can configure their Paystack keys, you can:

1. **Install react-paystack**:
   ```bash
   npm install react-paystack
   ```

2. **Update Checkout.jsx** to use the Paystack popup:
   - Fetch merchant's `paystack_public_key` from the merchant context
   - Replace fake card fields with Paystack payment button
   - Only create order in Supabase after successful payment

3. **Add webhook handling** (optional, for production):
   - Set up Paystack webhooks to verify payments
   - Update order status based on webhook events

---

## 🧪 Testing

### Test the Settings Page

1. Login to your admin dashboard
2. Go to **Settings → Finance**
3. Enter a test public key: `pk_test_1234567890abcdef`
4. Click **Save Configuration**
5. Verify:
   - Success message appears
   - "Connected" badge shows up
   - Page refresh still shows the key

### Verify in Database

```sql
-- Check that the key was saved
SELECT id, store_name, paystack_public_key
FROM merchants
WHERE id = 'your-merchant-id';
```

### Test Validation

Try entering an invalid key (not starting with `pk_`):
```sql
-- This should fail with constraint violation
UPDATE merchants 
SET paystack_public_key = 'invalid_key'
WHERE id = 'your-merchant-id';
```

---

## 🎨 UI Features

### Visual Indicators

- **Connected Badge**: Green badge appears when a key is configured
- **Eye Toggle**: Show/hide the API key for security
- **Loading State**: Spinner appears while saving
- **Success Feedback**: Green checkmark with "Saved successfully!" message
- **Error Feedback**: Red alert icon with "Failed to save" message

### User Experience

- Auto-loads existing key when page loads
- Success message auto-dismisses after 3 seconds
- Direct link to Paystack dashboard for easy access
- Security warnings to prevent common mistakes

---

## 🔐 Security Best Practices

### What's Safe ✅

- Storing public keys in the database
- Using public keys in frontend checkout
- Showing public keys to merchant owners

### What's NOT Safe ❌

- Storing secret keys in the database
- Using secret keys in frontend code
- Sharing secret keys with anyone

### Database Constraint Protection

The `paystack_key_format` constraint prevents:
- Accidental storage of secret keys (which start with `sk_`)
- Storage of invalid key formats
- Common security mistakes

---

## 📊 Database Schema

### merchants table (updated)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| store_name | TEXT | Store name |
| business_name | TEXT | Business name |
| slug | TEXT | URL slug |
| **paystack_public_key** | **TEXT** | **Paystack public API key** |
| created_at | TIMESTAMP | Creation timestamp |
| ... | ... | Other columns |

---

## 🐛 Troubleshooting

### "Failed to save" error

**Possible causes:**
1. No merchant found (not logged in or no merchant association)
2. Database RLS policy blocking update
3. Invalid key format (doesn't start with `pk_`)

**Solutions:**
1. Check that you're logged in and have a merchant
2. Verify RLS policies allow merchant owners to UPDATE their merchant
3. Ensure the key starts with `pk_test_` or `pk_live_`

### Key doesn't persist after refresh

**Possible causes:**
1. Save didn't complete successfully
2. Browser cache issue
3. Context not refreshing

**Solutions:**
1. Check browser console for errors
2. Hard refresh the page (Cmd+Shift+R)
3. Check database directly to see if value was saved

### Constraint violation error

**Cause:** Trying to save a key that doesn't start with `pk_`

**Solution:** Ensure you're using the **Public Key**, not the Secret Key

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `src/pages/settings/Finance.jsx` | Finance settings UI with Paystack config |
| `src/context/adminMerchantContext.jsx` | Provides merchant data and refetch function |
| `add_paystack_key_migration.sql` | Database migration to add the column |

---

## ✨ Summary

✅ **Paystack public key field added to merchants table**  
✅ **Finance settings page updated with Paystack configuration**  
✅ **Security constraints prevent secret key storage**  
✅ **Visual feedback for save status**  
✅ **Per-merchant payment gateway configuration**  

Your merchants can now configure their Paystack payment gateways! Next step is to integrate the actual payment flow in the checkout page using `react-paystack`.
