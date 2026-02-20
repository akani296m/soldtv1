import React, { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useProducts } from '../../context/productcontext';
import SectionRenderer from '../../components/storefront/SectionRenderer';
import { SECTION_TYPES, getSectionDefaults, generateUUID } from '../../components/storefront/sections';

/**
 * StoreHome - Admin Preview Version
 * 
 * This is a simplified version for admin preview that uses default sections.
 * For the actual storefront, see /src/storefront/pages/StoreHome.jsx
 */
export default function StoreHome() {
  const { products, loading: productsLoading } = useProducts();

  // Default sections for admin preview (when no database sections are configured)
  // useMemo to avoid regenerating UUIDs on every render
  const previewSections = useMemo(() => [
    {
      id: generateUUID(),
      type: SECTION_TYPES.HERO,
      position: 0,
      visible: true,
      settings: getSectionDefaults(SECTION_TYPES.HERO)
    },
    {
      id: generateUUID(),
      type: SECTION_TYPES.FEATURED_PRODUCTS,
      position: 1,
      visible: true,
      settings: getSectionDefaults(SECTION_TYPES.FEATURED_PRODUCTS)
    },
    {
      id: generateUUID(),
      type: SECTION_TYPES.NEWSLETTER,
      position: 2,
      visible: true,
      settings: getSectionDefaults(SECTION_TYPES.NEWSLETTER)
    },
    {
      id: generateUUID(),
      type: SECTION_TYPES.TRUST_BADGES,
      position: 3,
      visible: true,
      settings: getSectionDefaults(SECTION_TYPES.TRUST_BADGES)
    }
  ], []);

  return (
    <SectionRenderer
      sections={previewSections}
      basePath="/store"
      products={products}
      productsLoading={productsLoading}
    />
  );
}