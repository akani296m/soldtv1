import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Loader2,
    ArrowLeft,
    Layout,
    Save,
    RotateCcw,
    CheckCircle,
    AlertCircle,
    Layers,
    Edit3,
    Check,
    X,
    Monitor,
    Smartphone,
    Tablet,
    Package,
    ExternalLink,
    Lock
} from 'lucide-react';
import { useTemplateSections } from '../../hooks/useTemplateSections';
import { useProducts } from '../../context/productcontext';
import { useAdminMerchant } from '../../context/adminMerchantContext';

// Import the existing editor components
import SectionList from '../storefront-editor/components/SectionList';
import SectionEditor from '../storefront-editor/components/SectionEditor';
import AddSectionModal from '../storefront-editor/components/AddSectionModal';
import SectionRenderer from '../../components/storefront/SectionRenderer';
import { PAGE_TYPES } from '../../components/storefront/sections';
import { SECTION_ZONE_KEYS } from '../../lib/sectionZones';

/**
 * Template Editor Page
 * Allows merchants to edit sections within a product page template
 */
export default function TemplateEditor() {
    const { templateId } = useParams();
    const navigate = useNavigate();

    const {
        template,
        sections,
        loading,
        saving,
        error,
        hasChanges,
        updateTemplateName,
        updateSectionSetting,
        toggleSectionVisibility,
        reorderSections,
        addSection,
        removeSection,
        duplicateSection,
        saveSections,
        resetSections
    } = useTemplateSections(templateId);

    const { products, loading: productsLoading } = useProducts();
    const { merchant } = useAdminMerchant();

    const [selectedSectionId, setSelectedSectionId] = useState(null);
    const [editMode, setEditMode] = useState('list'); // 'list' | 'edit'
    const [showAddModal, setShowAddModal] = useState(false);
    const [addTargetZone, setAddTargetZone] = useState(SECTION_ZONE_KEYS.PRODUCT_BOTTOM);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [device, setDevice] = useState('desktop');

    // Template name editing
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameInput, setNameInput] = useState('');

    const selectedSection = sections.find(s => s.id === selectedSectionId);
    const basePath = `/s/${merchant?.slug || 'preview'}`;

    const zoneBuckets = useMemo(() => ([
        { zone: SECTION_ZONE_KEYS.PRODUCT_TOP, label: 'Top Zone' },
        { zone: SECTION_ZONE_KEYS.PRODUCT_INFO_TRUST, label: 'Trust Zone' },
        { zone: SECTION_ZONE_KEYS.PRODUCT_INFO_INLINE, label: 'Inline Zone' },
        { zone: SECTION_ZONE_KEYS.PRODUCT_BOTTOM, label: 'Bottom Zone' },
    ]), []);

    const sectionsByZone = useMemo(() => {
        return zoneBuckets.reduce((acc, bucket) => {
            acc[bucket.zone] = sections
                .filter(section => section.zone === bucket.zone)
                .sort((a, b) => a.position - b.position);
            return acc;
        }, {});
    }, [sections, zoneBuckets]);

    const deviceWidths = {
        desktop: 'w-full',
        tablet: 'w-[768px]',
        mobile: 'w-[375px]'
    };

    // Initialize name input when template loads
    useEffect(() => {
        if (template) {
            setNameInput(template.name);
        }
    }, [template]);

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
        setSelectedSectionId(sectionId);
        setEditMode('edit');
    };

    const handleBackToList = () => {
        setSelectedSectionId(null);
        setEditMode('list');
    };

    const handleAddSection = (type) => {
        addSection(type, { zone: addTargetZone });
        setShowAddModal(false);
        setAddTargetZone(SECTION_ZONE_KEYS.PRODUCT_BOTTOM);
    };

    const handleSaveName = async () => {
        if (nameInput.trim() && nameInput !== template.name) {
            await updateTemplateName(nameInput.trim());
        }
        setIsEditingName(false);
    };

    const handleCancelNameEdit = () => {
        setNameInput(template?.name || '');
        setIsEditingName(false);
    };

    // Loading state
    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <Loader2 size={48} className="animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600">Loading template editor...</p>
                </div>
            </div>
        );
    }

    // Error state - template not found
    if (!template) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center max-w-md">
                    <Layout size={64} className="text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Template Not Found</h2>
                    <p className="text-gray-600 mb-4">
                        {error || "We couldn't find this template."}
                    </p>
                    <button
                        onClick={() => navigate('/store/templates')}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        Back to Templates
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-100">
            {/* Top Bar */}
            <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/store/templates')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
                    >
                        <ArrowLeft size={20} />
                        <span className="text-sm font-medium">Back</span>
                    </button>

                    <div className="h-6 w-px bg-gray-200"></div>

                    {/* Template Name */}
                    <div className="flex items-center gap-2">
                        <Layout size={20} className="text-purple-500" />

                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveName();
                                        if (e.key === 'Escape') handleCancelNameEdit();
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded-md text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSaveName}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                >
                                    <Check size={16} />
                                </button>
                                <button
                                    onClick={handleCancelNameEdit}
                                    className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditingName(true)}
                                className="flex items-center gap-2 group"
                            >
                                <span className="font-semibold text-gray-900">
                                    {template.name}
                                </span>
                                <Edit3
                                    size={14}
                                    className="text-gray-400 opacity-0 group-hover:opacity-100 transition"
                                />
                            </button>
                        )}
                    </div>

                    {/* Badges */}
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        Product Template
                    </span>

                    {hasChanges && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                            Unsaved changes
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={resetSections}
                        disabled={!hasChanges || saving}
                        className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RotateCcw size={16} />
                        <span className="text-sm">Reset</span>
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-sm">Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                <span className="text-sm">Save</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Live Preview */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Preview Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-700">
                                Product Page Preview
                            </h3>
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                                Real-time
                            </span>
                        </div>

                        {/* Device Toggles */}
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
                    </div>

                    {/* Preview Container */}
                    <div className="flex-1 overflow-auto p-4 flex justify-center bg-gray-100">
                        <div
                            className={`${deviceWidths[device]} bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300 origin-top`}
                            style={{
                                maxHeight: 'calc(100vh - 200px)',
                                transform: device !== 'desktop' ? 'scale(0.85)' : 'scale(1)'
                            }}
                        >
                            <div className="overflow-y-auto max-h-[calc(100vh-220px)]">
                                {/* Nav Preview */}
                                <nav className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-sm">Your Store</span>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span>Home</span>
                                            <span>Shop</span>
                                            <span>Cart</span>
                                        </div>
                                    </div>
                                </nav>

                                {/* Product Detail Mock Layout */}
                                <div className="bg-white min-h-[400px]">
                                    <SectionRenderer
                                        sections={sectionsByZone[SECTION_ZONE_KEYS.PRODUCT_TOP] || []}
                                        basePath={basePath}
                                        products={products}
                                        productsLoading={productsLoading}
                                        isEditing={true}
                                        selectedSectionId={selectedSectionId}
                                        onSectionClick={handleSelectSection}
                                    />
                                    <div className="max-w-7xl mx-auto px-6 py-8">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Product image */}
                                            <div className="aspect-[4/5] bg-gray-100 rounded-lg flex items-center justify-center">
                                                <Package className="text-gray-300" size={64} />
                                            </div>

                                            {/* Product info */}
                                            <div className="space-y-6">
                                                <div className="h-3 bg-gray-200 rounded w-24"></div>
                                                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                                                <div className="flex items-center gap-4">
                                                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                                                    <div className="h-6 bg-green-100 rounded-full w-20"></div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                                                    <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                                                    <div className="h-4 bg-gray-100 rounded w-4/6"></div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="flex-1 h-12 bg-gray-900 rounded-lg"></div>
                                                    <div className="w-12 h-12 bg-gray-100 rounded-lg"></div>
                                                </div>

                                                {/* Trust + Inline zones */}
                                                <SectionRenderer
                                                    sections={sectionsByZone[SECTION_ZONE_KEYS.PRODUCT_INFO_TRUST] || []}
                                                    basePath={basePath}
                                                    products={products}
                                                    productsLoading={productsLoading}
                                                    isEditing={true}
                                                    selectedSectionId={selectedSectionId}
                                                    onSectionClick={handleSelectSection}
                                                />
                                                <SectionRenderer
                                                    sections={sectionsByZone[SECTION_ZONE_KEYS.PRODUCT_INFO_INLINE] || []}
                                                    basePath={basePath}
                                                    products={products}
                                                    productsLoading={productsLoading}
                                                    isEditing={true}
                                                    selectedSectionId={selectedSectionId}
                                                    onSectionClick={handleSelectSection}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom zone */}
                                    <div className="max-w-7xl mx-auto px-6 pb-8">
                                        <SectionRenderer
                                            sections={sectionsByZone[SECTION_ZONE_KEYS.PRODUCT_BOTTOM] || []}
                                            basePath={basePath}
                                            products={products}
                                            productsLoading={productsLoading}
                                            isEditing={true}
                                            selectedSectionId={selectedSectionId}
                                            onSectionClick={handleSelectSection}
                                        />
                                    </div>
                                </div>

                                {/* Footer Preview */}
                                <footer className="bg-gray-50 py-6 px-6 text-center">
                                    <p className="text-[10px] text-gray-400">
                                        © 2024 Your Store. All rights reserved.
                                    </p>
                                </footer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Editor Sidebar */}
                <div className="w-[400px] border-l border-gray-200 overflow-hidden shrink-0 flex flex-col bg-[#F6F6F7]">
                    {/* Sidebar Header */}
                    <div className="px-4 py-4 border-b border-gray-200 bg-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layers size={20} className="text-purple-500" />
                                <h2 className="text-lg font-bold text-gray-900">Sections</h2>
                            </div>
                            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                                Template
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            {editMode === 'list'
                                ? 'Drag within zones, click to edit'
                                : 'Editing section settings'
                            }
                        </p>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {editMode === 'list' ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Locked Regions</h3>
                                    <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                                        <Lock size={14} className="text-gray-400" />
                                        <p className="text-sm font-medium text-gray-700">Media Gallery</p>
                                    </div>
                                    <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                                        <Lock size={14} className="text-gray-400" />
                                        <p className="text-sm font-medium text-gray-700">Product Info</p>
                                    </div>
                                </div>

                                {zoneBuckets.map((bucket) => (
                                    <div key={bucket.zone} className="space-y-2">
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{bucket.label}</h3>
                                        <SectionList
                                            sections={sectionsByZone[bucket.zone] || []}
                                            selectedSectionId={selectedSectionId}
                                            onSelectSection={handleSelectSection}
                                            onToggleVisibility={toggleSectionVisibility}
                                            onDuplicateSection={duplicateSection}
                                            onRemoveSection={removeSection}
                                            onReorder={(startIndex, endIndex) => reorderSections(startIndex, endIndex, bucket.zone)}
                                            onAddSection={() => {
                                                setAddTargetZone(bucket.zone);
                                                setShowAddModal(true);
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <SectionEditor
                                section={selectedSection}
                                onUpdateSetting={updateSectionSetting}
                                onBack={handleBackToList}
                            />
                        )}
                    </div>

                    {/* Footer with Status */}
                    <div className="p-4 bg-white border-t border-gray-200 space-y-3">
                        {/* Status Messages */}
                        {(error || saveError) && (
                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                                <AlertCircle size={16} />
                                <span>{error || saveError}</span>
                            </div>
                        )}

                        {saveSuccess && (
                            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">
                                <CheckCircle size={16} />
                                <span>Template saved successfully!</span>
                            </div>
                        )}

                        {/* Section count info */}
                        <div className="text-xs text-gray-500 text-center">
                            {sections.length} section{sections.length !== 1 ? 's' : ''} in this template
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Section Modal */}
            <AddSectionModal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    setAddTargetZone(SECTION_ZONE_KEYS.PRODUCT_BOTTOM);
                }}
                onAddSection={handleAddSection}
                pageType={PAGE_TYPES.PRODUCT} // Templates are for product pages
            />
        </div>
    );
}
