# 🚀 Polar Integration Quick Start Checklist

Use this checklist to get your Polar payments integration up and running.

## ✅ Pre-Integration (Completed)
- [x] Install required packages (`zod`, `@polar-sh/supabase`)
- [x] Create API endpoints (checkout, webhook, customer-portal)
- [x] Update frontend components (Billing page, success page)
- [x] Add routing for success page
- [x] Update Vercel CSP configuration
- [x] Create database migration file

---

## 📋 Your Setup Checklist

### Step 1: Database Setup
- [ ] Go to Supabase Dashboard → SQL Editor
- [ ] Copy contents of `migrations/add_polar_subscription_fields.sql`
- [ ] Execute the SQL migration
- [ ] Verify new columns exist in `merchants` table:
  - `polar_customer_id`
  - `polar_subscription_id`
  - `polar_product_id`

### Step 2: Polar Account Setup
- [ ] Sign up at [polar.sh](https://polar.sh)
- [ ] Verify your email
- [ ] Complete account setup

### Step 3: Create Subscription Products
- [ ] Go to Polar Dashboard → Products
- [ ] Create "Launch Plan" product:
  - Name: Launch
  - Price: R330/month (or your price)
  - Recurring: Yes
  - Copy the **Product Price ID** (starts with `price_`)
- [ ] Create "Growth Plan" product:
  - Name: Growth
  - Price: R730/month (or your price)
  - Recurring: Yes
  - Copy the **Product Price ID** (starts with `price_`)

### Step 4: Get API Credentials
- [ ] Go to Polar Dashboard → Settings → API
- [ ] Create a new **Access Token**
  - Name it: "Production API" or "Sandbox API"
  - Copy the token (you won't see it again!)
- [ ] Go to Settings → Webhooks
- [ ] Click "Add Endpoint"
  - URL: `https://your-domain.com/api/polar-webhook`
  - Events: Select ALL subscription events
  - Save and copy the **Webhook Secret**

### Step 5: Configure Environment Variables

**For Local Development:**
```bash
# Update your .env file with:
POLAR_ACCESS_TOKEN=polar_sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
POLAR_WEBHOOK_SECRET=wh_sec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
POLAR_ENVIRONMENT=sandbox
POLAR_SUCCESS_URL=http://localhost:5173/billing/success
POLAR_RETURN_URL=http://localhost:5173

# Add Product Price IDs
VITE_POLAR_LAUNCH_PRODUCT_ID=price_xxxxxxxxxxxxxxxxxxxxx
VITE_POLAR_GROWTH_PRODUCT_ID=price_xxxxxxxxxxxxxxxxxxxxx

# Add Supabase Service Role Key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxx
```

- [ ] Copy `.env.example` to `.env` if you haven't already
- [ ] Fill in all the Polar variables
- [ ] Get Supabase Service Role Key from Supabase Dashboard → Settings → API
- [ ] Save the file

**For Production (Vercel):**
- [ ] Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- [ ] Add each variable from above
- [ ] Change URLs to your production domain
- [ ] Change `POLAR_ENVIRONMENT` to `production` when ready

### Step 6: Test Locally
- [ ] Restart your dev server: `npm run dev`
- [ ] Navigate to `/settings/billing`
- [ ] You should see the two plans (Launch & Growth)
- [ ] Click "Continue" on a plan
- [ ] You should be redirected to Polar checkout
- [ ] Use test card: `4242 4242 4242 4242`
  - Any CVV (e.g., 123)
  - Any future expiry date
- [ ] Complete the checkout
- [ ] You should be redirected to `/billing/success`
- [ ] Check your Supabase database
  - Your merchant record should have:
    - `subscription_status` = 'active'
    - `subscription_plan` = 'launch' or 'growth'
    - `polar_customer_id` populated
    - `polar_subscription_id` populated

### Step 7: Test Customer Portal
- [ ] Go back to `/settings/billing`
- [ ] You should now see "Active Subscription" banner
- [ ] Click "Manage Subscription" button
- [ ] You should be redirected to Polar customer portal
- [ ] Try canceling the subscription
- [ ] Check your database - status should update to 'canceled'

### Step 8: Test Webhook Locally (Optional)
If you want to test webhooks locally:
- [ ] Install ngrok: `npm install -g ngrok`
- [ ] Run: `ngrok http 5173`
- [ ] Copy the https URL (e.g., `https://xxxx-xxx.ngrok.io`)
- [ ] Update Polar webhook URL to: `https://xxxx-xxx.ngrok.io/api/polar-webhook`
- [ ] Trigger subscription events (subscribe, cancel, etc.)
- [ ] Check your terminal logs for webhook events

### Step 9: Deploy to Production
- [ ] Push your code to GitHub
- [ ] Vercel will auto-deploy
- [ ] Add production environment variables in Vercel dashboard
- [ ] Update Polar webhook URL to production: `https://your-domain.com/api/polar-webhook`
- [ ] Change `POLAR_ENVIRONMENT` to `production`
- [ ] Update `POLAR_SUCCESS_URL` and `POLAR_RETURN_URL` to production URLs
- [ ] Create PRODUCTION products in Polar (not sandbox)
- [ ] Update product Price IDs to production IDs

### Step 10: Production Testing
- [ ] Test checkout flow with real card
- [ ] Verify webhook updates database
- [ ] Test customer portal
- [ ] Test subscription cancellation
- [ ] Verify email notifications from Polar

---

## 🐛 Common Issues & Solutions

### "Plan not configured" error
**Problem**: Product IDs not set or incorrect
**Solution**: 
1. Check `.env` file has `VITE_POLAR_LAUNCH_PRODUCT_ID` and `VITE_POLAR_GROWTH_PRODUCT_ID`
2. Verify the IDs start with `price_`
3. Restart dev server after changing `.env`

### Checkout redirect fails
**Problem**: Polar API error or incorrect credentials
**Solution**:
1. Check `POLAR_ACCESS_TOKEN` is correct
2. Verify `POLAR_ENVIRONMENT` matches your Polar account (sandbox vs production)
3. Check browser console for errors
4. Check Vercel function logs

### Webhook not updating database
**Problem**: Webhook not receiving events or signature verification failing
**Solution**:
1. Check Polar Dashboard → Webhooks → Recent Deliveries
2. Verify webhook URL is correct and accessible
3. Check `POLAR_WEBHOOK_SECRET` matches
4. Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
5. Check Vercel function logs for errors

### Can't open customer portal
**Problem**: Merchant doesn't have `polar_customer_id`
**Solution**:
1. Merchant must complete at least one checkout first
2. Check database to verify `polar_customer_id` is populated
3. If missing, webhook may have failed - check logs

### Database not updating after checkout
**Problem**: Webhook not configured or failing
**Solution**:
1. Ensure webhook is set up in Polar dashboard
2. Webhook URL must be HTTPS (use ngrok for local testing)
3. Check webhook delivery logs in Polar dashboard
4. Verify all webhook events are selected

---

## 📚 Additional Resources

- **Full Setup Guide**: See `POLAR_INTEGRATION_GUIDE.md`
- **Implementation Details**: See `POLAR_IMPLEMENTATION_SUMMARY.md`
- **Polar Documentation**: [docs.polar.sh](https://docs.polar.sh)
- **Polar Support**: [polar.sh/support](https://polar.sh/support)

---

## ✨ You're Done!

Once you've completed this checklist:
- ✅ Your merchants can subscribe to plans
- ✅ Payments are processed securely via Polar
- ✅ Database automatically syncs via webhooks
- ✅ Merchants can self-manage subscriptions

---

## 🎯 Next Enhancements (Optional)

Consider adding these features later:
- [ ] Email notifications when subscription status changes
- [ ] Grace period for failed payments
- [ ] Usage limits based on subscription tier
- [ ] Upgrade/downgrade flow
- [ ] Proration handling
- [ ] Annual billing option
- [ ] Trial period configuration
