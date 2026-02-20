# 🌐 Whop Payment Integration Guide

## Overview

Whop has been integrated as a payment gateway option for your merchants. This enables **global payments** with support for:
- Credit & Debit Cards
- Apple Pay
- Google Pay
- Cryptocurrency

The key feature is that Whop provides an **embedded checkout experience** - the payment form is displayed directly on your checkout page, providing a seamless on-site payment experience.

---

## ✅ What's Been Implemented

### 1. Finance Settings (Admin Panel)
- **Location**: Settings → Finance
- Merchants can now configure their Whop Plan ID
- Added Whop to the list of available payment gateways
- Proper instructions for obtaining the Plan ID from the Whop Dashboard

### 2. Storefront Checkout
- **Location**: `/s/:slug/checkout` or custom domain checkout
- Whop appears as a selectable payment method when configured
- When selected, the **WhopCheckoutEmbed** component is displayed inline
- Payment completion is handled automatically, creating orders in your database

### 3. Database Schema
- Added `whop_plan_id` column to the `merchants` table
- Run the migration in `migrations/add_whop_plan_id.sql`

---

## 🚀 Setup Instructions

### Step 1: Run the Database Migration

Execute this SQL in your Supabase SQL Editor:

```sql
-- Add the whop_plan_id column to the merchants table
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS whop_plan_id TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN merchants.whop_plan_id IS 'Whop Plan ID for embedded checkout (e.g., plan_XXXXXXXXX)';

-- Optional: Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_merchants_whop_plan_id ON merchants(whop_plan_id) WHERE whop_plan_id IS NOT NULL;
```

### Step 2: Get Your Whop Plan ID

1. Go to [dash.whop.com](https://dash.whop.com/)
2. Create a new product or select an existing one
3. Create a **Plan** under your product
4. Copy the Plan ID (starts with `plan_`)

### Step 3: Configure in Your Merchant Dashboard

1. Log in to your merchant dashboard
2. Go to **Settings → Finance**
3. Expand the **Whop** section
4. Paste your Plan ID (e.g., `plan_XXXXXXXXX`)
5. Click **Save Configuration**

### Step 4: Test the Integration

1. Go to your storefront
2. Add a product to cart
3. Proceed to checkout
4. Select **Whop** as the payment method
5. Complete the payment using the embedded form

---

## 🔧 Technical Details

### Files Modified

| File | Changes |
|------|---------|
| `src/pages/settings/Finance.jsx` | Added Whop gateway configuration |
| `src/storefront/pages/Checkout.jsx` | Added WhopCheckoutEmbed component and payment handling |
| `migrations/add_whop_plan_id.sql` | Database migration for whop_plan_id column |

### How It Works

1. **Payment Selection**: Customer selects Whop from payment options
2. **Embedded Checkout**: WhopCheckoutEmbed displays the payment form inline
3. **Payment Processing**: Customer completes payment within the embed
4. **Completion Callback**: `onComplete(planId, receiptId)` is triggered
5. **Order Creation**: Your system creates the order with payment reference
6. **Confirmation**: Customer is redirected to order confirmation

### Component Usage

```jsx
<WhopCheckoutEmbed
    planId={merchant.whop_plan_id}
    theme="light"
    prefill={{ email: formData.email }}
    hideEmail={!!formData.email}
    onComplete={(planId, receiptId) => handleWhopComplete(planId, receiptId)}
    fallback={<LoadingSpinner />}
/>
```

### Available Props

| Prop | Type | Description |
|------|------|-------------|
| `planId` | string | **Required** - Your Whop Plan ID |
| `theme` | 'light' \| 'dark' \| 'system' | Theme for the checkout |
| `prefill` | object | Prefill email or address |
| `hideEmail` | boolean | Hide email input if prefilled |
| `onComplete` | function | Callback when payment completes |
| `fallback` | ReactNode | Loading state content |

---

## ⚠️ Important Notes

### Pricing Consideration
- Whop uses a **plan-based pricing** model
- The price is determined by the plan configured in Whop Dashboard
- This may differ from your cart total if using fixed plans
- Consider using dynamic plans or adjusting your implementation for variable pricing

### Return URL Handling
- When using Whop with external payment providers (like crypto)
- The `returnUrl` prop can be used to handle redirects
- Check the `status` query parameter: `success`, `error`, or `cancelled`

### Security
- Plan IDs are safe to use in frontend code
- Whop handles all sensitive payment data
- No card details are ever stored on your servers

---

## 🧪 Testing

### Test Mode
1. Create a test plan in Whop Dashboard
2. Use test card numbers provided by Whop
3. Verify order creation in your database

### Checklist
- [ ] Database migration applied
- [ ] Whop Plan ID configured in Finance settings
- [ ] Checkout page displays Whop option
- [ ] Embedded checkout loads correctly
- [ ] Payment completion creates order
- [ ] Order confirmation displays correctly

---

## 🐛 Troubleshooting

### Checkout doesn't appear
- Ensure `whop_plan_id` is saved in the database
- Check browser console for errors
- Verify the Plan ID format is correct

### Payment doesn't complete
- Check if `onComplete` callback is firing
- Verify database permissions for order creation
- Look for errors in Supabase logs

### Styling issues
- The embed uses its own styles
- Container styling can be adjusted
- `theme` prop controls light/dark mode

---

## 📚 Additional Resources

- [Whop Checkout Documentation](https://dev.whop.com/checkout)
- [Whop Dashboard](https://dash.whop.com/)
- [@whop/checkout npm package](https://www.npmjs.com/package/@whop/checkout)

---

## 🎉 Summary

You now have Whop integrated as a payment option! This enables:

✅ Global payment acceptance  
✅ Crypto payments  
✅ Apple Pay & Google Pay  
✅ Embedded on-site checkout  
✅ Seamless order creation  
✅ Easy merchant configuration  

Your merchants can now offer their customers more payment flexibility through Whop's modern payment infrastructure.
