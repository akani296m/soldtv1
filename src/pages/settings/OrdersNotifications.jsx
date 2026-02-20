import React, { useState } from 'react';
import { ShoppingBag, Bell, Mail, CheckCircle } from 'lucide-react';

export default function OrdersNotificationsSettings() {
    const [settings, setSettings] = useState({
        autoFulfill: false,
        lowStockAlert: true,
        lowStockThreshold: 10,
        customerOrderConfirmation: true,
        customerShippingUpdate: true,
        adminNewOrder: true,
        adminPaymentReceived: true,
    });

    const toggleSetting = (key) => {
        setSettings({ ...settings, [key]: !settings[key] });
    };

    const ToggleSwitch = ({ enabled, onChange }) => (
        <button
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
            />
        </button>
    );

    return (
        <div className="max-w-4xl space-y-6">
            {/* Order Processing */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <ShoppingBag size={24} className="text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Order Processing</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Configure how orders are handled
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between py-3">
                        <div className="flex-1">
                            <h3 className="font-medium text-gray-900">Auto-fulfill orders</h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Automatically mark orders as fulfilled when payment is received
                            </p>
                        </div>
                        <ToggleSwitch
                            enabled={settings.autoFulfill}
                            onChange={() => toggleSetting('autoFulfill')}
                        />
                    </div>

                    <div className="flex items-center justify-between py-3 border-t border-gray-100">
                        <div className="flex-1">
                            <h3 className="font-medium text-gray-900">Low stock alerts</h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Get notified when product inventory runs low
                            </p>
                        </div>
                        <ToggleSwitch
                            enabled={settings.lowStockAlert}
                            onChange={() => toggleSetting('lowStockAlert')}
                        />
                    </div>

                    {settings.lowStockAlert && (
                        <div className="ml-4 pl-4 border-l-2 border-blue-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Low stock threshold
                            </label>
                            <input
                                type="number"
                                value={settings.lowStockThreshold}
                                onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) })}
                                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min="0"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Alert when inventory falls below this number
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Customer Notifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Mail size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Customer Notifications</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Email notifications sent to customers
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between py-3">
                        <div className="flex-1">
                            <h3 className="font-medium text-gray-900">Order confirmation</h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Send email when order is placed successfully
                            </p>
                        </div>
                        <ToggleSwitch
                            enabled={settings.customerOrderConfirmation}
                            onChange={() => toggleSetting('customerOrderConfirmation')}
                        />
                    </div>

                    <div className="flex items-center justify-between py-3 border-t border-gray-100">
                        <div className="flex-1">
                            <h3 className="font-medium text-gray-900">Shipping updates</h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Notify customers when order is shipped
                            </p>
                        </div>
                        <ToggleSwitch
                            enabled={settings.customerShippingUpdate}
                            onChange={() => toggleSetting('customerShippingUpdate')}
                        />
                    </div>
                </div>
            </div>

            {/* Admin Notifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <Bell size={24} className="text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Admin Notifications</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Email notifications for store administrators
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between py-3">
                        <div className="flex-1">
                            <h3 className="font-medium text-gray-900">New order</h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Get notified when a new order is placed
                            </p>
                        </div>
                        <ToggleSwitch
                            enabled={settings.adminNewOrder}
                            onChange={() => toggleSetting('adminNewOrder')}
                        />
                    </div>

                    <div className="flex items-center justify-between py-3 border-t border-gray-100">
                        <div className="flex-1">
                            <h3 className="font-medium text-gray-900">Payment received</h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Get notified when payment is successfully processed
                            </p>
                        </div>
                        <ToggleSwitch
                            enabled={settings.adminPaymentReceived}
                            onChange={() => toggleSetting('adminPaymentReceived')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
