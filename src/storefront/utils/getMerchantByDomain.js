import { supabase } from '../../lib/supabase';

/**
 * Fetches a merchant from Supabase by their custom domain
 * @param {string} domain - The custom domain (e.g., 'shop.acme.com')
 * @returns {Promise<{merchant: object|null, error: string|null}>}
 */
export async function getMerchantByDomain(domain) {
    if (!domain) {
        return { merchant: null, error: 'No domain provided' };
    }

    try {
        const { data, error } = await supabase
            .from('merchants')
            .select(`
                *,
                pixels:merchant_pixels (*),
                theme:themes (*)
            `)
            .eq('custom_domain', domain)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned - merchant not found
                return { merchant: null, error: 'Merchant not found' };
            }
            throw error;
        }

        return { merchant: data, error: null };
    } catch (err) {
        console.error('Error fetching merchant by domain:', err);
        return { merchant: null, error: err.message };
    }
}
