import React, { useMemo, useState } from 'react';
import {
    Monitor,
    Smartphone,
    Tablet,
    ExternalLink,
    Package,
    Search,
    Share2
} from 'lucide-react';
import SectionRenderer from '../../../components/storefront/SectionRenderer';
import { PAGE_TYPES, PAGE_TYPE_CONFIG, getSectionComponent } from '../../../components/storefront/sections';
import { SECTION_ZONE_KEYS } from '../../../lib/sectionZones';
import Footer from '../../../storefront/components/Footer';
import { parseFooterConfig } from '../../../lib/footerConfig';

function getImageUrl(imageItem) {
    if (!imageItem) return null;
    if (typeof imageItem === 'string') return imageItem;
    if (imageItem.url) return getImageUrl(imageItem.url);
    return null;
}

function zoneFilter(sections, zone) {
    return sections
        .filter(section => section.zone === zone)
        .sort((a, b) => a.position - b.position);
}

export default function LivePreview({
    sections,
    selectedSectionId,
    onSelectSection,
    merchant = null,
    merchantSlug,
    products = [],
    productsLoading = false,
    pageType = PAGE_TYPES.HOME,
    onFooterClick = null,
    previewProduct = null
}) {
    const [device, setDevice] = useState('desktop');

    const deviceWidths = {
        desktop: 'w-full',
        tablet: 'w-[768px]',
        mobile: 'w-[375px]'
    };

    const basePath = `/s/${merchantSlug || 'preview'}`;
    const pageConfig = PAGE_TYPE_CONFIG[pageType];

    // Parse footer config from merchant data
    const footerConfig = useMemo(() => {
        if (!merchant?.menu_config) return parseFooterConfig(null);
        return parseFooterConfig(merchant.menu_config);
    }, [merchant?.menu_config]);

    const storeName = merchant?.store_name || merchant?.business_name || 'Your Store';
    const logoUrl = merchant?.logo_url || null;

    const announcementBars = useMemo(() => {
        return sections
            .filter(section =>
                section.zone === SECTION_ZONE_KEYS.HEADER_ANNOUNCEMENT || section.type === 'announcement_bar'
            )
            .sort((a, b) => a.position - b.position);
    }, [sections]);

    const homeSections = useMemo(() => zoneFilter(sections, SECTION_ZONE_KEYS.HOME_MAIN), [sections]);
    const catalogTopSections = useMemo(() => zoneFilter(sections, SECTION_ZONE_KEYS.CATALOG_TOP), [sections]);
    const catalogBottomSections = useMemo(() => zoneFilter(sections, SECTION_ZONE_KEYS.CATALOG_BOTTOM), [sections]);
    const productTopSections = useMemo(() => zoneFilter(sections, SECTION_ZONE_KEYS.PRODUCT_TOP), [sections]);
    const productTrustSections = useMemo(() => zoneFilter(sections, SECTION_ZONE_KEYS.PRODUCT_INFO_TRUST), [sections]);
    const productInlineSections = useMemo(() => zoneFilter(sections, SECTION_ZONE_KEYS.PRODUCT_INFO_INLINE), [sections]);
    const productBottomSections = useMemo(() => zoneFilter(sections, SECTION_ZONE_KEYS.PRODUCT_BOTTOM), [sections]);

    const renderPageContent = () => {
        switch (pageType) {
            case PAGE_TYPES.CATALOG:
                return (
                    <div className="bg-gray-50 min-h-[400px]">
                        <SectionRenderer
                            sections={catalogTopSections}
                            basePath={basePath}
                            products={products}
                            productsLoading={productsLoading}
                            isEditing={true}
                            selectedSectionId={selectedSectionId}
                            onSectionClick={onSelectSection}
                        />

                        <div className="max-w-7xl mx-auto px-6 py-8">
                            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <div className="w-full h-10 bg-gray-100 rounded-lg pl-10 flex items-center text-gray-400 text-sm">
                                            Search products...
                                        </div>
                                    </div>
                                    <div className="h-10 w-32 bg-gray-100 rounded-lg"></div>
                                    <div className="h-10 w-32 bg-gray-100 rounded-lg"></div>
                                </div>
                            </div>

                            <div className={`grid gap-6 ${device === 'mobile' ? 'grid-cols-2' : 'grid-cols-4'}`}>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                    <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
                                        <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
                                            <Package className="text-gray-300" size={32} />
                                        </div>
                                        <div className="p-4">
                                            <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                                            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                                            <div className="h-4 bg-gray-100 rounded w-16"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <SectionRenderer
                            sections={catalogBottomSections}
                            basePath={basePath}
                            products={products}
                            productsLoading={productsLoading}
                            isEditing={true}
                            selectedSectionId={selectedSectionId}
                            onSectionClick={onSelectSection}
                        />
                    </div>
                );

            case PAGE_TYPES.PRODUCT: {
                const productImages = previewProduct?.images && Array.isArray(previewProduct.images) && previewProduct.images.length > 0
                    ? previewProduct.images.map(img => getImageUrl(img)).filter(Boolean)
                    : [];
                const hasImages = productImages.length > 0;
                const inStock = previewProduct?.inventory && previewProduct.inventory > 0;

                return (
                    <div className="bg-white min-h-[400px]">
                        <SectionRenderer
                            sections={productTopSections}
                            basePath={basePath}
                            products={products}
                            productsLoading={productsLoading}
                            isEditing={true}
                            selectedSectionId={selectedSectionId}
                            onSectionClick={onSelectSection}
                        />

                        <div className="max-w-7xl mx-auto px-6 py-8">
                            {!previewProduct ? (
                                <div className="text-center py-12">
                                    <Package className="mx-auto text-gray-300 mb-4" size={64} />
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Products Yet</h3>
                                    <p className="text-sm text-gray-500">
                                        Add products to your store to preview the product page layout.
                                    </p>
                                </div>
                            ) : (
                                <div className={`grid gap-8 ${device === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                                    <div className="space-y-4">
                                        <div className="aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                                            {hasImages ? (
                                                <img
                                                    src={productImages[0]}
                                                    alt={previewProduct.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                                                    <Package className="text-gray-300 mb-2" size={64} />
                                                    <span className="text-gray-400 text-sm">No image</span>
                                                </div>
                                            )}
                                        </div>

                                        {hasImages && productImages.length > 1 && (
                                            <div className="grid grid-cols-4 gap-2">
                                                {productImages.slice(0, 4).map((img, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${idx === 0 ? 'border-black' : 'border-transparent'}`}
                                                    >
                                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        {previewProduct.category && (
                                            <span className="text-sm text-gray-500 uppercase tracking-wider">
                                                {previewProduct.category}
                                            </span>
                                        )}

                                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                            {previewProduct.title}
                                        </h1>

                                        <div className="flex items-center gap-4 pb-6 border-b">
                                            <span className="text-2xl font-bold">
                                                R {Number(previewProduct.price || 0).toLocaleString('en-ZA', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}
                                            </span>
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {inStock ? 'In Stock' : 'Out of Stock'}
                                            </span>
                                        </div>

                                        {previewProduct.description && (
                                            <div>
                                                <h3 className="font-bold text-sm uppercase mb-2">Description</h3>
                                                <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">
                                                    {previewProduct.description}
                                                </p>
                                            </div>
                                        )}

                                        {previewProduct.tags && Array.isArray(previewProduct.tags) && previewProduct.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {previewProduct.tags.slice(0, 4).map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <div className={`flex-1 h-12 ${inStock ? 'bg-gray-900' : 'bg-gray-300'} rounded-lg flex items-center justify-center`}>
                                                <span className="text-white font-medium text-sm">
                                                    {inStock ? 'Add to Cart' : 'Out of Stock'}
                                                </span>
                                            </div>
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <Share2 size={18} className="text-gray-500" />
                                            </div>
                                        </div>

                                        <SectionRenderer
                                            sections={productTrustSections}
                                            basePath={basePath}
                                            products={products}
                                            productsLoading={productsLoading}
                                            isEditing={true}
                                            selectedSectionId={selectedSectionId}
                                            onSectionClick={onSelectSection}
                                        />

                                        <SectionRenderer
                                            sections={productInlineSections}
                                            basePath={basePath}
                                            products={products}
                                            productsLoading={productsLoading}
                                            isEditing={true}
                                            selectedSectionId={selectedSectionId}
                                            onSectionClick={onSelectSection}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <SectionRenderer
                            sections={productBottomSections}
                            basePath={basePath}
                            products={products}
                            productsLoading={productsLoading}
                            isEditing={true}
                            selectedSectionId={selectedSectionId}
                            onSectionClick={onSelectSection}
                        />
                    </div>
                );
            }

            case PAGE_TYPES.HOME:
            default:
                return (
                    <SectionRenderer
                        sections={homeSections}
                        basePath={basePath}
                        products={products}
                        productsLoading={productsLoading}
                        isEditing={true}
                        selectedSectionId={selectedSectionId}
                        onSectionClick={onSelectSection}
                    />
                );
        }
    };

    const renderAnnouncementBars = () => {
        return announcementBars.map((section) => {
            const AnnouncementComponent = getSectionComponent(section.type);
            if (!AnnouncementComponent) return null;

            const isSelected = selectedSectionId === section.id;
            const isHidden = !section.visible;

            return (
                <div
                    key={section.id}
                    className={[
                        'relative transition-all duration-200',
                        isHidden ? 'opacity-40' : '',
                        isSelected ? 'ring-2 ring-blue-500 ring-inset' : '',
                        onSelectSection ? 'cursor-pointer' : ''
                    ].join(' ')}
                    onClick={() => onSelectSection && onSelectSection(section.id)}
                >
                    {isHidden && (
                        <div className="absolute top-2 right-2 z-10 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                            Hidden
                        </div>
                    )}

                    <div className="absolute top-2 left-2 z-10 bg-blue-500 text-white text-xs px-2 py-1 rounded capitalize">
                        {section.type.replace(/_/g, ' ')}
                    </div>

                    <AnnouncementComponent
                        settings={section.settings}
                        basePath={basePath}
                    />
                </div>
            );
        });
    };

    return (
        <div className="h-full flex flex-col bg-gray-100">
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-700">
                        {pageConfig?.label || 'Live Preview'}
                    </h3>
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                        Real-time
                    </span>
                </div>

                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setDevice('desktop')}
                        className={`p-2 rounded-md transition ${device === 'desktop' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                        title="Desktop view"
                    >
                        <Monitor size={18} className={device === 'desktop' ? 'text-blue-500' : 'text-gray-500'} />
                    </button>
                    <button
                        onClick={() => setDevice('tablet')}
                        className={`p-2 rounded-md transition ${device === 'tablet' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                        title="Tablet view"
                    >
                        <Tablet size={18} className={device === 'tablet' ? 'text-blue-500' : 'text-gray-500'} />
                    </button>
                    <button
                        onClick={() => setDevice('mobile')}
                        className={`p-2 rounded-md transition ${device === 'mobile' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                        title="Mobile view"
                    >
                        <Smartphone size={18} className={device === 'mobile' ? 'text-blue-500' : 'text-gray-500'} />
                    </button>
                </div>

                {merchantSlug && (
                    <a
                        href={basePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
                    >
                        <span>Open Store</span>
                        <ExternalLink size={14} />
                    </a>
                )}
            </div>

            <div className="flex-1 overflow-auto p-4 flex justify-center">
                <div
                    className={`${deviceWidths[device]} bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300 origin-top`}
                    style={{
                        maxHeight: 'calc(100vh - 200px)',
                        transform: device !== 'desktop' ? 'scale(0.85)' : 'scale(1)'
                    }}
                >
                    <div className="overflow-y-auto max-h-[calc(100vh-220px)]">
                        {renderAnnouncementBars()}

                        <nav className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-sm">Your Store</span>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className={pageType === PAGE_TYPES.HOME ? 'text-black font-medium' : ''}>Home</span>
                                    <span className={pageType === PAGE_TYPES.CATALOG ? 'text-black font-medium' : ''}>Shop</span>
                                    <span>Cart</span>
                                </div>
                            </div>
                        </nav>

                        {renderPageContent()}

                        <div
                            className={`relative transition-all cursor-pointer group ${onFooterClick ? 'hover:ring-2 hover:ring-blue-400 hover:ring-inset' : ''}`}
                            onClick={() => onFooterClick && onFooterClick()}
                        >
                            {onFooterClick && (
                                <div className="absolute top-2 left-2 z-10 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    Click to edit footer
                                </div>
                            )}
                            <Footer
                                storeName={storeName}
                                logoUrl={logoUrl}
                                basePath={basePath}
                                footerConfig={footerConfig}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
