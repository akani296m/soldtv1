import React, { useState, useEffect } from 'react';
import { ChevronRight, CheckCircle, AlertCircle, Eye, EyeOff, Building, DollarSign } from 'lucide-react';
import { useAdminMerchant } from '../../context/adminMerchantContext';
import { supabase } from '../../lib/supabase';

// Official payment provider logos
import YocoLogo from '../../assets/icons/yoco.svg';
import PaystackLogo from '../../assets/icons/Paystack.svg';
import PayfastLogo from '../../assets/icons/Payfast.svg';
import OzowLogo from '../../assets/icons/Ozow.svg';
import WhopLogo from '../../assets/icons/Whop.svg';
import ManualEFTLogo from '../../assets/icons/manualeft.svg';
import TestGatewayLogo from '../../assets/icons/testgateway.svg';

// Gateway data configuration
const PAYMENT_GATEWAYS = [
    {
        id: 'yoco',
        name: 'Yoco',
        logo: YocoLogo,
        description: 'Accept card payments with competitive rates',
        keyField: 'yoco_secret_key',
        dashboardUrl: 'https://portal.yoco.com/',
        dashboardLabel: 'Yoco Portal → API Keys',
        isSecretKey: true,
    },
    {
        id: 'paystack',
        name: 'Paystack',
        logo: PaystackLogo,
        description: 'Accept payments via cards, bank transfers, and mobile money',
        keyField: 'paystack_public_key',
        dashboardUrl: 'https://dashboard.paystack.com/#/settings/developers',
        dashboardLabel: 'Paystack Dashboard → Settings → API Keys & Webhooks',
    },
    {
        id: 'payfast',
        name: 'PayFast',
        logo: PayfastLogo,
        description: 'South African payment gateway supporting multiple payment methods',
        keyField: 'payfast_merchant_id',
        dashboardUrl: 'https://www.payfast.co.za/dashboard',
        dashboardLabel: 'PayFast Dashboard → Settings → Integration',
    },
    {
        id: 'ozow',
        name: 'Ozow',
        logo: OzowLogo,
        description: 'Instant EFT payments directly from customer bank accounts',
        keyField: 'ozow_site_code',
        dashboardUrl: 'https://ozow.com/merchant',
        dashboardLabel: 'Ozow Merchant Portal → API Settings',
    },
    {
        id: 'whop',
        name: 'Whop',
        logo: WhopLogo,
        description: 'Global payments with cards, Apple Pay, Google Pay, and crypto',
        keyField: 'whop_plan_id',
        dashboardUrl: 'https://dash.whop.com/',
        dashboardLabel: 'Whop Dashboard → Products → Plans',
        isPlanId: true,
    },
    {
        id: 'manual_eft',
        name: 'Bank Transfer',
        logo: ManualEFTLogo,
        description: 'Accept direct bank transfers with Proof of Payment verification',
        keyField: 'eft_enabled',
        isManualEFT: true,
    },
    {
        id: 'test_gateway',
        name: 'Test Gateway',
        logo: TestGatewayLogo,
        description: 'Test payment gateway for development. Card "1" = success, "2" = failure',
        keyField: 'test_gateway_enabled',
        isTestGateway: true,
    },
];

// South African banks list
const SA_BANKS = [
    'ABSA Bank',
    'African Bank',
    'Bidvest Bank',
    'Capitec Bank',
    'Discovery Bank',
    'First National Bank (FNB)',
    'Investec Bank',
    'Nedbank',
    'Old Mutual',
    'Standard Bank',
    'TymeBank',
    'Other',
];

export default function FinanceSettings() {
    const { merchant, refetch } = useAdminMerchant();
    const [expandedGateway, setExpandedGateway] = useState(null);
    const [gatewayKeys, setGatewayKeys] = useState({});
    const [showKeys, setShowKeys] = useState({});
    const [saving, setSaving] = useState({});
    const [saveStatus, setSaveStatus] = useState({});

    // Manual EFT banking details state
    const [eftDetails, setEftDetails] = useState({
        eft_enabled: false,
        eft_bank_name: '',
        eft_account_holder: '',
        eft_account_number: '',
        eft_branch_code: '',
        eft_account_type: 'cheque',
    });


    // Load existing gateway keys when merchant data loads
    useEffect(() => {
        const fetchGatewayKeys = async () => {
            if (!merchant?.id) return;

            // Initialize from merchant context
            const keys = {};
            PAYMENT_GATEWAYS.forEach(gateway => {
                if (merchant[gateway.keyField]) {
                    keys[gateway.id] = merchant[gateway.keyField];
                }
            });
            setGatewayKeys(keys);

            // Initialize EFT details from merchant context
            setEftDetails({
                eft_enabled: merchant.eft_enabled || false,
                eft_bank_name: merchant.eft_bank_name || '',
                eft_account_holder: merchant.eft_account_holder || '',
                eft_account_number: merchant.eft_account_number || '',
                eft_branch_code: merchant.eft_branch_code || '',
                eft_account_type: merchant.eft_account_type || 'cheque',
            });

            // Fetch keys from database if not in context
            try {
                const { data, error } = await supabase
                    .from('merchants')
                    .select('paystack_public_key, yoco_secret_key, whop_plan_id, eft_enabled, eft_bank_name, eft_account_holder, eft_account_number, eft_branch_code, eft_account_type, test_gateway_enabled')
                    .eq('id', merchant.id)
                    .single();

                if (!error && data) {
                    setGatewayKeys(prev => ({
                        ...prev,
                        paystack: data.paystack_public_key || prev.paystack,
                        yoco: data.yoco_secret_key || prev.yoco,
                        whop: data.whop_plan_id || prev.whop,
                        manual_eft: data.eft_enabled || prev.manual_eft,
                        test_gateway: data.test_gateway_enabled || prev.test_gateway
                    }));

                    // Update EFT details
                    setEftDetails({
                        eft_enabled: data.eft_enabled || false,
                        eft_bank_name: data.eft_bank_name || '',
                        eft_account_holder: data.eft_account_holder || '',
                        eft_account_number: data.eft_account_number || '',
                        eft_branch_code: data.eft_branch_code || '',
                        eft_account_type: data.eft_account_type || 'cheque',
                    });
                }
            } catch (err) {
                console.error('Error fetching gateway keys:', err);
            }
        };

        fetchGatewayKeys();
    }, [merchant?.id, merchant?.paystack_public_key]);

    const handleSaveGateway = async (gatewayId, keyField) => {
        if (!merchant?.id) {
            setSaveStatus(prev => ({ ...prev, [gatewayId]: 'error' }));
            return;
        }

        setSaving(prev => ({ ...prev, [gatewayId]: true }));
        setSaveStatus(prev => ({ ...prev, [gatewayId]: null }));

        try {
            const updateData = {};
            // Handle boolean values (test_gateway) vs string values (API keys)
            const value = gatewayKeys[gatewayId];
            updateData[keyField] = typeof value === 'boolean' ? value : (value?.trim() || null);

            const { error } = await supabase
                .from('merchants')
                .update(updateData)
                .eq('id', merchant.id);

            if (error) throw error;

            setSaveStatus(prev => ({ ...prev, [gatewayId]: 'success' }));
            refetch();

            setTimeout(() => setSaveStatus(prev => ({ ...prev, [gatewayId]: null })), 3000);
        } catch (error) {
            console.error(`Error saving ${gatewayId} configuration:`, error);
            setSaveStatus(prev => ({ ...prev, [gatewayId]: 'error' }));
        } finally {
            setSaving(prev => ({ ...prev, [gatewayId]: false }));
        }
    };

    // Special save handler for Manual EFT
    const handleSaveManualEFT = async () => {
        if (!merchant?.id) {
            setSaveStatus(prev => ({ ...prev, manual_eft: 'error' }));
            return;
        }

        // Validate required fields when enabling
        if (eftDetails.eft_enabled) {
            if (!eftDetails.eft_bank_name || !eftDetails.eft_account_holder ||
                !eftDetails.eft_account_number || !eftDetails.eft_branch_code) {
                alert('Please fill in all banking details to enable Manual EFT payments.');
                return;
            }
        }

        setSaving(prev => ({ ...prev, manual_eft: true }));
        setSaveStatus(prev => ({ ...prev, manual_eft: null }));

        try {
            const { error } = await supabase
                .from('merchants')
                .update({
                    eft_enabled: eftDetails.eft_enabled,
                    eft_bank_name: eftDetails.eft_bank_name.trim() || null,
                    eft_account_holder: eftDetails.eft_account_holder.trim() || null,
                    eft_account_number: eftDetails.eft_account_number.trim() || null,
                    eft_branch_code: eftDetails.eft_branch_code.trim() || null,
                    eft_account_type: eftDetails.eft_account_type || 'cheque',
                })
                .eq('id', merchant.id);

            if (error) throw error;

            setSaveStatus(prev => ({ ...prev, manual_eft: 'success' }));
            refetch();

            setTimeout(() => setSaveStatus(prev => ({ ...prev, manual_eft: null })), 3000);
        } catch (error) {
            console.error('Error saving Manual EFT configuration:', error);
            setSaveStatus(prev => ({ ...prev, manual_eft: 'error' }));
        } finally {
            setSaving(prev => ({ ...prev, manual_eft: false }));
        }
    };

    const isGatewayActive = (gatewayId) => {
        // Special check for Manual EFT
        if (gatewayId === 'manual_eft') {
            return eftDetails.eft_enabled && eftDetails.eft_bank_name && eftDetails.eft_account_number;
        }
        return gatewayKeys[gatewayId] && String(gatewayKeys[gatewayId]).trim().length > 0;
    };

    const toggleExpanded = (gatewayId) => {
        setExpandedGateway(expandedGateway === gatewayId ? null : gatewayId);
    };

    const renderGatewayContent = (gateway) => {
        const isActive = isGatewayActive(gateway.id);
        const isSecretKey = gateway.isSecretKey || false;
        const isPlanId = gateway.isPlanId || false;

        // Determine label and placeholder based on key type
        let keyLabel = 'Public Key';
        let placeholder = 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxx';

        if (isSecretKey) {
            keyLabel = 'Secret Key';
            placeholder = 'sk_test_xxxxxxxxxxxxxxxxxxxxxxxx';
        } else if (isPlanId) {
            keyLabel = 'Plan ID';
            placeholder = 'plan_XXXXXXXXX';
        }

        return (
            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-semibold text-gray-900">{gateway.name}</h3>
                    {isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            <CheckCircle size={12} />
                            Connected
                        </span>
                    )}
                </div>

                <p className="text-sm text-gray-600 mb-4">{gateway.description}</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {gateway.name} {keyLabel}
                        </label>
                        <div className="relative">
                            <input
                                type={showKeys[gateway.id] ? 'text' : 'password'}
                                value={gatewayKeys[gateway.id] || ''}
                                onChange={(e) => setGatewayKeys(prev => ({ ...prev, [gateway.id]: e.target.value }))}
                                className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white"
                                placeholder={placeholder}
                            />
                            <button
                                type="button"
                                onClick={() => setShowKeys(prev => ({ ...prev, [gateway.id]: !prev[gateway.id] }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showKeys[gateway.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">
                            Get your {keyLabel.toLowerCase()} from your{' '}
                            <a
                                href={gateway.dashboardUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                {gateway.dashboardLabel}
                            </a>
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleSaveGateway(gateway.id, gateway.keyField)}
                            disabled={saving[gateway.id]}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                        >
                            {saving[gateway.id] ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                'Save Configuration'
                            )}
                        </button>

                        {saveStatus[gateway.id] === 'success' && (
                            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                <CheckCircle size={16} />
                                Saved successfully!
                            </div>
                        )}

                        {saveStatus[gateway.id] === 'error' && (
                            <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                                <AlertCircle size={16} />
                                Failed to save
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">
                                    {isPlanId ? 'Setup Instructions:' : 'Important Security Note:'}
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-blue-700">
                                    {isPlanId ? (
                                        <>
                                            <li>Use your <strong>Plan ID</strong> (starts with <code className="bg-blue-100 px-1 rounded">plan_</code>)</li>
                                            <li>Create a plan in your Whop Dashboard under Products</li>
                                            <li>The checkout will be embedded directly on your store</li>
                                            <li>Supports credit cards, Apple Pay, Google Pay, and crypto</li>
                                        </>
                                    ) : isSecretKey ? (
                                        <>
                                            <li>Use your <strong>Secret Key</strong> (starts with <code className="bg-blue-100 px-1 rounded">sk_</code>)</li>
                                            <li>This key is securely stored and never exposed to customers</li>
                                            <li>Keep this key confidential and never share it publicly</li>
                                        </>
                                    ) : (
                                        <>
                                            <li>Only use your <strong>Public Key</strong> (starts with <code className="bg-blue-100 px-1 rounded">pk_</code>)</li>
                                            <li>Never use your Secret Key in this field</li>
                                            <li>The public key is safe to use in your storefront checkout</li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Custom renderer for Manual EFT banking details
    const renderManualEFTContent = () => {
        const isActive = isGatewayActive('manual_eft');

        return (
            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-semibold text-gray-900">Manual EFT / Bank Transfer</h3>
                    {isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            <CheckCircle size={12} />
                            Active
                        </span>
                    )}
                </div>

                <p className="text-sm text-gray-600 mb-4">
                    Accept direct bank transfers from customers. They'll see your banking details at checkout and can pay via their bank.
                </p>

                {/* Enable/Disable Toggle */}
                <div className="mb-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={eftDetails.eft_enabled}
                                onChange={(e) => setEftDetails(prev => ({ ...prev, eft_enabled: e.target.checked }))}
                                className="sr-only"
                            />
                            <div className={`w-11 h-6 rounded-full transition-colors ${eftDetails.eft_enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform shadow ${eftDetails.eft_enabled ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                            </div>
                        </div>
                        <span className="font-medium text-gray-700">
                            {eftDetails.eft_enabled ? 'Manual EFT Enabled' : 'Manual EFT Disabled'}
                        </span>
                    </label>
                </div>

                <div className="space-y-4">
                    {/* Bank Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bank Name *
                        </label>
                        <select
                            value={eftDetails.eft_bank_name}
                            onChange={(e) => setEftDetails(prev => ({ ...prev, eft_bank_name: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                        >
                            <option value="">Select your bank</option>
                            {SA_BANKS.map(bank => (
                                <option key={bank} value={bank}>{bank}</option>
                            ))}
                        </select>
                    </div>

                    {/* Account Holder */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Account Holder Name *
                        </label>
                        <input
                            type="text"
                            value={eftDetails.eft_account_holder}
                            onChange={(e) => setEftDetails(prev => ({ ...prev, eft_account_holder: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                            placeholder="e.g., John Doe or XYZ Trading (Pty) Ltd"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Account Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Account Number *
                            </label>
                            <div className="relative">
                                <input
                                    type={showKeys.eft_account ? 'text' : 'password'}
                                    value={eftDetails.eft_account_number}
                                    onChange={(e) => setEftDetails(prev => ({ ...prev, eft_account_number: e.target.value }))}
                                    className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-mono text-sm"
                                    placeholder="1234567890"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKeys(prev => ({ ...prev, eft_account: !prev.eft_account }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showKeys.eft_account ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Branch Code */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Branch Code *
                            </label>
                            <input
                                type="text"
                                value={eftDetails.eft_branch_code}
                                onChange={(e) => setEftDetails(prev => ({ ...prev, eft_branch_code: e.target.value }))}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-mono text-sm"
                                placeholder="250655"
                            />
                        </div>
                    </div>

                    {/* Account Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Account Type
                        </label>
                        <div className="flex gap-4">
                            {['cheque', 'savings', 'transmission'].map(type => (
                                <label key={type} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="accountType"
                                        value={type}
                                        checked={eftDetails.eft_account_type === type}
                                        onChange={(e) => setEftDetails(prev => ({ ...prev, eft_account_type: e.target.value }))}
                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 capitalize">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={handleSaveManualEFT}
                            disabled={saving.manual_eft}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                        >
                            {saving.manual_eft ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                'Save Banking Details'
                            )}
                        </button>

                        {saveStatus.manual_eft === 'success' && (
                            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                <CheckCircle size={16} />
                                Saved successfully!
                            </div>
                        )}

                        {saveStatus.manual_eft === 'error' && (
                            <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                                <AlertCircle size={16} />
                                Failed to save
                            </div>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                            <div className="text-sm text-amber-800">
                                <p className="font-medium mb-1">How Manual EFT Works:</p>
                                <ul className="list-disc list-inside space-y-1 text-amber-700">
                                    <li>Customers select "Manual EFT / Bank Transfer" at checkout</li>
                                    <li>Your banking details are displayed for them to make a payment</li>
                                    <li>A warning reminds them to send Proof of Payment (PoP)</li>
                                    <li>You'll need to manually verify payments before processing orders</li>
                                    <li>Orders will be marked as "Awaiting Payment" until you confirm</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Custom renderer for Test Gateway
    const renderTestGatewayContent = () => {
        const isActive = isGatewayActive('test_gateway');

        return (
            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-semibold text-gray-900">Test Payment Gateway</h3>
                    {isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            <CheckCircle size={12} />
                            Active
                        </span>
                    )}
                </div>

                <p className="text-sm text-gray-600 mb-4">
                    A bogus payment gateway for testing your checkout flow without real transactions.
                </p>

                {/* Enable/Disable Toggle */}
                <div className="mb-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={gatewayKeys.test_gateway || false}
                                onChange={(e) => setGatewayKeys(prev => ({ ...prev, test_gateway: e.target.checked }))}
                                className="sr-only"
                            />
                            <div className={`w-11 h-6 rounded-full transition-colors ${gatewayKeys.test_gateway ? 'bg-purple-500' : 'bg-gray-300'}`}>
                                <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform shadow ${gatewayKeys.test_gateway ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                            </div>
                        </div>
                        <span className="font-medium text-gray-700">
                            {gatewayKeys.test_gateway ? 'Test Gateway Enabled' : 'Test Gateway Disabled'}
                        </span>
                    </label>
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => handleSaveGateway('test_gateway', 'test_gateway_enabled')}
                        disabled={saving.test_gateway}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                        {saving.test_gateway ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            'Save Configuration'
                        )}
                    </button>

                    {saveStatus.test_gateway === 'success' && (
                        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                            <CheckCircle size={16} />
                            Saved successfully!
                        </div>
                    )}

                    {saveStatus.test_gateway === 'error' && (
                        <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                            <AlertCircle size={16} />
                            Failed to save
                        </div>
                    )}
                </div>

                {/* Info Box */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-purple-600 flex-shrink-0 mt-0.5" size={18} />
                        <div className="text-sm text-purple-800">
                            <p className="font-medium mb-2">How to Use Test Gateway:</p>
                            <ul className="list-disc list-inside space-y-1.5 text-purple-700">
                                <li><strong>Card Number "1"</strong> - Payment will succeed ✓</li>
                                <li><strong>Card Number "2"</strong> - Payment will fail ✗</li>
                                <li><strong>Expiry Date</strong> - Any future date works</li>
                                <li><strong>CVV</strong> - Any 3-digit number works</li>
                                <li className="text-purple-900 font-medium">⚠️ For testing only - no real transactions are processed</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl space-y-8" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            {/* Payment Gateway Section */}
            <div>
                {/* Headline - Outside the card */}
                <h2 className="text-xl font-semibold text-gray-900 mb-5" style={{ color: '#111827', fontWeight: 600 }}>
                    Payment Gateway
                </h2>

                {/* Card Container */}
                <div
                    className="bg-white rounded-2xl border overflow-hidden"
                    style={{
                        borderRadius: '16px',
                        borderColor: '#E5E7EB',
                        borderWidth: '1px',
                        borderStyle: 'solid'
                    }}
                >
                    {PAYMENT_GATEWAYS.map((gateway, index) => {
                        const isActive = isGatewayActive(gateway.id);
                        const isExpanded = expandedGateway === gateway.id;
                        const isLast = index === PAYMENT_GATEWAYS.length - 1;

                        return (
                            <div key={gateway.id}>
                                {/* List Item Row */}
                                <div
                                    onClick={() => toggleExpanded(gateway.id)}
                                    className="flex items-center justify-between px-5 py-4 cursor-pointer transition-colors hover:bg-gray-50"
                                    style={{ padding: '16px 20px' }}
                                >
                                    {/* Left Side: Logo + Text */}
                                    <div className="flex items-center gap-4">
                                        {/* Brand Logo Container */}
                                        <div
                                            className="flex items-center justify-center bg-white border border-gray-200 overflow-hidden"
                                            style={{
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '10px',
                                            }}
                                        >
                                            <img
                                                src={gateway.logo}
                                                alt={`${gateway.name} logo`}
                                                className="w-6 h-6 object-contain"
                                            />
                                        </div>

                                        {/* Text Block */}
                                        <div className="flex flex-col">
                                            <span
                                                className="font-medium"
                                                style={{
                                                    fontSize: '16px',
                                                    fontWeight: 500,
                                                    color: '#1F2937',
                                                    lineHeight: '1.4'
                                                }}
                                            >
                                                {gateway.name}
                                            </span>
                                            <span
                                                className="flex items-center gap-1.5"
                                                style={{
                                                    fontSize: '14px',
                                                    fontWeight: 400,
                                                    color: '#6B7280',
                                                    lineHeight: '1.4'
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color: isActive ? '#50C878' : '#D1D5DB',
                                                        fontSize: '10px'
                                                    }}
                                                >
                                                    ●
                                                </span>
                                                Gateway is {isActive ? 'active' : 'inactive'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right Side: Chevron */}
                                    <ChevronRight
                                        size={20}
                                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                        style={{ color: '#9CA3AF' }}
                                    />
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    gateway.isManualEFT
                                        ? renderManualEFTContent()
                                        : gateway.isTestGateway
                                            ? renderTestGatewayContent()
                                            : renderGatewayContent(gateway)
                                )}

                                {/* Divider - Only between items, not after last */}
                                {!isLast && (
                                    <div
                                        style={{
                                            height: '1px',
                                            backgroundColor: '#F3F4F6',
                                            marginLeft: '20px',
                                            marginRight: '20px'
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Billing Information Section */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-5" style={{ color: '#111827', fontWeight: 600 }}>
                    Billing Information
                </h2>

                <div
                    className="bg-white rounded-2xl border"
                    style={{
                        borderRadius: '16px',
                        borderColor: '#E5E7EB',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        padding: '20px'
                    }}
                >
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <DollarSign className="text-blue-600 mt-0.5" size={20} />
                                <div>
                                    <h3 className="font-medium text-blue-900 mb-1">Current Plan: Free Trial</h3>
                                    <p className="text-sm text-blue-700">
                                        You're currently on a free trial. Upgrade to unlock premium features.
                                    </p>
                                    <button className="mt-3 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                                        View Plans
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Business Name
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Your Business Name"
                                    defaultValue={merchant?.business_name || ''}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tax ID / VAT Number
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
