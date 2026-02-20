import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useAdminMerchant } from '../../context/adminMerchantContext';
import { supabase } from '../../lib/supabase';

// TikTok icon component
const TikTokIcon = ({ size = 24, className = "" }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
);

export default function TikTokMarketing() {
    const { merchant } = useAdminMerchant();
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
                .eq('platform', 'tiktok')
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
                        platform: 'tiktok',
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
                    .eq('platform', 'tiktok');

                if (error) throw error;
            }

            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            console.error('Error saving TikTok Pixel:', error);
            setSaveStatus('error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <TikTokIcon size={32} className="text-black" />
                    TikTok Marketing
                </h1>
                <p className="text-gray-500 mt-2">
                    Connect your store with TikTok to track conversions and optimize your ad campaigns.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50 space-y-1">
                    <h2 className="text-lg font-semibold text-gray-900">TikTok Pixel</h2>
                    <p className="text-sm text-gray-500">
                        The TikTok Pixel helps you track visitor activity and measure ad performance on your store.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex gap-3">
                        <div className="bg-gray-100 p-2 rounded-full h-fit">
                            <TikTokIcon size={20} className="text-black" />
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900">Why use TikTok Pixel?</h3>
                            <p className="text-sm text-gray-700 mt-1">
                                Track conversions, optimize your ads, build targeted audiences, and measure the effectiveness of your TikTok advertising campaigns.
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            TikTok Pixel ID
                        </label>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={pixelId}
                                    onChange={(e) => setPixelId(e.target.value)}
                                    placeholder="e.g., C1234567890ABCDEFGHIJKLM"
                                    className="w-full pl-4 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            Don't have a Pixel ID?
                            <a
                                href="https://ads.tiktok.com/help/article/standard-mode-pixel"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-700 hover:underline flex items-center gap-1 font-medium"
                            >
                                Learn how to create one <ExternalLink size={10} />
                            </a>
                        </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-black hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
