import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Package, Edit2, ShoppingBag, ChevronRight, Clock, BarChart3,
  Store, Palette, CreditCard, Truck, Globe, Check, ArrowRight, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAdminMerchant } from '../context/adminMerchantContext';
import { useProducts } from '../context/productcontext';


export default function Home() {
  const { merchantId, merchant, loading: merchantLoading } = useAdminMerchant();
  const { products, loading: productsLoading } = useProducts();
  const [editingProduct, setEditingProduct] = useState(null);
  // NEW: State for the dropdown
  const [timeRange, setTimeRange] = useState('This Week');
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const navigate = useNavigate();

  // Check completion status of each setup step
  const hasStoreName = merchant?.store_name || merchant?.name || merchant?.business_name;
  const hasProducts = products.length > 0;

  // Check if any payment gateway is configured (check multiple payment options)
  const hasPaymentSetup = !!(
    merchant?.paystack_public_key ||
    merchant?.yoco_secret_key ||
    merchant?.whop_plan_id ||
    merchant?.payfast_merchant_id ||
    merchant?.peach_entity_id ||
    merchant?.ozow_site_code ||
    (merchant?.eft_enabled && merchant?.eft_bank_name && merchant?.eft_account_number)
  );

  // A merchant needs to complete onboarding if they haven't finished ALL essential steps
  // Essential steps: store name (always done after signup), products, and payment setup
  const hasCompletedEssentialOnboarding = hasStoreName && hasProducts && hasPaymentSetup;

  // Show onboarding wizard if essential steps are incomplete
  const isNewMerchant = !productsLoading && !merchantLoading && !hasCompletedEssentialOnboarding;

  // Setup steps configuration
  const setupSteps = [
    {
      id: 'store-name',
      title: 'Add store name',
      description: 'Give your store a name that represents your brand',
      icon: Store,
      completed: !!hasStoreName,
      action: () => navigate('/settings/general'),
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      id: 'first-product',
      title: 'Add your first product',
      description: 'Start selling by adding products to your catalog',
      icon: Package,
      completed: hasProducts,
      action: () => navigate('/products'),
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      id: 'design-store',
      title: 'Design your store',
      description: 'Customize the look and feel of your storefront',
      icon: Palette,
      completed: false, // Can be enhanced to check if sections have been customized
      action: () => navigate('/store/storefront-editor'),
      gradient: 'from-pink-500 to-pink-600',
    },
    {
      id: 'payments',
      title: 'Set up Payments',
      description: 'Connect a payment gateway to accept payments',
      icon: CreditCard,
      completed: !!hasPaymentSetup,
      action: () => navigate('/settings/finance'),
      gradient: 'from-green-500 to-green-600',
    },
    {
      id: 'shipping',
      title: 'Review your shipping rates',
      description: 'Configure shipping options for your customers',
      icon: Truck,
      completed: false, // Can be enhanced to check shipping configuration
      action: () => navigate('/settings/shipping'),
      gradient: 'from-orange-500 to-orange-600',
    },
    {
      id: 'domain',
      title: 'Customize your domain',
      description: 'Set up a custom domain for your store',
      icon: Globe,
      completed: false, // Can be enhanced to check domain configuration
      action: () => navigate('/settings/manage-store'),
      gradient: 'from-indigo-500 to-indigo-600',
    },
  ];

  const completedSteps = setupSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / setupSteps.length) * 100;

  // Fetch recent orders from Supabase - scoped to merchant
  useEffect(() => {
    const fetchRecentOrders = async () => {
      // Wait for merchant context
      if (merchantLoading || !merchantId) {
        setLoadingOrders(false);
        setRecentOrders([]);
        return;
      }

      try {
        setLoadingOrders(true);
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('merchant_id', merchantId) // ✅ Scope to current merchant
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setRecentOrders(data || []);
      } catch (error) {
        console.error('Error fetching recent orders:', error);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchRecentOrders();
  }, [merchantId, merchantLoading]);

  // Fetch revenue data from Supabase based on time range - scoped to merchant
  useEffect(() => {
    const fetchRevenueData = async () => {
      // Wait for merchant context
      if (merchantLoading || !merchantId) {
        setLoadingRevenue(false);
        setRevenueData([]);
        setTotalRevenue(0);
        return;
      }

      try {
        setLoadingRevenue(true);

        // Calculate date range based on selection
        const now = new Date();
        let startDate = new Date();

        switch (timeRange) {
          case 'Today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'This Week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'This Month':
            startDate.setDate(now.getDate() - 30);
            break;
          case 'Year to Date':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate.setDate(now.getDate() - 7);
        }

        const { data, error } = await supabase
          .from('orders')
          .select('created_at, total')
          .eq('merchant_id', merchantId) // ✅ Scope to current merchant
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Process data based on time range
        const processedData = processRevenueData(data || [], timeRange);
        setRevenueData(processedData);

        // Calculate total revenue
        const total = (data || []).reduce((sum, order) => sum + (order.total || 0), 0);
        setTotalRevenue(total);

      } catch (error) {
        console.error('Error fetching revenue data:', error);
        setRevenueData([]);
        setTotalRevenue(0);
      } finally {
        setLoadingRevenue(false);
      }
    };

    fetchRevenueData();
  }, [timeRange, merchantId, merchantLoading]);

  // Helper function to process revenue data for charts
  const processRevenueData = (orders, range) => {
    if (!orders || orders.length === 0) {
      return getEmptyDataForRange(range);
    }

    const groupedData = {};

    orders.forEach(order => {
      const date = new Date(order.created_at);
      let key;

      switch (range) {
        case 'Today':
          // Group by hour
          key = `${date.getHours()}:00`;
          break;
        case 'This Week':
          // Group by day
          const daysAgo = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
          key = daysAgo === 0 ? 'Today' : `${7 - daysAgo}d ago`;
          break;
        case 'Month':
          // Group by week
          const weeksAgo = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24 * 7));
          key = `Week ${4 - weeksAgo}`;
          break;
        case 'Year to Date':
          // Group by month
          key = date.toLocaleDateString('en-US', { month: 'short' });
          break;
        default:
          key = date.toLocaleDateString();
      }

      if (!groupedData[key]) {
        groupedData[key] = 0;
      }
      groupedData[key] += order.total || 0;
    });

    // Convert to array format for stacked bar chart (split revenue into two segments)
    return Object.entries(groupedData).map(([time, totalRevenue]) => {
      // Split revenue into two segments (60% and 40% for visual effect)
      const segment1 = totalRevenue * 0.6;
      const segment2 = totalRevenue * 0.4;
      return {
        time,
        revenue1: segment1,
        revenue2: segment2,
        total: totalRevenue
      };
    });
  };

  // Helper to provide empty data structure when no orders
  const getEmptyDataForRange = (range) => {
    const createDataPoint = (time) => ({
      time,
      revenue1: 0,
      revenue2: 0,
      total: 0
    });

    switch (range) {
      case 'Today':
        return Array.from({ length: 24 }, (_, i) => createDataPoint(`${i}:00`));
      case 'This Week':
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => createDataPoint(day));
      case 'Month':
        return ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map(week => createDataPoint(week));
      case 'Year to Date':
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map(month => createDataPoint(month));
      default:
        return [];
    }
  };



  // --- HELPERS ---
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const orderDate = new Date(dateString);
    const diffMs = now - orderDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return diffMins <= 1 ? '1 minute ago' : `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      'delivered': { bg: 'bg-green-100', text: 'text-green-700', label: 'Delivered' },
      'shipped': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Shipped' },
      'processing': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Processing' },
      'pending': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Pending' },
      'cancelled': { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' }
    };
    return configs[status?.toLowerCase()] || configs['pending'];
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
  };

  const closeModal = () => {
    setEditingProduct(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <h1 className="hidden md:block text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* NEW MERCHANT ONBOARDING SETUP WIZARD */}
      {isNewMerchant ? (
        <div className="space-y-6">
          {/* Welcome Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl shadow-xl p-8">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Sparkles className="text-yellow-300" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-white">Welcome to your store!</h2>
              </div>

              <p className="text-purple-100 text-lg mb-6 max-w-2xl">
                Let's get your store ready for customers. Complete these steps to start selling and make your first sale.
              </p>

              {/* Progress Bar */}
              <div className="bg-white/20 rounded-full h-3 mb-3 overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-white/80 text-sm font-medium">
                {completedSteps} of {setupSteps.length} steps completed
              </p>
            </div>
          </div>

          {/* Setup Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {setupSteps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <button
                  key={step.id}
                  onClick={step.action}
                  className={`group relative bg-white rounded-xl border-2 p-5 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${step.completed
                    ? 'border-green-200 bg-green-50/50'
                    : 'border-gray-100 hover:border-purple-200'
                    }`}
                >
                  {/* Step Number Badge */}
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                    {index + 1}
                  </div>

                  <div className="flex items-start gap-4">
                    {/* Icon Container */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      {step.completed ? (
                        <Check className="text-white" size={24} />
                      ) : (
                        <IconComponent className="text-white" size={24} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-gray-900 mb-1 flex items-center gap-2 ${step.completed ? 'line-through text-gray-500' : ''}`}>
                        {step.title}
                        {step.completed && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            Done
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 leading-snug">
                        {step.description}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ArrowRight
                      className={`flex-shrink-0 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all duration-300 ${step.completed ? 'opacity-50' : ''}`}
                      size={20}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Tip Card */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-2 bg-amber-100 rounded-lg">
                <Sparkles className="text-amber-600" size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-amber-900 mb-1">Pro Tip</h4>
                <p className="text-amber-700 text-sm">
                  Start by adding at least one product. Once you have a product in your catalog,
                  you'll see your sales analytics and dashboard features appear here.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* REGULAR DASHBOARD FOR ACTIVE MERCHANTS */
        <>
          {/* Sales Analytics Card */}
          <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">

              {/* Title & Hero Metric */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 size={20} className="text-[#111827]" />
                  <h2 className="text-[16px] font-semibold text-[#111827]">Sales</h2>
                </div>
                {/* Hero Metric */}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatCurrency(totalRevenue)}
                  </span>
                  {/* Placeholder trend indicator */}
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    +12%
                  </span>
                </div>
              </div>

              {/* Scrollable Filter Pills */}
              <div className="flex overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar">
                <div className="flex gap-2">
                  {['Today', 'This Week', 'Month', 'Year to Date'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setTimeRange(option)}
                      className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-full border transition-all ${timeRange === option
                        ? 'bg-[#111827] text-white border-[#111827]'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CHART */}
            {loadingRevenue ? (
              <div className="flex items-center justify-center h-[200px] md:h-[400px]">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : revenueData.length === 0 ? (
              <div className="flex items-center justify-center flex-col h-[200px] md:h-[400px]">
                <TrendingUp className="text-gray-300 mb-3" size={48} />
                <p className="text-gray-500">No revenue data available for this period</p>
              </div>
            ) : (
              <div className="h-[200px] md:h-[400px] w-[110%] -ml-[5%] md:w-full md:ml-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E5E7EB"
                    />
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      dy={10}
                      interval="preserveStartEnd"
                    />
                    {/* Hide Y-Axis on mobile (width=0) */}
                    <YAxis
                      width={window.innerWidth < 768 ? 0 : 40}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const total = payload[0].payload.total;
                          return (
                            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                              <p className="text-sm font-semibold text-gray-900">
                                {formatCurrency(total)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {payload[0].payload.time}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <defs>
                      <linearGradient id="colorRevenue1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#A78BFA" stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="colorRevenue2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EC4899" stopOpacity={1} />
                        <stop offset="100%" stopColor="#F472B6" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <Bar
                      dataKey="revenue1"
                      stackId="a"
                      fill="url(#colorRevenue1)"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="revenue2"
                      stackId="a"
                      fill="url(#colorRevenue2)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 gap-6">
            {/* Recent Orders - Full width */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
                <button
                  onClick={() => navigate('/orders')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  See All
                </button>
              </div>

              {loadingOrders ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-500">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.slice(0, 4).map((order) => {
                    const statusConfig = getStatusConfig(order.status);
                    return (
                      <div
                        key={order.id}
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all cursor-pointer group"
                      >
                        {/* Icon Container */}
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="text-purple-600" size={20} />
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">Order #{String(order.id || '').slice(0, 8)}</p>
                          <p className="text-xs text-gray-500 truncate">{order.customer_name} • {getTimeAgo(order.created_at)}</p>
                        </div>

                        {/* Status Badge */}
                        <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${statusConfig.bg} ${statusConfig.text}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Edit Modal (Stays inside Home because it edits Home data) */}
          {editingProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Product</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name
                    </label>
                    <input
                      type="text"
                      defaultValue={editingProduct.name}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Units Sold
                    </label>
                    <input
                      type="number"
                      defaultValue={editingProduct.unitsSold}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}