import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAdminMerchant } from './adminMerchantContext';

// Create the Context
const CollectionContext = createContext();

// Create the Provider
export function CollectionProvider({ children }) {
    const { merchantId, loading: merchantLoading, hasMerchant } = useAdminMerchant();
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch collections from Supabase when merchantId changes
    useEffect(() => {
        if (merchantLoading) return;

        if (!hasMerchant || !merchantId) {
            setCollections([]);
            setLoading(false);
            return;
        }

        fetchCollections();
    }, [merchantId, merchantLoading, hasMerchant]);

    const fetchCollections = useCallback(async () => {
        if (!merchantId) {
            setCollections([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            console.log('[CollectionContext] Fetching collections for merchant:', merchantId);

            const { data, error } = await supabase
                .from('collections')
                .select(`
          *,
          collection_products (
            id,
            product_id,
            sort_order,
            products (
              id,
              title,
              price,
              images,
              is_active
            )
          )
        `)
                .eq('merchant_id', merchantId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            console.log('[CollectionContext] Fetched', data?.length || 0, 'collections');
            setCollections(data || []);
        } catch (err) {
            console.error('Error fetching collections:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [merchantId]);

    // Create a new collection
    const addCollection = async (newCollection) => {
        if (!merchantId) {
            console.error('[CollectionContext] Cannot add collection - no merchant ID');
            return { success: false, error: 'No merchant associated with this account' };
        }

        try {
            const { data, error } = await supabase
                .from('collections')
                .insert([{
                    name: newCollection.name,
                    description: newCollection.description || null,
                    image_url: newCollection.image_url || null,
                    is_active: newCollection.is_active !== undefined ? newCollection.is_active : true,
                    sort_order: newCollection.sort_order || 0,
                    merchant_id: merchantId
                }])
                .select()
                .single();

            if (error) throw error;

            console.log('[CollectionContext] Created collection:', data.id);

            // If products were provided, add them to the collection
            if (newCollection.product_ids && newCollection.product_ids.length > 0) {
                await addProductsToCollection(data.id, newCollection.product_ids);
            }

            // Refetch to get complete data with products
            await fetchCollections();
            return { success: true, data };
        } catch (err) {
            console.error('Error adding collection:', err);
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    // Update an existing collection
    const editCollection = async (id, updatedCollection) => {
        if (!merchantId) {
            console.error('[CollectionContext] Cannot edit collection - no merchant ID');
            return { success: false, error: 'No merchant associated with this account' };
        }

        try {
            const { data, error } = await supabase
                .from('collections')
                .update({
                    name: updatedCollection.name,
                    description: updatedCollection.description || null,
                    image_url: updatedCollection.image_url || null,
                    is_active: updatedCollection.is_active,
                    sort_order: updatedCollection.sort_order || 0,
                })
                .eq('id', id)
                .eq('merchant_id', merchantId)
                .select()
                .single();

            if (error) throw error;

            console.log('[CollectionContext] Updated collection:', id);

            // If product_ids were provided, sync them
            if (updatedCollection.product_ids !== undefined) {
                await syncCollectionProducts(id, updatedCollection.product_ids);
            }

            // Refetch to get complete data with products
            await fetchCollections();
            return { success: true, data };
        } catch (err) {
            console.error('Error editing collection:', err);
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    // Delete a collection
    const deleteCollection = async (id) => {
        if (!merchantId) {
            console.error('[CollectionContext] Cannot delete collection - no merchant ID');
            return { success: false, error: 'No merchant associated with this account' };
        }

        try {
            const { error } = await supabase
                .from('collections')
                .delete()
                .eq('id', id)
                .eq('merchant_id', merchantId);

            if (error) throw error;

            console.log('[CollectionContext] Deleted collection:', id);
            setCollections(prev => prev.filter(c => c.id !== id));
            return { success: true };
        } catch (err) {
            console.error('Error deleting collection:', err);
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    // Add products to a collection
    const addProductsToCollection = async (collectionId, productIds) => {
        try {
            const records = productIds.map((productId, index) => ({
                collection_id: collectionId,
                product_id: productId,
                sort_order: index
            }));

            const { error } = await supabase
                .from('collection_products')
                .upsert(records, { onConflict: 'collection_id,product_id' });

            if (error) throw error;

            console.log('[CollectionContext] Added', productIds.length, 'products to collection:', collectionId);
            return { success: true };
        } catch (err) {
            console.error('Error adding products to collection:', err);
            return { success: false, error: err.message };
        }
    };

    // Remove products from a collection
    const removeProductsFromCollection = async (collectionId, productIds) => {
        try {
            const { error } = await supabase
                .from('collection_products')
                .delete()
                .eq('collection_id', collectionId)
                .in('product_id', productIds);

            if (error) throw error;

            console.log('[CollectionContext] Removed', productIds.length, 'products from collection:', collectionId);
            return { success: true };
        } catch (err) {
            console.error('Error removing products from collection:', err);
            return { success: false, error: err.message };
        }
    };

    // Sync collection products (replace all products in collection with new list)
    const syncCollectionProducts = async (collectionId, productIds) => {
        try {
            // Delete all existing products in collection
            await supabase
                .from('collection_products')
                .delete()
                .eq('collection_id', collectionId);

            // Add new products if any
            if (productIds.length > 0) {
                await addProductsToCollection(collectionId, productIds);
            }

            console.log('[CollectionContext] Synced', productIds.length, 'products in collection:', collectionId);
            return { success: true };
        } catch (err) {
            console.error('Error syncing collection products:', err);
            return { success: false, error: err.message };
        }
    };

    // Get a single collection with products
    const getCollection = async (id) => {
        try {
            const { data, error } = await supabase
                .from('collections')
                .select(`
          *,
          collection_products (
            id,
            product_id,
            sort_order,
            products (
              id,
              title,
              price,
              images,
              is_active
            )
          )
        `)
                .eq('id', id)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (err) {
            console.error('Error fetching collection:', err);
            return { success: false, error: err.message };
        }
    };

    return (
        <CollectionContext.Provider value={{
            collections,
            addCollection,
            editCollection,
            deleteCollection,
            addProductsToCollection,
            removeProductsFromCollection,
            syncCollectionProducts,
            getCollection,
            loading: loading || merchantLoading,
            error,
            merchantId,
            refetch: fetchCollections
        }}>
            {children}
        </CollectionContext.Provider>
    );
}

// Helper hook
export function useCollections() {
    return useContext(CollectionContext);
}
