import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminMerchant } from '../context/adminMerchantContext';
import { Loader2, Store } from 'lucide-react';

/**
 * RequireMerchant Component
 * 
 * Wrapper that ensures the user has a merchant account before accessing admin pages.
 * If user is authenticated but has no merchant, redirects to /onboarding.
 */
export default function RequireMerchant({ children }) {
    const { hasMerchant, loading, merchant } = useAdminMerchant();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Don't redirect while still loading
        if (loading) return;

        // If user has no merchant, redirect to onboarding
        // (unless they're already on the onboarding page)
        if (!hasMerchant && location.pathname !== '/onboarding') {
            console.log('[RequireMerchant] No merchant found, redirecting to onboarding');
            navigate('/onboarding', { replace: true });
        }
    }, [hasMerchant, loading, navigate, location.pathname]);

    // Show loading state while checking for merchant
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
                    <p className="text-blue-200 font-medium">Loading your store...</p>
                </div>
            </div>
        );
    }

    // Show "no merchant" state if merchant check completed but none found
    if (!hasMerchant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Store className="w-8 h-8 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">No Store Found</h2>
                    <p className="text-blue-200 mb-6">
                        Redirecting you to complete setup...
                    </p>
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
                </div>
            </div>
        );
    }

    // User has a merchant, render the protected content
    return children;
}
