import React, { useState, useEffect } from 'react';
import { FileText, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAdminMerchant } from '../../context/adminMerchantContext';
import { supabase } from '../../lib/supabase';

export default function Pages() {
    const { merchant, merchantId, loading: merchantLoading, refetch } = useAdminMerchant();
    const [activeTab, setActiveTab] = useState('shipping');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

    const [pages, setPages] = useState({
        shipping: '',
        privacy: '',
        about: '',
    });

    // Load page content when merchant data loads
    useEffect(() => {
        if (merchant) {
            setPages({
                shipping: merchant.shipping_policy || '',
                privacy: merchant.privacy_policy || '',
                about: merchant.about_us || '',
            });
        }
    }, [merchant]);

    const handleChange = (e) => {
        const { value } = e.target;
        setPages((prev) => ({
            ...prev,
            [activeTab]: value,
        }));
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
                    shipping_policy: pages.shipping,
                    privacy_policy: pages.privacy,
                    about_us: pages.about,
                })
                .eq('id', merchantId);

            if (error) throw error;

            setSaveStatus('success');
            // Refresh merchant context to reflect changes
            await refetch();

            // Clear success message after 3 seconds
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (err) {
            console.error('Error saving pages:', err);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: 'shipping', label: 'Shipping Policy', icon: FileText },
        { id: 'privacy', label: 'Privacy Policy', icon: FileText },
        { id: 'about', label: 'About Us', icon: FileText },
    ];

    const placeholders = {
        shipping: `Example Shipping Policy:

SHIPPING INFORMATION

Processing Time:
• Orders are processed within 1-2 business days
• You will receive a confirmation email once your order has been shipped

Shipping Methods:
• Standard Shipping (3-5 business days)
• Express Shipping (1-2 business days)

Shipping Costs:
• Free shipping on orders over R500
• Standard shipping: R50
• Express shipping: R100

International Shipping:
• We currently ship to select countries
• International orders may take 7-14 business days
• Additional customs fees may apply

Tracking:
• You will receive a tracking number via email once your order ships
• Track your order through our website or the courier's website

Contact Us:
If you have any questions about shipping, please contact us at [your email]`,

        privacy: `Example Privacy Policy:

PRIVACY POLICY

Information We Collect:
• Personal information (name, email, address, phone number)
• Payment information
• Order history
• Browsing behavior on our website

How We Use Your Information:
• To process and fulfill your orders
• To communicate with you about your orders
• To improve our products and services
• To send promotional emails (with your consent)

Information Security:
• We use industry-standard encryption to protect your data
• Your payment information is never stored on our servers
• We implement strict access controls

Cookies:
• We use cookies to enhance your browsing experience
• You can disable cookies in your browser settings

Third-Party Sharing:
• We do not sell your personal information to third parties
• We share information with trusted partners only to fulfill orders

Your Rights:
• You have the right to access your personal data
• You can request deletion of your data at any time
• You can opt out of marketing communications

Contact Us:
For privacy concerns, please email us at [your email]`,

        about: `Example About Us:

ABOUT US

Our Story:
[Your company name] was founded in [year] with a mission to [describe your mission]. We believe in [your core values].

What We Do:
We specialize in [describe your products/services]. Our team is dedicated to providing [what makes you unique].

Our Mission:
To [state your mission statement]. We strive to [your goals].

Our Values:
• Quality: We never compromise on quality
• Customer Service: Your satisfaction is our priority
• Innovation: We continuously improve our products
• Sustainability: We care about our environmental impact

Why Choose Us:
• [Unique selling point 1]
• [Unique selling point 2]
• [Unique selling point 3]
• [Unique selling point 4]

Our Team:
Our passionate team of [number] professionals works hard to bring you the best [products/services] in the industry.

Contact Us:
We'd love to hear from you! Reach out at [your email] or call us at [your phone number].`,
    };

    // Show loading state while fetching merchant data
    if (merchantLoading) {
        return (
            <div className="max-w-6xl flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <FileText size={24} className="text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Store Pages</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Manage your store's informational pages
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
                            {isSaving ? 'Saving...' : 'Save All Pages'}
                        </button>
                    </div>
                </div>

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
                                    <span className="font-medium">Pages saved successfully!</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle size={20} />
                                    <span className="font-medium">
                                        Failed to save pages. Please try again.
                                    </span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Editor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {tabs.find((t) => t.id === activeTab)?.label} Content
                        </label>
                        <textarea
                            value={pages[activeTab]}
                            onChange={handleChange}
                            placeholder={placeholders[activeTab]}
                            rows={20}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y"
                        />
                        <div className="mt-2 flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                                This content will be displayed on your store's {tabs.find((t) => t.id === activeTab)?.label.toLowerCase()} page
                            </p>
                            <p className="text-xs text-gray-500">
                                {pages[activeTab].length} characters
                            </p>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips</h3>
                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                            <li>Be clear and concise in your policies</li>
                            <li>Update your pages regularly to reflect current practices</li>
                            <li>Include contact information for customer inquiries</li>
                            <li>Make sure your policies comply with local regulations</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
