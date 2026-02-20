import React, { useEffect, useState } from 'react';
import {
    Loader2, CheckCircle, AlertCircle, Save, RotateCcw,
    Palette, Type, Layout, Square, Sparkles, ChevronDown, ChevronUp,
    X, RotateCw
} from 'lucide-react';
import { useThemeSettings } from '../hooks/useThemeSettings';
import { useAdminMerchant } from '../../../context/adminMerchantContext';
import ColorPicker from './ColorPicker';
import { THEME_FONT_OPTIONS, ensureGoogleFontsLoaded } from '../../../lib/theme/fonts';

// Font weight options
const WEIGHT_OPTIONS = [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' },
    { value: '800', label: 'Extra Bold' },
];

// Border radius options
const RADIUS_OPTIONS = [
    { value: 'none', label: 'None', preview: '0px' },
    { value: 'sm', label: 'Small', preview: '4px' },
    { value: 'md', label: 'Medium', preview: '8px' },
    { value: 'lg', label: 'Large', preview: '12px' },
    { value: 'xl', label: 'Extra Large', preview: '16px' },
    { value: 'full', label: 'Pill', preview: '9999px' },
];

// Shadow intensity options
const SHADOW_OPTIONS = [
    { value: 'none', label: 'None' },
    { value: 'subtle', label: 'Subtle' },
    { value: 'medium', label: 'Medium' },
    { value: 'strong', label: 'Strong' },
];

// Layout variant options
const HEADER_VARIANTS = [
    { value: 'minimal', label: 'Minimal', desc: 'Logo left, nav right' },
    { value: 'centered', label: 'Centered', desc: 'Logo + nav centered' },
    { value: 'split', label: 'Split', desc: 'Nav left, logo center' },
];

const CARD_VARIANTS = [
    { value: 'default', label: 'Default', desc: 'Image top, info below' },
    { value: 'overlay', label: 'Overlay', desc: 'Info on hover' },
    { value: 'minimal', label: 'Minimal', desc: 'Clean grid style' },
];

const CARD_ASPECT_RATIO_OPTIONS = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '3:4', label: 'Portrait (3:4)' },
    { value: '4:5', label: 'Tall (4:5)' },
];

const CARD_PRICE_FORMAT_OPTIONS = [
    { value: 'default', label: 'Standard Price' },
    { value: 'fromPrice', label: 'From Price' },
];

const CARD_HOVER_EFFECT_OPTIONS = [
    { value: 'quickView', label: 'Quick View Overlay' },
    { value: 'zoom', label: 'Image Zoom' },
    { value: 'none', label: 'No Hover Effect' },
];

/**
 * Collapsible Section Component
 */
function SettingsSection({ title, icon: Icon, children, defaultOpen = false }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition"
            >
                <div className="flex items-center gap-2">
                    {Icon && <Icon size={18} className="text-gray-500" />}
                    <span className="font-semibold text-gray-900">{title}</span>
                </div>
                {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            {isOpen && (
                <div className="p-4 space-y-4 border-t border-gray-100">
                    {children}
                </div>
            )}
        </div>
    );
}

/**
 * Select Input with optional override indicator
 */
function SelectField({ label, value, onChange, options, isOverridden, onClearOverride, helpText }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                {isOverridden && (
                    <button
                        onClick={onClearOverride}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        title="Reset to theme default"
                    >
                        <RotateCw size={12} />
                        Reset
                    </button>
                )}
            </div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${isOverridden ? 'border-blue-300 bg-blue-50/30' : 'border-gray-300'
                    }`}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {helpText && <p className="text-xs text-gray-500">{helpText}</p>}
        </div>
    );
}

/**
 * Radio Card Group for variant selection
 */
function VariantSelector({ label, value, onChange, options }) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <div className="grid gap-2">
                {options.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={`text-left px-3 py-2.5 rounded-lg border transition ${value === opt.value
                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <p className={`text-sm font-medium ${value === opt.value ? 'text-blue-700' : 'text-gray-800'}`}>
                            {opt.label}
                        </p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}

/**
 * Theme Preset Card
 */
function PresetCard({ preset, isSelected, onSelect }) {
    const colors = preset.settings?.colors || {};

    return (
        <button
            onClick={onSelect}
            className={`p-3 rounded-lg border-2 transition text-left ${isSelected
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
                }`}
        >
            {/* Color Preview */}
            <div className="flex gap-1 mb-2">
                <div
                    className="w-6 h-6 rounded border border-gray-200"
                    style={{ backgroundColor: colors.primary || '#000' }}
                    title="Primary"
                />
                <div
                    className="w-6 h-6 rounded border border-gray-200"
                    style={{ backgroundColor: colors.accent || '#3b82f6' }}
                    title="Accent"
                />
                <div
                    className="w-6 h-6 rounded border border-gray-200"
                    style={{ backgroundColor: colors.background || '#fff' }}
                    title="Background"
                />
                <div
                    className="w-6 h-6 rounded border border-gray-200"
                    style={{ backgroundColor: colors.surface || '#f5f5f5' }}
                    title="Surface"
                />
            </div>

            <p className={`text-sm font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                {preset.name}
            </p>
            <p className="text-xs text-gray-500 capitalize">{preset.category}</p>
        </button>
    );
}

/**
 * Main Theme Settings Component
 */
export default function ThemeSettings() {
    const { merchantId } = useAdminMerchant();
    const {
        themePreset,
        themePresets,
        loading,
        saving,
        error,
        hasChanges,
        selectPreset,
        updateSetting,
        clearOverride,
        isOverridden,
        getThemeValue,
        saveTheme,
        resetTheme,
        clearOverrides
    } = useThemeSettings(merchantId);

    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState(null);

    useEffect(() => {
        ensureGoogleFontsLoaded([
            getThemeValue('typography.headingFont'),
            getThemeValue('typography.bodyFont'),
            getThemeValue('typography.paragraphFont')
        ]);
    }, [getThemeValue]);

    const handleSave = async () => {
        setSaveError(null);
        setSaveSuccess(false);

        const result = await saveTheme();

        if (result.success) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } else {
            setSaveError(result.error || 'Failed to save theme settings');
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

                {/* Theme Presets */}
                <SettingsSection title="Theme Preset" icon={Sparkles} defaultOpen={true}>
                    <p className="text-sm text-gray-600 mb-3">
                        Choose a base theme to start with. Customize individual settings below.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {themePresets.map((preset) => (
                            <PresetCard
                                key={preset.id}
                                preset={preset}
                                isSelected={themePreset?.id === preset.id}
                                onSelect={() => selectPreset(preset.id)}
                            />
                        ))}
                    </div>
                    {themePresets.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                            No theme presets available. Run the seed migration to add presets.
                        </p>
                    )}
                </SettingsSection>

                {/* Colors */}
                <SettingsSection title="Colors" icon={Palette} defaultOpen={true}>
                    <div className="space-y-4">
                        <ColorPicker
                            label="Primary Color"
                            value={getThemeValue('colors.primary')}
                            onChange={(color) => updateSetting('colors.primary', color)}
                        />
                        <p className="text-xs text-gray-500 -mt-3">
                            Main brand color for buttons and key elements
                        </p>

                        <ColorPicker
                            label="Accent Color"
                            value={getThemeValue('colors.accent')}
                            onChange={(color) => updateSetting('colors.accent', color)}
                        />
                        <p className="text-xs text-gray-500 -mt-3">
                            Secondary color for links and highlights
                        </p>

                        <ColorPicker
                            label="Background"
                            value={getThemeValue('colors.background')}
                            onChange={(color) => updateSetting('colors.background', color)}
                        />

                        <ColorPicker
                            label="Surface"
                            value={getThemeValue('colors.surface')}
                            onChange={(color) => updateSetting('colors.surface', color)}
                        />
                        <p className="text-xs text-gray-500 -mt-3">
                            Background for cards, modals, and navigation
                        </p>

                        <ColorPicker
                            label="Text"
                            value={getThemeValue('colors.text')}
                            onChange={(color) => updateSetting('colors.text', color)}
                        />

                        <ColorPicker
                            label="Text Muted"
                            value={getThemeValue('colors.textMuted')}
                            onChange={(color) => updateSetting('colors.textMuted', color)}
                        />

                        <ColorPicker
                            label="Border"
                            value={getThemeValue('colors.border')}
                            onChange={(color) => updateSetting('colors.border', color)}
                        />
                    </div>
                </SettingsSection>

                {/* Typography */}
                <SettingsSection title="Typography" icon={Type}>
                    <SelectField
                        label="Heading Font"
                        value={getThemeValue('typography.headingFont')}
                        onChange={(val) => updateSetting('typography.headingFont', val)}
                        options={THEME_FONT_OPTIONS}
                        isOverridden={isOverridden('typography.headingFont')}
                        onClearOverride={() => clearOverride('typography.headingFont')}
                    />
                    <SelectField
                        label="Heading Weight"
                        value={getThemeValue('typography.headingWeight')}
                        onChange={(val) => updateSetting('typography.headingWeight', val)}
                        options={WEIGHT_OPTIONS}
                        isOverridden={isOverridden('typography.headingWeight')}
                        onClearOverride={() => clearOverride('typography.headingWeight')}
                    />

                    <div className="border-t border-gray-100 pt-4">
                        <SelectField
                            label="Body Font"
                            value={getThemeValue('typography.bodyFont')}
                            onChange={(val) => updateSetting('typography.bodyFont', val)}
                            options={THEME_FONT_OPTIONS}
                            isOverridden={isOverridden('typography.bodyFont')}
                            onClearOverride={() => clearOverride('typography.bodyFont')}
                        />
                        <SelectField
                            label="Body Weight"
                            value={getThemeValue('typography.bodyWeight')}
                            onChange={(val) => updateSetting('typography.bodyWeight', val)}
                            options={WEIGHT_OPTIONS}
                            isOverridden={isOverridden('typography.bodyWeight')}
                            onClearOverride={() => clearOverride('typography.bodyWeight')}
                        />
                    </div>

                    {/* Font Preview */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-2">Preview:</p>
                        <h3
                            style={{
                                fontFamily: getThemeValue('typography.headingFont'),
                                fontWeight: getThemeValue('typography.headingWeight'),
                                fontSize: '1.25rem',
                                color: getThemeValue('colors.text')
                            }}
                        >
                            Heading Text
                        </h3>
                        <p
                            style={{
                                fontFamily: getThemeValue('typography.bodyFont'),
                                fontWeight: getThemeValue('typography.bodyWeight'),
                                fontSize: '0.875rem',
                                color: getThemeValue('colors.textMuted')
                            }}
                        >
                            Body text looks like this. It's used for paragraphs and descriptions.
                        </p>
                    </div>
                </SettingsSection>

                {/* Layout Variants */}
                <SettingsSection title="Layout" icon={Layout}>
                    <VariantSelector
                        label="Header Style"
                        value={getThemeValue('layout.headerVariant')}
                        onChange={(val) => updateSetting('layout.headerVariant', val)}
                        options={HEADER_VARIANTS}
                    />

                    <div className="border-t border-gray-100 pt-4">
                        <p className="text-sm font-medium text-gray-700">Footer Layout</p>
                        <p className="text-xs text-gray-500 mt-1">
                            Footer structure is locked by the platform. Use Footer settings to edit content, links, colors, and visibility.
                        </p>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <VariantSelector
                            label="Product Card Style"
                            value={getThemeValue('layout.productCardVariant')}
                            onChange={(val) => updateSetting('layout.productCardVariant', val)}
                            options={CARD_VARIANTS}
                        />
                    </div>
                </SettingsSection>

                <SettingsSection title="Product Cards" icon={Square}>
                    <SelectField
                        label="Image Aspect Ratio"
                        value={getThemeValue('productCard.imageAspectRatio')}
                        onChange={(val) => updateSetting('productCard.imageAspectRatio', val)}
                        options={CARD_ASPECT_RATIO_OPTIONS}
                    />

                    <SelectField
                        label="Price Format"
                        value={getThemeValue('productCard.priceFormat')}
                        onChange={(val) => updateSetting('productCard.priceFormat', val)}
                        options={CARD_PRICE_FORMAT_OPTIONS}
                    />

                    <SelectField
                        label="Hover Effect"
                        value={getThemeValue('productCard.hoverEffect')}
                        onChange={(val) => updateSetting('productCard.hoverEffect', val)}
                        options={CARD_HOVER_EFFECT_OPTIONS}
                    />

                    <div className="border-t border-gray-100 pt-4 space-y-3">
                        <label className="flex items-center justify-between text-sm text-gray-700">
                            <span>Show Category</span>
                            <input
                                type="checkbox"
                                checked={!!getThemeValue('productCard.showCategory')}
                                onChange={(e) => updateSetting('productCard.showCategory', e.target.checked)}
                            />
                        </label>
                        <label className="flex items-center justify-between text-sm text-gray-700">
                            <span>Show Badges</span>
                            <input
                                type="checkbox"
                                checked={!!getThemeValue('productCard.showBadges')}
                                onChange={(e) => updateSetting('productCard.showBadges', e.target.checked)}
                            />
                        </label>
                        <label className="flex items-center justify-between text-sm text-gray-700">
                            <span>Show Description</span>
                            <input
                                type="checkbox"
                                checked={!!getThemeValue('productCard.showDescription')}
                                onChange={(e) => updateSetting('productCard.showDescription', e.target.checked)}
                            />
                        </label>
                        <label className="flex items-center justify-between text-sm text-gray-700">
                            <span>Show Tags</span>
                            <input
                                type="checkbox"
                                checked={!!getThemeValue('productCard.showTags')}
                                onChange={(e) => updateSetting('productCard.showTags', e.target.checked)}
                            />
                        </label>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">Title Lines</label>
                        <input
                            type="range"
                            min="1"
                            max="3"
                            step="1"
                            value={getThemeValue('productCard.titleTruncation') || 2}
                            onChange={(e) => updateSetting('productCard.titleTruncation', parseInt(e.target.value, 10))}
                            className="w-full mt-2"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>1 line</span>
                            <span>{getThemeValue('productCard.titleTruncation') || 2} lines</span>
                            <span>3 lines</span>
                        </div>
                    </div>
                </SettingsSection>

                {/* Style Settings */}
                <SettingsSection title="Style & Effects" icon={Square}>
                    <SelectField
                        label="Border Radius"
                        value={getThemeValue('layout.borderRadius')}
                        onChange={(val) => updateSetting('layout.borderRadius', val)}
                        options={RADIUS_OPTIONS}
                        helpText="Controls roundness of buttons, cards, and inputs"
                    />

                    {/* Border Radius Preview */}
                    <div className="flex gap-2 mt-2">
                        {RADIUS_OPTIONS.slice(0, 5).map((opt) => (
                            <div
                                key={opt.value}
                                className={`w-10 h-10 border-2 transition ${getThemeValue('layout.borderRadius') === opt.value
                                    ? 'border-blue-500 bg-blue-100'
                                    : 'border-gray-300 bg-gray-100'
                                    }`}
                                style={{ borderRadius: opt.preview }}
                                title={opt.label}
                            />
                        ))}
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <SelectField
                            label="Shadow Intensity"
                            value={getThemeValue('layout.shadowStyle')}
                            onChange={(val) => updateSetting('layout.shadowStyle', val)}
                            options={SHADOW_OPTIONS}
                            helpText="Controls shadow depth on cards and dropdowns"
                        />
                    </div>
                </SettingsSection>

                {/* Spacing */}
                <SettingsSection title="Spacing" icon={Layout}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Section Padding</label>
                            <input
                                type="range"
                                min="40"
                                max="160"
                                step="20"
                                value={getThemeValue('spacing.sectionPadding') || 80}
                                onChange={(e) => updateSetting('spacing.sectionPadding', e.target.value)}
                                className="w-full mt-2"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Compact</span>
                                <span>{getThemeValue('spacing.sectionPadding')}px</span>
                                <span>Spacious</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">Container Width</label>
                            <input
                                type="range"
                                min="1000"
                                max="1600"
                                step="100"
                                value={getThemeValue('spacing.containerWidth') || 1280}
                                onChange={(e) => updateSetting('spacing.containerWidth', e.target.value)}
                                className="w-full mt-2"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Narrow</span>
                                <span>{getThemeValue('spacing.containerWidth')}px</span>
                                <span>Wide</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">Grid Gap</label>
                            <input
                                type="range"
                                min="12"
                                max="48"
                                step="4"
                                value={getThemeValue('spacing.gridGap') || 24}
                                onChange={(e) => updateSetting('spacing.gridGap', e.target.value)}
                                className="w-full mt-2"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Tight</span>
                                <span>{getThemeValue('spacing.gridGap')}px</span>
                                <span>Loose</span>
                            </div>
                        </div>
                    </div>
                </SettingsSection>

                {/* Clear Overrides */}
                {hasChanges && (
                    <button
                        onClick={clearOverrides}
                        className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2"
                    >
                        <X size={14} className="inline mr-1" />
                        Clear all custom overrides
                    </button>
                )}
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
                        <span>Theme saved successfully!</span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={resetTheme}
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
                                <span>Save Theme</span>
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
