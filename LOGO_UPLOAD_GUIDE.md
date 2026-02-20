# Logo Upload Feature - Implementation Guide

## What was added:

### 1. **Branding Settings Component** (`BrandingSettings.jsx`)
   - New component for managing store branding
   - Logo upload functionality using the existing `ImageUploader` component
   - Color scheme customization (primary and accent colors)
   - Live preview of logo and color scheme

### 2. **Updated Editor Sidebar** (`EditorSidebar.jsx`)
   - Added tab navigation to switch between "Sections" and "Branding"
   - Integrated the new `BrandingSettings` component
   - Clean separation of concerns between section editing and branding management

### 3. **Database Migration** (`migrations/add_logo_url.sql`)
   - Adds `logo_url` column to merchants table
   - Safe migration that checks if column exists before adding

## How to use:

### Step 1: Run the database migration
You need to execute the migration in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `/migrations/add_logo_url.sql`
4. Paste and run the migration

Alternatively, if you have the Supabase CLI installed:
```bash
supabase db push migrations/add_logo_url.sql
```

### Step 2: Access the logo upload
1. Navigate to the **Storefront Editor** in your merchant dashboard
2. Click on the **"Branding"** tab in the right sidebar
3. Upload your logo using the image uploader
4. Optionally customize your primary and accent colors
5. Click **"Save Changes"**

### Step 3: Verify on the storefront
1. Visit your live storefront at `/s/{your-slug}`
2. The uploaded logo should appear in the navigation header
3. If no logo is uploaded, the store name will be displayed instead

## Technical Details:

### Logo Storage:
- Logos are stored in Supabase Storage under `product-images/logos/`
- The URL is saved in the `merchants.logo_url` column
- Supported formats: PNG, SVG (recommended), JPG
- Maximum file size: 5MB
- Recommended dimensions: 300px width with transparent background

### Integration Points:
- **Frontend**: `StorefrontLayout.jsx` (lines 106-123) renders the logo
- **Backend**: `useStorefrontSettings` hook manages saving/loading
- **Storage**: Uses existing `uploadImage` utility from `lib/uploadImage.js`

### RLS Policies:
The existing RLS policies on the merchants table should allow:
- Merchants can read their own logo_url
- Merchants can update their own logo_url

If you encounter permission errors, verify your RLS policies allow merchants to update their own records.

## Features:
✅ Logo upload with drag-and-drop support
✅ Image preview before saving
✅ URL input fallback for external images
✅ Color scheme customization
✅ Live preview of changes
✅ Auto-save with success/error notifications
✅ Mobile-responsive design

## Troubleshooting:

**Issue**: Cannot save logo
- Check that the migration has been run
- Verify RLS policies on merchants table
- Ensure user has valid merchant_id in context

**Issue**: Logo not showing on storefront
- Check that logo_url was saved successfully
- Verify the image URL is accessible
- Clear browser cache

**Issue**: Upload fails
- Ensure image is under 5MB
- Check Supabase Storage bucket permissions
- Verify `product-images` bucket exists
