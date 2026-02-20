# Supabase Security Hardening Guide

This guide addresses the 13 security vulnerabilities found in your security scan. Follow both the SQL migration AND the manual dashboard configuration steps.

## Vulnerability Summary

| # | Severity | Vulnerability | Fix Location |
|---|----------|---------------|--------------|
| 1 | HIGH | Login Rate Limiting | Dashboard + SQL |
| 2 | HIGH | OTP Brute Force | Dashboard |
| 3 | MEDIUM | OTP Timing Attack | SQL Function |
| 4 | MEDIUM | Content-Type Sniffing | vercel.json |
| 5 | MEDIUM | Storage CORS Wildcard | Dashboard |
| 6 | MEDIUM | Realtime Token in URL | Client Code |
| 7 | MEDIUM | Error Message Info Leakage | SQL + Code |
| 8 | HIGH | RPC Function Enumeration | SQL |
| 9 | MEDIUM | Security Headers Missing | vercel.json |
| 10 | MEDIUM | Edge Function CORS Bypass | Edge Functions |
| 11 | HIGH | TLS Downgrade Check | vercel.json |
| 12 | MEDIUM | Credentials in Error Messages | SQL + Code |
| 13 | HIGH | Password Reset Flow Abuse | Dashboard + SQL |

---

## Step 1: Run the SQL Migration

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Open the file `migrations/security_hardening.sql`
5. Copy the entire contents and paste into the SQL Editor
6. Click **Run** to execute

This will:
- Enable Row Level Security (RLS) on all tables
- Create proper access policies
- Set up audit logging tables
- Create secure RPC wrapper functions
- Add input validation triggers

---

## Step 2: Configure Authentication Rate Limits

Go to **Authentication > Rate Limits** in your Supabase Dashboard and apply these settings:

### Email Rate Limits
| Setting | Recommended Value |
|---------|-------------------|
| Email sign-in rate limit | 10 per hour per email |
| Email sign-up rate limit | 3 per hour per email |
| Password reset rate limit | 3 per hour per email |
| Email change rate limit | 3 per hour per user |

### OTP Rate Limits
| Setting | Recommended Value |
|---------|-------------------|
| Phone/SMS OTP rate limit | 5 per hour per phone |
| OTP verification attempts | 5 per OTP |

### General Rate Limits
| Setting | Recommended Value |
|---------|-------------------|
| Anonymous sign-in rate limit | 30 per hour per IP |
| Token refresh rate limit | 60 per hour per user |

---

## Step 3: Configure Authentication Settings

Go to **Authentication > Providers** and configure:

### Email Provider Settings
- ✅ Enable email confirmation
- ✅ Enable "Secure email change" 
- Set OTP expiry to **5 minutes** (300 seconds)
- Enable double confirmation for email changes

### Password Settings
Go to **Authentication > Policies**:
- Minimum password length: **8 characters**
- Require uppercase letters: **Yes**
- Require numbers: **Yes**
- Require special characters: **Recommended**

### Account Lockout
- Enable temporary account lockout after **5 failed login attempts**
- Lockout duration: **15 minutes**

---

## Step 4: Configure Storage Security

Go to **Storage** and for EACH bucket (e.g., `product-images`):

### 1. Remove CORS Wildcards
Click on your bucket > **Configuration**:
- Remove `*` from allowed origins
- Add your specific domains:
  - `https://yourdomain.com`
  - `https://www.yourdomain.com`
  - `http://localhost:5173` (for development only)

### 2. Configure Bucket Policies
Click on your bucket > **Policies**:

**For Public Buckets (product images):**
```sql
-- SELECT policy (public read)
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- INSERT policy (authenticated + valid merchant)
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE policy (owner only)
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 3. File Type Restrictions
Set allowed MIME types for each bucket:
- `image/jpeg`
- `image/png`
- `image/gif`
- `image/webp`
- `image/svg+xml`

Set maximum file size: **5 MB**

---

## Step 5: Configure Realtime Security

Go to **Database > Replication**:

1. Only enable realtime on necessary tables
2. Use the secure view pattern from the SQL migration
3. Remove realtime from sensitive tables like `merchants`, `auth_audit_log`

### Client-Side Fix for Token in URL
Update your Supabase client configuration:

```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Don't persist session in URL
    flowType: 'pkce',
    detectSessionInUrl: false,
  },
  realtime: {
    // Use headers instead of URL params for auth
    params: {
      eventsPerSecond: 10
    }
  }
})
```

---

## Step 6: API Key Security

Go to **Settings > API**:

### Critical Checks
- ⚠️ Ensure your **service_role** key is NEVER exposed in client-side code
- ⚠️ Only use the **anon** key in browser applications
- Consider rotating keys if you suspect they may have been compromised

### Key Rotation
If you need to rotate keys:
1. Go to **Settings > API**
2. Click **Generate New Keys**
3. Update your environment variables:
   - `.env` file
   - Vercel environment variables
   - Any CI/CD secrets

---

## Step 7: Edge Functions CORS (If Applicable)

If you have Supabase Edge Functions, add this CORS configuration:

Create `supabase/functions/_shared/cors.ts`:
```typescript
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
];

// Add localhost only in development
if (Deno.env.get('ENVIRONMENT') !== 'production') {
  allowedOrigins.push('http://localhost:5173');
}

export const corsHeaders = (origin: string | null) => {
  const isAllowed = origin && allowedOrigins.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
};

export const handleCors = (req: Request) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }
  
  return null;
};
```

Use in your functions:
```typescript
import { corsHeaders, handleCors } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('origin');
  
  // Your function logic here
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 
      'Content-Type': 'application/json',
      ...corsHeaders(origin)
    },
  });
});
```

---

## Step 8: Error Handling Best Practices

Update your error handling in React components to avoid leaking sensitive information:

### Before (Insecure):
```javascript
catch (error) {
  console.error('Error:', error);
  setError(error.message); // May leak database structure or sensitive info
}
```

### After (Secure):
```javascript
catch (error) {
  console.error('Error:', error);
  // Generic user-facing message
  setError('An error occurred. Please try again.');
  
  // Log full error only in development
  if (import.meta.env.DEV) {
    console.error('Full error:', error);
  }
}
```

### Create Error Mapping Utility
```javascript
// src/lib/errors.js
const errorMessages = {
  '23505': 'This record already exists.',
  '42501': 'You do not have permission to perform this action.',
  '22P02': 'Invalid input format.',
  'PGRST116': 'No matching records found.',
  'default': 'An unexpected error occurred. Please try again.'
};

export function getSafeErrorMessage(error) {
  if (!error) return errorMessages.default;
  
  const code = error.code || error.status;
  return errorMessages[code] || errorMessages.default;
}
```

---

## Step 9: Verify Security Configuration

After applying all fixes, verify with these SQL queries:

### Check RLS Status
```sql
SELECT 
  schemaname,
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should show `rls_enabled = true`.

### Check Policies
```sql
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Verify No Public Access to Sensitive Tables
```sql
-- This should return empty if properly secured
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND roles::text LIKE '%anon%'
  AND cmd IN ('UPDATE', 'DELETE')
  AND qual = 'true';
```

---

## Security Checklist

Before deploying to production, verify:

- [ ] SQL migration has been executed
- [ ] Rate limits configured in Dashboard
- [ ] Email confirmation enabled
- [ ] Password policies set
- [ ] Storage CORS wildcards removed
- [ ] Bucket policies properly configured
- [ ] Realtime only on necessary tables
- [ ] vercel.json has security headers
- [ ] Service role key not in client code
- [ ] Error messages are generic
- [ ] Edge Functions have proper CORS (if applicable)

---

## Ongoing Security Maintenance

1. **Monthly Review**: Check the auth audit log for suspicious activity
2. **Key Rotation**: Rotate API keys every 90 days
3. **Dependency Updates**: Keep Supabase client updated
4. **Security Scans**: Re-run security scan after major changes
5. **Access Review**: Audit merchant_users relationships quarterly

---

## Support

For Supabase-specific security questions:
- [Supabase Security Documentation](https://supabase.com/docs/guides/auth/security)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Security Best Practices](https://supabase.com/docs/guides/security)
