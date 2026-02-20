import React, { useState } from 'react';
import { useCollections } from '../context/collectionContext';
import { FolderOpen, Edit, Trash2, Loader2, Plus, Search, Package, Image as ImageIcon, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Collections() {
    const { collections, deleteCollection, loading } = useCollections();
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCollections, setSelectedCollections] = useState(new Set());

    // Helper to extract actual URL from nested objects or return string as-is
    const getImageUrl = (imageItem) => {
        if (!imageItem) return null;
        if (typeof imageItem === 'string') return imageItem;
        if (imageItem.url) return getImageUrl(imageItem.url);
        return null;
    };

    // Filter collections based on search query
    const filteredCollections = collections.filter(collection =>
        collection.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get product count for a collection
    const getProductCount = (collection) => {
        return collection.collection_products?.length || 0;
    };

    // Selection handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedCollections(new Set(filteredCollections.map(c => c.id)));
        } else {
            setSelectedCollections(new Set());
        }
    };

    const handleSelectCollection = (collectionId, e) => {
        e.stopPropagation();
        const newSelected = new Set(selectedCollections);
        if (newSelected.has(collectionId)) {
            newSelected.delete(collectionId);
        } else {
            newSelected.add(collectionId);
        }
        setSelectedCollections(newSelected);
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (confirm('Delete this collection? Products in this collection will not be deleted.')) {
            await deleteCollection(id);
            const newSelected = new Set(selectedCollections);
            newSelected.delete(id);
            setSelectedCollections(newSelected);
        }
    };

    const handleEdit = (collection) => {
        navigate('/products/collections/edit', { state: { editCollection: collection } });
    };

    const handleCreate = () => {
        navigate('/products/collections/create');
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const hasSelection = selectedCollections.size > 0;
    const allSelected = filteredCollections.length > 0 && selectedCollections.size === filteredCollections.length;

    return (
        <div className="p-8" style={{ backgroundColor: '#F1F2F4', minHeight: '100vh' }}>
            {/* Page Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-[32px] font-semibold text-[#1F1F1F]">Collections</h1>
                    <p className="text-gray-500 mt-1">Group your products into collections for easier browsing</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    Create Collection
                </button>
            </div>

            {collections.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E1E3E5] text-center py-20">
                    <FolderOpen className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900">No collections yet</h3>
                    <p className="text-gray-500 mb-6">Create your first collection to organize your products.</p>
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={18} />
                        Create Collection
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-[#E1E3E5] shadow-sm overflow-hidden">
                    {/* Search Bar */}
                    <div className="px-4 py-3 border-b border-[#E1E3E5] flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative flex-1 max-w-md">
                                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search collections..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-[#E1E3E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {hasSelection && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">{selectedCollections.size} selected</span>
                                <button
                                    onClick={() => setSelectedCollections(new Set())}
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Bulk Action Bar */}
                    {hasSelection && (
                        <div className="px-4 py-3 border-b border-[#E1E3E5] flex items-center gap-4" style={{ backgroundColor: '#F7F8F9' }}>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                                    style={{ accentColor: '#000000' }}
                                />
                                <span className="font-semibold text-[#1F1F1F] text-sm">
                                    {selectedCollections.size} selected
                                </span>
                            </div>
                            <button className="p-1.5 border border-[#E1E3E5] rounded-md bg-white hover:bg-gray-50 transition-colors">
                                <MoreHorizontal size={18} className="text-gray-600" />
                            </button>
                        </div>
                    )}

                    {/* Collections Grid/List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {filteredCollections.map((collection) => {
                            const productCount = getProductCount(collection);
                            const previewProducts = collection.collection_products?.slice(0, 4) || [];

                            return (
                                <div
                                    key={collection.id}
                                    onClick={() => handleEdit(collection)}
                                    className="bg-white border border-[#E1E3E5] rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                                >
                                    {/* Collection Image / Product Preview Grid */}
                                    <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden">
                                        {collection.image_url ? (
                                            <img
                                                src={collection.image_url}
                                                alt={collection.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : previewProducts.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-0.5 h-full">
                                                {previewProducts.map((cp, index) => {
                                                    const firstImage = cp.products?.images?.[0];
                                                    const imageUrl = getImageUrl(firstImage);
                                                    return (
                                                        <div key={index} className="bg-gray-50 flex items-center justify-center">
                                                            {imageUrl ? (
                                                                <img
                                                                    src={imageUrl}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <Package className="text-gray-300" size={24} />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                {[...Array(Math.max(0, 4 - previewProducts.length))].map((_, i) => (
                                                    <div key={`empty-${i}`} className="bg-gray-50" />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <ImageIcon className="text-gray-300" size={48} />
                                            </div>
                                        )}

                                        {/* Checkbox */}
                                        <div
                                            className="absolute top-3 left-3"
                                            onClick={(e) => handleSelectCollection(collection.id, e)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedCollections.has(collection.id)}
                                                onChange={() => { }}
                                                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                                style={{
                                                    accentColor: '#000000',
                                                    opacity: selectedCollections.has(collection.id) ? 1 : undefined
                                                }}
                                            />
                                        </div>

                                        {/* Status Badge */}
                                        <div className="absolute top-3 right-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${collection.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {collection.is_active ? 'Active' : 'Draft'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Collection Info */}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-[#1F1F1F] truncate">{collection.name}</h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {productCount} {productCount === 1 ? 'product' : 'products'}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(collection);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(collection.id, e)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {collection.description && (
                                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                                {collection.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Empty Search Results */}
                    {filteredCollections.length === 0 && searchQuery && (
                        <div className="py-12 text-center">
                            <Search className="mx-auto text-gray-300 mb-4" size={48} />
                            <p className="text-gray-500">No collections found matching "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
