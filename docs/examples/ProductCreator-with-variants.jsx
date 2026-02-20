/**
 * EXAMPLE: Integrating Variants into Admin Products Page
 * 
 * This file shows how to add the VariantEditor component to your
 * existing admin product creation/edit page.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useProducts } from '../context/productcontext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Share2, Eye, Save, Plus, X, ChevronDown, Layout } from 'lucide-react';
import { uploadImage, deleteImage } from '../lib/uploadImage';
import { useTemplates } from '../hooks/useTemplates';
import { useAdminMerchant } from '../context/adminMerchantContext';

// ============================================================================
// NEW IMPORTS FOR VARIANTS
// ============================================================================
import { VariantEditor } from '../components/admin/VariantEditor';
import { useProductVariants, useVariantManagement } from '../hooks/useVariants';


export default function ProductCreator() {
    const navigate = useNavigate();
    const location = useLocation();
    const editProduct = location.state?.editProduct;

    const [productTitle, setProductTitle] = useState('');
    const [priceInput, setPriceInput] = useState('');
    const [price, setPrice] = useState(0);
    const [description, setDescription] = useState('');
    const [images, setImages] = useState([]);
    const [category, setCategory] = useState('');
    const [inventory, setInventory] = useState('');
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [saveStatus, setSaveStatus] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [templateId, setTemplateId] = useState('');

    // ========================================================================
    // NEW: Track product ID for variant management
    // ========================================================================
    const [savedProductId, setSavedProductId] = useState(editProduct?.id || null);

    const { addProduct, editProduct: updateProduct } = useProducts();
    const { templates, loading: templatesLoading } = useTemplates();
    const { merchant } = useAdminMerchant();
    const fileInputRef = useRef(null);

    // ========================================================================
    // NEW: Fetch variants and setup variant management
    // ========================================================================
    const {
        variants,
        optionTypes,
        loading: variantsLoading,
        refetch: refetchVariants
    } = useProductVariants(savedProductId);

    const variantManagement = useVariantManagement(savedProductId);

    const categories = ['Electronics', 'Fashion', 'Home & Garden', 'Beauty', 'Sports', 'Books', 'Toys'];

    const extractImageUrl = (item) => {
        if (typeof item === 'string') {
            return item;
        }
        if (item && typeof item === 'object' && item.url) {
            return extractImageUrl(item.url);
        }
        return null;
    };

    useEffect(() => {
        if (editProduct) {
            setIsEditMode(true);
            setSavedProductId(editProduct.id);
            setProductTitle(editProduct.title || '');

            const numericPrice = Number(editProduct.price) || 0;
            setPrice(numericPrice);
            setPriceInput(numericPrice > 0 ? numericPrice.toLocaleString('en-ZA') : '');

            setDescription(editProduct.description || '');
            setCategory(editProduct.category || '');

            setInventory(editProduct.inventory !== null && editProduct.inventory !== undefined
                ? String(editProduct.inventory)
                : '');

            setTags(Array.isArray(editProduct.tags) ? editProduct.tags : []);

            const normalizedImages = Array.isArray(editProduct.images)
                ? editProduct.images.map((item, i) => {
                    const actualUrl = extractImageUrl(item);
                    return actualUrl ? {
                        id: `server-img-${i}`,
                        url: actualUrl,
                        uploading: false
                    } : null;
                }).filter(Boolean)
                : [];
            setImages(normalizedImages);

            setTemplateId(editProduct.template_id || '');
        }
    }, [editProduct]);

    const formatPrice = (value) => {
        let clean = value.replace(/[^\d.]/g, '');

        const parts = clean.split('.');
        if (parts.length > 2) {
            clean = parts[0] + '.' + parts.slice(1).join('');
        }

        const [integer, decimal] = clean.split('.');
        const formattedInt = integer
            ? parseInt(integer, 10).toLocaleString('en-ZA')
            : '';

        return decimal !== undefined
            ? `${formattedInt}.${decimal.slice(0, 2)}`
            : formattedInt;
    };

    const handlePriceChange = (e) => {
        const input = e.target.value;
        const formatted = formatPrice(input);
        const numeric = parseFloat(formatted.replace(/[^\d.]/g, '')) || 0;

        setPriceInput(formatted);
        setPrice(numeric);
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);

        const placeholders = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            url: URL.createObjectURL(file),
            uploading: true,
            file
        }));

        setImages(prev => [...prev, ...placeholders]);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const placeholderId = placeholders[i].id;

            const result = await uploadImage(file);

            if (result.success) {
                setImages(prev => prev.map(img =>
                    img.id === placeholderId
                        ? { id: placeholderId, url: result.url, uploading: false }
                        : img
                ));
            } else {
                console.error('Failed to upload image:', result.error);
                setImages(prev => prev.filter(img => img.id !== placeholderId));
                alert(`Failed to upload ${file.name}: ${result.error}`);
            }
        }
    };

    const removeImage = async (id) => {
        const imageToRemove = images.find(img => img.id === id);

        if (imageToRemove && !imageToRemove.uploading && imageToRemove.url.includes('supabase')) {
            await deleteImage(imageToRemove.url);
        }

        setImages(prev => prev.filter(img => img.id !== id));
    };

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newTag = tagInput.trim().toLowerCase();
            if (newTag && !tags.includes(newTag)) {
                setTags(prev => [...prev, newTag]);
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(prev => prev.filter(tag => tag !== tagToRemove));
    };

    // ========================================================================
    // MODIFIED: Save handler now sets product ID for variants
    // ========================================================================
    const handleSave = async () => {
        setSaveStatus('Saving...');

        const uploadingImages = images.filter(img => img.uploading);
        if (uploadingImages.length > 0) {
            alert('Please wait for all images to finish uploading');
            setSaveStatus('');
            return;
        }

        try {
            const processedImageUrls = [];

            for (const img of images) {
                if (img.file && !img.url.includes('supabase')) {
                    setSaveStatus('Uploading images...');
                    const result = await uploadImage(img.file);

                    if (result.success) {
                        processedImageUrls.push(result.url);
                    } else {
                        setSaveStatus('Error!');
                        alert(`Failed to upload image: ${result.error}`);
                        return;
                    }
                } else {
                    processedImageUrls.push(img.url);
                }
            }

            setSaveStatus('Saving...');

            const productData = {
                title: productTitle,
                price: (price === '' || price === null) ? null : Number(price),
                description,
                category,
                inventory: (inventory === '' || inventory === null) ? null : Number(inventory),
                images: processedImageUrls,
                tags,
                template_id: templateId || null,
            };

            let result;
            if (isEditMode) {
                result = await updateProduct(editProduct.id, productData);
            } else {
                result = await addProduct(productData);

                // ============================================================
                // NEW: Set product ID after creation for variant editor
                // ============================================================
                if (result.success && result.data?.id) {
                    setSavedProductId(result.data.id);
                    setIsEditMode(true); // Switch to edit mode
                }
            }

            if (result.success) {
                setSaveStatus('Saved!');

                // ============================================================
                // NEW: Don't navigate away immediately if we just created
                // a product - allow user to add variants
                // ============================================================
                if (!isEditMode) {
                    // Show success message but stay on page
                    setTimeout(() => {
                        setSaveStatus('Product saved! You can now add variants below.');
                    }, 500);
                } else {
                    // For updates, navigate back after delay
                    setTimeout(() => {
                        navigate('/products');
                    }, 1000);
                }
            } else {
                setSaveStatus('Error!');
                console.error('Save failed:', result.error);
            }
        } catch (err) {
            setSaveStatus('Error!');
            console.error('Save error:', err);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: productTitle || 'Product',
                    text: description,
                    url: url
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        }
    };

    const handlePreview = () => {
        if (isEditMode && editProduct?.id && merchant?.slug) {
            const storefrontUrl = `/s/${merchant.slug}/product/${editProduct.id}`;
            window.open(storefrontUrl, '_blank');
        } else if (!isEditMode) {
            alert('Please save the product first to preview it in the storefront.');
        } else if (!merchant?.slug) {
            alert('Unable to preview: Store slug not found.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm">
                {/* Header */}
                <div className="border-b border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold text-gray-900">
                            {isEditMode ? 'Edit Product' : 'Create New Product'}
                        </h1>
                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Save size={18} />
                                {saveStatus || 'Save'}
                            </button>
                            <button
                                onClick={handlePreview}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <Eye size={18} />
                                Preview
                            </button>
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <Share2 size={18} />
                                Share
                            </button>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-6 space-y-6">
                    {/* Product Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product Title *
                        </label>
                        <input
                            type="text"
                            value={productTitle}
                            onChange={(e) => setProductTitle(e.target.value)}
                            maxLength={100}
                            placeholder="Enter product title"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price *
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-2.5 text-gray-600 font-medium">R</span>
                            <input
                                type="text"
                                value={priceInput}
                                onChange={handlePriceChange}
                                placeholder="0.00"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            This is the base price. You can set custom prices for variants below.
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                            placeholder="Describe your product..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
                        />
                    </div>

                    {/* Images */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product Images
                        </label>
                        <div className="grid grid-cols-4 gap-4">
                            {images.map(img => (
                                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                                    {img.uploading && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => removeImage(img.id)}
                                        disabled={img.uploading}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                                <Plus size={32} className="text-gray-400" />
                            </button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </div>

                    {/* Footer Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category
                            </label>
                            <div className="relative">
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-full appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                                >
                                    <option value="">Select category</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <ChevronDown size={18} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Inventory */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Inventory
                            </label>
                            <input
                                type="number"
                                value={inventory}
                                onChange={(e) => setInventory(e.target.value)}
                                min="0"
                                placeholder="0"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Base inventory. Use variants for separate stock levels.
                            </p>
                        </div>

                        {/* Product Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Product Tags
                            </label>
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                placeholder="Type tag and press Enter"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-2"
                            />
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="ml-1 hover:text-blue-600 focus:outline-none"
                                        >
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Product Page Template Section */}
                    <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                            <Layout size={18} className="text-purple-500" />
                            <label className="text-sm font-medium text-gray-700">
                                Product Page Template
                            </label>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                Optional
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                            Choose a custom layout for this product's page. Leave as default to use the standard product page layout.
                        </p>
                        <div className="relative">
                            <select
                                value={templateId}
                                onChange={(e) => setTemplateId(e.target.value)}
                                disabled={templatesLoading}
                                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white disabled:bg-gray-50 disabled:cursor-wait"
                            >
                                <option value="">Default Template</option>
                                {templates.map(template => (
                                    <option key={template.id} value={template.id}>
                                        {template.name} {template.is_default ? '(Store Default)' : ''}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={18} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                        </div>
                        {templates.length === 0 && !templatesLoading && (
                            <p className="text-xs text-gray-400 mt-2">
                                No custom templates yet.{' '}
                                <a
                                    href="/store/templates"
                                    className="text-purple-600 hover:underline"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        navigate('/store/templates');
                                    }}
                                >
                                    Create one
                                </a>
                            </p>
                        )}
                    </div>

                    {/* ================================================================ */}
                    {/* NEW: Variant Editor Section */}
                    {/* Only show after product is saved (has an ID) */}
                    {/* ================================================================ */}
                    {savedProductId && (
                        <div className="pt-6 border-t-2 border-purple-200">
                            <VariantEditor
                                variants={variants}
                                optionTypes={optionTypes}
                                management={variantManagement}
                                onVariantsChange={refetchVariants}
                                basePrice={price}
                            />
                        </div>
                    )}

                    {/* ================================================================ */}
                    {/* NEW: Info message if product not yet saved */}
                    {/* ================================================================ */}
                    {!savedProductId && (
                        <div className="pt-6 border-t-2 border-gray-200">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                <p className="text-sm text-blue-800">
                                    💡 <strong>Save the product first</strong> to add variants with different sizes, colors, or other options
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
