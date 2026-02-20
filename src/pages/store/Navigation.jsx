import React, { useState, useEffect, useCallback } from 'react';
import {
    Menu, Save, Loader2, CheckCircle, AlertCircle,
    GripVertical, Eye, EyeOff, ChevronDown, ChevronUp,
    LayoutGrid, ArrowLeft, Edit2, Check, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminMerchant } from '../../context/adminMerchantContext';
import { supabase } from '../../lib/supabase';

// Default menu items that merchants can customize
const DEFAULT_HEADER_ITEMS = [
    { id: 'home', label: 'Home', path: '/', enabled: true, order: 0 },
    { id: 'products', label: 'Catalog', path: '/products', enabled: true, order: 1 },
    { id: 'about', label: 'About Us', path: '/about', enabled: false, order: 2 },
    { id: 'contact', label: 'Contact', path: '/contact', enabled: false, order: 3 },
];

const DEFAULT_FOOTER_ITEMS = [
    // Shop section
    { id: 'new_arrivals', label: 'New Arrivals', section: 'Shop', path: '/products', enabled: true, order: 0 },
    { id: 'all_products', label: 'All Products', section: 'Shop', path: '/products', enabled: true, order: 1 },
    // Support section
    { id: 'shipping', label: 'Shipping Policy', section: 'Support', path: '/shipping', enabled: true, order: 2 },
    { id: 'privacy', label: 'Privacy Policy', section: 'Support', path: '/privacy', enabled: true, order: 3 },
    { id: 'about', label: 'About Us', section: 'Support', path: '/about', enabled: false, order: 4 },
    { id: 'faq', label: 'FAQ', section: 'Support', path: '/faq', enabled: false, order: 5 },
    { id: 'returns', label: 'Returns', section: 'Support', path: '/returns', enabled: false, order: 6 },
];

export default function Navigation() {
    const navigate = useNavigate();
    const { merchant, merchantId, loading: merchantLoading, refetch } = useAdminMerchant();
    const [activeTab, setActiveTab] = useState('header');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    const [editingItemId, setEditingItemId] = useState(null);
    const [editingLabel, setEditingLabel] = useState('');
    const [draggedItem, setDraggedItem] = useState(null);

    const [headerItems, setHeaderItems] = useState(DEFAULT_HEADER_ITEMS);
    const [footerItems, setFooterItems] = useState(DEFAULT_FOOTER_ITEMS);

    // Load menu config when merchant data loads
    useEffect(() => {
        if (merchant?.menu_config) {
            const config = typeof merchant.menu_config === 'string'
                ? JSON.parse(merchant.menu_config)
                : merchant.menu_config;

            if (config.header && config.header.length > 0) {
                setHeaderItems(config.header);
            }
            if (config.footer && config.footer.length > 0) {
                setFooterItems(config.footer);
            }
        }
    }, [merchant]);

    const handleSave = async () => {
        if (!merchantId) {
            setSaveStatus('error');
            return;
        }

        setIsSaving(true);
        setSaveStatus(null);

        try {
            const menuConfig = {
                header: headerItems,
                footer: footerItems,
            };

            const { error } = await supabase
                .from('merchants')
                .update({ menu_config: menuConfig })
                .eq('id', merchantId);

            if (error) throw error;

            setSaveStatus('success');
            await refetch();

            setTimeout(() => setSaveStatus(null), 3000);
        } catch (err) {
            console.error('Error saving menu configuration:', err);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleItemVisibility = (type, itemId) => {
        const setItems = type === 'header' ? setHeaderItems : setFooterItems;
        setItems(prev =>
            prev.map(item =>
                item.id === itemId ? { ...item, enabled: !item.enabled } : item
            )
        );
        if (saveStatus) setSaveStatus(null);
    };

    const startEditing = (item) => {
        setEditingItemId(item.id);
        setEditingLabel(item.label);
    };

    const saveEditing = (type) => {
        const setItems = type === 'header' ? setHeaderItems : setFooterItems;
        setItems(prev =>
            prev.map(item =>
                item.id === editingItemId ? { ...item, label: editingLabel } : item
            )
        );
        setEditingItemId(null);
        setEditingLabel('');
        if (saveStatus) setSaveStatus(null);
    };

    const cancelEditing = () => {
        setEditingItemId(null);
        setEditingLabel('');
    };

    // Drag and drop handlers
    const handleDragStart = (e, item) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, targetItem, type) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.id === targetItem.id) return;

        const setItems = type === 'header' ? setHeaderItems : setFooterItems;
        const items = type === 'header' ? headerItems : footerItems;

        const draggedIndex = items.findIndex(item => item.id === draggedItem.id);
        const targetIndex = items.findIndex(item => item.id === targetItem.id);

        const newItems = [...items];
        newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, draggedItem);

        // Update order numbers
        const updatedItems = newItems.map((item, index) => ({
            ...item,
            order: index,
        }));

        setItems(updatedItems);
        setDraggedItem(null);
        if (saveStatus) setSaveStatus(null);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    // Move item up/down (alternative to drag and drop)
    const moveItem = (type, itemId, direction) => {
        const items = type === 'header' ? headerItems : footerItems;
        const setItems = type === 'header' ? setHeaderItems : setFooterItems;

        const currentIndex = items.findIndex(item => item.id === itemId);
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (newIndex < 0 || newIndex >= items.length) return;

        const newItems = [...items];
        [newItems[currentIndex], newItems[newIndex]] = [newItems[newIndex], newItems[currentIndex]];

        const updatedItems = newItems.map((item, index) => ({
            ...item,
            order: index,
        }));

        setItems(updatedItems);
        if (saveStatus) setSaveStatus(null);
    };

    const tabs = [
        { id: 'header', label: 'Header Navigation', icon: Menu },
        { id: 'footer', label: 'Footer Links', icon: LayoutGrid },
    ];

    const currentItems = activeTab === 'header' ? headerItems : footerItems;

    // Group footer items by section for display
    const groupedFooterItems = footerItems.reduce((acc, item) => {
        const section = item.section || 'Other';
        if (!acc[section]) acc[section] = [];
        acc[section].push(item);
        return acc;
    }, {});

    if (merchantLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Go back"
                            >
                                <ArrowLeft size={20} className="text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Navigation Settings</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Customize your storefront header and footer menus
                                </p>
                            </div>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={18} />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <div className="flex gap-1 px-6">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <tab.icon size={16} />
                                        {tab.label}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Save Status Message */}
                        {saveStatus && (
                            <div
                                className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${saveStatus === 'success'
                                    ? 'bg-green-50 text-green-800 border border-green-200'
                                    : 'bg-red-50 text-red-800 border border-red-200'
                                    }`}
                            >
                                {saveStatus === 'success' ? (
                                    <>
                                        <CheckCircle size={20} />
                                        <span className="font-medium">Menu configuration saved successfully!</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={20} />
                                        <span className="font-medium">
                                            Failed to save configuration. Please try again.
                                        </span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips</h3>
                            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                <li>Drag items to reorder them, or use the arrow buttons</li>
                                <li>Click the eye icon to show/hide menu items</li>
                                <li>Click on a label to edit it</li>
                                <li>Changes are automatically reflected on your storefront after saving</li>
                            </ul>
                        </div>

                        {/* Menu Items */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">
                                {activeTab === 'header' ? 'Header Menu Items' : 'Footer Menu Items'}
                            </h3>

                            {activeTab === 'header' ? (
                                // Header items (flat list)
                                <div className="space-y-2">
                                    {headerItems
                                        .sort((a, b) => a.order - b.order)
                                        .map((item, index) => (
                                            <MenuItemRow
                                                key={item.id}
                                                item={item}
                                                type="header"
                                                index={index}
                                                totalItems={headerItems.length}
                                                isEditing={editingItemId === item.id}
                                                editingLabel={editingLabel}
                                                setEditingLabel={setEditingLabel}
                                                onStartEditing={() => startEditing(item)}
                                                onSaveEditing={() => saveEditing('header')}
                                                onCancelEditing={cancelEditing}
                                                onToggle={() => toggleItemVisibility('header', item.id)}
                                                onMoveUp={() => moveItem('header', item.id, 'up')}
                                                onMoveDown={() => moveItem('header', item.id, 'down')}
                                                onDragStart={(e) => handleDragStart(e, item)}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, item, 'header')}
                                                onDragEnd={handleDragEnd}
                                                isDragging={draggedItem?.id === item.id}
                                            />
                                        ))}
                                </div>
                            ) : (
                                // Footer items (grouped by section)
                                <div className="space-y-6">
                                    {Object.entries(groupedFooterItems).map(([section, items]) => (
                                        <div key={section}>
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                                {section} Section
                                            </h4>
                                            <div className="space-y-2">
                                                {items
                                                    .sort((a, b) => a.order - b.order)
                                                    .map((item, index) => (
                                                        <MenuItemRow
                                                            key={item.id}
                                                            item={item}
                                                            type="footer"
                                                            index={index}
                                                            totalItems={items.length}
                                                            isEditing={editingItemId === item.id}
                                                            editingLabel={editingLabel}
                                                            setEditingLabel={setEditingLabel}
                                                            onStartEditing={() => startEditing(item)}
                                                            onSaveEditing={() => saveEditing('footer')}
                                                            onCancelEditing={cancelEditing}
                                                            onToggle={() => toggleItemVisibility('footer', item.id)}
                                                            onMoveUp={() => moveItem('footer', item.id, 'up')}
                                                            onMoveDown={() => moveItem('footer', item.id, 'down')}
                                                            onDragStart={(e) => handleDragStart(e, item)}
                                                            onDragOver={handleDragOver}
                                                            onDrop={(e) => handleDrop(e, item, 'footer')}
                                                            onDragEnd={handleDragEnd}
                                                            isDragging={draggedItem?.id === item.id}
                                                        />
                                                    ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Preview Section */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h3 className="text-sm font-medium text-gray-700 mb-4">Preview</h3>
                            {activeTab === 'header' ? (
                                <MenuPreviewHeader items={headerItems} />
                            ) : (
                                <MenuPreviewFooter items={footerItems} storeName={merchant?.store_name || 'Store'} tagline={merchant?.footer_tagline || 'Redefining modern commerce.'} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Individual menu item row component
function MenuItemRow({
    item,
    type,
    index,
    totalItems,
    isEditing,
    editingLabel,
    setEditingLabel,
    onStartEditing,
    onSaveEditing,
    onCancelEditing,
    onToggle,
    onMoveUp,
    onMoveDown,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    isDragging,
}) {
    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isDragging
                ? 'bg-blue-50 border-blue-300 opacity-50'
                : item.enabled
                    ? 'bg-white border-gray-200 hover:border-gray-300'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
        >
            {/* Drag Handle */}
            <div className="cursor-grab active:cursor-grabbing">
                <GripVertical size={18} className="text-gray-400" />
            </div>

            {/* Item Content */}
            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={editingLabel}
                            onChange={(e) => setEditingLabel(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onSaveEditing();
                                if (e.key === 'Escape') onCancelEditing();
                            }}
                        />
                        <button
                            onClick={onSaveEditing}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                            <Check size={16} />
                        </button>
                        <button
                            onClick={onCancelEditing}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${item.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                            {item.label}
                        </span>
                        <button
                            onClick={onStartEditing}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        >
                            <Edit2 size={14} />
                        </button>
                    </div>
                )}
                <span className="text-xs text-gray-400">{item.path}</span>
            </div>

            {/* Reorder Buttons */}
            <div className="flex flex-col gap-0.5">
                <button
                    onClick={onMoveUp}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronUp size={14} />
                </button>
                <button
                    onClick={onMoveDown}
                    disabled={index === totalItems - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronDown size={14} />
                </button>
            </div>

            {/* Visibility Toggle */}
            <button
                onClick={onToggle}
                className={`p-2 rounded-lg transition-colors ${item.enabled
                    ? 'text-green-600 bg-green-50 hover:bg-green-100'
                    : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
                    }`}
                title={item.enabled ? 'Click to hide' : 'Click to show'}
            >
                {item.enabled ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
        </div>
    );
}

// Header preview component
function MenuPreviewHeader({ items }) {
    const enabledItems = items.filter(item => item.enabled).sort((a, b) => a.order - b.order);

    return (
        <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div className="text-white font-bold">Your Store</div>
                <div className="flex items-center gap-6">
                    {enabledItems.map(item => (
                        <span key={item.id} className="text-gray-300 text-sm hover:text-white cursor-default">
                            {item.label}
                        </span>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-gray-400">🔍</div>
                    <div className="text-gray-400">🛒</div>
                </div>
            </div>
        </div>
    );
}

// Footer preview component
function MenuPreviewFooter({ items, storeName, tagline = 'Redefining modern commerce.' }) {
    const enabledItems = items.filter(item => item.enabled);
    const grouped = enabledItems.reduce((acc, item) => {
        const section = item.section || 'Other';
        if (!acc[section]) acc[section] = [];
        acc[section].push(item);
        return acc;
    }, {});

    return (
        <div className="bg-gray-100 rounded-lg p-6">
            <div className="grid grid-cols-4 gap-6">
                <div>
                    <h4 className="font-bold text-gray-900 mb-2">{storeName}.</h4>
                    <p className="text-sm text-gray-500">{tagline}</p>
                </div>
                {Object.entries(grouped).map(([section, sectionItems]) => (
                    <div key={section}>
                        <h4 className="font-bold text-xs uppercase text-gray-900 mb-2">{section}</h4>
                        <ul className="space-y-1">
                            {sectionItems.sort((a, b) => a.order - b.order).map(item => (
                                <li key={item.id} className="text-sm text-gray-500">
                                    {item.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}
