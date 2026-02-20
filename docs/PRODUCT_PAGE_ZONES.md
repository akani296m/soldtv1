# Product Page Section Zones

## Overview

The product page now supports zone-based section rendering, allowing sections to declare where they should appear on the page. This solves the issue where all dynamic sections were rendering at the bottom instead of inside the product info column.

## Available Zones

Sections on the product page can render in three zones:

### 1. **Trust Zone** (`trust`)
- **Location**: Inside the product info column, below the add-to-cart button
- **Purpose**: Trust signals and badges (shipping info, security, returns, etc.)
- **Examples**: `product_trust`
- **Styling**: Compact, icon-based layout integrated with the product info

### 2. **Inline Zone** (`inline`)
- **Location**: Inside the product info column, below the trust zone
- **Purpose**: Product-specific content that should appear next to the product image
- **Examples**: `product_tabs` (specifications, shipping, care instructions)
- **Styling**: Optimized for narrow column layout, no horizontal padding

### 3. **Bottom Zone** (`bottom`)
- **Location**: Full-width sections below the product grid
- **Purpose**: Cross-sell content and page-wide elements
- **Examples**: `related_products`, `newsletter`, `rich_text`
- **Styling**: Full-width with standard section padding

## How It Works

### 1. Section Metadata
Each section component declares its zone in the `sectionMeta` object:

```javascript
ProductTabsSection.sectionMeta = {
    type: 'product_tabs',
    name: 'Product Tabs',
    description: 'Display product details in an accordion-style tabbed interface',
    icon: 'AlignLeft',
    pageTypes: ['product'],
    zone: 'inline', // ← Zone declaration
    defaultSettings: { ... }
};
```

### 2. Zone Filtering
The ProductDetail page automatically filters sections by zone:

```javascript
import { getSectionZone, SECTION_ZONES } from '../../components/storefront/sections';

// Filter sections by zone
const trustSections = sections.filter(s =>
    s.visible && getSectionZone(s.type) === SECTION_ZONES.TRUST
);

const inlineSections = sections.filter(s =>
    s.visible && getSectionZone(s.type) === SECTION_ZONES.INLINE
);

const bottomSections = sections.filter(s =>
    s.visible && getSectionZone(s.type) === SECTION_ZONES.BOTTOM
);
```

### 3. Zone Rendering
Each zone renders in its designated location:

```jsx
{/* Inside product info column */}
<div className="flex flex-col">
    {/* Product title, price, description, quantity, add-to-cart */}
    
    {/* Trust Zone */}
    <SectionRenderer sections={trustSections} ... />
    
    {/* Inline Zone */}
    {inlineSections.length > 0 && (
        <div className="mt-8">
            <SectionRenderer sections={inlineSections} ... />
        </div>
    )}
</div>

{/* Bottom Zone - full width */}
<SectionRenderer sections={bottomSections} ... />
```

## Current Section Mappings

| Section Type | Zone | Reasoning |
|--------------|------|-----------|
| `product_trust` | `trust` | Trust signals belong with the purchase decision |
| `product_tabs` | `inline` | Product details complement the product info |
| `related_products` | `bottom` | Cross-sell needs full width for product grid |
| `newsletter` | `bottom` | Page-wide marketing element |
| `rich_text` | `bottom` (default) | Flexible, typically full-width content |

## Adding New Sections

When creating a new product page section:

1. **Decide on the zone**: Where should this section appear?
2. **Add the zone to sectionMeta**:
   ```javascript
   YourSection.sectionMeta = {
       type: 'your_section',
       zone: 'inline', // or 'trust' or 'bottom'
       pageTypes: ['product'],
       // ... other metadata
   };
   ```
3. **Style appropriately**:
   - **Inline sections**: No horizontal padding, compact layout
   - **Bottom sections**: Full padding and width
   - **Trust sections**: Minimal spacing, icon-based

## Benefits

✅ **Scalable**: New section types automatically render in the correct location  
✅ **No CSS hacks**: Pure component-based positioning  
✅ **Merchant-friendly**: Sections appear where users expect them  
✅ **Maintainable**: No hardcoded type arrays to update  
✅ **Flexible**: Easy to add new zones if needed

## Migration Notes

- Old hardcoded type checking has been replaced with zone-based filtering
- Existing sections automatically default to `bottom` zone if no zone is specified
- ProductTabsSection layout has been optimized for inline rendering
