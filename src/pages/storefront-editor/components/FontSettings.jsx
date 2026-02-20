import React, { useState } from 'react';
import { Save, RotateCcw, Loader2, CheckCircle, AlertCircle, Type, ChevronDown } from 'lucide-react';
import { useStorefrontSettings } from '../hooks/useStorefrontSettings';
import { useAdminMerchant } from '../../../context/adminMerchantContext';

/**
 * Available fonts from the assets/fonts folder
 * These correspond to the Poppins font family with different weights
 */
const AVAILABLE_FONTS = [
    {
        name: 'Poppins',
        family: 'Poppins',
        weights: [
            { label: 'Thin', value: '100' },
            { label: 'Extra Light', value: '200' },
            { label: 'Light', value: '300' },
            { label: 'Regular', value: '400' },
            { label: 'Medium', value: '500' },
            { label: 'Semi Bold', value: '600' },
            { label: 'Bold', value: '700' },
            { label: 'Extra Bold', value: '800' },
            { label: 'Black', value: '900' },
        ]
    },
    // System fonts as fallbacks
    {
        name: 'Inter',
        family: 'Inter, sans-serif',
        weights: [
            { label: 'Light', value: '300' },
            { label: 'Regular', value: '400' },
            { label: 'Medium', value: '500' },
            { label: 'Semi Bold', value: '600' },
            { label: 'Bold', value: '700' },
        ]
    },
    {
        name: 'System Default',
        family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weights: [
            { label: 'Regular', value: '400' },
            { label: 'Medium', value: '500' },
            { label: 'Bold', value: '700' },
        ]
    },
];

/**
 * Font selector dropdown component
 */
function FontSelector({ label, description, fontValue, weightValue, onFontChange, onWeightChange }) {
    const selectedFont = AVAILABLE_FONTS.find(f => f.name === fontValue) || AVAILABLE_FONTS[0];

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                </label>
                {description && (
                    <p className="text-xs text-gray-500 mb-2">{description}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Font Family Dropdown */}
                <div className="relative">
                    <select
                        value={fontValue}
                        onChange={(e) => onFontChange(e.target.value)}
                        className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                        style={{ fontFamily: selectedFont.family }}
                    >
                        {AVAILABLE_FONTS.map((font) => (
                            <option
                                key={font.name}
                                value={font.name}
                                style={{ fontFamily: font.family }}
                            >
                                {font.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                {/* Font Weight Dropdown */}
                <div className="relative">
                    <select
                        value={weightValue}
                        onChange={(e) => onWeightChange(e.target.value)}
                        className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                        style={{ fontWeight: weightValue }}
                    >
                        {selectedFont.weights.map((weight) => (
                            <option
                                key={weight.value}
                                value={weight.value}
                                style={{ fontWeight: weight.value }}
                            >
                                {weight.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>
        </div>
    );
}

/**
 * Font Settings Component
 * Allows merchants to customize fonts for headings, body, and paragraphs
 */
export default function FontSettings() {
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
            setSaveError(result.error || 'Failed to save font settings');
        }
    };

    // Get the current font for preview
    const headingFont = AVAILABLE_FONTS.find(f => f.name === settings.font_heading) || AVAILABLE_FONTS[0];
    const bodyFont = AVAILABLE_FONTS.find(f => f.name === settings.font_body) || AVAILABLE_FONTS[0];
    const paragraphFont = AVAILABLE_FONTS.find(f => f.name === settings.font_paragraph) || AVAILABLE_FONTS[0];

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
                {/* Heading Font Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                    <div className="flex items-center gap-2">
                        <Type size={18} className="text-blue-500" />
                        <h3 className="font-semibold text-gray-900">Heading Font</h3>
                    </div>

                    <FontSelector
                        label="Headings (H1 - H6)"
                        description="Used for page titles, section headers, and product names"
                        fontValue={settings.font_heading || 'Poppins'}
                        weightValue={settings.font_heading_weight || '700'}
                        onFontChange={(value) => updateSetting('font_heading', value)}
                        onWeightChange={(value) => updateSetting('font_heading_weight', value)}
                    />
                </div>

                {/* Body Font Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                    <FontSelector
                        label="Body Text"
                        description="General text throughout the store (navigation, labels, buttons)"
                        fontValue={settings.font_body || 'Poppins'}
                        weightValue={settings.font_body_weight || '400'}
                        onFontChange={(value) => updateSetting('font_body', value)}
                        onWeightChange={(value) => updateSetting('font_body_weight', value)}
                    />
                </div>

                {/* Paragraph Font Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                    <FontSelector
                        label="Paragraph Text"
                        description="For descriptions, product details, and longer content"
                        fontValue={settings.font_paragraph || 'Poppins'}
                        weightValue={settings.font_paragraph_weight || '400'}
                        onFontChange={(value) => updateSetting('font_paragraph', value)}
                        onWeightChange={(value) => updateSetting('font_paragraph_weight', value)}
                    />
                </div>

                {/* Live Preview Section */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Live Preview</h3>
                    <div className="bg-white rounded-lg p-5 space-y-4 shadow-sm">
                        {/* Heading Preview */}
                        <h1
                            className="text-2xl"
                            style={{
                                fontFamily: headingFont.family,
                                fontWeight: settings.font_heading_weight || '700'
                            }}
                        >
                            Heading Example
                        </h1>

                        {/* Body Preview */}
                        <div
                            className="text-sm"
                            style={{
                                fontFamily: bodyFont.family,
                                fontWeight: settings.font_body_weight || '400'
                            }}
                        >
                            <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-2">Button</span>
                            <span>Navigation Link</span>
                        </div>

                        {/* Paragraph Preview */}
                        <p
                            className="text-gray-600 leading-relaxed"
                            style={{
                                fontFamily: paragraphFont.family,
                                fontWeight: settings.font_paragraph_weight || '400'
                            }}
                        >
                            This is how your paragraph text will look. Product descriptions,
                            about pages, and other long-form content will use this font style.
                        </p>

                        {/* Price Preview */}
                        <div className="pt-3 border-t border-gray-100">
                            <span
                                className="text-xl"
                                style={{
                                    fontFamily: headingFont.family,
                                    fontWeight: settings.font_heading_weight || '700'
                                }}
                            >
                                R 1,299.00
                            </span>
                            <span
                                className="text-sm text-gray-500 ml-2"
                                style={{
                                    fontFamily: bodyFont.family,
                                    fontWeight: settings.font_body_weight || '400'
                                }}
                            >
                                In Stock
                            </span>
                        </div>
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
                        <span>Font settings saved successfully!</span>
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
