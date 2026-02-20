# Fixed: Onboarding Redirect Loop

## The Problem
After completing onboarding, users were redirected back to onboarding, creating an infinite loop.

## Root Cause
1. User completes onboarding → merchant + merchant_users created
2. User redirected to `/` (dashboard)
3. `RequireMerchant` component checks `hasMerchant` from `AdminMerchantContext`
4. Context hasn't refreshed yet, so `hasMerchant` is still `false`
5. `RequireMerchant` redirects back to `/onboarding`
6. Loop repeats! 🔄

## The Fix

### 1. **Trigger Context Refetch** (`onboarding.jsx`)
After creating the merchant, we now:
```javascript
// Call refetchMerchant to update the context
await refetchMerchant();

// Wait for context to update
await new Promise(resolve => setTimeout(resolve, 500));

// Then redirect
navigate('/', { replace: true });
```

### 2. **Prevent Re-Entry** (`onboarding.jsx`)
Added check to redirect users who already have a merchant:
```javascript
useEffect(() => {
  if (hasMerchant && merchant) {
    navigate('/', { replace: true });
  }
}, [hasMerchant, merchant, navigate]);
```

## Testing the Fix

### Test 1: Fresh Onboarding
1. Clear existing merchant data (if testing):
   ```sql
   DELETE FROM merchant_users WHERE user_id = auth.uid();
   DELETE FROM merchants WHERE owner_id = auth.uid();
   ```
2. Log in
3. Complete onboarding
4. Should redirect to dashboard **once** ✅
5. Refresh page - should stay on dashboard ✅

### Test 2: Existing User
1. Log in with user that has merchant
2. Go to dashboard
3. Try to manually navigate to `/onboarding`
4. Should redirect back to dashboard immediately ✅

### Test 3: Context Persistence
1. Complete onboarding
2. Refresh the page
3. Should stay on dashboard (not loop back to onboarding) ✅

## Debug Checklist

If you still experience issues:

### Check Console Logs
Look for these messages in sequential order:
```
[Onboarding] Creating merchant with slug: your-store
[Onboarding] Merchant created: <uuid>
[Onboarding] Merchant-user relationship created
[Onboarding] Refreshing merchant context...
[AdminMerchantContext] Found merchant: {...}
[Onboarding] Redirecting to dashboard...
```

### Common Issues

#### Issue: Still redirecting to onboarding
**Check:**
1. Is `refetchMerchant` being called?
2. Is the merchant_users record actually created?
   ```sql
   SELECT * FROM merchant_users WHERE user_id = auth.uid();
   ```
3. Are RLS policies allowing SELECT on merchant_users?

#### Issue: Context not updating
**Check:**
1. RLS policies on `merchants` table allow SELECT
2. RLS policies on `merchant_users` table allow SELECT
3. The merchant_users record has correct `user_id` and `merchant_id`

#### Issue: Multiple merchants created
**Solution:** This shouldn't happen now because onboarding redirects users with merchants away. But if it does:
```sql
-- Delete duplicate merchants (keep only the first one)
DELETE FROM merchants 
WHERE owner_id = auth.uid() 
AND id NOT IN (
  SELECT id FROM merchants 
  WHERE owner_id = auth.uid() 
  ORDER BY created_at ASC 
  LIMIT 1
);
```

## Changes Made

| File | Change |
|------|--------|
| `onboarding.jsx` | Added `useAdminMerchant()` hook |
| `onboarding.jsx` | Call `refetchMerchant()` after merchant creation |
| `onboarding.jsx` | Added delay to ensure context updates |
| `onboarding.jsx` | Added redirect for users who already have merchant |

## Flow Now

```
Login → Check if has merchant
         ↓                ↓
        No              Yes
         ↓                ↓
    Onboarding       Dashboard
         ↓
     Complete
         ↓
  Create Merchant
         ↓
  Refetch Context ← Important!
         ↓
    Dashboard ✅
```

## Summary

✅ **Fixed:** Onboarding now properly updates merchant context before redirect  
✅ **Fixed:** Users with merchants are redirected away from onboarding  
✅ **Fixed:** No more infinite redirect loops  
✅ **Result:** Smooth onboarding flow that works correctly
