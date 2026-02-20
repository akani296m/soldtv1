# Collection Carousel Section

## Overview
The Collection Carousel Section is a new storefront section that displays products from a selected collection in a beautiful, scrollable carousel format. Merchants can add this section to their homepage or any other page through the storefront editor.

## Features

### For Customers (Storefront)
- **Smooth Carousel Navigation**: Scroll through collection products with arrow buttons
- **Auto-Scroll**: Optional automatic scrolling through products
- **Responsive Design**: Adapts to different screen sizes
- **Hover Effects**: Product images scale on hover with "View Product" CTA
- **Scroll Indicators**: Dots showing current position in the carousel
- **Touch/Swipe Support**: Mobile-friendly scrolling

### For Merchants (Editor)
- **Collection Selector**: Dropdown showing all active collections with product counts
- **Customization Options**:
  - Choose which collection to display
  - Toggle collection name display
  - Show/hide product prices
  - Show/hide navigation arrows
  - Set items per view (2-6 products)
  - Enable auto-scroll with customizable speed
  - Set fallback title and subtitle

## Usage Guide

### Adding the Section

1. **Navigate to Storefront Editor**
   - Go to your merchant dashboard
   - Click "Edit My Store" → "Theme Editor"

2. **Add Collection Carousel Section**
   - Click "+ Add Section"
   - Look for "Collection Carousel" in the sections list
   - Click to add it to your page

3. **Configure the Section**
   - **Select Collection**: Choose from your active collections
   - **Display Settings**:
     - Toggle "Show Collection Name as Title" to use collection name
     - Toggle "Show Product Prices" to display pricing
     - Toggle "Show Navigation Arrows" for carousel controls
   - **Layout Settings**:
     - Set "Items Per View" (2-6 products visible at once)
   - **Auto-Scroll** (optional):
     - Enable "Auto-Scroll Carousel"
     - Set scroll speed in milliseconds (2000-10000ms)

4. **Save Your Changes**
   - Click "Save" in the editor
   - Preview your storefront to see the carousel in action

### Best Practices

1. **Collection Size**: Works best with collections containing 4+ products
2. **Product Images**: Use high-quality images with consistent aspect ratios
3. **Items Per View**: 
   - Desktop: 4 items works well for most layouts
   - Consider fewer items (2-3) for smaller screens
4. **Auto-Scroll**: Use sparingly - 5-7 seconds is a good speed
5. **Section Placement**: Works great on homepage or collection landing pages

## Technical Details

### Settings Schema

```javascript
{
  title: 'Shop the Collection',              // Fallback title
  subtitle: '',                                // Optional subtitle
  collection_id: null,                         // Selected collection ID
  show_collection_name: true,                  // Use collection name as title
  show_prices: true,                           // Display product prices
  show_navigation: true,                       // Show arrow buttons
  items_per_view: 4,                          // Products visible at once (2-6)
  auto_scroll: false,                         // Enable auto-scrolling
  scroll_interval: 5000                       // Auto-scroll speed in ms
}
```

### Data Flow

1. **Section Added**: Merchant adds section in editor
2. **Collection Selected**: Merchant chooses a collection from dropdown
3. **Data Fetch**: Component fetches collection and associated products from Supabase
4. **Rendering**: Products displayed in carousel with configured settings
5. **Interaction**: Customers can scroll, click products, or watch auto-scroll

### Component Files

- **Section Component**: `/src/components/storefront/sections/CollectionCarouselSection.jsx`
- **Section Registry**: `/src/components/storefront/sections/index.js`
- **Editor Integration**: `/src/pages/storefront-editor/components/SectionEditor.jsx`

## Empty States

The section handles empty/error states gracefully:

1. **No Collection Selected** (In Editor)
   - Shows placeholder with folder icon
   - Message: "Select a collection in the editor settings"

2. **Collection Loading**
   - Shows skeleton loading animation
   - Prevents layout shift

3. **Empty Collection**
   - Shows package icon
   - Message: "[Collection Name] doesn't have any products yet"

4. **No Collections Available** (In Editor)
   - Dropdown shows "No collections available"
   - Helpful text: "Create a collection first to use this section"

## Dependencies

- **CollectionContext**: Fetches merchant's collections
- **Supabase**: Queries `collections` and `collection_products` tables
- **React Router**: Links to product detail pages

## Styling

- **Carousel Container**: Full width, hides scrollbar
- **Product Cards**: Aspect ratio 3:4, hover scale effect
- **Navigation Buttons**: Appear on hover (desktop), always visible (mobile)
- **Indicators**: Centered dots below carousel
- **Responsive**: Grid columns adjust based on `items_per_view` setting

## Browser Compatibility

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Touch/swipe gestures on mobile
- ⚠️ Smooth scrolling may vary on older browsers

## Performance Considerations

1. **Image Loading**: Products load images on-demand
2. **Auto-Scroll**: Uses interval cleanup to prevent memory leaks
3. **Scroll Position**: Tracks position efficiently without excessive re-renders
4. **Collection Query**: Fetches once on mount, caches results

## Future Enhancements

- **Drag to Scroll**: Add mouse drag functionality for desktop
- **Lazy Loading**: Load product images as they come into view
- **Collection Analytics**: Track which products are clicked
- **Quick View**: Modal preview without leaving page
- **Add to Cart**: Quick add to cart from carousel
- **Multiple Collections**: Display products from multiple collections
- **Filter Options**: Let customers filter by price, availability, etc.

## Troubleshooting

### Section not showing products
- ✅ Check collection has active products
- ✅ Verify collection itself is active
- ✅ Ensure products have images uploaded
- ✅ Check collection_id is set in settings

### Collection not in dropdown
- ✅ Collection must be set to "Active"
- ✅ Collection must belong to the current merchant
- ✅ Check browser console for errors

### Carousel not scrolling
- ✅ Verify products.length > items_per_view
- ✅ Check browser console for JavaScript errors
- ✅ Try disabling auto-scroll and using manual nav first

## Related Features

- **Collections Management**: `/products/collections`
- **Collection Editor**: `/products/collections/create` and `/edit`
- **Featured Products Section**: Similar layout, different data source
- **Related Products Section**: Product-page equivalent

## Support

For issues or questions:
1. Check browser console for errors
2. Verify collection has products and is active
3. Review section settings in editor
4. Check database migration completed successfully
