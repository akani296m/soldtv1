import React, { useEffect, useMemo, useState } from 'react';
import {
    Save,
    RotateCcw,
    Loader2,
    CheckCircle,
    AlertCircle,
    ChevronUp,
    ChevronDown,
    Plus,
    Trash2,
    Eye,
    EyeOff,
    Lock,
} from 'lucide-react';
import { useAdminMerchant } from '../../../context/adminMerchantContext';
import { supabase } from '../../../lib/supabase';
import ImageUploader from './ImageUploader';
import {
    parseFooterConfig,
    createFooterId,
    REQUIRED_FOOTER_BLOCK_TYPES,
    buildLegacyFooterItemsFromConfig,
} from '../../../lib/footerConfig';

function setBlockEnabled(config, type, enabled) {
    return {
        ...config,
        blocks: (config.blocks || []).map((block) =>
            block.type === type && !block.required
                ? { ...block, enabled }
                : block
        ),
    };
}

function FooterBlockToggle({ block, onToggle }) {
    const isRequired = REQUIRED_FOOTER_BLOCK_TYPES.includes(block.type);
    return (
        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{block.label}</span>
                {isRequired && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        <Lock size={12} />
                        Required
                    </span>
                )}
            </div>
            <button
                type="button"
                disabled={isRequired}
                onClick={() => onToggle(block.type, !block.enabled)}
                className={`p-2 rounded-lg transition ${block.enabled ? 'text-green-700 bg-green-50' : 'text-gray-500 bg-gray-100'} ${isRequired ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
                {block.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
        </div>
    );
}

export default function FooterSettings() {
    const { merchant, merchantId, refetch } = useAdminMerchant();

    const [config, setConfig] = useState(parseFooterConfig(null));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [originalConfigString, setOriginalConfigString] = useState('');

    useEffect(() => {
        if (!merchant) return;
        const nextConfig = parseFooterConfig(merchant.menu_config);
        setConfig(nextConfig);
        setOriginalConfigString(JSON.stringify(nextConfig));
        setLoading(false);
    }, [merchant]);

    const hasChanges = useMemo(() => JSON.stringify(config) !== originalConfigString, [config, originalConfigString]);

    const handleSave = async () => {
        if (!merchantId) {
            setSaveError('No merchant ID found');
            return;
        }

        setSaving(true);
        setSaveSuccess(false);
        setSaveError(null);

        try {
            let existingConfig = merchant?.menu_config || {};
            if (typeof existingConfig === 'string') {
                try {
                    existingConfig = JSON.parse(existingConfig);
                } catch {
                    existingConfig = {};
                }
            }

            const updatedMenuConfig = {
                ...existingConfig,
                footer_config: config,
                footer: buildLegacyFooterItemsFromConfig(config),
            };

            const { error } = await supabase
                .from('merchants')
                .update({ menu_config: updatedMenuConfig })
                .eq('id', merchantId);

            if (error) throw error;

            setSaveSuccess(true);
            setOriginalConfigString(JSON.stringify(config));
            await refetch();
            setTimeout(() => setSaveSuccess(false), 2500);
        } catch (err) {
            setSaveError(err.message || 'Failed to save footer settings');
        } finally {
            setSaving(false);
        }
    };

    const resetSettings = () => {
        if (!originalConfigString) return;
        setConfig(JSON.parse(originalConfigString));
        setSaveError(null);
    };

    const updateGroup = (groupId, updater) => {
        setConfig((prev) => ({
            ...prev,
            linkGroups: prev.linkGroups.map((group) =>
                group.id === groupId ? updater(group) : group
            ),
        }));
    };

    const moveArrayItem = (items, index, direction) => {
        const nextIndex = direction === 'up' ? index - 1 : index + 1;
        if (nextIndex < 0 || nextIndex >= items.length) return items;
        const cloned = [...items];
        [cloned[index], cloned[nextIndex]] = [cloned[nextIndex], cloned[index]];
        return cloned.map((item, order) => ({ ...item, order }));
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
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm text-gray-700 font-medium">Footer layout is locked at platform level.</p>
                    <p className="text-xs text-gray-500 mt-1">
                        Merchants can edit content and visibility only. Grid structure, spacing, and compliance sections cannot be altered.
                    </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">Block Visibility</h3>
                    {(config.blocks || [])
                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                        .map((block) => (
                            <FooterBlockToggle
                                key={block.type}
                                block={block}
                                onToggle={(type, enabled) => setConfig((prev) => setBlockEnabled(prev, type, enabled))}
                            />
                        ))}
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                    <h3 className="font-semibold text-gray-900">Footer Branding</h3>
                    <label className="flex items-center justify-between text-sm text-gray-700">
                        <span>Show footer logo</span>
                        <input
                            type="checkbox"
                            checked={config.branding.showLogo}
                            onChange={(e) => setConfig((prev) => ({
                                ...prev,
                                branding: { ...prev.branding, showLogo: e.target.checked },
                            }))}
                        />
                    </label>
                    <ImageUploader
                        label="Footer logo (optional override)"
                        value={config.branding.footerLogoUrl}
                        onChange={(url) => setConfig((prev) => ({
                            ...prev,
                            branding: { ...prev.branding, footerLogoUrl: url },
                        }))}
                        folder="storefront/footer"
                        aspectRatio="aspect-[3/1]"
                        placeholder="Upload footer logo"
                    />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                    <h3 className="font-semibold text-gray-900">Footer Colors</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="text-sm text-gray-700">
                            Background
                            <input
                                type="color"
                                value={config.style.backgroundColor}
                                onChange={(e) => setConfig((prev) => ({
                                    ...prev,
                                    style: { ...prev.style, backgroundColor: e.target.value },
                                }))}
                                className="mt-1 w-full h-10 rounded border border-gray-200"
                            />
                        </label>
                        <label className="text-sm text-gray-700">
                            Accent background
                            <input
                                type="color"
                                value={config.style.accentBackground}
                                onChange={(e) => setConfig((prev) => ({
                                    ...prev,
                                    style: { ...prev.style, accentBackground: e.target.value },
                                }))}
                                className="mt-1 w-full h-10 rounded border border-gray-200"
                            />
                        </label>
                        <label className="text-sm text-gray-700">
                            Borders
                            <input
                                type="color"
                                value={config.style.borderColor}
                                onChange={(e) => setConfig((prev) => ({
                                    ...prev,
                                    style: { ...prev.style, borderColor: e.target.value },
                                }))}
                                className="mt-1 w-full h-10 rounded border border-gray-200"
                            />
                        </label>
                        <label className="text-sm text-gray-700">
                            Text
                            <input
                                type="color"
                                value={config.style.textColor}
                                onChange={(e) => setConfig((prev) => ({
                                    ...prev,
                                    style: { ...prev.style, textColor: e.target.value },
                                }))}
                                className="mt-1 w-full h-10 rounded border border-gray-200"
                            />
                        </label>
                        <label className="text-sm text-gray-700">
                            Buttons
                            <input
                                type="color"
                                value={config.style.buttonBackground}
                                onChange={(e) => setConfig((prev) => ({
                                    ...prev,
                                    style: { ...prev.style, buttonBackground: e.target.value },
                                }))}
                                className="mt-1 w-full h-10 rounded border border-gray-200"
                            />
                        </label>
                        <label className="text-sm text-gray-700">
                            Buttons label
                            <input
                                type="color"
                                value={config.style.buttonText}
                                onChange={(e) => setConfig((prev) => ({
                                    ...prev,
                                    style: { ...prev.style, buttonText: e.target.value },
                                }))}
                                className="mt-1 w-full h-10 rounded border border-gray-200"
                            />
                        </label>
                        <label className="text-sm text-gray-700">
                            Links and accents
                            <input
                                type="color"
                                value={config.style.linkColor}
                                onChange={(e) => setConfig((prev) => ({
                                    ...prev,
                                    style: { ...prev.style, linkColor: e.target.value },
                                }))}
                                className="mt-1 w-full h-10 rounded border border-gray-200"
                            />
                        </label>
                        <label className="text-sm text-gray-700">
                            Form elements
                            <input
                                type="color"
                                value={config.style.formElementBorder}
                                onChange={(e) => setConfig((prev) => ({
                                    ...prev,
                                    style: { ...prev.style, formElementBorder: e.target.value },
                                }))}
                                className="mt-1 w-full h-10 rounded border border-gray-200"
                            />
                        </label>
                        <label className="text-sm text-gray-700">
                            Errors
                            <input
                                type="color"
                                value={config.style.errorColor}
                                onChange={(e) => setConfig((prev) => ({
                                    ...prev,
                                    style: { ...prev.style, errorColor: e.target.value },
                                }))}
                                className="mt-1 w-full h-10 rounded border border-gray-200"
                            />
                        </label>
                        <label className="text-sm text-gray-700">
                            Sales price
                            <input
                                type="color"
                                value={config.style.salesPriceColor}
                                onChange={(e) => setConfig((prev) => ({
                                    ...prev,
                                    style: { ...prev.style, salesPriceColor: e.target.value },
                                }))}
                                className="mt-1 w-full h-10 rounded border border-gray-200"
                            />
                        </label>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Link Groups</h3>
                        <button
                            type="button"
                            onClick={() => setConfig((prev) => ({
                                ...prev,
                                linkGroups: [
                                    ...prev.linkGroups,
                                    {
                                        id: createFooterId('group'),
                                        name: `Group ${prev.linkGroups.length + 1}`,
                                        enabled: true,
                                        order: prev.linkGroups.length,
                                        links: [],
                                    },
                                ],
                            }))}
                            className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
                        >
                            <Plus size={14} className="inline mr-1" />
                            Add group
                        </button>
                    </div>

                    {config.linkGroups
                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                        .map((group, groupIndex) => (
                            <div key={group.id} className="rounded-lg border border-gray-200 p-3 space-y-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={group.name}
                                        onChange={(e) => updateGroup(group.id, (target) => ({ ...target, name: e.target.value }))}
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded"
                                        placeholder="Group name"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setConfig((prev) => ({ ...prev, linkGroups: moveArrayItem(prev.linkGroups, groupIndex, 'up') }))}
                                        disabled={groupIndex === 0}
                                        className="p-2 rounded border border-gray-200 disabled:opacity-40"
                                    >
                                        <ChevronUp size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfig((prev) => ({ ...prev, linkGroups: moveArrayItem(prev.linkGroups, groupIndex, 'down') }))}
                                        disabled={groupIndex === config.linkGroups.length - 1}
                                        className="p-2 rounded border border-gray-200 disabled:opacity-40"
                                    >
                                        <ChevronDown size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfig((prev) => ({
                                            ...prev,
                                            linkGroups: prev.linkGroups.filter((entry) => entry.id !== group.id).map((entry, order) => ({ ...entry, order })),
                                        }))}
                                        className="p-2 rounded border border-red-200 text-red-600"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {(group.links || [])
                                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                        .map((link, linkIndex) => (
                                            <div key={link.id} className="grid grid-cols-12 gap-2 items-center">
                                                <input
                                                    type="text"
                                                    value={link.label}
                                                    onChange={(e) => updateGroup(group.id, (target) => ({
                                                        ...target,
                                                        links: target.links.map((entry) => entry.id === link.id ? { ...entry, label: e.target.value } : entry),
                                                    }))}
                                                    className="col-span-4 px-2 py-1.5 text-sm border border-gray-300 rounded"
                                                    placeholder="Label"
                                                />
                                                <input
                                                    type="text"
                                                    value={link.path}
                                                    onChange={(e) => updateGroup(group.id, (target) => ({
                                                        ...target,
                                                        links: target.links.map((entry) => entry.id === link.id ? { ...entry, path: e.target.value } : entry),
                                                    }))}
                                                    className="col-span-5 px-2 py-1.5 text-sm border border-gray-300 rounded"
                                                    placeholder="/path or https://..."
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => updateGroup(group.id, (target) => ({
                                                        ...target,
                                                        links: target.links.map((entry) => entry.id === link.id ? { ...entry, enabled: !entry.enabled } : entry),
                                                    }))}
                                                    className={`col-span-1 p-1.5 rounded ${link.enabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                                                >
                                                    {link.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateGroup(group.id, (target) => ({
                                                        ...target,
                                                        links: moveArrayItem(target.links, linkIndex, 'up'),
                                                    }))}
                                                    disabled={linkIndex === 0}
                                                    className="col-span-1 p-1.5 rounded border border-gray-200 disabled:opacity-40"
                                                >
                                                    <ChevronUp size={12} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateGroup(group.id, (target) => ({
                                                        ...target,
                                                        links: moveArrayItem(target.links, linkIndex, 'down'),
                                                    }))}
                                                    disabled={linkIndex === group.links.length - 1}
                                                    className="col-span-1 p-1.5 rounded border border-gray-200 disabled:opacity-40"
                                                >
                                                    <ChevronDown size={12} />
                                                </button>
                                            </div>
                                        ))}
                                </div>

                                <div className="flex justify-between">
                                    <button
                                        type="button"
                                        onClick={() => updateGroup(group.id, (target) => ({
                                            ...target,
                                            links: [
                                                ...target.links,
                                                {
                                                    id: createFooterId('link'),
                                                    label: `Link ${target.links.length + 1}`,
                                                    path: '/',
                                                    enabled: true,
                                                    order: target.links.length,
                                                },
                                            ],
                                        }))}
                                        className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
                                    >
                                        <Plus size={14} className="inline mr-1" />
                                        Add link
                                    </button>
                                </div>
                            </div>
                        ))}
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        Legal / Policy Links
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                            <Lock size={12} />
                            Required block
                        </span>
                    </h3>
                    {config.legal.policyLinks
                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                        .map((link, index) => (
                            <div key={link.id} className="grid grid-cols-12 gap-2 items-center">
                                <input
                                    type="text"
                                    value={link.label}
                                    onChange={(e) => setConfig((prev) => ({
                                        ...prev,
                                        legal: {
                                            ...prev.legal,
                                            policyLinks: prev.legal.policyLinks.map((entry) =>
                                                entry.id === link.id ? { ...entry, label: e.target.value } : entry
                                            ),
                                        },
                                    }))}
                                    className="col-span-4 px-2 py-1.5 text-sm border border-gray-300 rounded"
                                />
                                <input
                                    type="text"
                                    value={link.path}
                                    onChange={(e) => setConfig((prev) => ({
                                        ...prev,
                                        legal: {
                                            ...prev.legal,
                                            policyLinks: prev.legal.policyLinks.map((entry) =>
                                                entry.id === link.id ? { ...entry, path: e.target.value } : entry
                                            ),
                                        },
                                    }))}
                                    className="col-span-6 px-2 py-1.5 text-sm border border-gray-300 rounded"
                                />
                                <button
                                    type="button"
                                    onClick={() => setConfig((prev) => ({
                                        ...prev,
                                        legal: {
                                            ...prev.legal,
                                            policyLinks: prev.legal.policyLinks.map((entry) =>
                                                entry.id === link.id ? { ...entry, enabled: !entry.enabled } : entry
                                            ),
                                        },
                                    }))}
                                    className={`col-span-1 p-1.5 rounded ${link.enabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                                >
                                    {link.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                                </button>
                                <div className="col-span-1 flex flex-col gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setConfig((prev) => ({
                                            ...prev,
                                            legal: {
                                                ...prev.legal,
                                                policyLinks: moveArrayItem(prev.legal.policyLinks, index, 'up'),
                                            },
                                        }))}
                                        disabled={index === 0}
                                        className="p-1 rounded border border-gray-200 disabled:opacity-40"
                                    >
                                        <ChevronUp size={12} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfig((prev) => ({
                                            ...prev,
                                            legal: {
                                                ...prev.legal,
                                                policyLinks: moveArrayItem(prev.legal.policyLinks, index, 'down'),
                                            },
                                        }))}
                                        disabled={index === config.legal.policyLinks.length - 1}
                                        className="p-1 rounded border border-gray-200 disabled:opacity-40"
                                    >
                                        <ChevronDown size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                    <h3 className="font-semibold text-gray-900">Newsletter Block</h3>
                    <input
                        type="text"
                        value={config.newsletter.heading}
                        onChange={(e) => setConfig((prev) => ({
                            ...prev,
                            newsletter: { ...prev.newsletter, heading: e.target.value },
                        }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                        placeholder="Heading"
                    />
                    <input
                        type="text"
                        value={config.newsletter.buttonText}
                        onChange={(e) => setConfig((prev) => ({
                            ...prev,
                            newsletter: { ...prev.newsletter, buttonText: e.target.value },
                        }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                        placeholder="Button text"
                    />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">Social Media</h3>
                    {(config.social.links || [])
                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                        .map((social) => (
                            <div key={social.id} className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-3 text-sm text-gray-700">{social.label}</div>
                                <input
                                    type="text"
                                    value={social.url}
                                    onChange={(e) => setConfig((prev) => ({
                                        ...prev,
                                        social: {
                                            ...prev.social,
                                            links: prev.social.links.map((entry) =>
                                                entry.id === social.id ? { ...entry, url: e.target.value } : entry
                                            ),
                                        },
                                    }))}
                                    className="col-span-8 px-2 py-1.5 text-sm border border-gray-300 rounded"
                                    placeholder="https://..."
                                />
                                <button
                                    type="button"
                                    onClick={() => setConfig((prev) => ({
                                        ...prev,
                                        social: {
                                            ...prev.social,
                                            links: prev.social.links.map((entry) =>
                                                entry.id === social.id ? { ...entry, enabled: !entry.enabled } : entry
                                            ),
                                        },
                                    }))}
                                    className={`col-span-1 p-1.5 rounded ${social.enabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                                >
                                    {social.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                                </button>
                            </div>
                        ))}
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        Copyright
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                            <Lock size={12} />
                            Required block
                        </span>
                    </h3>
                    <input
                        type="text"
                        value={config.copyright.text}
                        onChange={(e) => setConfig((prev) => ({
                            ...prev,
                            copyright: { ...prev.copyright, text: e.target.value },
                        }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                    />
                    <p className="text-xs text-gray-500">
                        Tokens: {'{{year}}'} and {'{{store_name}}'}
                    </p>
                </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-200 space-y-3">
                {saveError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                        <AlertCircle size={16} />
                        <span>{saveError}</span>
                    </div>
                )}

                {saveSuccess && (
                    <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">
                        <CheckCircle size={16} />
                        <span>Footer settings saved.</span>
                    </div>
                )}

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
                                <span>Save Footer</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
