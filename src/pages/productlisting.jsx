import React, { useState, useMemo } from 'react';
import { useProducts } from '../context/productcontext';
import { Package, Edit, Trash2, Loader2, Plus, Search, SlidersHorizontal, ArrowUpDown, ChevronDown, MoreHorizontal, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Products() {
  const { products, deleteProduct, editProduct, loading } = useProducts();
  const navigate = useNavigate();

  // State management
  const [activeTab, setActiveTab] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [showAllSelected, setShowAllSelected] = useState(false);

  // Helper to extract actual URL from nested objects or return string as-is
  const getImageUrl = (imageItem) => {
    if (!imageItem) return null;
    if (typeof imageItem === 'string') return imageItem;
    // Recursively extract URL from nested objects
    if (imageItem.url) return getImageUrl(imageItem.url);
    return null;
  };

  // Filter products based on active tab
  const filteredProducts = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return products.filter(p => p.is_active);
      case 'draft':
        return products.filter(p => !p.is_active);
      case 'archived':
        return []; // Add archived logic when implemented
      default:
        return products;
    }
  }, [products, activeTab]);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectProduct = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkEdit = () => {
    // Implement bulk edit logic
    alert('Bulk edit functionality');
  };

  const handleSetAsDraft = async () => {
    for (const id of selectedProducts) {
      const product = products.find(p => p.id === id);
      if (product && product.is_active) {
        await editProduct(id, { ...product, is_active: false });
      }
    }
    setSelectedProducts(new Set());
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this product?')) {
      await deleteProduct(id);
      const newSelected = new Set(selectedProducts);
      newSelected.delete(id);
      setSelectedProducts(newSelected);
    }
  };

  const handleEdit = (product) => {
    navigate('/products/create', { state: { editProduct: product } });
  };

  const handleCreate = () => {
    navigate('/products/create');
  };

  // Toggle product active status
  const handleToggleStatus = async (product) => {
    const newIsActive = !product.is_active;
    await editProduct(product.id, { ...product, is_active: newIsActive });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const hasSelection = selectedProducts.size > 0;
  const allSelected = filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length;

  return (
    <div className="p-8" style={{ backgroundColor: '#F1F2F4', minHeight: '100vh' }}>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[32px] font-semibold text-[#1F1F1F]">Products</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E1E3E5] text-center py-20">
          <Package className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900">No products yet</h3>
          <p className="text-gray-500">Go to "Add Product" to create your first item.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E1E3E5] shadow-sm overflow-hidden">
          {/* Section 1: Top Navigation & Filter Bar */}
          <div className="px-4 py-3 border-b border-[#E1E3E5] flex items-center justify-between">
            {/* Left: Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'all'
                  ? 'bg-[#E4E5E7] text-[#1F1F1F]'
                  : 'text-[#6B7280] hover:text-[#1F1F1F]'
                  }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'active'
                  ? 'bg-[#E4E5E7] text-[#1F1F1F]'
                  : 'text-[#6B7280] hover:text-[#1F1F1F]'
                  }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab('draft')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'draft'
                  ? 'bg-[#E4E5E7] text-[#1F1F1F]'
                  : 'text-[#6B7280] hover:text-[#1F1F1F]'
                  }`}
              >
                Draft
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'archived'
                  ? 'bg-[#E4E5E7] text-[#1F1F1F]'
                  : 'text-[#6B7280] hover:text-[#1F1F1F]'
                  }`}
              >
                Archived
              </button>
            </div>

            {/* Right: Tools */}
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-[#E1E3E5] rounded-md overflow-hidden">
                <button className="p-2 hover:bg-gray-50 transition-colors border-r border-[#E1E3E5]">
                  <Search size={18} className="text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-50 transition-colors">
                  <SlidersHorizontal size={18} className="text-gray-600" />
                </button>
              </div>
              <button className="p-2 border border-[#E1E3E5] rounded-md hover:bg-gray-50 transition-colors">
                <ArrowUpDown size={18} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Section 2: Bulk Action Bar (Contextual Header) */}
          {hasSelection && (
            <div className="px-4 py-3 border-b border-[#E1E3E5] flex items-center justify-between" style={{ backgroundColor: '#F7F8F9' }}>
              {/* Left Group */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                    style={{ accentColor: '#000000' }}
                  />
                  <span className="font-semibold text-[#1F1F1F] text-sm">
                    {selectedProducts.size} selected
                  </span>
                  <ChevronDown size={16} className="text-gray-600" />
                </div>

                <button
                  onClick={handleBulkEdit}
                  className="px-3 py-1.5 border border-[#E1E3E5] rounded-md text-sm font-medium text-[#1F1F1F] bg-white hover:bg-gray-50 transition-colors"
                >
                  Bulk edit
                </button>

                <button
                  onClick={handleSetAsDraft}
                  className="px-3 py-1.5 border border-[#E1E3E5] rounded-md text-sm font-medium text-[#1F1F1F] bg-white hover:bg-gray-50 transition-colors"
                >
                  Set as draft
                </button>

                <button className="p-1.5 border border-[#E1E3E5] rounded-md bg-white hover:bg-gray-50 transition-colors">
                  <MoreHorizontal size={18} className="text-gray-600" />
                </button>
              </div>

              {/* Right Group */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show all selected</span>
                <button
                  onClick={() => setShowAllSelected(!showAllSelected)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showAllSelected ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                >
                  <span
                    className={`${showAllSelected ? 'translate-x-5' : 'translate-x-1'
                      } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Section 3: Data List Rows */}
          <div>
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                onClick={() => handleEdit(product)}
                className="px-4 py-4 flex items-center hover:bg-gray-50 transition-colors cursor-pointer"
                style={{
                  borderBottom: index !== filteredProducts.length - 1 ? '1px solid #E1E3E5' : 'none',
                  minHeight: '68px'
                }}
              >
                <div className="flex items-center mr-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    onChange={() => handleSelectProduct(product.id)}
                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                    style={{ accentColor: '#000000' }}
                  />
                </div>

                <div className="flex items-center gap-3 flex-1 min-w-0" style={{ maxWidth: '35%' }}>
                  <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    {product.images && product.images[0] ? (
                      <img src={getImageUrl(product.images[0])} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-full h-full p-2 text-gray-400" />
                    )}
                  </div>
                  <span className="font-medium text-[#1F1F1F] text-sm truncate">
                    {product.title}
                  </span>
                </div>

                {/* Category */}
                <div className="flex-1 px-4 text-sm text-gray-600" style={{ maxWidth: '15%' }}>
                  {product.category || '—'}
                </div>

                {/* Price */}
                <div className="flex-1 px-4 text-sm text-gray-600" style={{ maxWidth: '15%' }}>
                  R {Number(product.price).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                {/* Inventory */}
                <div className="flex-1 px-4 text-sm text-gray-600" style={{ maxWidth: '15%' }}>
                  {product.inventory} in stock
                </div>

                {/* Status */}
                <div className="flex-1 px-4" style={{ maxWidth: '10%' }}>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {product.is_active ? 'Active' : 'Draft'}
                  </span>
                </div>

                <div className="flex items-center gap-2 justify-end" style={{ maxWidth: '10%' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => navigate(`/reviews?productId=${product.id}`)}
                    className="p-1.5 text-gray-400 hover:text-amber-600 transition-colors"
                    title="Manage reviews"
                  >
                    <Star size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
