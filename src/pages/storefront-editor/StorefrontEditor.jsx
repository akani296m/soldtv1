import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Store, ArrowLeft, Home, LayoutGrid, Package, ChevronDown } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSections } from '../../hooks/useSections';
import { useAdminMerchant } from '../../context/adminMerchantContext';
import { useProducts } from '../../context/productcontext';
import { PAGE_TYPES, PAGE_TYPE_CONFIG } from '../../components/storefront/sections';
import EditorSidebar from './components/EditorSidebar';
import LivePreview from './components/LivePreview';

// Icon mapping for page types
const PAGE_ICONS = {
    [PAGE_TYPES.HOME]: Home,
    [PAGE_TYPES.CATALOG]: LayoutGrid,
    [PAGE_TYPES.PRODUCT]: Package
};

/**
 * Main Storefront Editor Page
 * Split view with live preview on left and editor sidebar on right
 * Supports editing sections for Home, Catalog, and Product pages
 */
export default function StorefrontEditor() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const slugParam = searchParams.get('slug');
    const pageParam = searchParams.get('page');

    // Current page type being edited
    const [currentPageType, setCurrentPageType] = useState(pageParam || PAGE_TYPES.HOME);
    const [showPageDropdown, setShowPageDropdown] = useState(false);

    // Get the merchant the current user has access to
    const {
        merchant: authorizedMerchant,
        merchantId: authorizedMerchantId,
        loading: merchantLoading,
        hasMerchant
    } = useAdminMerchant();

    // Get products for preview
    const { products, loading: productsLoading } = useProducts();

    // Preview product state - track which product to use for product page preview
    const [previewProductId, setPreviewProductId] = useState(null);

    const [merchant, setMerchant] = useState(null);
    const [loadingMerchant, setLoadingMerchant] = useState(true);
    const [merchantError, setMerchantError] = useState(null);
    const [selectedSectionId, setSelectedSectionId] = useState(null);

    // Compute the preview product - use selected product or fallback to first created
    const previewProduct = useMemo(() => {
        if (!products || products.length === 0) return null;

        // If a specific product is selected, use it
        if (previewProductId) {
            const selected = products.find(p => p.id === previewProductId);
            if (selected) return selected;
        }

        // Fallback: use the first product ever created (oldest by created_at)
        // Products are sorted by created_at descending in the context, so we get the last one
        const sortedByCreated = [...products].sort((a, b) =>
            new Date(a.created_at) - new Date(b.created_at)
        );
        return sortedByCreated[0] || null;
    }, [products, previewProductId]);

    // Set merchant data from context
    useEffect(() => {
        if (merchantLoading) {
            setLoadingMerchant(true);
            return;
        }

        if (!hasMerchant || !authorizedMerchant) {
            setMerchantError('You do not have access to any stores. Please complete onboarding first.');
            setLoadingMerchant(false);
            return;
        }

        if (slugParam && slugParam !== authorizedMerchant.slug) {
            console.warn('[StorefrontEditor] Access denied - unauthorized store:', slugParam);
            setMerchantError('You do not have permission to edit this store.');
            setLoadingMerchant(false);
            return;
        }

        setMerchant(authorizedMerchant);
        setMerchantError(null);
        setLoadingMerchant(false);
    }, [merchantLoading, hasMerchant, authorizedMerchant, slugParam]);

    // Use the sections hook with merchant ID AND page type
    const {
        sections,
        loading: loadingSections,
        saving,
        error: sectionsError,
        hasChanges,
        updateSectionSetting,
        toggleSectionVisibility,
        reorderSections,
        addSection,
        removeSection,
        duplicateSection,
        saveSections,
        resetSections
    } = useSections(merchant?.id, currentPageType);

    // Handle page type change
    const handlePageTypeChange = (newPageType) => {
        // Reset selection when changing pages
        setSelectedSectionId(null);
        setCurrentPageType(newPageType);
        setShowPageDropdown(false);

        // Update URL param
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', newPageType);
        setSearchParams(newParams);
    };

    // Show loading state
    if (loadingMerchant) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <Loader2 size={48} className="animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600">Loading storefront editor...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (merchantError || !merchant) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center max-w-md">
                    <Store size={64} className="text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No Store Found</h2>
                    <p className="text-gray-600 mb-4">
                        {merchantError || "We couldn't find your store."}
                    </p>
                    <button
                        onClick={() => navigate('/onboarding')}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        Complete Onboarding
                    </button>
                </div>
            </div>
        );
    }

    const CurrentPageIcon = PAGE_ICONS[currentPageType] || Home;
    const currentPageConfig = PAGE_TYPE_CONFIG[currentPageType];

    return (
        <div className="h-screen flex flex-col">
            {/* Top Bar */}
            <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
                    >
                        <ArrowLeft size={20} />
                        <span className="text-sm font-medium">Back</span>
                    </button>
                    <div className="h-6 w-px bg-gray-200"></div>

                    {/* Store Name */}
                    <div className="flex items-center gap-2">
                        <Store size={20} className="text-blue-500" />
                        <span className="font-semibold text-gray-900">
                            {merchant.store_name || merchant.business_name || 'Your Store'}
                        </span>
                    </div>

                    <div className="h-6 w-px bg-gray-200"></div>

                    {/* Page Type Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowPageDropdown(!showPageDropdown)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                        >
                            <CurrentPageIcon size={16} className="text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">
                                {currentPageConfig?.label || 'Home Page'}
                            </span>
                            <ChevronDown
                                size={16}
                                className={`text-gray-500 transition-transform ${showPageDropdown ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* Dropdown */}
                        {showPageDropdown && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowPageDropdown(false)}
                                />
                                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-20">
                                    {Object.entries(PAGE_TYPE_CONFIG).map(([type, config]) => {
                                        const Icon = PAGE_ICONS[type] || Home;
                                        const isActive = type === currentPageType;

                                        return (
                                            <button
                                                key={type}
                                                onClick={() => handlePageTypeChange(type)}
                                                className={`
                                                    w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition
                                                    ${isActive ? 'bg-blue-50' : ''}
                                                `}
                                            >
                                                <Icon
                                                    size={18}
                                                    className={isActive ? 'text-blue-500' : 'text-gray-500'}
                                                />
                                                <div>
                                                    <p className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                                                        {config.label}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {config.description}
                                                    </p>
                                                </div>
                                                {isActive && (
                                                    <span className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Unsaved indicator */}
                    {hasChanges && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                            Unsaved changes
                        </span>
                    )}
                </div>

                {/* Preview Link */}
                {merchant.slug && (
                    <a
                        href={`/s/${merchant.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:text-blue-600 hover:underline"
                    >
                        View Live Store →
                    </a>
                )}
            </header>

            {/* Loading sections indicator */}
            {loadingSections && (
                <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center gap-2 text-blue-700 text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Loading {currentPageConfig?.label.toLowerCase()} sections...</span>
                </div>
            )}

            {/* Main Content - Split View */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Live Preview */}
                <div className="flex-1 overflow-hidden">
                    <LivePreview
                        sections={sections}
                        selectedSectionId={selectedSectionId}
                        onSelectSection={setSelectedSectionId}
                        merchant={merchant}
                        merchantSlug={merchant.slug}
                        products={products}
                        productsLoading={productsLoading}
                        pageType={currentPageType}
                        previewProduct={previewProduct}
                    />
                </div>

                {/* Right: Editor Sidebar */}
                <div className="w-[400px] border-l border-gray-200 overflow-hidden shrink-0">
                    <EditorSidebar
                        sections={sections}
                        selectedSectionId={selectedSectionId}
                        onSelectSection={setSelectedSectionId}
                        onUpdateSectionSetting={updateSectionSetting}
                        onToggleVisibility={toggleSectionVisibility}
                        onReorderSections={reorderSections}
                        onAddSection={addSection}
                        onDuplicateSection={duplicateSection}
                        onRemoveSection={removeSection}
                        saveSections={saveSections}
                        resetSections={resetSections}
                        saving={saving}
                        hasChanges={hasChanges}
                        error={sectionsError}
                        pageType={currentPageType}
                        products={products}
                        previewProduct={previewProduct}
                        onPreviewProductChange={(nextId) => setPreviewProductId(nextId ? parseInt(nextId, 10) : null)}
                    />
                </div>
            </div>
        </div>
    );
}
