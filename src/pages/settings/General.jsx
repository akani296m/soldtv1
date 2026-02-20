import React, { useState, useEffect } from 'react';
import { Save, Building2, Mail, Phone, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { useAdminMerchant } from '../../context/adminMerchantContext';
import { supabase } from '../../lib/supabase';

export default function GeneralSettings() {
    const { merchant, merchantId, loading: merchantLoading, refetch } = useAdminMerchant();

    const [formData, setFormData] = useState({
        storeName: '',
        storeEmail: '',
        storePhone: '',
        storeAddress: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'South Africa',
        timezone: 'Africa/Johannesburg',
        currency: 'ZAR',
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

    // Load merchant data when component mounts or merchant changes
    useEffect(() => {
        if (merchant) {
            setFormData(prev => ({
                ...prev,
                // Use store_name or name as the store name (prefer store_name as it's what's set during onboarding)
                storeName: merchant.store_name || merchant.name || merchant.business_name || '',
                storeEmail: merchant.email || '',
                storePhone: merchant.phone || '',
                storeAddress: merchant.address || '',
                city: merchant.city || '',
                state: merchant.state || '',
                zipCode: merchant.zip_code || '',
                country: merchant.country || 'South Africa',
                timezone: merchant.timezone || 'Africa/Johannesburg',
                currency: merchant.currency || 'ZAR',
            }));
        }
    }, [merchant]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        // Clear save status when user makes changes
        if (saveStatus) setSaveStatus(null);
    };

    const handleSave = async () => {
        if (!merchantId) {
            setSaveStatus('error');
            return;
        }

        setIsSaving(true);
        setSaveStatus(null);

        try {
            const { error } = await supabase
                .from('merchants')
                .update({
                    name: formData.storeName,
                    store_name: formData.storeName,
                    business_name: formData.storeName,
                    email: formData.storeEmail,
                    phone: formData.storePhone,
                    address: formData.storeAddress,
                    city: formData.city,
                    state: formData.state,
                    zip_code: formData.zipCode,
                    country: formData.country,
                    timezone: formData.timezone,
                    currency: formData.currency,
                })
                .eq('id', merchantId);

            if (error) throw error;

            setSaveStatus('success');
            // Refresh merchant context to reflect changes
            await refetch();

            // Clear success message after 3 seconds
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (err) {
            console.error('Error saving general settings:', err);
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
        <div className="max-w-4xl">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Building2 size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">General Settings</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Manage your store's basic information and contact details
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-6 space-y-6">
                    {/* Store Information */}
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Store Information</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Store Name
                                </label>
                                <input
                                    type="text"
                                    name="storeName"
                                    value={formData.storeName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter your store name"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Mail size={16} className="inline mr-1" />
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="storeEmail"
                                        value={formData.storeEmail}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="store@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Phone size={16} className="inline mr-1" />
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="storePhone"
                                        value={formData.storePhone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="pt-6 border-t border-gray-200">
                        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <MapPin size={18} />
                            Store Address
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Street Address
                                </label>
                                <input
                                    type="text"
                                    name="storeAddress"
                                    value={formData.storeAddress}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="123 Main Street"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        State/Province
                                    </label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ZIP/Postal Code
                                    </label>
                                    <input
                                        type="text"
                                        name="zipCode"
                                        value={formData.zipCode}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Country
                                </label>
                                <select
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="United States">United States</option>
                                    <option value="Canada">Canada</option>
                                    <option value="United Kingdom">United Kingdom</option>
                                    <option value="South Africa">South Africa</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Standards and formats */}
                    <div className="pt-6 border-t border-gray-200">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">
                            Standards and Formats
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Timezone
                                </label>
                                <select
                                    name="timezone"
                                    value={formData.timezone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="America/New_York">Eastern Time (ET)</option>
                                    <option value="America/Chicago">Central Time (CT)</option>
                                    <option value="America/Denver">Mountain Time (MT)</option>
                                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                    <option value="Africa/Johannesburg">South Africa (SAST)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Currency
                                </label>
                                <select
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="USD">USD - US Dollar</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="GBP">GBP - British Pound</option>
                                    <option value="ZAR">ZAR - South African Rand</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-between items-center">
                    {/* Save Status Message */}
                    <div className="flex items-center gap-2">
                        {saveStatus === 'success' && (
                            <span className="text-sm text-green-600 flex items-center gap-1">
                                <CheckCircle size={16} />
                                Settings saved successfully
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
        </div>
    );
}
