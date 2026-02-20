import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Upload, UserPlus, Users, SlidersHorizontal, ArrowUpDown, MoreVertical, Mail, ShoppingBag, Loader2, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAdminMerchant } from '../context/adminMerchantContext';

export default function Customers() {
    const { merchantId, loading: merchantLoading } = useAdminMerchant();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [sortBy, setSortBy] = useState('newest');

    // Fetch customers from orders (unique customers) - scoped to merchant
    const fetchCustomers = async () => {
        // Don't fetch if no merchant
        if (!merchantId) {
            setCustomers([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select('customer_name, customer_email, customer_phone, created_at, items')
                .eq('merchant_id', merchantId) // ✅ Scope to current merchant
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Group by email to get unique customers with their order count and tags
            const customerMap = new Map();

            data?.forEach(order => {
                const email = order.customer_email;
                if (!email) return;

                if (customerMap.has(email)) {
                    const existing = customerMap.get(email);
                    existing.orders += 1;
                    existing.lastOrderDate = new Date(order.created_at) > new Date(existing.lastOrderDate)
                        ? order.created_at
                        : existing.lastOrderDate;

                    // Extract tags from items
                    order.items?.forEach(item => {
                        if (item.tags && Array.isArray(item.tags)) {
                            item.tags.forEach(tag => {
                                if (!existing.tags.includes(tag)) {
                                    existing.tags.push(tag);
                                }
                            });
                        }
                    });
                } else {
                    const tags = [];
                    order.items?.forEach(item => {
                        if (item.tags && Array.isArray(item.tags)) {
                            item.tags.forEach(tag => {
                                if (!tags.includes(tag)) {
                                    tags.push(tag);
                                }
                            });
                        }
                    });

                    customerMap.set(email, {
                        email: order.customer_email,
                        firstName: order.customer_name?.split(' ')[0] || '',
                        lastName: order.customer_name?.split(' ').slice(1).join(' ') || '',
                        fullName: order.customer_name || '',
                        phone: order.customer_phone || '',
                        orders: 1,
                        tags: tags,
                        lastOrderDate: order.created_at,
                        createdAt: order.created_at
                    });
                }
            });

            const customersArray = Array.from(customerMap.values());
            setCustomers(customersArray);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!merchantLoading && merchantId) {
            fetchCustomers();
        } else if (!merchantLoading) {
            setCustomers([]);
            setLoading(false);
        }
    }, [merchantId, merchantLoading]);

    // Filter and sort customers
    const filteredCustomers = customers
        .filter(customer => {
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                return (
                    customer.firstName?.toLowerCase().includes(query) ||
                    customer.lastName?.toLowerCase().includes(query) ||
                    customer.email?.toLowerCase().includes(query) ||
                    customer.tags?.some(tag => tag.toLowerCase().includes(query))
                );
            }
            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'name-asc':
                    return (a.firstName || '').localeCompare(b.firstName || '');
                case 'name-desc':
                    return (b.firstName || '').localeCompare(a.firstName || '');
                case 'orders-high':
                    return b.orders - a.orders;
                case 'orders-low':
                    return a.orders - b.orders;
                case 'newest':
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

    // Handle select all
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedCustomers(filteredCustomers.map(c => c.email));
        } else {
            setSelectedCustomers([]);
        }
    };

    // Handle individual selection
    const handleSelectCustomer = (email) => {
        setSelectedCustomers(prev => {
            if (prev.includes(email)) {
                return prev.filter(e => e !== email);
            } else {
                return [...prev, email];
            }
        });
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f0f0f0' }}>
            <div className="p-8">
                {/* Page Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-[32px] font-bold text-[#1F1F1F]">Customers</h1>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-3">
                        {/* Secondary Actions */}
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#303030] rounded-lg hover:bg-gray-50 transition border border-gray-200 font-medium">
                            <Download size={18} />
                            Export
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#303030] rounded-lg hover:bg-gray-50 transition border border-gray-200 font-medium">
                            <Upload size={18} />
                            Import
                        </button>

                        {/* Primary CTA */}
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-[#1F1F1F] text-white rounded-lg hover:bg-[#303030] transition font-medium shadow-sm">
                            <UserPlus size={18} />
                            Add customer
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Customers</p>
                                <p className="text-3xl font-bold text-gray-900">{customers.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Users className="text-blue-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {customers.reduce((sum, c) => sum + c.orders, 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <ShoppingBag className="text-green-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Avg Orders/Customer</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {customers.length > 0 ? (customers.reduce((sum, c) => sum + c.orders, 0) / customers.length).toFixed(1) : '0'}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <BarChart3 className="text-purple-600" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Container */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                    {/* Search and Filter Toolbar */}
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            {/* Search Input */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search customers"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-[15px]"
                                />
                            </div>

                            {/* View Controls */}
                            <button
                                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                                title="Filter columns"
                            >
                                <SlidersHorizontal size={20} className="text-gray-600" />
                            </button>

                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none pl-4 pr-10 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition outline-none text-[15px] font-medium cursor-pointer"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="name-asc">Name A-Z</option>
                                    <option value="name-desc">Name Z-A</option>
                                    <option value="orders-high">Most Orders</option>
                                    <option value="orders-low">Least Orders</option>
                                </select>
                                <ArrowUpDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && customers.length === 0 && (
                        <div className="p-12 text-center">
                            <Users className="mx-auto text-gray-300 mb-4" size={64} strokeWidth={1.5} />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No customers yet</h3>
                            <p className="text-gray-500">Customers will appear here once they place orders.</p>
                        </div>
                    )}

                    {/* No Results */}
                    {!loading && customers.length > 0 && filteredCustomers.length === 0 && (
                        <div className="p-12 text-center">
                            <Search className="mx-auto text-gray-300 mb-4" size={64} strokeWidth={1.5} />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No customers found</h3>
                            <p className="text-gray-500 mb-4">Try adjusting your search.</p>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Clear search
                            </button>
                        </div>
                    )}

                    {/* Data Table */}
                    {!loading && filteredCustomers.length > 0 && (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            {/* Select All Checkbox */}
                                            <th className="px-6 py-4 text-left w-12">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                                                    onChange={handleSelectAll}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </th>

                                            {/* Column Headers */}
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                First name
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Last name
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Orders
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Tags
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredCustomers.map((customer) => (
                                            <tr
                                                key={customer.email}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                {/* Checkbox */}
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCustomers.includes(customer.email)}
                                                        onChange={() => handleSelectCustomer(customer.email)}
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    />
                                                </td>

                                                {/* First Name */}
                                                <td className="px-6 py-4">
                                                    <span className="text-[15px] font-medium text-gray-900">
                                                        {customer.firstName || '—'}
                                                    </span>
                                                </td>

                                                {/* Last Name */}
                                                <td className="px-6 py-4">
                                                    <span className="text-[15px] font-medium text-gray-900">
                                                        {customer.lastName || '—'}
                                                    </span>
                                                </td>

                                                {/* Email */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Mail size={16} className="text-gray-400" />
                                                        <span className="text-[15px] text-gray-700">
                                                            {customer.email}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Orders */}
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                                                        <ShoppingBag size={14} />
                                                        {customer.orders}
                                                    </span>
                                                </td>

                                                {/* Tags */}
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {customer.tags && customer.tags.length > 0 ? (
                                                            customer.tags.slice(0, 3).map((tag, index) => (
                                                                <span
                                                                    key={index}
                                                                    className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-400 text-sm">—</span>
                                                        )}
                                                        {customer.tags && customer.tags.length > 3 && (
                                                            <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                                                                +{customer.tags.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Results Count Footer */}
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-sm text-gray-600 flex items-center justify-between">
                                <span>
                                    Showing {filteredCustomers.length} of {customers.length} customers
                                </span>
                                {selectedCustomers.length > 0 && (
                                    <span className="font-medium text-blue-600">
                                        {selectedCustomers.length} selected
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
