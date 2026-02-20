import React, { useState, useEffect } from 'react';
import { Store, Palette, Eye, Save, Loader2, CheckCircle } from 'lucide-react';
import { useAdminMerchant } from '../../context/adminMerchantContext';
import { supabase } from '../../lib/supabase';
import ImageUploader from '../storefront-editor/components/ImageUploader';

export default function ManageStoreSettings() {
    const { merchant, merchantId, loading: merchantLoading, refetch } = useAdminMerchant();

    const [storeData, setStoreData] = useState({
        storeName: '',
        tagline: '',
        logo: null,
        favicon: null,
        primaryColor: '#3B82F6',
        accentColor: '#10B981',
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

    // Load merchant data when component mounts or merchant changes
    useEffect(() => {
        if (merchant) {
            setStoreData(prev => ({
                ...prev,
                // Use store_name or name from merchant data
                storeName: merchant.store_name || merchant.name || merchant.business_name || '',
                tagline: merchant.tagline || '',
                logo: merchant.logo_url || null,
                favicon: merchant.favicon_url || null,
                primaryColor: merchant.primary_color || '#3B82F6',
                accentColor: merchant.accent_color || '#10B981',
            }));
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
            const updateData = {
                name: storeData.storeName,
                store_name: storeData.storeName,
                business_name: storeData.storeName,
                tagline: storeData.tagline,
                logo_url: storeData.logo,
                favicon_url: storeData.favicon,
                primary_color: storeData.primaryColor,
                accent_color: storeData.accentColor,
            };

            const { error } = await supabase
                .from('merchants')
                .update(updateData)
                .eq('id', merchantId);

            if (error) throw error;

            setSaveStatus('success');
            await refetch();

            setTimeout(() => setSaveStatus(null), 3000);
        } catch (err) {
            console.error('Error saving store settings:', err);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    // Show loading state while fetching merchant data
    if (merchantLoading) {
        return (
            <div className="max-w-4xl flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-6">
            {/* Store Identity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Store size={24} className="text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Store Identity</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Customize your store's appearance and branding
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Store Name
                        </label>
                        <input
                            type="text"
                            value={storeData.storeName}
                            onChange={(e) => setStoreData({ ...storeData, storeName: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tagline
                        </label>
                        <input
                            type="text"
                            value={storeData.tagline}
                            onChange={(e) => setStoreData({ ...storeData, tagline: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="A short tagline for your store"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Store Logo
                        </label>
                        <ImageUploader
                            label=""
                            value={storeData.logo}
                            onChange={(url) => setStoreData({ ...storeData, logo: url })}
                            bucket="product-images"
                            folder="logos"
                            aspectRatio="aspect-[3/1]"
                            placeholder="Upload your store logo"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Recommended: Square or horizontal image, PNG or SVG with transparent background
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Store Favicon
                        </label>
                        <ImageUploader
                            label=""
                            value={storeData.favicon}
                            onChange={(url) => setStoreData({ ...storeData, favicon: url })}
                            bucket="product-images"
                            folder="favicons"
                            aspectRatio="aspect-square"
                            placeholder="Upload your favicon"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            This icon appears in browser tabs. Recommended: 32x32 or 64x64 px, square PNG or SVG
                        </p>
                    </div>
                </div>
            </div>

            {/* Brand Colors */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-50 rounded-lg">
                            <Palette size={24} className="text-pink-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Brand Colors</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Customize your store's color scheme
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Primary Color
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={storeData.primaryColor}
                                    onChange={(e) => setStoreData({ ...storeData, primaryColor: e.target.value })}
                                    className="w-16 h-12 rounded-lg border border-gray-300 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={storeData.primaryColor}
                                    onChange={(e) => setStoreData({ ...storeData, primaryColor: e.target.value })}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Accent Color
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={storeData.accentColor}
                                    onChange={(e) => setStoreData({ ...storeData, accentColor: e.target.value })}
                                    className="w-16 h-12 rounded-lg border border-gray-300 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={storeData.accentColor}
                                    onChange={(e) => setStoreData({ ...storeData, accentColor: e.target.value })}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2">
                            <Eye size={18} />
                            Preview Changes
                        </button>
                    </div>
                </div>
            </div>

            {/* Online Store */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Online Store</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Manage your storefront appearance
                            </p>
                        </div>
                        <button
                            onClick={() => window.open('/store/editor', '_blank')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Open Store Editor
                        </button>
                    </div>
                </div>
            </div>

            {/* Save Button Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex justify-between items-center">
                {/* Save Status Message */}
                <div className="flex items-center gap-2">
                    {saveStatus === 'success' && (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle size={16} />
                            Store settings saved successfully
                        </span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="text-sm text-red-600">
                            Failed to save settings. Please try again.
                        </span>
                    )}
                </div>

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
    );
}
