import React, { useMemo, useState } from 'react';
import {
    Loader2,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    GripVertical,
    Eye,
    EyeOff,
    Trash2,
    Copy,
    ChevronRight,
    Lock,
    Settings,
    Package,
    ChevronDown,
    Columns3
} from 'lucide-react';
import SectionEditor from './SectionEditor';
import AddSectionModal from './AddSectionModal';
import ThemeSettings from './ThemeSettings';
import FooterSettings from './FooterSettings';
import { PAGE_TYPES } from '../../../components/storefront/sections';
import { SECTION_ZONE_KEYS } from '../../../lib/sectionZones';

const SECTION_DISPLAY_NAMES = {
    hero: 'Hero',
    featured_products: 'Featured Products',
    newsletter: 'Newsletter',
    trust_badges: 'Trust Badges',
    rich_text: 'Rich Text',
    image_banner: 'Image Banner',
    collection_carousel: 'Collection Carousel',
    announcement_bar: 'Announcement Bar',
    product_trust: 'Product Trust',
    related_products: 'Related Products',
    product_tabs: 'Product Tabs',
    catalog_header: 'Catalog Header',
    us_vs_them: 'Us vs Them',
};

const PAGE_ZONE_BUCKETS = {
    [PAGE_TYPES.HOME]: [
        { zone: SECTION_ZONE_KEYS.HEADER_ANNOUNCEMENT, label: 'Announcement' },
        { zone: SECTION_ZONE_KEYS.HOME_MAIN, label: 'Template' }
    ],
    [PAGE_TYPES.CATALOG]: [
        { zone: SECTION_ZONE_KEYS.CATALOG_TOP, label: 'Top Zone' },
        { zone: SECTION_ZONE_KEYS.CATALOG_BOTTOM, label: 'Bottom Zone' }
    ],
    [PAGE_TYPES.PRODUCT]: [
        { zone: SECTION_ZONE_KEYS.PRODUCT_TOP, label: 'Top Zone' },
        { zone: SECTION_ZONE_KEYS.PRODUCT_INFO_TRUST, label: 'Trust Zone' },
        { zone: SECTION_ZONE_KEYS.PRODUCT_INFO_INLINE, label: 'Inline Zone' },
        { zone: SECTION_ZONE_KEYS.PRODUCT_BOTTOM, label: 'Bottom Zone' }
    ]
};

function getSectionCapabilities(section) {
    const isLocked = !!section?.is_locked;
    return {
        canReorder: !isLocked,
        canDelete: !isLocked,
        canDuplicate: !isLocked,
        canToggleVisibility: true,
        canConfigure: true,
        configDepth: isLocked ? 'limited' : 'full'
    };
}

function getImageUrl(imageItem) {
    if (!imageItem) return null;
    if (typeof imageItem === 'string') return imageItem;
    if (imageItem.url) return getImageUrl(imageItem.url);
    return null;
}

export default function EditorSidebar({
    sections,
    selectedSectionId,
    onSelectSection,
    onUpdateSectionSetting,
    onToggleVisibility,
    onReorderSections,
    onAddSection,
    onDuplicateSection,
    onRemoveSection,
    saveSections,
    resetSections,
    saving,
    hasChanges,
    error,
    pageType = PAGE_TYPES.HOME,
    products = [],
    previewProduct = null,
    onPreviewProductChange = null
}) {
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addTargetZone, setAddTargetZone] = useState(null);
    const [explicitView, setExplicitView] = useState(null);

    const sidebarView = explicitView || (selectedSectionId ? 'section' : 'page');
    const selectedSection = sections.find(s => s.id === selectedSectionId);
    const zoneBuckets = PAGE_ZONE_BUCKETS[pageType] || PAGE_ZONE_BUCKETS[PAGE_TYPES.HOME];

    const sectionsByZone = useMemo(() => {
        const groups = new Map(zoneBuckets.map(bucket => [bucket.zone, []]));
        sections.forEach((section) => {
            if (!groups.has(section.zone)) {
                groups.set(section.zone, []);
            }
            groups.get(section.zone).push(section);
        });

        groups.forEach((value, key) => {
            groups.set(key, [...value].sort((a, b) => a.position - b.position));
        });

        return groups;
    }, [sections, zoneBuckets]);

    const setSidebarView = (view) => {
        setExplicitView(view);
    };

    const handleSave = async () => {
        setSaveError(null);
        const result = await saveSections();

        if (result.success) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } else {
            setSaveError(result.error || 'Failed to save changes');
        }
    };

    const handleSelectSection = (sectionId) => {
        onSelectSection(sectionId);
        setSidebarView('section');
    };

    const handleBackToPage = () => {
        onSelectSection(null);
        setSidebarView('page');
    };

    const handleAddSection = (type) => {
        onAddSection(type, { zone: addTargetZone });
        setShowAddModal(false);
        setAddTargetZone(null);
    };

    const openAddSection = (zone) => {
        setAddTargetZone(zone);
        setShowAddModal(true);
    };

    const handleDragStart = (e, index, zone) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ index, zone }));
        e.currentTarget.classList.add('opacity-50');
    };

    const handleDragEnd = (e) => {
        e.currentTarget.classList.remove('opacity-50');
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-gray-100');
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('bg-gray-100');
    };

    const handleDrop = (e, dropIndex, zone) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-gray-100');

        let payload;
        try {
            payload = JSON.parse(e.dataTransfer.getData('application/json'));
        } catch {
            return;
        }

        if (!payload || payload.zone !== zone) {
            return;
        }

        const dragIndex = Number(payload.index);
        if (!Number.isFinite(dragIndex) || dragIndex === dropIndex) {
            return;
        }

        onReorderSections?.(dragIndex, dropIndex, zone);
    };

    const renderSectionRow = (section, zone, index) => {
        const capabilities = getSectionCapabilities(section);
        const isVisible = section.visible !== false;
        const isSelected = selectedSectionId === section.id;
        const displayName = SECTION_DISPLAY_NAMES[section.type] || section.type.replace(/_/g, ' ');

        return (
            <div
                key={section.id}
                draggable={capabilities.canReorder}
                onDragStart={capabilities.canReorder ? (e) => handleDragStart(e, index, zone) : undefined}
                onDragEnd={capabilities.canReorder ? handleDragEnd : undefined}
                onDragOver={capabilities.canReorder ? handleDragOver : undefined}
                onDragLeave={capabilities.canReorder ? handleDragLeave : undefined}
                onDrop={capabilities.canReorder ? (e) => handleDrop(e, index, zone) : undefined}
                onClick={() => capabilities.canConfigure && handleSelectSection(section.id)}
                className={[
                    'group flex items-center gap-3 px-3 py-2.5 bg-white rounded-lg border border-gray-200 transition-all',
                    capabilities.canConfigure ? 'cursor-pointer hover:border-gray-300 hover:shadow-sm' : '',
                    !isVisible ? 'opacity-50' : '',
                    isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''
                ].join(' ')}
            >
                {capabilities.canReorder ? (
                    <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600" onClick={(e) => e.stopPropagation()}>
                        <GripVertical size={16} />
                    </div>
                ) : (
                    <div className="text-gray-300">
                        <Lock size={14} />
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 capitalize truncate">
                        {displayName}
                    </p>
                    {section.is_locked && (
                        <p className="text-[11px] text-gray-500">Locked section ({capabilities.configDepth} config)</p>
                    )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {capabilities.canToggleVisibility && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleVisibility?.(section.id);
                            }}
                            className={`p-1.5 rounded hover:bg-gray-100 ${isVisible ? 'text-gray-400' : 'text-amber-500'}`}
                            title={isVisible ? 'Hide section' : 'Show section'}
                        >
                            {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                    )}

                    {capabilities.canDuplicate && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDuplicateSection?.(section.id);
                            }}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
                            title="Duplicate section"
                        >
                            <Copy size={14} />
                        </button>
                    )}

                    {capabilities.canDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to remove this section?')) {
                                    onRemoveSection?.(section.id);
                                }
                            }}
                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                            title="Remove section"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>

                <ChevronRight size={16} className="text-gray-300" />
            </div>
        );
    };

    const renderLockedRegionRow = (label) => (
        <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-gray-300">
                <Lock size={14} />
            </div>
            <p className="text-sm font-medium text-gray-700">{label}</p>
        </div>
    );

    const renderZoneBucket = (bucket) => {
        const zoneSections = sectionsByZone.get(bucket.zone) || [];
        return (
            <div key={bucket.zone}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{bucket.label}</h3>
                <div className="space-y-2">
                    {zoneSections.map((section, index) => renderSectionRow(section, bucket.zone, index))}
                    <button
                        onClick={() => openAddSection(bucket.zone)}
                        className="w-full mt-1 border border-dashed border-gray-300 py-3 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
                    >
                        + Add section
                    </button>
                </div>
            </div>
        );
    };

    const renderProductPreviewPicker = () => {
        if (pageType !== PAGE_TYPES.PRODUCT) return null;

        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Package size={16} className="text-gray-500" />
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Preview Product
                    </h3>
                </div>

                {products.length === 0 ? (
                    <div className="text-center py-4">
                        <Package className="mx-auto text-gray-300 mb-2" size={32} />
                        <p className="text-sm text-gray-500">No products available</p>
                        <p className="text-xs text-gray-400 mt-1">Add products to preview this page</p>
                    </div>
                ) : (
                    <div className="relative">
                        <select
                            value={previewProduct?.id || ''}
                            onChange={(e) => onPreviewProductChange && onPreviewProductChange(e.target.value || null)}
                            className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm text-gray-800 cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        >
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.title}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                    </div>
                )}

                {previewProduct && (
                    <div className="flex items-center gap-3 mt-3 p-2 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                            {previewProduct.images && previewProduct.images.length > 0 ? (
                                <img
                                    src={getImageUrl(previewProduct.images[0])}
                                    alt={previewProduct.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Package size={16} className="text-gray-400" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                                {previewProduct.title}
                            </p>
                            <p className="text-xs text-gray-500">
                                R {Number(previewProduct.price || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                )}

                <p className="text-xs text-gray-400 mt-3">
                    This product is used only for preview. It does not affect your live store.
                </p>
            </div>
        );
    };

    const renderPageView = () => (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {renderProductPreviewPicker()}

            {pageType === PAGE_TYPES.CATALOG && (
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Locked Region</h3>
                    {renderLockedRegionRow('Product Grid')}
                </div>
            )}

            {pageType === PAGE_TYPES.PRODUCT && (
                <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Locked Regions</h3>
                    {renderLockedRegionRow('Media Gallery')}
                    {renderLockedRegionRow('Product Info')}
                </div>
            )}

            {zoneBuckets.map(renderZoneBucket)}

            <button
                onClick={() => setSidebarView('theme')}
                className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
                <Settings size={16} />
                <span className="underline">Theme settings</span>
            </button>

            <button
                onClick={() => setSidebarView('footer')}
                className="w-full mt-2 flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
                <Columns3 size={16} />
                <span className="underline">Footer settings</span>
            </button>
        </div>
    );

    const renderSectionView = () => (
        <div className="flex-1 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
                <button
                    onClick={handleBackToPage}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft size={16} />
                    <span>Back to sections</span>
                </button>
            </div>

            {selectedSection && (
                <div className="px-4 py-4 border-b border-gray-100">
                    <h2 className="text-base font-semibold text-gray-900 capitalize">
                        {SECTION_DISPLAY_NAMES[selectedSection.type] || selectedSection.type.replace(/_/g, ' ')}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {selectedSection.is_locked ? 'Locked section - limited configuration' : 'Section settings'}
                    </p>
                </div>
            )}

            <div className="p-4">
                <SectionEditor
                    section={selectedSection}
                    onUpdateSetting={onUpdateSectionSetting}
                    onBack={handleBackToPage}
                    hideHeader={true}
                />
            </div>
        </div>
    );

    const renderThemeView = () => (
        <div className="flex-1 overflow-hidden flex flex-col">
            <div className="shrink-0 sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
                <button
                    onClick={() => setSidebarView('page')}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft size={16} />
                    <span>Back to sections</span>
                </button>
            </div>

            <div className="flex-1 overflow-hidden">
                <ThemeSettings />
            </div>
        </div>
    );

    const renderFooterView = () => (
        <div className="flex-1 overflow-hidden flex flex-col">
            <div className="shrink-0 sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
                <button
                    onClick={() => setSidebarView('page')}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft size={16} />
                    <span>Back to sections</span>
                </button>
            </div>

            <div className="flex-1 overflow-hidden">
                <FooterSettings />
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-[#F6F6F7]">
            {sidebarView === 'page' && renderPageView()}
            {sidebarView === 'section' && renderSectionView()}
            {sidebarView === 'theme' && renderThemeView()}
            {sidebarView === 'footer' && renderFooterView()}

            {sidebarView === 'page' && (
                <div className="p-4 border-t bg-white space-y-3">
                    {(error || saveError) && (
                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                            <AlertCircle size={16} />
                            <span>{error || saveError}</span>
                        </div>
                    )}

                    {saveSuccess && (
                        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">
                            <CheckCircle size={16} />
                            <span>Changes saved successfully!</span>
                        </div>
                    )}

                    {hasChanges && (
                        <p className="text-xs text-amber-600 text-center">
                            Unsaved changes
                        </p>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={resetSections}
                            disabled={!hasChanges || saving}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Reset
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!hasChanges || saving}
                            className="flex-1 px-4 py-2 bg-black text-white rounded-md text-sm hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {saving ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 size={16} className="animate-spin" />
                                    Saving...
                                </span>
                            ) : (
                                'Save'
                            )}
                        </button>
                    </div>
                </div>
            )}

            <AddSectionModal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    setAddTargetZone(null);
                }}
                onAddSection={handleAddSection}
                pageType={pageType}
            />
        </div>
    );
}
