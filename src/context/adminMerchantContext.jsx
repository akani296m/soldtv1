import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './authContext';
import posthog from 'posthog-js';

/**
 * AdminMerchantContext
 * 
 * This context identifies which merchant the currently logged-in user belongs to.
 * It fetches from the merchant_users junction table and provides:
 * - merchant: The merchant record the user has access to
 * - merchantId: Quick access to merchant.id
 * - role: The user's role for this merchant (owner, admin, staff)
 * - loading: Whether we're still fetching the merchant
 * - error: Any error that occurred
 * - hasMerchant: Boolean check for quick conditionals
 * - refetch: Function to re-fetch merchant data
 */

const AdminMerchantContext = createContext(null);

export function useAdminMerchant() {
    const context = useContext(AdminMerchantContext);
    if (!context) {
        throw new Error('useAdminMerchant must be used within an AdminMerchantProvider');
    }
    return context;
}

export function AdminMerchantProvider({ children }) {
    const { user, loading: authLoading } = useAuth();
    const [merchant, setMerchant] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMerchant = async () => {
        // Don't fetch if auth is still loading or no user
        if (authLoading) return;

        if (!user) {
            setMerchant(null);
            setRole(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Query merchant_users to find the merchant(s) this user has access to
            // For now, we'll get the first/primary merchant
            // If you need multi-merchant support per user, this can be extended
            const { data: merchantUserData, error: fetchError } = await supabase
                .from('merchant_users')
                .select(`
                    role,
                    merchant_id,
                    merchants (*)
                `)
                .eq('user_id', user.id)
                .limit(1)
                .single();

            if (fetchError) {
                // PGRST116 means no rows found - user has no merchant
                if (fetchError.code === 'PGRST116') {
                    console.log('[AdminMerchantContext] User has no merchant association');
                    setMerchant(null);
                    setRole(null);
                } else {
                    throw fetchError;
                }
            } else if (merchantUserData) {
                console.log('[AdminMerchantContext] Found merchant:', merchantUserData.merchants);
                setMerchant(merchantUserData.merchants);
                setRole(merchantUserData.role);
            }
        } catch (err) {
            console.error('[AdminMerchantContext] Error fetching merchant:', err);
            setError(err.message);
            setMerchant(null);
            setRole(null);
        } finally {
            setLoading(false);
        }
    };

    // Fetch merchant when user changes
    useEffect(() => {
        fetchMerchant();
    }, [user?.id, authLoading]);

    // Identify merchant with PostHog for analytics
    useEffect(() => {
        if (merchant?.id) {
            posthog.identify(merchant.id, {
                email: merchant.email,
                store_name: merchant.name,
                store_slug: merchant.slug,
                city: merchant.city,
            });
        }
    }, [merchant]);

    const value = {
        merchant,
        merchantId: merchant?.id || null,
        role,
        loading: loading || authLoading,
        error,
        hasMerchant: !!merchant,
        refetch: fetchMerchant,
    };

    return (
        <AdminMerchantContext.Provider value={value}>
            {children}
        </AdminMerchantContext.Provider>
    );
}

export default AdminMerchantContext;
