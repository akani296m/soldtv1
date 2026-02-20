import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAdminMerchant } from './adminMerchantContext';

// 1. Create the Context
const ProductContext = createContext();

// 2. Create the Provider (The "Box" wrapper)
export function ProductProvider({ children }) {
  const { merchantId, loading: merchantLoading, hasMerchant } = useAdminMerchant();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch products from Supabase when merchantId changes
  useEffect(() => {
    // Wait for merchant context to finish loading
    if (merchantLoading) return;

    // If user has no merchant, set empty products
    if (!hasMerchant || !merchantId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    fetchProducts();
  }, [merchantId, merchantLoading, hasMerchant]);

  const fetchProducts = async () => {
    // Don't fetch if no merchant ID
    if (!merchantId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[ProductContext] Fetching products for merchant:', merchantId);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('merchant_id', merchantId) // ✅ Scope to current merchant
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('[ProductContext] Fetched', data?.length || 0, 'products');
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to add a new product
  const addProduct = async (newProduct) => {
    if (!merchantId) {
      console.error('[ProductContext] Cannot add product - no merchant ID');
      return { success: false, error: 'No merchant associated with this account' };
    }

    try {
      // Insert into Supabase with merchant_id
      const { data, error } = await supabase
        .from('products')
        .insert([{
          title: newProduct.title,
          price: newProduct.price,
          description: newProduct.description,
          category: newProduct.category,
          inventory: newProduct.inventory,
          images: newProduct.images,
          tags: newProduct.tags,
          is_active: newProduct.is_active !== undefined ? newProduct.is_active : true,
          template_id: newProduct.template_id || null, // Product page template
          merchant_id: merchantId // ✅ Associate with current merchant
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('[ProductContext] Created product:', data.id);
      // Update local state with the new product (prepend to maintain order)
      setProducts((prev) => [data, ...prev]);
      return { success: true, data };
    } catch (err) {
      console.error('Error adding product:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Function to edit an existing product
  const editProduct = async (id, updatedProduct) => {
    if (!merchantId) {
      console.error('[ProductContext] Cannot edit product - no merchant ID');
      return { success: false, error: 'No merchant associated with this account' };
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          title: updatedProduct.title,
          price: updatedProduct.price,
          description: updatedProduct.description,
          category: updatedProduct.category,
          inventory: updatedProduct.inventory,
          images: updatedProduct.images,
          tags: updatedProduct.tags,
          is_active: updatedProduct.is_active,
          template_id: updatedProduct.template_id || null, // Product page template
        })
        .eq('id', id)
        .eq('merchant_id', merchantId) // ✅ Security: ensure product belongs to this merchant
        .select()
        .single();

      if (error) throw error;

      console.log('[ProductContext] Updated product:', id);
      // Update local state
      setProducts(prev => prev.map(p => p.id === id ? data : p));
      return { success: true, data };
    } catch (err) {
      console.error('Error editing product:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Function to delete a product
  const deleteProduct = async (id) => {
    if (!merchantId) {
      console.error('[ProductContext] Cannot delete product - no merchant ID');
      return { success: false, error: 'No merchant associated with this account' };
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('merchant_id', merchantId); // ✅ Security: ensure product belongs to this merchant

      if (error) throw error;

      console.log('[ProductContext] Deleted product:', id);
      // Update local state
      setProducts(prev => prev.filter(p => p.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  return (
    <ProductContext.Provider value={{
      products,
      addProduct,
      editProduct,
      deleteProduct,
      loading: loading || merchantLoading,
      error,
      merchantId, // Expose merchantId for components that need it
      refetch: fetchProducts
    }}>
      {children}
    </ProductContext.Provider>
  );
}

// 3. Create a helper hook so it's easy to use
export function useProducts() {
  return useContext(ProductContext);
}