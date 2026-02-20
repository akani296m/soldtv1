import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useMerchant } from '../context/MerchantContext';

/**
 * Hook to fetch products scoped to the current merchant
 * Does NOT use authenticated user state - uses merchant.id from context
 */
export function useMerchantProducts() {
    const { merchant, loading: merchantLoading } = useMerchant();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchProducts() {
            // Wait for merchant to be loaded
            if (merchantLoading) return;

            // If no merchant, can't fetch products
            if (!merchant?.id) {
                setProducts([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const { data, error: fetchError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('merchant_id', merchant.id)
                    .order('created_at', { ascending: false });

                if (fetchError) throw fetchError;
                setProducts(data || []);
            } catch (err) {
                console.error('Error fetching merchant products:', err);
                setError(err.message);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, [merchant?.id, merchantLoading]);

    return { products, loading: loading || merchantLoading, error };
}

/**
 * Hook to fetch a single product by ID, scoped to the current merchant
 */
export function useMerchantProduct(productId) {
    const { merchant, loading: merchantLoading } = useMerchant();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchProduct() {
            // Wait for merchant to be loaded
            if (merchantLoading) return;

            // If no merchant or product ID, can't fetch
            if (!merchant?.id || !productId) {
                setProduct(null);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const { data, error: fetchError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('merchant_id', merchant.id)
                    .eq('id', parseInt(productId))
                    .single();

                if (fetchError) {
                    if (fetchError.code === 'PGRST116') {
                        setProduct(null);
                    } else {
                        throw fetchError;
                    }
                } else {
                    setProduct(data);
                }
            } catch (err) {
                console.error('Error fetching product:', err);
                setError(err.message);
                setProduct(null);
            } finally {
                setLoading(false);
            }
        }

        fetchProduct();
    }, [merchant?.id, productId, merchantLoading]);

    return { product, loading: loading || merchantLoading, error };
}
