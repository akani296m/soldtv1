import React, { useState, useEffect } from 'react';
import { Facebook, Save, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useAdminMerchant } from '../../context/adminMerchantContext';
import { supabase } from '../../lib/supabase';

export default function FacebookMarketing() {
    const { merchant, refetch } = useAdminMerchant();
    const [pixelId, setPixelId] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);

    useEffect(() => {
        const fetchPixel = async () => {
            if (!merchant?.id) return;

            const { data, error } = await supabase
                .from('merchant_pixels')
                .select('pixel_id')
                .eq('merchant_id', merchant.id)
                .eq('platform', 'meta')
                .maybeSingle();

            if (!error && data?.pixel_id) {
                setPixelId(data.pixel_id);
            }
        };

        fetchPixel();
    }, [merchant?.id]);

    const handleSave = async () => {
        if (!merchant?.id) return;
        setSaving(true);
        setSaveStatus(null);

        try {
            const trimmedPixelId = pixelId.trim();

            if (trimmedPixelId) {
                // Upsert: Insert or update the pixel
                const { error } = await supabase
                    .from('merchant_pixels')
                    .upsert({
                        merchant_id: merchant.id,
                        platform: 'meta',
                        pixel_id: trimmedPixelId
                    }, {
                        onConflict: 'merchant_id,platform'
                    });

                if (error) throw error;
            } else {
                // Delete the pixel if empty
                const { error } = await supabase
                    .from('merchant_pixels')
                    .delete()
                    .eq('merchant_id', merchant.id)
                    .eq('platform', 'meta');

                if (error) throw error;
            }

            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            console.error('Error saving Facebook Pixel:', error);
            setSaveStatus('error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Facebook className="text-blue-600" size={32} />
                    Facebook Marketing
                </h1>
                <p className="text-gray-500 mt-2">
                    Connect your store with Facebook to track conversions and run effective ad campaigns.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50 space-y-1">
                    <h2 className="text-lg font-semibold text-gray-900">Facebook Pixel</h2>
                    <p className="text-sm text-gray-500">
                        The Facebook Pixel helps you track visitor activity on your store.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                        <div className="bg-blue-100 p-2 rounded-full h-fit">
                            <Facebook className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <h3 className="font-medium text-blue-900">Why use Facebook Pixel?</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                It helps you measure the effectiveness of your advertising by understanding the actions people take on your website.
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Facebook Pixel ID
                        </label>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={pixelId}
                                    onChange={(e) => setPixelId(e.target.value)}
                                    placeholder="e.g., 123456789012345"
                                    className="w-full pl-4 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            Don't have a Pixel ID?
                            <a
                                href="https://www.facebook.com/business/help/952192354843755"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                                Learn how to create one <ExternalLink size={10} />
                            </a>
                        </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Pixel ID
                                </>
                            )}
                        </button>

                        {saveStatus === 'success' && (
                            <span className="text-green-600 flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-left-2">
                                <CheckCircle size={16} /> Saved successfully
                            </span>
                        )}

                        {saveStatus === 'error' && (
                            <span className="text-red-600 flex items-center gap-2 text-sm font-medium animate-in fade-in-from-left-2">
                                <AlertCircle size={16} /> Error saving. Please try again.
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
