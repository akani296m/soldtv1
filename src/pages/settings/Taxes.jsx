import React, { useState } from 'react';
import { Receipt, Plus, AlertCircle } from 'lucide-react';

export default function TaxesSettings() {
    const [taxSettings, setTaxSettings] = useState({
        collectTaxes: true,
        includeInPrices: false,
        businessTaxId: '',
    });

    const [taxRates, setTaxRates] = useState([
        { id: 1, region: 'California', rate: 7.25, inclusive: false },
        { id: 2, region: 'New York', rate: 8.875, inclusive: false },
    ]);

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
            {/* Tax Collection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <Receipt size={24} className="text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Tax Collection</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Configure how taxes are calculated and collected
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between py-3">
                        <div className="flex-1">
                            <h3 className="font-medium text-gray-900">Charge tax on all products</h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Automatically calculate and collect sales tax
                            </p>
                        </div>
                        <ToggleSwitch
                            enabled={taxSettings.collectTaxes}
                            onChange={() => setTaxSettings({ ...taxSettings, collectTaxes: !taxSettings.collectTaxes })}
                        />
                    </div>

                    <div className="flex items-center justify-between py-3 border-t border-gray-100">
                        <div className="flex-1">
                            <h3 className="font-medium text-gray-900">All prices include tax</h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Product prices already include tax amounts
                            </p>
                        </div>
                        <ToggleSwitch
                            enabled={taxSettings.includeInPrices}
                            onChange={() => setTaxSettings({ ...taxSettings, includeInPrices: !taxSettings.includeInPrices })}
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Tax ID / VAT Number
                        </label>
                        <input
                            type="text"
                            value={taxSettings.businessTaxId}
                            onChange={(e) => setTaxSettings({ ...taxSettings, businessTaxId: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your tax ID or VAT number"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Required for international sales and tax compliance
                        </p>
                    </div>
                </div>
            </div>

            {/* Tax Rates */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Tax Rates by Region</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Set tax rates for different locations
                            </p>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2">
                            <Plus size={18} />
                            Add Rate
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="space-y-3">
                        {taxRates.map((rate) => (
                            <div
                                key={rate.id}
                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                            >
                                <div>
                                    <h3 className="font-medium text-gray-900">{rate.region}</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        Tax rate: {rate.rate}%{rate.inclusive ? ' (included in price)' : ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
                                        Edit
                                    </button>
                                    <button className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tax Exemptions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-lg">
                            <AlertCircle size={24} className="text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Tax Exemptions</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Manage tax-exempt products and customers
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex gap-3">
                            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="font-medium text-amber-900 mb-1">Important Tax Information</h3>
                                <p className="text-sm text-amber-800">
                                    Tax laws vary by location. Make sure you're compliant with local regulations.
                                    Consider consulting with a tax professional for your specific situation.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                            Learn about tax exemptions
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
