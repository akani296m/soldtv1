import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Package, DollarSign, Users, FileText, Store as StoreIcon,
  ChevronDown, ChevronUp, Settings, Sliders, Trophy, Menu, X, PanelLeftClose,
  Grid2X2, LogOut, LayoutDashboard, Wand2
} from 'lucide-react';
import { useAuth } from '../context/authContext';
import { useAdminMerchant } from '../context/adminMerchantContext';

// Custom Cart Icon component to match lucide-react icon API
const CartIcon = ({ size = 20, strokeWidth, fill, ...props }) => (
  <img
    src="/assets/icons/cart.svg"
    alt="Cart"
    style={{ width: `${size}px`, height: `${size}px` }}
    {...props}
  />
);


export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({ orders: false, products: false, 'edit my store': false, marketing: false });
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { user, signOut } = useAuth();
  const { merchant } = useAdminMerchant();

  const toggleSubmenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  // Navigation sections
  const homeNavItems = [

    {
      name: 'Home',
      icon: Grid2X2,
      path: '/',
      iconStyle: 'filled' // Special flag for active item
    },
    {
      name: 'Orders',
      icon: CartIcon,
      path: '/orders',
      hasSubmenu: true,
      children: [
        { name: 'All Orders', path: '/orders' },
        { name: 'Returns', path: '/orders/returns' },
        { name: 'Order Tracking', path: '/orders/tracking' },
      ]
    },
    {
      name: 'Products',
      icon: Package,
      path: '/products',
      hasSubmenu: true,
      children: [
        { name: 'All Products', path: '/products' },
        { name: 'Collections', path: '/products/collections' },
        { name: 'Reviews', path: '/reviews' },
      ]
    },
    { name: 'Customers', icon: Users, path: '/customers' },
    {
      name: 'Marketing',
      icon: FileText,
      path: '/marketing',
      hasSubmenu: true,
      children: [
        { name: 'Facebook', path: '/marketing/facebook' },
        { name: 'Omnisend', path: '/marketing/omnisend' },
        { name: 'TikTok', path: '/marketing/tiktok' },
      ]
    },

  ];

  // Build the live store URL using merchant slug
  const liveStoreUrl = merchant?.slug ? `/s/${merchant.slug}` : '/store';

  const manageStoreItems = [
    { name: 'Preview My Store', icon: StoreIcon, path: liveStoreUrl, isExternalLink: true },
    {
      name: 'Edit My Store',
      icon: Settings,
      path: '/store/editor',
      hasSubmenu: true,
      children: [
        { name: 'Theme Editor', path: '/store/editor' },
        { name: 'Product Templates', path: '/store/templates' },
        { name: 'Pages', path: '/store/pages' },
        { name: 'Navigation', path: '/store/navigation' },
      ]
    },
  ];

  // Section Label Component
  const SectionLabel = ({ children }) => (
    <div className="mt-6 mb-3 px-0">
      <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
        {children}
      </span>
    </div>
  );

  // Nav Item Component
  const NavItem = ({ name, icon: Icon, path, hasSubmenu, children, isExternalLink, onClick }) => {
    const isMainActive = location.pathname === path;
    const isChildActive = children?.some(child => location.pathname === child.path);
    const isActive = isMainActive || (hasSubmenu && isChildActive);
    const isExpanded = expandedMenus[name.toLowerCase()];

    const handleClick = () => {
      if (hasSubmenu) {
        toggleSubmenu(name.toLowerCase());
      } else if (isExternalLink) {
        // Open in new tab for live store preview
        window.open(path, '_blank');
        if (onClick) onClick();
      } else {
        navigate(path);
        if (onClick) onClick();
      }
    };

    return (
      <div className="w-full">
        <button
          onClick={handleClick}
          className={`w-full h-[28px] flex items-center justify-between px-3 rounded-lg transition-all ${isActive && name === 'Home'
            ? 'bg-white text-[#111827] shadow-sm'
            : 'bg-transparent text-[#111827] hover:bg-gray-100'
            }`}
        >
          <div className="flex items-center gap-3">
            <Icon
              size={20}
              strokeWidth={1.5}
              fill={isActive && name === 'Home' ? '#111827' : 'none'}
            />
            <span className="text-[14px] font-medium" style={{ letterSpacing: '-0.15px' }}>{name}</span>
          </div>
          {hasSubmenu && (
            isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />
          )}
        </button>

        {/* Sub-menu items with tree view */}
        {children && isExpanded && (
          <div className="mt-1 ml-6 pl-3 border-l border-gray-300 space-y-1">
            {children.map((child) => {
              const isChildItemActive = location.pathname === child.path;
              return (
                <button
                  key={child.path}
                  onClick={() => {
                    navigate(child.path);
                    if (onClick) onClick();
                  }}
                  className={`w-full h-[28px] flex items-center px-3 rounded-md transition-colors text-left ${isChildItemActive
                    ? 'text-[#111827] font-medium'
                    : 'text-[#6B7280] hover:text-[#111827] hover:bg-gray-50'
                    }`}
                >
                  <span className="text-[13px]" style={{ letterSpacing: '-0.15px' }}>{child.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Helper to determine page title for Mobile Header
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/admin') return 'Dashboard';

    if (path.startsWith('/orders')) return 'Orders';
    if (path.startsWith('/products')) return 'Products';
    if (path.startsWith('/reviews')) return 'Reviews';
    if (path.startsWith('/customers')) return 'Customers';
    if (path.startsWith('/marketing')) return 'Marketing';
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/store')) return 'Manage Store';
    return 'Soldt'; // Fallback
  };

  return (
    <>
      {/* Mobile App Bar (Header) */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <h1 className="text-lg font-semibold text-gray-900">
            {getPageTitle()}
          </h1>
        </div>

        {/* Optional: Right side action or logo placeholder */}
        <div className="w-8 h-8 bg-[#ffcd00] rounded-md flex items-center justify-center">
          <span className="text-[10px] font-bold text-[#111827]">S</span>
        </div>
      </header>

      {/* Backdrop Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-[270px] h-screen bg-[#F3F4F6] p-6 flex flex-col
        fixed md:relative z-40
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header & Brand Identity */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            {/* Yellow Square Icon */}
            <div className="w-8 h-8 bg-[#ffcd00] rounded-md"></div>
            {/* SOLDT Text */}
            <span className="text-[20px] font-bold text-[#111827]">SOLDT</span>
          </div>
          {/* Collapse Trigger */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={18} className="text-[#6B7280]" />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 flex flex-col overflow-y-auto">
          {/* HOME Section */}
          <SectionLabel>HOME</SectionLabel>
          <div className="space-y-1">
            {homeNavItems.map((item) => (
              <NavItem key={item.name} {...item} onClick={() => setIsOpen(false)} />
            ))}
          </div>

          {/* MANAGE MY STORE Section */}
          <SectionLabel>MANAGE MY STORE</SectionLabel>
          <div className="space-y-1">
            {manageStoreItems.map((item) => (
              <NavItem key={item.name} {...item} onClick={() => setIsOpen(false)} />
            ))}
          </div>
        </nav>

        {/* Footer / Utility Area */}
        <div className="mt-auto space-y-3">
          {/* Settings */}
          <button
            onClick={() => navigate('/settings')}
            className="w-full h-[28px] flex items-center justify-between px-3 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Sliders size={20} strokeWidth={1.5} className="text-[#111827]" />
              <span className="text-[14px] font-medium text-[#111827]" style={{ letterSpacing: '-0.15px' }}>Settings</span>
            </div>
            <ChevronDown size={16} className="text-[#111827]" />
          </button>

          {/* Logout */}
          <button
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
            className="w-full h-[28px] flex items-center gap-3 px-3 rounded-lg hover:bg-red-50 text-[#111827] hover:text-red-600 transition-colors"
          >
            <LogOut size={20} strokeWidth={1.5} />
            <span className="text-[14px] font-medium" style={{ letterSpacing: '-0.15px' }}>Log Out</span>
          </button>

          {/* Premium Promo Card - Only show for trial users or users without active subscription */}
          {merchant && (!merchant.subscription_plan || merchant.subscription_plan === 'trial' || merchant.subscription_status !== 'active') && (
            <div className="bg-[#E5E7EB] rounded-2xl p-4 space-y-3">
              {/* Trophy Icon */}
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Trophy size={20} className="text-[#F59E0B]" />
              </div>

              {/* Headline */}
              <div>
                <div className="inline-block bg-blue-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full mb-1">
                  Unlock
                </div>
                <span className="text-[14px] font-semibold text-[#111827]"> Full Features</span>
              </div>

              {/* Body Copy */}
              <p className="text-[12px] text-[#6B7280]">
                You are currently in <span className="font-medium">trial mode</span>.
              </p>

              {/* CTA Button */}
              <button
                onClick={() => navigate('/settings/billing')}
                className="w-full bg-black text-white text-[14px] font-medium py-2.5 rounded-full hover:bg-gray-900 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
