import React from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
    Settings,
    Building2,
    CreditCard,
    Store,
    ShoppingBag,
    Truck,
    Receipt,
    ChevronLeft,
    ArrowLeft,
    AlertTriangle,
    ChevronRight,
    Globe
} from 'lucide-react';

export default function SettingsLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const settingsSections = [
        {
            name: 'General',
            path: '/settings/general',
            icon: Settings,

        },
        {
            name: 'Finance',
            path: '/settings/finance',
            icon: CreditCard,

        },
        {
            name: 'Billing',
            path: '/settings/billing',
            icon: CreditCard,

        },
        {
            name: 'Manage Store',
            path: '/settings/manage-store',
            icon: Store,

        },
        {
            name: 'Domains',
            path: '/settings/domains',
            icon: Globe,

        },
        {
            name: 'Orders & Notifications',
            path: '/settings/orders-notifications',
            icon: ShoppingBag,

        },
        {
            name: 'Shipping',
            path: '/settings/shipping',
            icon: Truck,

        },
        {
            name: 'Taxes',
            path: '/settings/taxes',
            icon: Receipt,

        },
        {
            name: 'Danger Zone',
            path: '/settings/danger-zone',
            icon: AlertTriangle,

        },
    ];

    // Check if we're on a specific settings page (not just /settings or /settings/)
    const isOnSettingsSubPage = location.pathname !== '/settings' && location.pathname !== '/settings/';

    // Get current section info for mobile back button
    const currentSection = settingsSections.find(s => s.path === location.pathname);

    // Desktop nav item (with left border active state)
    const DesktopNavItem = ({ name, path, icon: Icon, description }) => {
        const isActive = location.pathname === path;

        return (
            <Link
                to={path}
                className={`
                    block px-4 py-3.5 rounded-lg transition-all
                    ${isActive
                        ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-700'
                        : 'hover:bg-gray-50 border-l-4 border-transparent text-gray-700 hover:text-gray-900'
                    }
                `}
            >
                <div className="flex items-start gap-3">
                    <Icon size={20} className={`mt-0.5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                            {name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                            {description}
                        </div>
                    </div>
                </div>
            </Link>
        );
    };

    // Mobile nav item (card-style with chevron)
    const MobileNavItem = ({ name, path, icon: Icon, description }) => {
        return (
            <Link
                to={path}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all active:bg-gray-50"
            >
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-gray-100 rounded-lg">
                        <Icon size={22} className="text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                            {name}
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">
                            {description}
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                </div>
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header - Different behavior on mobile based on current page */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="px-4 md:px-6 py-4">
                    <div className="flex items-center gap-3 md:gap-4">
                        {/* Back button - on mobile sub-pages, go back to settings list */}
                        <button
                            onClick={() => {
                                // On mobile sub-page, go back to settings list
                                // On desktop or settings root, go to dashboard
                                if (isOnSettingsSubPage && window.innerWidth < 768) {
                                    navigate('/settings');
                                } else {
                                    navigate('/');
                                }
                            }}
                            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Back"
                        >
                            <ArrowLeft size={20} className="text-gray-600" />
                        </button>
                        <div className="flex-1 min-w-0">
                            {/* On mobile sub-pages, show section name. Otherwise show "Settings" */}
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                                <span className="hidden md:inline">Settings</span>
                                <span className="md:hidden">
                                    {isOnSettingsSubPage ? (currentSection?.name || 'Settings') : 'Settings'}
                                </span>
                            </h1>
                            <p className="text-sm text-gray-500 mt-0.5 hidden md:block">
                                Manage your store preferences and configuration
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile: Full-screen category list when at /settings root */}
            <div className="md:hidden">
                {!isOnSettingsSubPage ? (
                    // Show category list as full-screen cards
                    <div className="p-4 space-y-3">
                        {settingsSections.map((section) => (
                            <MobileNavItem key={section.path} {...section} />
                        ))}
                    </div>
                ) : (
                    // Show the settings form content (full width)
                    <main className="p-4">
                        <Outlet />
                    </main>
                )}
            </div>

            {/* Desktop: Traditional split layout */}
            <div className="hidden md:flex">
                {/* Settings Sidebar */}
                <aside className="w-80 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)] sticky top-[73px]">
                    <nav className="p-4 space-y-1">
                        {settingsSections.map((section) => (
                            <DesktopNavItem key={section.path} {...section} />
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
