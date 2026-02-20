# Product Tabs Section - Usage Guide

## Overview
The **Product Tabs Section** is an accordion-style component designed for product detail pages. It allows you to organize detailed product information (specifications, shipping info, care instructions, warranty, etc.) in a clean, expandable interface. This helps keep your product pages organized without overwhelming customers with too much information at once.

![Product Tabs Preview](preview-mockup.png)

## Features
- ✅ **Accordion-style interface** - Expandable/collapsible tabs
- ✅ **Customizable icons** - Choose from 5 pre-built icons (Package, Truck, Sparkles, Shield, Info)
- ✅ **3 Style variants** - Modern (cards), Minimal (lines), Bordered
- ✅ **Rich text content** - Support for HTML content in tabs
- ✅ **Flexible behavior** - Allow single or multiple tabs open at once
- ✅ **Fully customizable** - Colors, text, and layout options
- ✅ **Mobile responsive** - Works beautifully on all screen sizes
- ✅ **Smooth animations** - Premium micro-interactions

## How to Use in the Storefront Editor

### 1. Adding the Section
1. Navigate to a **Product Template** in your editor
2. Click **"Add Section"**
3. Select **"Product Tabs"** from the list
4. The section will be added to your product page template

### 2. Configuring the Section
The Product Tabs section has several customization options:

#### Basic Settings
- **Section Title**: Main heading above the tabs (e.g., "Product Details")
- **Section Subtitle**: Optional subheading for context (e.g., "Everything you need to know")

#### Tab Configuration
Each tab has three properties:
- **Label**: The tab heading (e.g., "Shipping & Returns")
- **Icon**: Visual icon for the tab (Package, Truck, Sparkles, Shield, Info)
- **Content**: The detailed content (supports HTML)

**Example Tab:**
```
Label: "Shipping & Returns"
Icon: "Truck"
Content: 
<p>📦 <strong>Free Standard Shipping</strong> on orders over R 1,500</p>
<p>✈️ <strong>Express Shipping</strong> available (1-2 business days)</p>
<p>🔄 <strong>30-Day Returns</strong> on all items</p>
```

#### Style Options
- **Style**: Choose from:
  - **Modern** - Cards with subtle shadows (recommended)
  - **Minimal** - Simple line separators
  - **Bordered** - Outlined boxes

#### Behavior Settings
- **Allow Multiple Tabs Open**: Check to let users expand multiple tabs simultaneously
- **Default Open Tab**: Which tab should be expanded by default (0 = first, -1 = none)
- **Show Tab Icons**: Toggle icon visibility

#### Color Customization
- **Background Color**: Overall section background
- **Accent Color**: Icon fill and active tab color
- **Text Color**: Main text color
- **Border Color**: Tab border color

## Default Tabs (Recommended)

The section comes with 4 pre-configured tabs that work great for most products:

### 1. Product Specifications 📦
- Material details
- Dimensions
- Weight
- Color options
- Technical specs

### 2. Shipping & Returns 🚚
- Shipping costs and timeframes
- Return policy
- Guarantee information

### 3. Care Instructions ✨
- Washing/cleaning instructions
- Storage recommendations
- Maintenance tips

### 4. Warranty & Support 🛡️
- Warranty coverage
- Customer support hours
- Contact information

## Best Practices

### Content Guidelines
1. **Keep it scannable** - Use bullet points and short paragraphs
2. **Use formatting** - Bold key points and use emojis for visual interest
3. **Be specific** - Provide concrete details, not vague descriptions
4. **Update regularly** - Keep shipping times and policies current

### Design Tips
1. **Start with 3-4 tabs** - Don't overwhelm users with too many options
2. **Use relevant icons** - Icons should match the tab content
3. **Set a default open** - Have the most important tab open by default
4. **Match your brand** - Use accent colors that align with your brand
5. **Test on mobile** - Ensure content is readable on smaller screens

### Common Tab Topics
- Product Specifications
- Shipping & Delivery
- Returns & Exchanges
- Care Instructions
- Warranty Information
- Size Guide
- Materials & Sustainability
- Assembly Instructions

## Example Configurations

### Minimal Fashion Store
```
Style: Minimal
Default Open: -1 (all closed)
Tabs:
  1. Size Guide (Info icon)
  2. Materials & Care (Sparkles icon)
  3. Shipping (Truck icon)
```

### Premium Electronics
```
Style: Modern
Default Open: 0 (first tab)
Show Icons: Yes
Tabs:
  1. Tech Specs (Package icon)
  2. What's in the Box (Package icon)
  3. Warranty & Support (Shield icon)
  4. Shipping (Truck icon)
```

### Handmade Products
```
Style: Bordered
Allow Multiple Open: Yes
Tabs:
  1. About This Item (Info icon)
  2. Materials Used (Sparkles icon)
  3. Care Instructions (Sparkles icon)
  4. Shipping (Truck icon)
```

## HTML Content Tips

You can use HTML in tab content for rich formatting:

```html
<!-- Bold text -->
<p><strong>Bold text here</strong></p>

<!-- Lists -->
<ul>
  <li>First item</li>
  <li>Second item</li>
</ul>

<!-- Line breaks -->
<p>First line<br>Second line</p>

<!-- Links -->
<p>Read our <a href="/shipping-policy">full shipping policy</a></p>

<!-- Emojis for visual interest -->
<p>✅ Free shipping</p>
<p>🔄 Easy returns</p>
```

## Technical Details

### Component Location
`/src/components/storefront/sections/ProductTabsSection.jsx`

### Section Type
`product_tabs`

### Available For
Product pages only (via `pageTypes: ['product']`)

### Props Accepted
- `settings` - Configuration object from the database
- `product` - Product data (optional, for future dynamic content)

## Troubleshooting

**Q: Tabs aren't showing up**  
A: Make sure you've added the section to a Product Template, not the Home or Catalog page. This section is product-page only.

**Q: Content is cut off**  
A: The max height is set to 1000px. If you have very long content, users can still scroll within the tab.

**Q: Icons not displaying**  
A: Ensure `show_icons` is set to `true` in the settings and you've selected a valid icon from the dropdown.

**Q: Multiple tabs open when they shouldn't be**  
A: Check that `allow_multiple_open` is set to `false` in the settings.

## Support

For additional help or feature requests, contact the development team or refer to the main storefront documentation.

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Author**: Antigravity Development Team
