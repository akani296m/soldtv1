import React, { useState, useRef, useEffect } from 'react';
import { useCollections } from '../context/collectionContext';
import { useProducts } from '../context/productcontext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, ArrowLeft, X, Plus, Search, Package, Check, GripVertical, Image as ImageIcon } from 'lucide-react';
import { uploadImage, deleteImage } from '../lib/uploadImage';

export default function CollectionEditor() {
    const navigate = useNavigate();
    const location = useLocation();
    const editCollection = location.state?.editCollection;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const [saveStatus, setSaveStatus] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [productSearchQuery, setProductSearchQuery] = useState('');

    const { addCollection, editCollection: updateCollection, getCollection } = useCollections();
    const { products, loading: productsLoading } = useProducts();
    const fileInputRef = useRef(null);

    // Populate form when editing an existing collection
    useEffect(() => {
        if (editCollection) {
            setIsEditMode(true);
            setName(editCollection.name || '');
            setDescription(editCollection.description || '');
            setImageUrl(editCollection.image_url || '');
            setIsActive(editCollection.is_active !== false);

            // Extract product IDs from collection_products
            const productIds = editCollection.collection_products?.map(cp => cp.product_id) || [];
            setSelectedProductIds(productIds);
        }
    }, [editCollection]);

    // Filter products based on search query
    const filteredProducts = products.filter(product =>
        product.title.toLowerCase().includes(productSearchQuery.toLowerCase())
    );

    // Get selected products in order
    const selectedProducts = selectedProductIds
        .map(id => products.find(p => p.id === id))
        .filter(Boolean);

    // Helper to extract actual URL from nested objects
    const getImageUrl = (imageItem) => {
        if (!imageItem) return null;
        if (typeof imageItem === 'string') return imageItem;
        if (imageItem.url) return getImageUrl(imageItem.url);
        return null;
    };

    // Handle collection image upload
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageUploading(true);
        const result = await uploadImage(file);

        if (result.success) {
            // Delete old image if exists
            if (imageUrl) {
                await deleteImage(imageUrl);
            }
            setImageUrl(result.url);
        } else {
            alert(`Failed to upload image: ${result.error}`);
        }

        setImageUploading(false);
    };

    const removeImage = async () => {
        if (imageUrl) {
            await deleteImage(imageUrl);
            setImageUrl('');
        }
    };

    // Handle product selection
    const toggleProductSelection = (productId) => {
        setSelectedProductIds(prev => {
            if (prev.includes(productId)) {
                return prev.filter(id => id !== productId);
            } else {
                return [...prev, productId];
            }
        });
    };

    // Handle removing product from collection
    const removeProduct = (productId) => {
        setSelectedProductIds(prev => prev.filter(id => id !== productId));
    };

    // Save collection
    const handleSave = async () => {
        if (!name.trim()) {
            alert('Please enter a collection name');
            return;
        }

        setSaveStatus('Saving...');

        try {
            const collectionData = {
                name: name.trim(),
                description: description.trim() || null,
                image_url: imageUrl || null,
                is_active: isActive,
                product_ids: selectedProductIds
            };

            let result;
            if (isEditMode) {
                result = await updateCollection(editCollection.id, collectionData);
            } else {
                result = await addCollection(collectionData);
            }

            if (result.success) {
                setSaveStatus('Saved!');
                setTimeout(() => {
                    navigate('/products/collections');
                }, 500);
            } else {
                setSaveStatus('Error!');
                console.error('Save failed:', result.error);
                alert(`Failed to save: ${result.error}`);
            }
        } catch (err) {
            setSaveStatus('Error!');
            console.error('Save error:', err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Fixed Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/products/collections')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-semibold text-gray-900">
                            {isEditMode ? 'Edit Collection' : 'Create Collection'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/products/collections')}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Save size={18} />
                            {saveStatus || 'Save'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Collection Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info Card */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Collection Details</h2>

                            {/* Name */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Collection Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Summer Collection"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    placeholder="Describe this collection..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
                                />
                            </div>
                        </div>

                        {/* Products Card */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-medium text-gray-900">Products</h2>
                                <button
                                    onClick={() => setShowProductPicker(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    <Plus size={16} />
                                    Add Products
                                </button>
                            </div>

                            {selectedProducts.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                    <Package className="mx-auto text-gray-300 mb-3" size={40} />
                                    <p className="text-gray-500 mb-3">No products in this collection</p>
                                    <button
                                        onClick={() => setShowProductPicker(true)}
                                        className="text-sm text-blue-600 hover:text-blue-700"
                                    >
                                        Add products to this collection
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {selectedProducts.map((product, index) => {
                                        const firstImage = product.images?.[0];
                                        const productImageUrl = getImageUrl(firstImage);

                                        return (
                                            <div
                                                key={product.id}
                                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                                            >
                                                <GripVertical className="text-gray-300 cursor-grab" size={18} />

                                                <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                                    {productImageUrl ? (
                                                        <img src={productImageUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-full h-full p-2 text-gray-400" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">{product.title}</p>
                                                    <p className="text-sm text-gray-500">
                                                        R {Number(product.price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => removeProduct(product.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Settings */}
                    <div className="space-y-6">
                        {/* Collection Image Card */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Collection Image</h2>

                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                                {imageUploading ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : imageUrl ? (
                                    <>
                                        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                                        <button
                                            onClick={removeImage}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                        <ImageIcon className="text-gray-300 mb-2" size={32} />
                                        <p className="text-sm text-gray-500">Click to upload</p>
                                    </div>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />

                            {imageUrl && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700"
                                >
                                    Change Image
                                </button>
                            )}
                        </div>

                        {/* Status Card */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Status</h2>

                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-gray-700">Collection Active</span>
                                <button
                                    onClick={() => setIsActive(!isActive)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-green-600' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`${isActive ? 'translate-x-6' : 'translate-x-1'
                                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                    />
                                </button>
                            </label>
                            <p className="text-xs text-gray-500 mt-2">
                                {isActive
                                    ? 'This collection is visible on your storefront'
                                    : 'This collection is hidden from customers'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Picker Modal */}
            {showProductPicker && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                            onClick={() => setShowProductPicker(false)}
                        />

                        {/* Modal */}
                        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Add Products</h3>
                                <button
                                    onClick={() => setShowProductPicker(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Search */}
                            <div className="p-4 border-b border-gray-200">
                                <div className="relative">
                                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search products..."
                                        value={productSearchQuery}
                                        onChange={(e) => setProductSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Product List */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {productsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : filteredProducts.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Package className="mx-auto text-gray-300 mb-3" size={40} />
                                        <p className="text-gray-500">
                                            {productSearchQuery ? 'No products found' : 'No products available'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredProducts.map((product) => {
                                            const isSelected = selectedProductIds.includes(product.id);
                                            const firstImage = product.images?.[0];
                                            const productImageUrl = getImageUrl(firstImage);

                                            return (
                                                <div
                                                    key={product.id}
                                                    onClick={() => toggleProductSelection(product.id)}
                                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isSelected
                                                            ? 'bg-blue-50 border border-blue-200'
                                                            : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                                                            ? 'bg-blue-600 border-blue-600'
                                                            : 'border-gray-300'
                                                        }`}>
                                                        {isSelected && <Check size={14} className="text-white" />}
                                                    </div>

                                                    <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                                        {productImageUrl ? (
                                                            <img src={productImageUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package className="w-full h-full p-2 text-gray-400" />
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 truncate">{product.title}</p>
                                                        <p className="text-sm text-gray-500">
                                                            R {Number(product.price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>

                                                    {!product.is_active && (
                                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                            Draft
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    {selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected
                                </p>
                                <button
                                    onClick={() => setShowProductPicker(false)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
