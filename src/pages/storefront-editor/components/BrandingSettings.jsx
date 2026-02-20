import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Loader2, CheckCircle, AlertCircle, Palette } from 'lucide-react';
import { useStorefrontSettings } from '../hooks/useStorefrontSettings';
import { useAdminMerchant } from '../../../context/adminMerchantContext';
import ImageUploader from './ImageUploader';
import ColorPicker from './ColorPicker';

/**
 * Branding Settings Component
 * Allows merchants to upload logo and configure store branding
 */
export default function BrandingSettings() {
    const { merchantId } = useAdminMerchant();
    const {
        settings,
        loading,
        saving,
        error,
        hasChanges,
        updateSetting,
        saveSettings,
        resetSettings
    } = useStorefrontSettings(merchantId);

    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState(null);

    const handleSave = async () => {
        setSaveError(null);
        setSaveSuccess(false);

        const result = await saveSettings();

        if (result.success) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } else {
            setSaveError(result.error || 'Failed to save branding settings');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Logo Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                    <div className="flex items-center gap-2">
                        <Palette size={18} className="text-blue-500" />
                        <h3 className="font-semibold text-gray-900">Store Logo</h3>
                    </div>
                    <p className="text-sm text-gray-500">
                        Upload your store logo. It will appear in the navigation header and footer.
                    </p>

                    <ImageUploader
                        label="Logo"
                        value={settings.logo_url}
                        onChange={(url) => updateSetting('logo_url', url)}
                        bucket="product-images"
                        folder="logos"
                        aspectRatio="aspect-[3/1]"
                        placeholder="Upload your logo"
                    />

                    <p className="text-xs text-gray-400">
                        Recommended: PNG or SVG format with transparent background, max width 300px
                    </p>
                </div>

                {/* Color Scheme Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                    <h3 className="font-semibold text-gray-900">Color Scheme</h3>
                    <p className="text-sm text-gray-500">
                        Customize your store's color palette for buttons, links, and accents.
                    </p>

                    <div className="space-y-4">
                        <ColorPicker
                            label="Primary Color"
                            value={settings.primary_color}
                            onChange={(color) => updateSetting('primary_color', color)}
                        />
                        <p className="text-xs text-gray-400 -mt-2">
                            Used for main text and key elements
                        </p>

                        <ColorPicker
                            label="Accent Color"
                            value={settings.accent_color}
                            onChange={(color) => updateSetting('accent_color', color)}
                        />
                        <p className="text-xs text-gray-400 -mt-2">
                            Used for buttons, links, and highlights
                        </p>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Preview</h3>
                    <div className="bg-white rounded-lg p-4 space-y-3">
                        {/* Logo Preview */}
                        {settings.logo_url ? (
                            <div className="flex items-center gap-3">
                                <img
                                    src={settings.logo_url}
                                    alt="Store Logo"
                                    className="h-8 max-w-[150px] object-contain"
                                />
                                <span className="text-xs text-gray-500">← Your logo</span>
                            </div>
                        ) : (
                            <div className="text-gray-400 text-sm">No logo uploaded yet</div>
                        )}

                        {/* Color Preview */}
                        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-8 h-8 rounded border border-gray-200"
                                    style={{ backgroundColor: settings.primary_color }}
                                />
                                <span className="text-xs text-gray-500">Primary</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-8 h-8 rounded border border-gray-200"
                                    style={{ backgroundColor: settings.accent_color }}
                                />
                                <span className="text-xs text-gray-500">Accent</span>
                            </div>
                        </div>

                        {/* Sample Button */}
                        <button
                            className="w-full py-2 px-4 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
                            style={{ backgroundColor: settings.accent_color }}
                        >
                            Sample Button
                        </button>
                    </div>
                </div>
            </div>

            {/* Fixed Footer with Actions */}
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
                        <span>Branding settings saved successfully!</span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={resetSettings}
                        disabled={!hasChanges || saving}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RotateCcw size={18} />
                        <span>Reset</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                <span>Save Changes</span>
                            </>
                        )}
                    </button>
                </div>

                {hasChanges && (
                    <p className="text-xs text-amber-600 text-center">
                        ⚠️ You have unsaved changes
                    </p>
                )}
            </div>
        </div>
    );
}
