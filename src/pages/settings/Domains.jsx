import React, { useState, useEffect } from 'react';
import { Globe, Save, Loader2, CheckCircle, Eye, Link2, ExternalLink, AlertCircle } from 'lucide-react';
import { useAdminMerchant } from '../../context/adminMerchantContext';
import { supabase } from '../../lib/supabase';

export default function DomainsSettings() {
    const { merchant, merchantId, loading: merchantLoading, refetch } = useAdminMerchant();

    const [customDomain, setCustomDomain] = useState({
        domain: '',
        verified: false,
        configuredAt: null
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

    // Load merchant data when component mounts or merchant changes
    useEffect(() => {
        if (merchant) {
            // Load custom domain settings
            setCustomDomain({
                domain: merchant.custom_domain || '',
                verified: merchant.custom_domain_verified || false,
                configuredAt: merchant.custom_domain_configured_at || null
            });
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
            const updateData = {};

            // Add custom domain if provided
            if (customDomain.domain.trim()) {
                updateData.custom_domain = customDomain.domain.trim().toLowerCase();
                // Set configured timestamp if this is the first time
                if (!customDomain.configuredAt) {
                    updateData.custom_domain_configured_at = new Date().toISOString();
                }
            } else {
                // Clear custom domain if empty
                updateData.custom_domain = null;
                updateData.custom_domain_verified = false;
                updateData.custom_domain_configured_at = null;
            }

            const { error } = await supabase
                .from('merchants')
                .update(updateData)
                .eq('id', merchantId);

            if (error) throw error;

            setSaveStatus('success');
            await refetch();

            setTimeout(() => setSaveStatus(null), 3000);
        } catch (err) {
            console.error('Error saving domain settings:', err);
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
            {/* Page Header */}
            <div className="mb-2">
                <h1 className="text-2xl font-bold text-gray-900">Domains</h1>
                <p className="text-gray-500 mt-1">
                    Connect your own domain to your storefront
                </p>
            </div>

            {/* Current Storefront URL */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Link2 size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Default Store URL</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Your free SOLDT storefront URL
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                        <div className="flex items-start gap-4">
                            <div className="p-2.5 bg-white rounded-lg shadow-sm">
                                <Eye size={22} className="text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                                    Your Storefront is Live
                                </h3>
                                <a
                                    href={`${window.location.origin}/s/${merchant?.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-900 font-medium text-sm bg-white px-3 py-1.5 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
                                >
                                    {window.location.origin}/s/{merchant?.slug}
                                    <ExternalLink size={14} />
                                </a>
                                <p className="text-xs text-blue-700 mt-3">
                                    This is your default storefront URL. Share it with your customers or add a custom domain below.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Domain Configuration */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Globe size={24} className="text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Custom Domain</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Use your own domain for a professional storefront experience
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Custom Domain Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Custom Domain
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={customDomain.domain}
                                onChange={(e) => setCustomDomain({ ...customDomain, domain: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                                placeholder="shop.yourdomain.com"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Enter your custom domain (e.g., shop.yourdomain.com or www.yourdomain.com)
                        </p>
                    </div>

                    {/* Domain Status */}
                    {customDomain.domain && (
                        <div className={`p-5 rounded-xl border-2 ${customDomain.verified
                            ? 'bg-green-50 border-green-200'
                            : 'bg-amber-50 border-amber-200'
                            }`}>
                            <div className="flex items-start gap-4">
                                {customDomain.verified ? (
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <CheckCircle size={22} className="text-green-600" />
                                    </div>
                                ) : (
                                    <div className="p-2 bg-amber-100 rounded-lg">
                                        <AlertCircle size={22} className="text-amber-600" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h3 className={`text-sm font-semibold mb-1 ${customDomain.verified ? 'text-green-900' : 'text-amber-900'
                                        }`}>
                                        {customDomain.verified ? 'Domain Verified & Active' : 'Domain Pending Verification'}
                                    </h3>
                                    <p className={`text-sm ${customDomain.verified ? 'text-green-700' : 'text-amber-700'
                                        }`}>
                                        {customDomain.verified
                                            ? 'Your custom domain is active and customers can access your store.'
                                            : 'Follow the DNS instructions below to verify your domain.'}
                                    </p>
                                    {customDomain.configuredAt && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            Configured on {new Date(customDomain.configuredAt).toLocaleDateString('en-ZA', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DNS Configuration Instructions */}
                    {customDomain.domain && !customDomain.verified && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">?</span>
                                DNS Configuration Steps
                            </h3>
                            <ol className="space-y-4 text-sm text-gray-700">
                                <li className="flex gap-3">
                                    <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</span>
                                    <div className="flex-1 pt-0.5">
                                        <strong>Log in to your domain registrar</strong>
                                        <p className="text-gray-500 mt-0.5">GoDaddy, Namecheap, Domains.co.za, or wherever you bought your domain</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</span>
                                    <div className="flex-1 pt-0.5">
                                        <strong>Add a CNAME record</strong> with these details:
                                        <div className="mt-3 bg-white border border-gray-300 rounded-lg p-4 font-mono text-sm">
                                            <div className="grid grid-cols-[100px_1fr] gap-y-2 gap-x-4">
                                                <div className="text-gray-500">Type:</div>
                                                <div className="font-semibold text-gray-900">CNAME</div>
                                                <div className="text-gray-500">Name/Host:</div>
                                                <div className="font-semibold text-gray-900 break-all">
                                                    {customDomain.domain.replace(/^https?:\/\//, '').split('.')[0] || 'www'}
                                                </div>
                                                <div className="text-gray-500">Value/Target:</div>
                                                <div className="font-semibold text-blue-600">cname.vercel-dns.com</div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</span>
                                    <div className="flex-1 pt-0.5">
                                        <strong>Save your DNS changes</strong>
                                        <p className="text-gray-500 mt-0.5">DNS changes can take 24-48 hours to propagate worldwide</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">4</span>
                                    <div className="flex-1 pt-0.5">
                                        <strong>Click "Save Changes" below</strong> to save your custom domain to your store
                                    </div>
                                </li>
                            </ol>
                            <div className="mt-6 pt-4 border-t border-gray-300">
                                <p className="text-xs text-gray-600 flex items-start gap-2">
                                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                    <span>
                                        <strong>Note:</strong> After saving, contact our support team to complete the domain verification
                                        and SSL certificate setup. Your domain will be live within 24-48 hours.
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* View Storefront Link */}
                    {customDomain.verified && (
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => window.open(`https://${customDomain.domain}`, '_blank')}
                                className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium flex items-center gap-2 shadow-sm"
                            >
                                <ExternalLink size={18} />
                                Visit Your Store
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Save Button Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex justify-between items-center sticky bottom-4">
                {/* Save Status Message */}
                <div className="flex items-center gap-2">
                    {saveStatus === 'success' && (
                        <span className="text-sm text-green-600 flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg">
                            <CheckCircle size={16} />
                            Domain settings saved successfully
                        </span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="text-sm text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-lg">
                            <AlertCircle size={16} />
                            Failed to save settings. Please try again.
                        </span>
                    )}
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    <Save size={18} />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}
