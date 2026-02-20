# Theme System Implementation

## Overview

The theme system allows merchants to customize their storefronts with pre-built themes or custom settings. It uses a hierarchical resolution system that deep-merges default → preset → merchant overrides to ensure no missing values.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Database                              │
├─────────────────────────────────────────────────────────────┤
│  themes table          │  merchants table                    │
│  - id                  │  - theme_id (FK → themes)          │
│  - name, slug          │  - theme_settings (JSONB)          │
│  - settings (JSONB)    │  - theme_version                   │
│  - version             │                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Theme Resolution                         │
│                   src/lib/theme/resolver.js                 │
├─────────────────────────────────────────────────────────────┤
│  resolveTheme(presetSettings, merchantSettings)             │
│  ├── Start with defaultTheme (all keys defined)            │
│  ├── Deep merge presetSettings (from themes table)         │
│  └── Deep merge merchantSettings (from merchants table)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   CSS Variable Generation                    │
│                src/lib/theme/cssVariables.js                │
├─────────────────────────────────────────────────────────────┤
│  generateCssVariables(resolvedTheme)                        │
│  ├── Color variables (--color-primary, --color-primary-rgb) │
│  ├── Typography variables (--font-heading, --font-body)     │
│  ├── Spacing variables (--spacing-section, --spacing-card)  │
│  ├── Border radius (--radius-sm, --radius-md, --radius-lg)  │
│  └── Shadow styles (--shadow-sm, --shadow-md, --shadow-lg)  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Theme Context                           │
│                 src/context/ThemeContext.jsx                │
├─────────────────────────────────────────────────────────────┤
│  ThemeProvider                                               │
│  ├── Resolves theme from preset + merchant settings         │
│  ├── Generates CSS variables                                │
│  ├── Applies variables to document.documentElement          │
│  ├── Sets data-theme attribute on body                      │
│  └── Provides theme context to children                     │
│                                                              │
│  useTheme() Hook                                             │
│  ├── theme - Full resolved theme object                     │
│  ├── colors, typography, spacing, buttons - Shortcuts       │
│  ├── headerVariant, footerVariant, productCardVariant       │
│  └── isDarkMode - Auto-detected from background color       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Variant Components                         │
│              src/storefront/components/                      │
├─────────────────────────────────────────────────────────────┤
│  Header.jsx                                                  │
│  ├── minimal - Logo left, nav center, actions right         │
│  ├── centered - Logo & nav stacked center                   │
│  └── split - Nav left, logo center, actions right           │
│                                                              │
│  Footer.jsx                                                  │
│  ├── columns - Full footer with link columns & newsletter   │
│  ├── simple - Single row with essential links               │
│  └── minimal - Copyright and legal links only               │
│                                                              │
│  ProductCard.jsx                                             │
│  ├── default - Card with image top, info below              │
│  ├── overlay - Full image with hover info overlay           │
│  └── minimal - Clean, simple grid layout                    │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
src/
├── lib/
│   └── theme/
│       ├── index.js          # Main exports
│       ├── defaults.js       # System default theme
│       ├── resolver.js       # Theme resolution logic
│       ├── cssVariables.js   # CSS variable generation
│       └── presets.js        # Pre-built theme presets
│
├── context/
│   └── ThemeContext.jsx      # Theme provider & hook
│
└── storefront/
    ├── components/
    │   ├── Header.jsx        # Variant-based header
    │   ├── Footer.jsx        # Variant-based footer
    │   ├── ProductCard.jsx   # Variant-based product cards
    │   └── StorefrontLayout.jsx  # Main layout with ThemeProvider
    │
    └── utils/
        ├── getMerchantBySlug.js   # Updated to include theme relation
        └── getMerchantByDomain.js # Updated to include theme relation
```

## CSS Variables Reference

### Colors
- `--color-primary` / `--color-primary-rgb`
- `--color-secondary` / `--color-secondary-rgb`
- `--color-accent` / `--color-accent-rgb`
- `--color-background` / `--color-background-rgb`
- `--color-surface` / `--color-surface-rgb`
- `--color-surface-hover`
- `--color-text` / `--color-text-rgb`
- `--color-text-muted`
- `--color-border`
- `--color-success`, `--color-error`, `--color-warning`

### Typography
- `--font-heading`, `--font-heading-weight`
- `--font-body`, `--font-body-weight`
- `--font-paragraph`, `--font-paragraph-weight`
- `--font-size-xs` through `--font-size-3xl`

### Spacing
- `--spacing-section` - Vertical section padding
- `--spacing-container` - Max content width
- `--spacing-grid` - Gap between grid items
- `--spacing-card` - Card internal padding

### Border Radius
- `--radius-none`, `--radius-sm`, `--radius-md`
- `--radius-lg`, `--radius-xl`, `--radius-full`

### Shadows
- `--shadow-none`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`

### Buttons
- `--button-padding`, `--button-font-size`
- `--button-height`, `--button-radius`

## Usage Examples

### Using Theme in Components

```jsx
import { useTheme } from '../context/ThemeContext';

function MyComponent() {
  const { colors, headerVariant, isDarkMode } = useTheme();
  
  return (
    <div style={{ 
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-text)',
      borderRadius: 'var(--radius-md)'
    }}>
      {/* Content */}
    </div>
  );
}
```

### Variant Components

```jsx
// Uses theme's configured variant by default
<Header storeName="My Store" basePath="/s/my-store" />

// Override variant explicitly
<Header variant="centered" storeName="My Store" basePath="/s/my-store" />
```

## Pre-built Themes

| Theme  | Style       | Header    | Footer  | Cards    |
|--------|-------------|-----------|---------|----------|
| Clean  | Minimal     | minimal   | columns | default  |
| Bold   | High Impact | split     | columns | overlay  |
| Luxury | Elegant     | centered  | simple  | minimal  |
| Urban  | Dark Mode   | minimal   | minimal | overlay  |
| Soft   | Playful     | centered  | simple  | default  |

## Database Migration

Run the SQL migration to add the themes table and update merchants:

```sql
-- Already in migrations/themes_table.sql
```

Then seed the pre-built themes:

```sql
-- Already in migrations/seed_themes.sql
```

## Next Steps

1. ~~**Theme Editor UI**~~: ✅ Built - Visual editor in storefront editor sidebar
2. **Live Preview**: Add real-time preview when editing themes (partially implemented)
3. **Premium Themes**: Add paid theme presets for monetization
4. **Theme Versions**: Implement migration logic for when theme structures change

---

## Theme Editor UI

The Theme Editor is integrated into the storefront editor sidebar and provides:

### Accessing the Editor
1. Go to the Storefront Editor
2. Click "Theme settings" at the bottom of the page structure view

### Available Customization Options

| Section | Options |
|---------|---------|
| **Theme Preset** | Select from pre-built themes (Clean, Bold, Luxury, Urban, Soft) |
| **Colors** | Primary, Accent, Background, Surface, Text, Text Muted, Border |
| **Typography** | Heading Font/Weight, Body Font/Weight with live preview |
| **Layout** | Header variant, Footer variant, Product Card variant |
| **Style & Effects** | Border Radius (none to pill), Shadow Intensity |
| **Spacing** | Section Padding, Container Width, Grid Gap |

### Implementation Files
- `src/pages/storefront-editor/hooks/useThemeSettings.js` - State management hook
- `src/pages/storefront-editor/components/ThemeSettings.jsx` - UI component
