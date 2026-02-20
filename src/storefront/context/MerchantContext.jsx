import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getMerchantBySlug } from '../utils/getMerchantBySlug';
import { getMerchantByDomain } from '../utils/getMerchantByDomain';

// Create Merchant Context
const MerchantContext = createContext();

// List of domains that host the admin dashboard (not storefronts)
const ADMIN_DOMAINS = [
    'merchants.io',
    'www.merchants.io',
    'soldt.co.za',           // Production admin domain
    'www.soldt.co.za',       // Production admin domain with www
    'admin.soldt.co.za',     // Production admin subdomain
    'localhost',
    'localhost:5173',        // Vite dev server
    'localhost:5174',        // Vite dev server (alternate port)
];

/**
 * Determines if the current hostname is an admin domain
 */
function isAdminDomain(hostname) {
    return ADMIN_DOMAINS.some(domain =>
        hostname === domain || hostname.startsWith(`${domain}:`)
    );
}

/**
 * Provider component that fetches and provides merchant data
 * - On admin domains with /s/:merchantSlug route → fetch by slug
 * - On custom domains → fetch by hostname
 */
export function MerchantProvider({ children, customDomain = false }) {
    const { merchantSlug } = useParams();
    const location = useLocation();
    const [merchant, setMerchant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [lookupMethod, setLookupMethod] = useState(null); // 'slug' or 'domain'

    useEffect(() => {
        async function fetchMerchant() {
            const hostname = window.location.hostname;
            const isAdmin = isAdminDomain(hostname);

            setLoading(true);
            setError(null);
            setNotFound(false);

            let fetchedMerchant = null;
            let fetchError = null;

            // Determine lookup method
            if (customDomain || !isAdmin) {
                // We're on a custom domain - lookup by hostname
                setLookupMethod('domain');
                const result = await getMerchantByDomain(hostname);
                fetchedMerchant = result.merchant;
                fetchError = result.error;
            } else if (merchantSlug) {
                // We're on the admin domain with /s/:slug route - lookup by slug
                setLookupMethod('slug');
                const result = await getMerchantBySlug(merchantSlug);
                fetchedMerchant = result.merchant;
                fetchError = result.error;
            } else {
                setNotFound(true);
                setLoading(false);
                return;
            }

            if (fetchError || !fetchedMerchant) {
                setNotFound(true);
                setError(fetchError);
            } else {
                setMerchant(fetchedMerchant);
            }

            setLoading(false);
        }

        fetchMerchant();
    }, [merchantSlug, customDomain, location.pathname]);

    return (
        <MerchantContext.Provider value={{
            merchant,
            merchantSlug: merchantSlug || merchant?.slug,
            loading,
            error,
            notFound,
            lookupMethod,
            isCustomDomain: lookupMethod === 'domain'
        }}>
            {children}
        </MerchantContext.Provider>
    );
}

/**
 * Hook to access merchant context
 */
export function useMerchant() {
    const context = useContext(MerchantContext);
    if (!context) {
        throw new Error('useMerchant must be used within a MerchantProvider');
    }
    return context;
}
