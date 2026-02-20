import React, { useState } from 'react';
import { Truck, Plus, MapPin, Package } from 'lucide-react';

export default function ShippingSettings() {
    const [shippingZones, setShippingZones] = useState([
        { id: 1, name: 'Domestic', countries: ['United States'], rates: 2 },
        { id: 2, name: 'International', countries: ['Canada', 'Mexico'], rates: 1 },
    ]);

    return (
        <div className="max-w-4xl space-y-6">
            {/* Shipping Zones */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Truck size={24} className="text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Shipping Zones</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Manage shipping locations and rates
                                </p>
                            </div>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2">
                            <Plus size={18} />
                            Add Zone
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="space-y-4">
                        {shippingZones.map((zone) => (
                            <div
                                key={zone.id}
                                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin size={18} className="text-gray-500" />
                                            <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">
                                            {zone.countries.join(', ')}
                                        </p>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-gray-500">
                                                <span className="font-medium text-gray-900">{zone.rates}</span> shipping rate(s)
                                            </span>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))}

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer">
                            <MapPin className="text-gray-400 mx-auto mb-2" size={32} />
                            <p className="text-sm text-gray-600 mb-2">No custom zones yet</p>
                            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                Create your first shipping zone
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shipping Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Package size={24} className="text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Package Settings</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Default package dimensions and weight
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Length (inches)
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="12"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Width (inches)
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="8"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Height (inches)
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="4"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Weight (lbs)
                        </label>
                        <input
                            type="number"
                            className="w-full md:w-1/3 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="1.5"
                            step="0.1"
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                            These dimensions will be used as defaults for shipping rate calculations when product-specific dimensions aren't available.
                        </p>
                    </div>
                </div>
            </div>

            {/* Carrier Integrations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Carrier Services</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Connect shipping carriers for real-time rates
                        </p>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['USPS', 'FedEx', 'UPS'].map((carrier) => (
                            <div key={carrier} className="border border-gray-200 rounded-lg p-4 text-center hover:border-blue-300 transition-colors">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Truck className="text-gray-600" size={24} />
                                </div>
                                <h3 className="font-medium text-gray-900 mb-2">{carrier}</h3>
                                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                    Connect
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
