# Subscription System Setup Guide

This guide explains how to complete the setup of the subscription system for your merchant platform.

## Overview

We've implemented a subscription system that:
- Adds subscription tracking to the merchants table
- Shows an "Unlock Full Features" card in the sidebar for trial users
- Hides the card when merchants have an active subscription
- Allows merchants to select a subscription plan from the billing page

## Database Migration Required

The migration file `migrations/add_subscription_fields.sql` adds the following fields to the merchants table:
- `subscription_plan` (VARCHAR): The plan tier ('trial', 'launch', 'growth', or null)
- `subscription_status` (VARCHAR): The subscription status ('active', 'inactive', 'cancelled', 'trial', or 'expired')
- `subscription_started_at` (TIMESTAMP): When the subscription started
- `subscription_expires_at` (TIMESTAMP): When the subscription expires

### How to Apply the Migration

#### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `migrations/add_subscription_fields.sql`
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

#### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Navigate to your project directory
cd /Users/akani/merchantsv1

# Run the migration
supabase db push
```

#### Option 3: Manual SQL Execution

Connect to your PostgreSQL database and run the SQL file directly:

```bash
psql <your-connection-string> < migrations/add_subscription_fields.sql
```

## Testing the Implementation

After applying the migration, test the subscription flow:

### 1. Verify Trial Mode (Default State)
- Log in to your merchant account
- Check the sidebar - you should see the "Unlock Full Features" card
- Click "Upgrade Now" - it should navigate to Settings > Billing

### 2. Test Plan Selection
- Go to Settings > Billing
- Click "Continue" on either the LAUNCH or GROWTH plan
- You should see a success message
- Return to the home page

### 3. Verify Subscription Active
- After selecting a plan, the "Unlock Full Features" card should disappear from the sidebar
- This confirms that the merchant is now on an active subscription

## Implementation Details

### Frontend Components Modified:

1. **`src/components/sidebar.jsx`**
   - Added conditional rendering for the premium promo card
   - Card only shows when: `!merchant.subscription_plan || merchant.subscription_plan === 'trial' || merchant.subscription_status !== 'active'`
   - "Upgrade Now" button navigates to `/settings/billing`

2. **`src/pages/settings/Billing.jsx`**
   - Created billing page with LAUNCH and GROWTH pricing cards
   - Added subscription selection functionality
   - Updates merchant subscription status in database

3. **`src/context/adminMerchantContext.jsx`**
   - Added `subscription_plan` and `subscription_status` to merchant query
   - These fields are now available throughout the app

### Database Schema:

```sql
-- Merchants table now includes:
subscription_plan VARCHAR(50) DEFAULT 'trial'
subscription_status VARCHAR(50) DEFAULT 'trial'
subscription_started_at TIMESTAMP WITH TIME ZONE
subscription_expires_at TIMESTAMP WITH TIME ZONE
```

## Future Enhancements

Consider adding:
- Payment integration (Stripe, Paystack, etc.)
- Subscription renewal reminders
- Trial period expiration logic
- Plan downgrade/upgrade flows
- Billing history page
- Invoice generation

## Troubleshooting

### Card Not Disappearing
- Check browser console for errors
- Verify the migration was applied successfully
- Ensure the merchant context is refetching after subscription update

### Database Errors
- Error `PGRST204`: Column not found - migration not applied
- Check Supabase logs for detailed error messages
- Verify your RLS policies allow updates to the merchants table

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify the database migration was successful
3. Ensure you have proper permissions to update the merchants table
4. Check the Supabase logs for detailed error information
