import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
export const PRODUCT_TAB_ICONS = {};

/**
 * Product Tabs Section Component
 * Displays product information (description, shipping, returns, etc.) in an accordion-style interface
 * Updated to match a clean Shopify-like minimal UI (no icons, simple dividers, plain chevrons).
 */
export default function ProductTabsSection({ settings = {}, product = null }) {
  const {
    title = 'Product description',
    subtitle = '',
    tabs = [
      {
        label: 'Product description',
        // NOTE: keep HTML support if you're using a rich text editor
        content:
          'This organic cotton swing shirt is the coziest way to stay warm and stylish! Its long sleeves protect you from the chill while its swing silhouette adds an effortless touch of fashion.'
      },
      {
        label: 'Shipping',
        content:
          'Free standard shipping on orders over R 1,500. Express shipping available. Delivery in 2–5 business days.'
      },
      {
        label: 'Returns',
        content:
          '30-day return policy on all items in original condition. Refunds processed within 3–5 business days after inspection.'
      }
    ],

    // Force minimal style to match the reference UI
    style = 'minimal',

    allow_multiple_open = false,
    default_open_index = 0,

    background_color = '#ffffff',
    text_color = '#111827',
    border_color = '#E5E7EB',

    // Icons are removed / disabled
    show_icons = false
  } = settings;

  // State to track which tabs are open
  const [openTabs, setOpenTabs] = useState(
    default_open_index >= 0 ? [default_open_index] : []
  );

  const toggleTab = (index) => {
    if (allow_multiple_open) {
      setOpenTabs((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setOpenTabs((prev) => (prev.includes(index) ? [] : [index]));
    }
  };

  // Minimal styling to match the screenshot (simple rows + dividers)
  const getTabStyles = () => {
    switch (style) {
      case 'minimal':
      default:
        return {
          container: 'border-b last:border-b-0',
          header: 'py-5 flex items-center justify-between',
          contentWrap: 'overflow-hidden transition-all duration-200 ease-in-out',
          content: 'pb-6',
          title: 'font-medium text-[20px] leading-tight',
          body: 'text-[15px] leading-7 text-gray-600 max-w-[65ch]'
        };
    }
  };

  const tabStyles = getTabStyles();

  const renderTab = (tab, index) => {
    const isOpen = openTabs.includes(index);

    return (
      <div
        key={index}
        className={tabStyles.container}
        style={{
          backgroundColor: background_color,
          borderColor: border_color,
          borderWidth: '0 0 1px 0'
        }}
      >
        <button
          type="button"
          onClick={() => toggleTab(index)}
          className={`w-full text-left ${tabStyles.header}`}
          aria-expanded={isOpen}
        >
          <span className={tabStyles.title} style={{ color: text_color }}>
            {tab.label}
          </span>

          {/* Plain chevron (no circle bg) */}
          <span
            className={`flex-shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            style={{ color: text_color }}
            aria-hidden="true"
          >
            <ChevronDown size={22} />
          </span>
        </button>

        {/* Content */}
        <div
          className={`${tabStyles.contentWrap} ${
            isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className={tabStyles.content}>
            <div
              className={tabStyles.body}
              // Keep HTML support for rich text; remove if you only want plain text.
              dangerouslySetInnerHTML={{ __html: tab.content }}
            />
          </div>
        </div>
      </div>
    );
  };

  if (!tabs || tabs.length === 0) return null;

  return (
    <section className="py-2" style={{ backgroundColor: background_color }}>
      <div>
        {/* Optional header (hide if you want it exactly like the screenshot) */}
        {(title || subtitle) && (
          <div className="mb-2">
            {title && (
              <h2
                className="text-[20px] font-medium"
                style={{ color: text_color }}
              >
                {title}
              </h2>
            )}
            {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
          </div>
        )}

        <div>
          {tabs.map((tab, index) => renderTab(tab, index))}
        </div>
      </div>
    </section>
  );
}

// Section metadata for the editor
ProductTabsSection.sectionMeta = {
  type: 'product_tabs',
  name: 'Product Tabs',
  description: 'Display product details in an accordion-style interface (minimal, no icons)',
  icon: 'AlignLeft',
  pageTypes: ['product'],
  zone: 'inline',
  defaultSettings: {
    title: 'Product description',
    subtitle: '',
    tabs: [
      {
        label: 'Product description',
        content:
          'This organic cotton swing shirt is the coziest way to stay warm and stylish! Its long sleeves protect you from the chill while its swing silhouette adds an effortless touch of fashion.'
      },
      {
        label: 'Shipping',
        content:
          'Free standard shipping on orders over R 1,500. Express shipping available. Delivery in 2–5 business days.'
      },
      {
        label: 'Returns',
        content:
          '30-day return policy on all items in original condition. Refunds processed within 3–5 business days after inspection.'
      }
    ],
    style: 'minimal',
    allow_multiple_open: false,
    default_open_index: 0,
    background_color: '#ffffff',
    text_color: '#111827',
    border_color: '#E5E7EB',
    show_icons: false
  },
  settingsSchema: [
    { key: 'title', type: 'text', label: 'Section Title', placeholder: 'Product description' },
    { key: 'subtitle', type: 'text', label: 'Section Subtitle', placeholder: '' },
    {
      key: 'tabs',
      type: 'array',
      label: 'Tabs',
      itemSchema: [
        { key: 'label', type: 'text', label: 'Tab Label', placeholder: 'Shipping' },
        {
          key: 'content',
          type: 'rich_text',
          label: 'Content',
          placeholder: 'Enter the tab content here. HTML is supported.',
          rows: 5
        }
      ],
      maxItems: 8
    },
    { key: 'allow_multiple_open', type: 'checkbox', label: 'Allow Multiple Tabs Open' },
    {
      key: 'default_open_index',
      type: 'number',
      label: 'Default Open Tab (0 = first, -1 = none)',
      min: -1,
      max: 7
    },
    { key: 'background_color', type: 'color', label: 'Background Color' },
    { key: 'text_color', type: 'color', label: 'Text Color' },
    { key: 'border_color', type: 'color', label: 'Border Color' }
  ]
};
