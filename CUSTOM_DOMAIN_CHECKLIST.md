# Custom Domain Implementation Checklist

## Pre-Deployment Checklist

### 1. Database Migration
- [ ] Run `migrations/add_custom_domain.sql` in Supabase SQL Editor
- [ ] Verify columns exist:
  ```sql
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'merchants' 
  AND column_name LIKE 'custom_domain%';
  ```
- [ ] Verify index exists:
  ```sql
  SELECT indexname FROM pg_indexes WHERE tablename = 'merchants';
  ```

### 2. Code Verification
- [ ] Check all new files exist:
  - `src/storefront/utils/getMerchantByDomain.js`
  - `src/storefront/components/CustomDomainStorefront.jsx`
  - `migrations/add_custom_domain.sql`
- [ ] Verify no TypeScript/ESLint errors
- [ ] Check dev server is running without errors

### 3. Local Testing
- [ ] Visit `http://localhost:5173` → Should show admin dashboard
- [ ] Visit `http://localhost:5173/s/[your-slug]` → Should show storefront
- [ ] Navigate to Settings → Manage Store → See Custom Domain section
- [ ] Enter a test domain and save → Check database update

### 4. Settings UI Testing
- [ ] Custom domain input field appears
- [ ] Current storefront URL displays correctly
- [ ] DNS instructions show when domain is entered
- [ ] Domain verification status shows correctly
- [ ] Save changes updates database

---

## Post-Deployment Checklist

### 1. Vercel Deployment
- [ ] Push code to Git
- [ ] Verify Vercel auto-deploys
- [ ] Check build logs for errors
- [ ] Visit production URL to confirm deployment

### 2. Production Testing
- [ ] Admin routes work (`yourdomain.com/`)
- [ ] Slug-based storefront works (`yourdomain.com/s/test-merchant`)
- [ ] Settings page loads correctly
- [ ] Custom domain section is visible

### 3. Custom Domain Setup (Test Merchant)
- [ ] Select a test merchant
- [ ] Add custom domain in Settings
- [ ] Save successfully
- [ ] Verify database update:
  ```sql
  SELECT custom_domain, custom_domain_verified, custom_domain_configured_at 
  FROM merchants 
  WHERE id = 'your-test-merchant-id';
  ```

### 4. Vercel Domain Configuration
- [ ] Log in to Vercel dashboard
- [ ] Go to Project → Settings → Domains
- [ ] Click "Add Domain"
- [ ] Enter test domain (e.g., `shop-test.yourdomain.com`)
- [ ] Configure DNS CNAME to `cname.vercel-dns.com`
- [ ] Wait for verification (few minutes to 48 hours)
- [ ] Check SSL certificate is issued

### 5. Live Domain Testing
- [ ] Visit custom domain in browser
- [ ] Verify storefront loads (not admin panel)
- [ ] Check merchant data is correct
- [ ] Test navigation (products, cart, checkout)
- [ ] Verify HTTPS works
- [ ] Test on mobile

---

## Rollout Plan

### Phase 1: Soft Launch (1-5 merchants)
- [ ] Select 5 beta merchants
- [ ] Personally configure their domains
- [ ] Monitor for issues
- [ ] Gather feedback
- [ ] Document common issues

### Phase 2: Self-Service (5-20 merchants)
- [ ] Enable custom domain settings for all merchants
- [ ] Send announcement email with instructions
- [ ] Offer 1-on-1 support for DNS setup
- [ ] Create video tutorial
- [ ] Monitor Vercel domain limits

### Phase 3: Scale (20-50 merchants)
- [ ] Consider Vercel API integration for auto-provisioning
- [ ] Implement domain verification workflow
- [ ] Add automated DNS checking
- [ ] Set up monitoring/alerts
- [ ] Consider upgrading Vercel plan if needed

---

## Monitoring

### Metrics to Track
- [ ] Number of custom domains configured
- [ ] Average time to DNS verification
- [ ] Domain-related support tickets
- [ ] Page load times on custom domains
- [ ] SSL certificate renewals

### Alerts to Set Up
- [ ] Domain limit approaching (45/50 on free tier)
- [ ] Failed domain verifications
- [ ] SSL certificate expiration warnings
- [ ] Broken domain DNS

---

## Support Preparation

### Merchant FAQ

**Q: How long does it take for my custom domain to work?**
A: DNS changes typically propagate within 24-48 hours, but can take up to 72 hours in rare cases.

**Q: Do I need to pay extra for a custom domain?**
A: No, custom domain support is included. You just need to own your domain and configure DNS.

**Q: Can I use my root domain (example.com) instead of a subdomain?**
A: We recommend using subdomains (shop.example.com) for better flexibility, but root domains are possible with A records.

**Q: What if I change my mind and want to remove my custom domain?**
A: Simply clear the custom domain field in settings and save. Your default URL will still work.

**Q: Is HTTPS/SSL included?**
A: Yes, we automatically provision free SSL certificates for all custom domains.

### Domain Registrar Guides
- [ ] Create GoDaddy CNAME setup guide
- [ ] Create Namecheap CNAME setup guide
- [ ] Create Cloudflare CNAME setup guide
- [ ] Create generic registrar guide

---

## Known Limitations

1. **Domain Limit:** 50 domains on Vercel free tier
2. **DNS Propagation:** Can take up to 48 hours
3. **Manual Verification:** Currently requires admin to mark as verified
4. **No Auto-Provisioning:** Domains must be added manually in Vercel (can be automated later)

---

## Future Enhancements

### Nice to Have
- [ ] Automatic domain verification via DNS lookup
- [ ] Vercel API integration for auto-domain provisioning
- [ ] Email notifications for domain status changes
- [ ] Domain health monitoring dashboard
- [ ] Batch domain import/export
- [ ] Domain transfer wizard

### Advanced Features
- [ ] Multiple domains per merchant (with primary domain)
- [ ] Custom domain analytics
- [ ] Domain performance metrics
- [ ] A/B testing across domains
- [ ] Geo-routing for domains

---

## Emergency Rollback Plan

If critical issues arise:

1. **Immediate:** Comment out domain detection in `App.jsx`
   ```jsx
   // Temporarily force admin routing for all requests
   // if (isCustomDomain) {
   //     return <CustomDomainStorefront />;
   // }
   ```

2. **Database:** Disable all custom domains
   ```sql
   UPDATE merchants SET custom_domain_verified = FALSE;
   ```

3. **Vercel:** Pause domain in Vercel dashboard

4. **Communication:** Notify affected merchants via email

---

## Success Criteria

✅ Implementation complete when:
- [ ] All checklist items above are checked
- [ ] At least 1 merchant successfully using custom domain
- [ ] No errors in production logs
- [ ] Merchant can self-serve DNS setup with docs
- [ ] Support tickets < 5% of total merchants

---

**Last Updated:** January 10, 2026  
**Status:** Ready for testing ✅
