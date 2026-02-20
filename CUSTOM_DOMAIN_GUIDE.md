# Custom Domain Implementation Guide

## Overview

This document explains the custom domain implementation for your multi-tenant merchants platform. Merchants can now use their own custom domains (e.g., `shop.acme.com`) instead of the default slug-based URLs (e.g., `merchants.io/s/acme`).

---

## Architecture

### Routing Logic

The app now intelligently detects whether it's running on:
1. **Admin Domain** (`merchants.io`, `localhost`) → Shows admin dashboard + slug-based storefronts
2. **Custom Domain** (anything else) → Shows storefront only, merchant identified by hostname

```
User visits shop.acme.com
    ↓
App detects hostname is NOT in ADMIN_DOMAINS list
    ↓
Renders CustomDomainStorefront component
    ↓
MerchantContext queries database for merchant with custom_domain = 'shop.acme.com'
    ↓
Renders storefront with merchant's data
```

---

## Implementation Summary

### 1. Database Changes ✅

**File:** `/migrations/add_custom_domain.sql`

Added three columns to the `merchants` table:
- `custom_domain` (TEXT UNIQUE) - The merchant's custom domain
- `custom_domain_verified` (BOOLEAN) - Whether DNS is configured correctly
- `custom_domain_configured_at` (TIMESTAMPTZ) - When the domain was first set

**To apply this migration:**

```bash
# Run in Supabase SQL Editor or via CLI
psql -h your-supabase-host -U postgres -d postgres -f migrations/add_custom_domain.sql
```

Or copy the SQL content and run it in your Supabase dashboard under SQL Editor.

---

### 2. New Files Created ✅

#### A. Domain-based Merchant Lookup
**File:** `src/storefront/utils/getMerchantByDomain.js`
- Fetches merchant by `custom_domain` column
- Similar to `getMerchantBySlug` but uses hostname

#### B. Custom Domain Storefront Component
**File:** `src/storefront/components/CustomDomainStorefront.jsx`
- Wraps storefront routes for custom domains
- Renders at root level (`/`, `/products`, `/cart`, etc.)
- Uses `MerchantProvider` with `customDomain={true}`

---

### 3. Enhanced Files ✅

#### A. MerchantContext
**File:** `src/storefront/context/MerchantContext.jsx`

**Changes:**
- Added `ADMIN_DOMAINS` array to identify admin vs custom domains
- New prop: `customDomain` to force domain-based lookup
- Auto-detects if on admin domain or custom domain
- Provides `isCustomDomain` and `lookupMethod` in context

**Usage:**
```jsx
const { merchant, isCustomDomain, lookupMethod } = useMerchant();
// lookupMethod: 'slug' | 'domain'
// isCustomDomain: true if on custom domain
```

#### B. App.jsx
**File:** `src/App.jsx`

**Changes:**
- Added domain detection on mount
- Conditionally renders:
  - `CustomDomainStorefront` for custom domains
  - Admin routes + `/s/:slug` routes for admin domain

**Key Logic:**
```jsx
const hostname = window.location.hostname;
if (isAdminDomain(hostname)) {
    // Show admin dashboard + /s/:slug routes
} else {
    // Show CustomDomainStorefront
}
```

#### C. Storefront Index
**File:** `src/storefront/index.js`

**Changes:**
- Exported `CustomDomainStorefront`
- Exported `getMerchantByDomain`

#### D. Settings UI
**File:** `src/pages/settings/ManageStore.jsx`

**Changes:**
- Added custom domain configuration section
- Shows current storefront URL
- Input field for custom domain
- DNS setup instructions with CNAME details
- Domain verification status indicator
- Auto-saves to database with timestamps

---

### 4. Vercel Configuration ✅

**File:** `vercel.json`

**Changes:**
- Simplified to use `rewrites` instead of `routes`
- All requests go to `/` for SPA routing
- Added security headers

---

## How to Use

### For Merchants (via Settings UI)

1. Navigate to **Settings** → **Manage Store**
2. Scroll to **Custom Domain** section
3. Enter custom domain (e.g., `shop.mystore.com`)
4. Follow DNS configuration steps:
   - Log in to domain registrar
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Wait 24-48 hours for DNS propagation
5. Click **Save Changes**
6. Contact support to complete verification

### For You (Platform Admin)

#### Step 1: Run Database Migration

```bash
# In Supabase SQL Editor, run:
migrations/add_custom_domain.sql
```

#### Step 2: Add Domain in Vercel

When a merchant configures a custom domain, you need to add it in Vercel:

**Option A: Manual (Vercel Dashboard)**
1. Go to your project → Settings → Domains
2. Click "Add"
3. Enter the merchant's domain (e.g., `shop.acme.com`)
4. Vercel will show DNS instructions (merchant should point CNAME to Vercel)
5. Vercel auto-generates SSL certificate

**Option B: Automated (Vercel API)**

Create an API route to automate this:

```javascript
// api/add-merchant-domain.js
export default async function handler(req, res) {
    const { domain, merchantId } = req.body;
    
    // Add domain to Vercel project
    const vercelResponse = await fetch(
        `https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: domain })
        }
    );
    
    if (!vercelResponse.ok) {
        return res.status(500).json({ error: 'Failed to add domain' });
    }
    
    // Update merchant in database
    const { error } = await supabase
        .from('merchants')
        .update({ 
            custom_domain: domain,
            custom_domain_configured_at: new Date().toISOString()
        })
        .eq('id', merchantId);
    
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true });
}
```

#### Step 3: Verify Domain (Optional)

Mark domain as verified once DNS is configured:

```sql
UPDATE merchants 
SET custom_domain_verified = TRUE 
WHERE custom_domain = 'shop.acme.com';
```

---

## Testing Locally

### Option 1: Edit /etc/hosts (Mac/Linux)

```bash
sudo nano /etc/hosts
```

Add:
```
127.0.0.1   shop.test.local
```

Then visit `http://shop.test.local:5173` - it will detect as custom domain!

### Option 2: Use a Service Like ngrok

```bash
ngrok http 5173
# Use the ngrok URL as your custom domain for testing
```

---

## URL Patterns

| Domain Type | Example URL | Merchant Lookup | Use Case |
|-------------|-------------|-----------------|----------|
| Admin | `merchants.io/` | N/A | Admin dashboard |
| Admin | `merchants.io/orders` | N/A | Admin orders page |
| Slug-based storefront | `merchants.io/s/acme` | By slug `acme` | Default storefront URL |
| Custom domain | `shop.acme.com/` | By domain `shop.acme.com` | Merchant's custom storefront |
| Custom domain | `shop.acme.com/products` | By domain `shop.acme.com` | Custom storefront catalog |

---

## Vercel Domain Limits

| Plan | Custom Domains | Cost |
|------|----------------|------|
| Hobby | 50 domains | Free |
| Pro | Unlimited | $20/month |
| Enterprise | Unlimited | Custom pricing |

**For 50 merchants:** Hobby plan is sufficient  
**For 50+ merchants:** Upgrade to Pro

---

## DNS Configuration Example

When merchant enters: `shop.acme.com`

They need to add this DNS record:

```
Type:  CNAME
Name:  shop
Value: cname.vercel-dns.com
TTL:   Automatic (or 3600)
```

Vercel handles:
- SSL certificate generation (via Let's Encrypt)
- HTTPS redirect
- CDN distribution

---

## Troubleshooting

### Issue: Domain not resolving

**Solution:**
1. Check DNS propagation: https://dnschecker.org
2. Verify CNAME points to `cname.vercel-dns.com`
3. Wait up to 48 hours for full propagation

### Issue: Merchant data not loading on custom domain

**Solution:**
1. Check `custom_domain` column in database matches exactly
2. Verify no trailing slashes or `https://` in database
3. Check browser console for errors

### Issue: Shows 404 on custom domain

**Solution:**
1. Ensure domain is added in Vercel project settings
2. Check `vercel.json` has correct rewrites
3. Redeploy the project

---

## Security Notes

1. **SSL/HTTPS:** Vercel auto-generates SSL certificates for all custom domains
2. **Domain Verification:** Consider implementing domain ownership verification before activation
3. **Rate Limiting:** Monitor domain additions to prevent abuse
4. **Unique Constraint:** Database ensures no two merchants can use same domain

---

## Next Steps

1. ✅ Run database migration
2. ✅ Deploy updated code to Vercel
3. ⏳ Test with a custom domain
4. ⏳ Document merchant onboarding process
5. ⏳ Set up Vercel API integration for automatic domain provisioning
6. ⏳ Add domain verification workflow

---

## Support Contact

If merchants need help with DNS configuration, direct them to:
- Check their domain registrar's documentation
- Use https://dnschecker.org to verify propagation
- Contact your support team

---

## Files Modified/Created

### Created:
- `src/storefront/utils/getMerchantByDomain.js`
- `src/storefront/components/CustomDomainStorefront.jsx`
- `migrations/add_custom_domain.sql`
- `CUSTOM_DOMAIN_GUIDE.md` (this file)

### Modified:
- `src/App.jsx` - Added domain detection and routing
- `src/storefront/context/MerchantContext.jsx` - Added domain-based lookup
- `src/storefront/index.js` - Exported new components
- `src/pages/settings/ManageStore.jsx` - Added custom domain UI
- `vercel.json` - Updated routing configuration

---

**Implementation Date:** January 10, 2026  
**Implementation Status:** ✅ Complete - Ready for testing
