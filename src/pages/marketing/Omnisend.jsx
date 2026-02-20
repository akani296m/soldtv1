import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, ExternalLink, Eye, EyeOff, Save, Send, Unplug } from 'lucide-react';
import { useAdminMerchant } from '../../context/adminMerchantContext';
import { supabase } from '../../lib/supabase';
import { buildOmnisendContact, buildOmnisendEventId, trackOmnisendEvent } from '../../lib/omnisend';

function formatDate(value) {
    if (!value) return 'Never';
    return new Date(value).toLocaleString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function OmnisendMarketing() {
    const { merchant } = useAdminMerchant();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [testing, setTesting] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    const [apiKey, setApiKey] = useState('');
    const [integration, setIntegration] = useState(null);

    const statusLabel = useMemo(() => {
        const status = integration?.status || 'disabled';
        if (status === 'connected') return { text: 'Connected', className: 'bg-green-100 text-green-700' };
        if (status === 'error') return { text: 'Error', className: 'bg-red-100 text-red-700' };
        return { text: 'Disabled', className: 'bg-gray-100 text-gray-700' };
    }, [integration?.status]);

    const lastErrorLabel = useMemo(() => {
        if (!integration?.last_error) return 'No errors';
        if (integration.last_error === 'AUTH') return 'Invalid or revoked Omnisend API key';
        return integration.last_error;
    }, [integration?.last_error]);

    const fetchIntegration = useCallback(async () => {
        if (!merchant?.id) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('integrations_omnisend')
                .select('status, auth_type, api_key, last_event_at, last_error, last_error_at, updated_at')
                .eq('merchant_id', merchant.id)
                .maybeSingle();

            if (error) throw error;

            setIntegration(data || { status: 'disabled' });
            setApiKey(data?.api_key || '');
        } catch (error) {
            console.error('Error fetching Omnisend integration:', error);
            setIntegration({ status: 'error', last_error: error.message });
        } finally {
            setLoading(false);
        }
    }, [merchant?.id]);

    useEffect(() => {
        fetchIntegration();
    }, [fetchIntegration]);

    const handleSave = async () => {
        if (!merchant?.id) return;

        const trimmedKey = apiKey.trim();
        if (!trimmedKey) {
            setSaveStatus('error');
            return;
        }

        setSaving(true);
        setSaveStatus(null);
        try {
            const { error } = await supabase
                .from('integrations_omnisend')
                .upsert(
                    {
                        merchant_id: merchant.id,
                        status: 'connected',
                        auth_type: 'api_key',
                        api_key: trimmedKey,
                        last_error: null,
                        last_error_at: null,
                    },
                    { onConflict: 'merchant_id' }
                );

            if (error) throw error;

            setSaveStatus('success');
            await fetchIntegration();
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            console.error('Error saving Omnisend key:', error);
            setSaveStatus('error');
        } finally {
            setSaving(false);
        }
    };

    const handleDisconnect = async () => {
        if (!merchant?.id) return;

        setDisconnecting(true);
        setSaveStatus(null);
        try {
            const { error } = await supabase
                .from('integrations_omnisend')
                .upsert(
                    {
                        merchant_id: merchant.id,
                        status: 'disabled',
                        auth_type: 'api_key',
                        api_key: null,
                        last_error: null,
                        last_error_at: null,
                    },
                    { onConflict: 'merchant_id' }
                );

            if (error) throw error;

            setApiKey('');
            setSaveStatus('success');
            await fetchIntegration();
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            console.error('Error disconnecting Omnisend:', error);
            setSaveStatus('error');
        } finally {
            setDisconnecting(false);
        }
    };

    const handleSendTest = async () => {
        if (!merchant?.id) return;

        const contact = buildOmnisendContact({
            email: merchant?.email,
            firstName: merchant?.name,
        });

        if (!contact.email && !contact.phone && !contact.id) {
            alert('Please set your merchant email first so we can send a test event.');
            return;
        }

        setTesting(true);
        setSaveStatus(null);
        try {
            const result = await trackOmnisendEvent({
                merchantId: merchant.id,
                name: 'started checkout',
                eventID: buildOmnisendEventId({
                    type: 'checkout_started',
                    cartId: `admin-test-${merchant.id}`,
                }),
                contact,
                properties: {
                    source: 'soldt_admin_test',
                    currency: 'ZAR',
                    value: 0,
                    test: true,
                },
            });

            if (!result.ok) {
                throw new Error(result.error || 'Test event failed');
            }

            setSaveStatus('success');
            await fetchIntegration();
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            console.error('Error sending Omnisend test event:', error);
            setSaveStatus('error');
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-64" />
                    <div className="h-40 bg-gray-200 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Omnisend</h1>
                <p className="text-gray-500 mt-2">
                    Connect Omnisend to trigger abandoned cart, checkout, and post-purchase automations.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Connection</h2>
                        <p className="text-sm text-gray-500">Using Omnisend API key (v5 events)</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusLabel.className}`}>
                        {statusLabel.text}
                    </span>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            Create an API key in Omnisend with <strong>events.write</strong> scope.
                            <a
                                href="https://api-docs.omnisend.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 text-blue-700 font-medium hover:underline inline-flex items-center gap-1"
                            >
                                Open docs <ExternalLink size={12} />
                            </a>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Omnisend API Key
                        </label>
                        <div className="relative">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Paste your Omnisend API key"
                                className="w-full px-4 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey((prev) => !prev)}
                                className="absolute inset-y-0 right-3 text-gray-500 hover:text-gray-700"
                                aria-label="Toggle key visibility"
                            >
                                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-gray-500">Last Event</p>
                            <p className="font-medium text-gray-900 mt-1">{formatDate(integration?.last_event_at)}</p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-gray-500">Last Updated</p>
                            <p className="font-medium text-gray-900 mt-1">{formatDate(integration?.updated_at)}</p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-gray-500">Last Error</p>
                            <p className="font-medium text-gray-900 mt-1 truncate" title={lastErrorLabel}>
                                {lastErrorLabel}
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={16} />
                            {saving ? 'Saving...' : 'Save & Connect'}
                        </button>

                        <button
                            onClick={handleSendTest}
                            disabled={testing || integration?.status !== 'connected'}
                            className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={16} />
                            {testing ? 'Sending...' : 'Send Test Event'}
                        </button>

                        <button
                            onClick={handleDisconnect}
                            disabled={disconnecting || integration?.status === 'disabled'}
                            className="border border-red-300 text-red-700 hover:bg-red-50 px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Unplug size={16} />
                            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                        </button>

                        {saveStatus === 'success' && (
                            <span className="text-green-600 flex items-center gap-2 text-sm font-medium">
                                <CheckCircle size={16} />
                                Saved successfully
                            </span>
                        )}

                        {saveStatus === 'error' && (
                            <span className="text-red-600 flex items-center gap-2 text-sm font-medium">
                                <AlertCircle size={16} />
                                Action failed. Check connection details.
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
