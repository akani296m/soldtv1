# Merchant Signup Flow - Complete Guide

## Overview

The merchant signup flow allows new users to create an account and automatically proceed through onboarding to create their merchant store.

## User Flow

```
/signup → Create Account → /onboarding → Create Merchant → /dashboard
```

### Step-by-Step:

1. **Visit Signup Page** (`/signup`)
   - User fills in: Full Name, Email, Password, Confirm Password
   - Form validates input (email format, password length, password match)

2. **Account Creation**
   - Supabase creates auth user
   - User's full name stored in user metadata
   - Two possible outcomes:
     - **Email confirmation enabled:** Shows "Check Your Email" message
     - **Auto-confirm enabled:** Immediately logs in and redirects to onboarding

3. **Onboarding** (`/onboarding`)
   - User answers business questions
   - User enters store name
   - System creates merchant record
   - System creates merchant_users relationship
   - Redirects to dashboard

4. **Dashboard** (`/`)
   - User can now manage their store
   - All admin features available

---

## Files Created/Modified

| File | Type | Description |
|------|------|-------------|
| `src/pages/signup.jsx` | ✨ Created | Merchant signup form with validation |
| `src/pages/login.jsx` | ✏️ Modified | Added "Create account" link |
| `src/App.jsx` | ✏️ Modified | Added `/signup` route |

---

## Features

### ✅ Form Validation
- **Full Name:** Required, trimmed
- **Email:** Required, valid email format
- **Password:** Minimum 6 characters
- **Confirm Password:** Must match password

### ✅ User Experience
- Show/hide password toggles
- Real-time error display
- Loading states during submission
- Automatic redirect after success
- Links to login page for existing users

### ✅ Email Confirmation Handling
The signup handles both scenarios:

**Scenario 1: Email Confirmation Enabled (Default Supabase)**
```javascript
// Shows success message
"Check Your Email" → User clicks link → Login → Onboarding
```

**Scenario 2: Email Confirmation Disabled**
```javascript
// Auto-logs in
Account Created → Automatically redirect to /onboarding → Dashboard
```

---

## Supabase Configuration

### Email Confirmation Settings

You can configure email confirmation in Supabase:

**Dashboard → Authentication → Email Templates → Confirmation Email**

#### To Enable Email Confirmation (Recommended for Production):
- Leave default settings
- Users must click confirmation link in email
- More secure but requires email service

#### To Disable Email Confirmation (Faster for Development):
```sql
-- Run in Supabase SQL Editor
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- In Supabase Dashboard:
-- Settings → Auth → Email Auth → Disable "Enable email confirmations"
```

---

## Testing

### Test 1: New User Signup
1. Navigate to `http://localhost:5173/signup`
2. Fill in the form:
   - Full Name: "Test Merchant"
   - Email: "test@example.com"
   - Password: "password123"
   - Confirm Password: "password123"
3. Click "Create Account"
4. Should either:
   - Show email confirmation message (if enabled)
   - Redirect to `/onboarding` (if auto-confirm)

### Test 2: Email Validation
1. Try invalid email: "notanemail"
   - Should show error: "Please enter a valid email address"
2. Try short password: "12345"
   - Should show error: "Password must be at least 6 characters"
3. Try mismatched passwords
   - Should show error: "Passwords do not match"

### Test 3: Duplicate Email
1. Try signing up with existing email
2. Should show error: "This email is already registered. Try logging in instead."

### Test 4: Navigation
1. From signup page, click "Sign in" link
   - Should go to `/login`
2. From login page, click "Create one" link
   - Should go to `/signup`

---

## Integration with Existing System

### How It Connects:

```
┌─────────┐     ┌────────────┐     ┌─────────────┐     ┌───────────┐
│ /signup │ --> │ Create     │ --> │ /onboarding │ --> │ /dashboard│
│         │     │ Auth User  │     │ Create      │     │ Merchant  │
│         │     │            │     │ Merchant    │     │ Data      │
└─────────┘     └────────────┘     └─────────────┘     └───────────┘
```

### Database Flow:

1. **Signup creates:**
   - Record in `auth.users` (Supabase Auth)
   - User metadata with full name

2. **Onboarding creates:**
   - Record in `merchants` table
   - Record in `merchant_users` table (links user to merchant)

3. **Result:**
   - User can log in
   - User has merchant account
   - User can access admin dashboard

---

## Customization Options

### 1. Add More Fields to Signup
Edit `src/pages/signup.jsx`:
```javascript
const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',          // Add this
    companyName: ''     // Add this
});
```

### 2. Change Password Requirements
```javascript
if (formData.password.length < 8) {  // Change from 6 to 8
    setError('Password must be at least 8 characters');
    return false;
}

// Add complexity check
if (!/[A-Z]/.test(formData.password)) {
    setError('Password must contain at least one uppercase letter');
    return false;
}
```

### 3. Add Terms & Conditions Checkbox
```javascript
const [acceptedTerms, setAcceptedTerms] = useState(false);

// In form:
<label className="flex items-center gap-2">
    <input
        type="checkbox"
        checked={acceptedTerms}
        onChange={(e) => setAcceptedTerms(e.target.checked)}
    />
    <span>I agree to the Terms of Service</span>
</label>

// In validation:
if (!acceptedTerms) {
    setError('Please accept the Terms of Service');
    return false;
}
```

---

## Troubleshooting

### Issue: "User already registered" error
**Solution:** User exists. Direct them to login page.

### Issue: No email confirmation sent
**Check:**
1. Supabase email settings configured
2. SMTP settings are correct
3. Check spam folder

### Issue: Creates user but doesn't redirect
**Check:**
1. Look at browser console for errors
2. Verify `useAuth` hook is working
3. Check `isAuthenticated` state updates

### Issue: Redirects to onboarding but no merchant created
**This is expected!** Onboarding happens after signup.
1. Signup creates auth user
2. Onboarding creates merchant

---

## Security Best Practices

### ✅ Implemented:
- Password minimum length
- Email validation
- Password confirmation
- Supabase secure auth
- HTTPS recommended for production

### 🔄 Recommended Additions:
- reCAPTCHA to prevent bots
- Email verification before access
- Password strength meter
- Rate limiting signup attempts
- Two-factor authentication (optional)

---

## Summary

✅ **Created:** Full-featured merchant signup form  
✅ **Integrated:** Links between signup → onboarding → dashboard  
✅ **Validated:** Email, password, and input validation  
✅ **Connected:** Supabase auth with automatic user creation  
✅ **Responsive:** Beautiful UI matching your existing design

Users can now:
1. Create an account at `/signup`
2. Complete onboarding
3. Start using the admin dashboard

All without any manual database setup!
