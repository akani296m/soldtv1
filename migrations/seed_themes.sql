-- ============================================================
-- SEED THEMES
-- Pre-built theme templates for merchants
-- Run this after the themes table has been created
-- ============================================================

-- Insert Clean theme
INSERT INTO themes (name, slug, description, category, is_free, is_active, version, settings)
VALUES (
    'Clean',
    'clean',
    'Minimal white design with subtle shadows and clean lines',
    'minimal',
    true,
    true,
    1,
    '{
        "colors": {
            "primary": "#000000",
            "secondary": "#555555",
            "accent": "#2563EB",
            "background": "#FFFFFF",
            "surface": "#FAFAFA",
            "surfaceHover": "#F5F5F5",
            "text": "#111111",
            "textMuted": "#666666",
            "border": "#E5E7EB",
            "success": "#22C55E",
            "error": "#EF4444",
            "warning": "#F59E0B"
        },
        "typography": {
            "headingFont": "Inter",
            "headingWeight": "700",
            "bodyFont": "Inter",
            "bodyWeight": "400",
            "paragraphFont": "Inter",
            "paragraphWeight": "400",
            "scale": "normal"
        },
        "spacing": {
            "sectionPadding": "80",
            "containerWidth": "1280",
            "gridGap": "24",
            "cardPadding": "24",
            "density": "normal"
        },
        "layout": {
            "headerVariant": "minimal",
            "footerVariant": "columns",
            "productCardVariant": "default",
            "borderRadius": "md",
            "shadowStyle": "subtle"
        },
        "buttons": {
            "primaryStyle": "filled",
            "secondaryStyle": "outline",
            "borderRadius": "md",
            "size": "md"
        }
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- Insert Bold theme
INSERT INTO themes (name, slug, description, category, is_free, is_active, version, settings)
VALUES (
    'Bold',
    'bold',
    'High contrast with sharp edges and strong shadows',
    'bold',
    true,
    true,
    1,
    '{
        "colors": {
            "primary": "#000000",
            "secondary": "#1A1A1A",
            "accent": "#7C3AED",
            "background": "#FFFFFF",
            "surface": "#F3F4F6",
            "surfaceHover": "#E5E7EB",
            "text": "#000000",
            "textMuted": "#4B5563",
            "border": "#000000",
            "success": "#10B981",
            "error": "#EF4444",
            "warning": "#F59E0B"
        },
        "typography": {
            "headingFont": "Poppins",
            "headingWeight": "800",
            "bodyFont": "Inter",
            "bodyWeight": "500",
            "paragraphFont": "Inter",
            "paragraphWeight": "400",
            "scale": "normal"
        },
        "spacing": {
            "sectionPadding": "100",
            "containerWidth": "1400",
            "gridGap": "32",
            "cardPadding": "28",
            "density": "spacious"
        },
        "layout": {
            "headerVariant": "split",
            "footerVariant": "columns",
            "productCardVariant": "overlay",
            "borderRadius": "none",
            "shadowStyle": "strong"
        },
        "buttons": {
            "primaryStyle": "filled",
            "secondaryStyle": "filled",
            "borderRadius": "none",
            "size": "lg"
        }
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- Insert Luxury theme
INSERT INTO themes (name, slug, description, category, is_free, is_active, version, settings)
VALUES (
    'Luxury',
    'luxury',
    'Elegant serif typography with muted tones and refined spacing',
    'luxury',
    true,
    true,
    1,
    '{
        "colors": {
            "primary": "#1F2937",
            "secondary": "#4B5563",
            "accent": "#B8860B",
            "background": "#FEFEFE",
            "surface": "#F9FAFB",
            "surfaceHover": "#F3F4F6",
            "text": "#1F2937",
            "textMuted": "#6B7280",
            "border": "#E5E7EB",
            "success": "#059669",
            "error": "#DC2626",
            "warning": "#D97706"
        },
        "typography": {
            "headingFont": "Playfair Display",
            "headingWeight": "600",
            "bodyFont": "Inter",
            "bodyWeight": "400",
            "paragraphFont": "Lora",
            "paragraphWeight": "400",
            "scale": "spacious"
        },
        "spacing": {
            "sectionPadding": "120",
            "containerWidth": "1200",
            "gridGap": "32",
            "cardPadding": "32",
            "density": "spacious"
        },
        "layout": {
            "headerVariant": "centered",
            "footerVariant": "simple",
            "productCardVariant": "minimal",
            "borderRadius": "sm",
            "shadowStyle": "subtle"
        },
        "buttons": {
            "primaryStyle": "filled",
            "secondaryStyle": "outline",
            "borderRadius": "sm",
            "size": "md"
        }
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- Insert Urban theme
INSERT INTO themes (name, slug, description, category, is_free, is_active, version, settings)
VALUES (
    'Urban',
    'urban',
    'Streetwear vibes with dark mode and neon accents',
    'urban',
    true,
    true,
    1,
    '{
        "colors": {
            "primary": "#FFFFFF",
            "secondary": "#A3A3A3",
            "accent": "#22C55E",
            "background": "#0A0A0A",
            "surface": "#171717",
            "surfaceHover": "#262626",
            "text": "#FFFFFF",
            "textMuted": "#A3A3A3",
            "border": "#262626",
            "success": "#22C55E",
            "error": "#EF4444",
            "warning": "#FBBF24"
        },
        "typography": {
            "headingFont": "Bebas Neue",
            "headingWeight": "400",
            "bodyFont": "Inter",
            "bodyWeight": "400",
            "paragraphFont": "Inter",
            "paragraphWeight": "400",
            "scale": "normal"
        },
        "spacing": {
            "sectionPadding": "60",
            "containerWidth": "1400",
            "gridGap": "20",
            "cardPadding": "20",
            "density": "compact"
        },
        "layout": {
            "headerVariant": "minimal",
            "footerVariant": "minimal",
            "productCardVariant": "overlay",
            "borderRadius": "lg",
            "shadowStyle": "none"
        },
        "buttons": {
            "primaryStyle": "filled",
            "secondaryStyle": "ghost",
            "borderRadius": "lg",
            "size": "md"
        }
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- Insert Soft theme
INSERT INTO themes (name, slug, description, category, is_free, is_active, version, settings)
VALUES (
    'Soft',
    'soft',
    'Rounded corners with pastel colors and playful vibes',
    'playful',
    true,
    true,
    1,
    '{
        "colors": {
            "primary": "#EC4899",
            "secondary": "#F472B6",
            "accent": "#06B6D4",
            "background": "#FDF2F8",
            "surface": "#FFFFFF",
            "surfaceHover": "#FCE7F3",
            "text": "#831843",
            "textMuted": "#9D174D",
            "border": "#FBCFE8",
            "success": "#10B981",
            "error": "#F43F5E",
            "warning": "#F59E0B"
        },
        "typography": {
            "headingFont": "Outfit",
            "headingWeight": "700",
            "bodyFont": "Outfit",
            "bodyWeight": "400",
            "paragraphFont": "Outfit",
            "paragraphWeight": "400",
            "scale": "normal"
        },
        "spacing": {
            "sectionPadding": "80",
            "containerWidth": "1280",
            "gridGap": "24",
            "cardPadding": "24",
            "density": "normal"
        },
        "layout": {
            "headerVariant": "centered",
            "footerVariant": "simple",
            "productCardVariant": "default",
            "borderRadius": "full",
            "shadowStyle": "medium"
        },
        "buttons": {
            "primaryStyle": "filled",
            "secondaryStyle": "outline",
            "borderRadius": "full",
            "size": "md"
        }
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- Verify themes were inserted
SELECT id, name, slug, category, is_free FROM themes ORDER BY name;
