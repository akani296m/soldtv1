# Polar Payments Integration Guide

This guide explains how to integrate Polar payments for merchant subscription fees in your application.

## Overview

We've integrated Polar payments to handle merchant subscriptions with the following features:
- ✅ Hosted checkout flow via Polar
- ✅ Webhook integration for automatic subscription status updates
- ✅ Customer portal for subscription management
- ✅ Support for multiple subscription plans (Launch & Growth)
- ✅ Automatic database sync when subscriptions change

## Prerequisites

1. **Polar Account**: Sign up at [polar.sh](https://polar.sh)
2. **Polar Products**: Create subscription products in your Polar dashboard
3. **Supabase Database**: Ensure you have the merchants table set up

---

## Step 1: Run Database Migration

Apply the Polar subscription fields migration to your database:

### Option A: Via Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `migrations/add_polar_subscription_fields.sql`
4. Paste and run the SQL

### Option B: Via CLI

```bash
psql <your-connection-string> < migrations/add_polar_subscription_fields.sql
```

This adds the following fields to the `merchants` table:
- `polar_customer_id` - Polar's customer reference
- `polar_subscription_id` - Active subscription ID
- `polar_product_id` - Product/plan ID

---

## Step 2: Create Polar Products

1. Log into your [Polar Dashboard](https://polar.sh)
2. Navigate to **Products**
3. Create two subscription products:
   - **Launch Plan** (R330/month)
   - **Growth Plan** (R730/month)
4. Note down the **Product Price IDs** for each plan (they look like `price_xxxxx`)

---

## Step 3: Get Polar API Credentials

### Access Token

1. In Polar Dashboard, go to **Settings** → **API**
2. Create a new **Access Token** (Server-side)
3. Save this token securely

### Webhook Secret

1. In Polar Dashboard, go to **Settings** → **Webhooks**
2. Create a new webhook endpoint:
   - **URL**: `https://your-domain.com/api/polar-webhook`
   - **Events**: Select all subscription events
3. Copy the **Webhook Secret**

---

## Step 4: Configure Environment Variables

Add the following environment variables to your `.env` file:

```env
# Polar Configuration
POLAR_ACCESS_TOKEN=your_polar_access_token_here
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret_here
POLAR_ENVIRONMENT=sandbox  # Use 'production' when going live
POLAR_SUCCESS_URL=https://your-domain.com/billing/success
POLAR_RETURN_URL=https://your-domain.com

# Polar Product IDs (from Step 2)
VITE_POLAR_LAUNCH_PRODUCT_ID=price_xxxxx_launch
VITE_POLAR_GROWTH_PRODUCT_ID=price_xxxxx_growth

# Supabase Service Role Key (for webhook to update database)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Get Supabase Service Role Key

1. Go to Supabase Dashboard → **Settings** → **API**
2. Copy the **service_role** key (keep this secret!)

---

## Step 5: Update Vercel Configuration

Update your `vercel.json` to include Polar in the Content Security Policy:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.paystack.co https://api.yoco.com https://api.openai.com https://api.polar.sh https://sandbox-api.polar.sh; frame-src https://js.stripe.com https://checkout.paystack.com https://pay.yoco.com https://checkout.polar.sh;"
        }
      ]
    }
  ]
}
```

---

## Step 6: Add Success Route

Update your app's routing to include the billing success page:

In your main routing file (e.g., `App.jsx`), add:

```jsx
import BillingSuccess from './pages/settings/BillingSuccess';

// In your routes:
<Route path="/billing/success" element={<BillingSuccess />} />
```

---

## Step 7: Deploy to Vercel

Deploy your application with the new environment variables:

### Option A: Via Vercel Dashboard

1. Go to your Vercel project
2. Navigate to **Settings** → **Environment Variables**
3. Add all the environment variables from Step 4
4. Redeploy your application

### Option B: Via Vercel CLI

```bash
# Set environment variables
vercel env add POLAR_ACCESS_TOKEN
vercel env add POLAR_WEBHOOK_SECRET
vercel env add POLAR_ENVIRONMENT
vercel env add VITE_POLAR_LAUNCH_PRODUCT_ID
vercel env add VITE_POLAR_GROWTH_PRODUCT_ID
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Deploy
vercel --prod
```

---

## Step 8: Test the Integration

### Testing in Sandbox Mode

1. Ensure `POLAR_ENVIRONMENT=sandbox` in your environment variables
2. Go to your billing page (`/settings/billing`)
3. Click **Continue** on a plan
4. You'll be redirected to Polar's test checkout
5. Use Polar's test card numbers to complete checkout
6. After successful payment, you should be redirected to `/billing/success`
7. Check your database - the merchant's subscription fields should be updated

### Test Card Numbers

Polar provides test cards for sandbox mode:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`

### Verify Webhook Integration

1. Complete a test checkout
2. Check your Vercel logs for webhook events
3. Verify the merchant's record in Supabase was updated:
   - `subscription_status` should be `'active'`
   - `polar_customer_id` should be populated
   - `polar_subscription_id` should be populated

---

## Step 9: Test Customer Portal

1. As a merchant with an active subscription, go to `/settings/billing`
2. You should see an "Active Subscription" banner
3. Click **Manage Subscription**
4. You'll be redirected to Polar's customer portal
5. Test canceling/reactivating the subscription
6. Verify webhook updates the database correctly

---

## Step 10: Go Live

When ready for production:

1. Switch to Polar production mode:
   ```env
   POLAR_ENVIRONMENT=production
   ```

2. Update product IDs to production product IDs

3. Update webhook URL in Polar dashboard to your production domain

4. Test the entire flow again in production

---

## Architecture Overview

### Files Created

```
api/
├── polar-checkout.js          # Redirects to Polar checkout
├── polar-webhook.js            # Handles subscription webhooks
└── polar-customer-portal.js    # Redirects to customer portal

migrations/
└── add_polar_subscription_fields.sql  # Database schema

src/pages/settings/
├── Billing.jsx                 # Updated to use Polar
└── BillingSuccess.jsx          # Checkout success page
```

### Flow Diagram

```
1. Merchant clicks plan → Billing.jsx
2. Redirect to /api/polar-checkout → Polar Checkout Page
3. Merchant completes payment → Polar processes payment
4. Polar redirects to /billing/success → BillingSuccess.jsx
5. Polar sends webhook to /api/polar-webhook → Updates database
6. Merchant manages subscription → /api/polar-customer-portal → Polar Portal
```

---

## Webhook Events Handled

The webhook endpoint (`/api/polar-webhook`) handles these events:

- ✅ `subscription.created` - New subscription created
- ✅ `subscription.active` - Subscription becomes active
- ✅ `subscription.updated` - Subscription details changed
- ✅ `subscription.canceled` - Subscription canceled
- ✅ `subscription.revoked` - Subscription revoked (e.g., payment failure)
- ✅ `subscription.uncanceled` - Canceled subscription reactivated
- ✅ `order.created` / `order.paid` - One-time payments

---

## Database Schema

The merchants table now includes:

```sql
polar_customer_id VARCHAR(255)      -- Polar customer reference
polar_subscription_id VARCHAR(255)  -- Active subscription ID
polar_product_id VARCHAR(255)       -- Product/plan ID
subscription_plan VARCHAR(50)       -- 'launch', 'growth', etc.
subscription_status VARCHAR(50)     -- 'active', 'canceled', etc.
subscription_started_at TIMESTAMP   -- When subscription started
subscription_expires_at TIMESTAMP   -- Current period end
```

---

## Troubleshooting

### Checkout Returns Error

- Verify `POLAR_ACCESS_TOKEN` is set correctly
- Check product IDs are valid
- Ensure `POLAR_ENVIRONMENT` matches your Polar account mode

### Webhook Not Updating Database

- Check Vercel function logs for errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Ensure webhook secret matches
- Check Polar webhook logs in dashboard

### Customer Portal Not Working

- Verify merchant has `polar_customer_id` populated
- Check if merchant has an active subscription
- Review Vercel logs for API errors

---

## Security Best Practices

✅ **Never expose secrets in frontend code**
- Access tokens and service keys are only in backend API routes

✅ **Verify webhook signatures**
- The webhook handler verifies Polar's signature

✅ **Use HTTPS in production**
- Webhooks require HTTPS endpoints

✅ **Restrict service role key usage**
- Only used in webhook endpoint, never in frontend

---

## Support

For issues with:
- **Polar Platform**: Contact [Polar Support](https://polar.sh/support)
- **Integration Questions**: Check this guide or review the code comments
- **Database Issues**: Check Supabase logs and RLS policies

---

## Next Steps

- [ ] Configure production Polar products
- [ ] Set up email notifications for subscription events
- [ ] Add usage limits based on subscription tier
- [ ] Implement grace period for failed payments
- [ ] Add subscription upgrade/downgrade flow
