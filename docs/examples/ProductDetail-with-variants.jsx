/**
 * EXAMPLE: Integrating Variants into ProductDetail.jsx
 * 
 * This file shows the key changes needed to add variant support
 * to your existing ProductDetail component.
 */

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Truck, ShieldCheck, Minus, Plus, Package, Loader2, Heart, Share2 } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import { useMerchantProduct, useMerchantProducts } from '../hooks/useMerchantProducts';
import { useCart } from '../../context/cartcontext';
import { useMerchant } from '../context/MerchantContext';

// ============================================================================
// NEW IMPORTS FOR VARIANTS
// ============================================================================
import { useProductVariants, useVariantSelection } from '../../hooks/useVariants';
import { VariantSelector, VariantPriceDisplay, VariantStockBadge } from '../components/VariantSelector';


export default function ProductDetail() {
    const { merchantSlug, productId } = useParams();
    const navigate = useNavigate();
    const { merchant, isCustomDomain, loading: merchantLoading } = useMerchant();
    const { product, loading } = useMerchantProduct(productId);
    const { products, loading: productsLoading } = useMerchantProducts();
    const { addToCart } = useCart();

    // ========================================================================
    // NEW: Fetch variants and option types
    // ========================================================================
    const { variants, optionTypes, loading: variantsLoading } = useProductVariants(productId);

    // ========================================================================
    // NEW: Variant selection hook
    // ========================================================================
    const {
        selectedOptions,
        isSelectionComplete,
        activeVariant,
        effectivePrice,
        effectiveImage,
        isInStock,
        stockQuantity,
        selectOption,
        getAvailableValuesForOption,
        getCartItemData,
        hasVariants
    } = useVariantSelection(product, variants, optionTypes);

    const [activeImage, setActiveImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);

    const basePath = isCustomDomain ? '' : `/s/${merchantSlug}`;

    const breadcrumbItems = useMemo(() => {
        const items = [
            { label: 'Home', path: '/' },
            { label: 'Products', path: '/products' },
        ];

        if (product?.category) {
            items.push({
                label: product.category,
                path: `/products?category=${encodeURIComponent(product.category)}`,
            });
        }

        items.push({
            label: product?.title || 'Product',
        });

        return items;
    }, [product?.category, product?.title]);

    const getImageUrl = (imageItem) => {
        if (!imageItem) return null;
        if (typeof imageItem === 'string') return imageItem;
        if (imageItem.url) return getImageUrl(imageItem.url);
        return null;
    };

    // ========================================================================
    // MODIFIED: Add to cart handler now supports variants
    // ========================================================================
    const handleAddToCart = () => {
        // Check variant selection if product has variants
        if (hasVariants && !isSelectionComplete) {
            alert('Please select all product options');
            return;
        }

        // Get cart item data (handles both variant and non-variant products)
        const cartItemData = getCartItemData(quantity);

        if (!cartItemData) {
            alert('Unable to add to cart. Please try again.');
            return;
        }

        addToCart(cartItemData);
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: product.title,
                    text: product.description,
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

    // ========================================================================
    // MODIFIED: Loading state now includes variants
    // ========================================================================
    if (loading || merchantLoading || variantsLoading) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-center min-h-[500px]">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-12">
                <Breadcrumb
                    items={[
                        { label: 'Home', path: '/' },
                        { label: 'Products', path: '/products' },
                        { label: 'Not Found' }
                    ]}
                    basePath={basePath}
                />
                <div className="text-center py-20">
                    <Package className="mx-auto text-gray-300 mb-4" size={80} />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
                    <p className="text-gray-500 mb-6">Sorry, we couldn't find the product you're looking for.</p>
                    <Link to={`${basePath}/products`} className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition">
                        Browse Products
                    </Link>
                </div>
            </div>
        );
    }

    // ========================================================================
    // MODIFIED: Use effectiveImage for display (variant-aware)
    // ========================================================================
    const productImages = product.images && Array.isArray(product.images) && product.images.length > 0
        ? product.images.map(img => getImageUrl(img)).filter(Boolean)
        : [];

    const hasImages = productImages.length > 0;

    // Use variant image if available, otherwise use product images
    const displayImage = effectiveImage || (hasImages ? productImages[activeImage] : null);

    return (
        <div className="bg-white min-h-screen">
            {/* Breadcrumb Navigation */}
            <div className="max-w-7xl mx-auto px-6 pt-6">
                <Breadcrumb items={breadcrumbItems} basePath={basePath} />
            </div>

            <div className="max-w-7xl mx-auto px-6 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                    {/* --- LEFT: IMAGE GALLERY --- */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <div className="aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden relative group">
                            {displayImage ? (
                                <>
                                    <img
                                        src={displayImage}
                                        alt={product.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        onClick={() => setIsFavorite(!isFavorite)}
                                        className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Heart
                                            size={20}
                                            className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}
                                        />
                                    </button>
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200">
                                    <Package className="text-gray-400 mb-2" size={64} />
                                    <span className="text-gray-500 text-sm">No image available</span>
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {hasImages && productImages.length > 1 && (
                            <div className="grid grid-cols-4 gap-4">
                                {productImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all hover:border-gray-400 ${activeImage === idx ? 'border-black' : 'border-transparent'
                                            }`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* --- RIGHT: PRODUCT INFO --- */}
                    <div className="flex flex-col">
                        {/* Category */}
                        {product.category && (
                            <span className="text-sm text-gray-500 uppercase tracking-wider mb-2">
                                {product.category}
                            </span>
                        )}

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                            {product.title}
                        </h1>

                        {/* ============================================================ */}
                        {/* NEW: Variant-aware price display */}
                        {/* ============================================================ */}
                        <VariantPriceDisplay
                            effectivePrice={effectivePrice}
                            basePrice={product.price}
                            hasVariants={hasVariants}
                            isSelectionComplete={isSelectionComplete}
                        />

                        {/* Description */}
                        {product.description && (
                            <div className="mb-8">
                                <h3 className="font-bold text-sm uppercase mb-3">Description</h3>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {product.description}
                                </p>
                            </div>
                        )}

                        {/* ============================================================ */}
                        {/* NEW: Variant Selector */}
                        {/* ============================================================ */}
                        {hasVariants && (
                            <div className="mb-8">
                                <VariantSelector
                                    optionTypes={optionTypes}
                                    selectedOptions={selectedOptions}
                                    getAvailableValuesForOption={getAvailableValuesForOption}
                                    onSelectOption={selectOption}
                                    isSelectionComplete={isSelectionComplete}
                                    activeVariant={activeVariant}
                                />
                            </div>
                        )}

                        {/* ============================================================ */}
                        {/* NEW: Variant Stock Badge */}
                        {/* ============================================================ */}
                        <div className="mb-4">
                            <VariantStockBadge
                                stockQuantity={stockQuantity}
                                isInStock={isInStock}
                                hasVariants={hasVariants}
                                isSelectionComplete={isSelectionComplete}
                            />
                        </div>

                        {/* Tags */}
                        {product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
                            <div className="mb-8">
                                <h3 className="font-bold text-sm uppercase mb-3">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {product.tags.map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity & Add to Cart */}
                        <div className="space-y-4 mb-8">
                            {/* Quantity Selector */}
                            <div>
                                <label className="font-bold text-sm uppercase mb-3 block">Quantity</label>
                                <div className="flex items-center border border-gray-300 rounded-lg w-36 justify-between">
                                    <button
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="p-3 text-gray-500 hover:text-black hover:bg-gray-50 transition rounded-l-lg"
                                        disabled={!isInStock}
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="font-medium text-lg">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(q => stockQuantity ? Math.min(stockQuantity, q + 1) : q + 1)}
                                        className="p-3 text-gray-500 hover:text-black hover:bg-gray-50 transition rounded-r-lg"
                                        disabled={!isInStock || (stockQuantity && quantity >= stockQuantity)}
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={!isInStock || (hasVariants && !isSelectionComplete)}
                                    className="flex-1 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition py-4 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500"
                                >
                                    {!isInStock
                                        ? 'Out of Stock'
                                        : hasVariants && !isSelectionComplete
                                            ? 'Select Options'
                                            : 'Add to Cart'
                                    }
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="w-14 h-14 flex items-center justify-center border border-gray-300 rounded-lg hover:border-black transition"
                                    title="Share product"
                                >
                                    <Share2 size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Trust Signals */}
                        <div className="border-t border-gray-200 pt-6 space-y-4 text-sm text-gray-600">
                            <div className="flex items-center gap-3">
                                <Truck size={22} className="text-gray-800" />
                                <div>
                                    <p className="font-medium text-gray-900">Free Shipping</p>
                                    <p className="text-xs">On orders over R 1,500</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={22} className="text-gray-800" />
                                <div>
                                    <p className="font-medium text-gray-900">Secure Payment</p>
                                    <p className="text-xs">Protected checkout & 30-day returns</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
