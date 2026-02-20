import { supabase } from '../../lib/supabase';

/**
 * Fetches a merchant from Supabase by their slug
 * @param {string} slug - The merchant's URL slug
 * @returns {Promise<{merchant: object|null, error: string|null}>}
 */
export async function getMerchantBySlug(slug) {
    if (!slug) {
        return { merchant: null, error: 'No slug provided' };
    }

    try {
        const { data, error } = await supabase
            .from('merchants')
            .select(`
                *,
                pixels:merchant_pixels (*),
                theme:themes (*)
            `)
            .eq('slug', slug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return { merchant: null, error: 'Merchant not found' };
            }
            throw error;
        }

        return { merchant: data, error: null };
    } catch (err) {
        console.error('Error fetching merchant by slug:', err);
        return { merchant: null, error: err.message };
    }
}
