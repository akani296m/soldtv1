import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Truck, ShieldCheck, Minus, Plus, Package, Loader2, Heart, Share2, Star } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import { useMerchantProduct, useMerchantProducts } from '../hooks/useMerchantProducts';
import { useCart } from '../../context/cartcontext';
import { useMerchant } from '../context/MerchantContext';
import { useProductTemplateSections } from '../../hooks/useProductTemplateSections';
import SectionRenderer from '../../components/storefront/SectionRenderer';
import { PAGE_TYPES } from '../../components/storefront/sections';
import { useProductVariants, useVariantSelection } from '../../hooks/useVariants';
import { VariantSelector, VariantPriceDisplay, VariantStockBadge } from '../components/VariantSelector';
import { SECTION_ZONE_KEYS } from '../../lib/sectionZones';
import ProductReviews from '../components/ProductReviews';
import { richTextToHtml, richTextToPlainText } from '../../lib/richText';
import {
    buildOmnisendEventId,
    getOmnisendCartId,
    getOmnisendContactHint,
    trackOmnisendEvent
} from '../../lib/omnisend';

export default function ProductDetail() {
    const { merchantSlug, productId } = useParams();
    const { merchant, isCustomDomain, loading: merchantLoading } = useMerchant();
    const { product, loading } = useMerchantProduct(productId);
    const { products, loading: productsLoading } = useMerchantProducts();
    const { addToCart } = useCart();

    // Fetch product-specific sections based on template_id or default
    const { sections, loading: sectionsLoading } = useProductTemplateSections(
        merchant?.id,
        product?.template_id
    );

    // Fetch variants for this product
    const { variants, optionTypes, loading: variantsLoading } = useProductVariants(productId);

    // Variant selection state
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
    const descriptionHtml = richTextToHtml(product?.description);

    // Base path for this merchant's storefront
    const basePath = isCustomDomain ? '' : `/s/${merchantSlug}`;

    // Update active image when variant changes
    useEffect(() => {
        if (effectiveImage) {
            // Find the image index in product images
            const productImages = product?.images?.map(img => {
                if (typeof img === 'string') return img;
                return img?.url || null;
            }).filter(Boolean) || [];

            const imageIndex = productImages.indexOf(effectiveImage);
            if (imageIndex >= 0) {
                setActiveImage(imageIndex);
            }
        }
    }, [effectiveImage, product?.images]);

    useEffect(() => {
        if (!merchant?.id || !product?.id) return;

        void trackOmnisendEvent({
            merchantId: merchant.id,
            name: 'viewed product',
            eventID: buildOmnisendEventId({
                type: 'product_viewed',
                productId: product.id,
            }),
            contact: getOmnisendContactHint(),
            properties: {
                productID: String(product.id),
                productTitle: product.title,
                productPrice: Number(effectivePrice || product.price || 0),
                category: product.category || null,
                productURL: window.location.href,
            },
        });
    }, [merchant?.id, product?.id, product?.title, product?.price, product?.category, effectivePrice]);

    // Update document title with product name and store name
    useEffect(() => {
        if (!product?.title || !merchant) return;

        const storeName = merchant.store_name || merchant.business_name || 'Store';
        document.title = `${product.title} | ${storeName}`;

        // Cleanup: title will be reset by StorefrontLayout when navigating away
    }, [product?.title, merchant]);

    // Build breadcrumb items dynamically - MUST be before any early returns
    const breadcrumbItems = useMemo(() => {
        const items = [
            { label: 'Home', path: '/' },
            { label: 'Products', path: '/products' },
        ];

        // Add category if product has one
        if (product?.category) {
            items.push({
                label: product.category,
                path: `/products?category=${encodeURIComponent(product.category)}`,
            });
        }

        // Add current product name (no path = not clickable)
        items.push({
            label: product?.title || 'Product',
        });

        return items;
    }, [product?.category, product?.title]);

    // Helper to extract actual URL from nested objects
    const getImageUrl = (imageItem) => {
        if (!imageItem) return null;
        if (typeof imageItem === 'string') return imageItem;
        if (imageItem.url) return getImageUrl(imageItem.url);
        return null;
    };

    const handleAddToCart = () => {
        const omnisendContext = {
            omnisend: {
                merchantId: merchant?.id,
                cartId: getOmnisendCartId(),
                contact: getOmnisendContactHint(),
            },
        };

        // If product has variants, require selection
        if (hasVariants && !isSelectionComplete) {
            alert('Please select all options before adding to cart');
            return;
        }

        // Get cart item data from variant selection hook (handles both variant and non-variant)
        if (hasVariants) {
            const cartItemData = getCartItemData(quantity);
            if (!cartItemData) {
                alert('Unable to add to cart');
                return;
            }
            addToCart(cartItemData, quantity, omnisendContext);
        } else {
            // Legacy: non-variant product
            const productImages = product.images && Array.isArray(product.images) && product.images.length > 0
                ? product.images.map(img => getImageUrl(img)).filter(Boolean)
                : [];

            const cartItem = {
                id: product.id,
                title: product.title,
                price: product.price,
                image: productImages[0] || null,
                inventory: product.inventory
            };

            addToCart(cartItem, quantity, omnisendContext);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: product.title,
                    text: richTextToPlainText(product.description),
                    url: url
                });
            } catch {
                console.log('Share cancelled');
            }
        } else {
            navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        }
    };

    // Loading state
    if (loading || merchantLoading || sectionsLoading || variantsLoading) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-center min-h-[500px]">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                </div>
            </div>
        );
    }

    // Product not found
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

    // Extract and normalize product images
    const productImages = product.images && Array.isArray(product.images) && product.images.length > 0
        ? product.images.map(img => getImageUrl(img)).filter(Boolean)
        : [];

    const ratingAverage = Number(product.rating_average || 0);
    const ratingCount = Number(product.rating_count || 0);

    const hasImages = productImages.length > 0;
    // Use variant-aware stock check if product has variants
    const inStock = hasVariants
        ? (isSelectionComplete ? isInStock : true) // Allow adding if incomplete (will prompt)
        : (product.inventory && product.inventory > 0);

    // Get the effective stock quantity for max input
    const currentStock = hasVariants
        ? (isSelectionComplete ? stockQuantity : product.inventory)
        : product.inventory;

    // Filter sections by canonical zone
    const topSections = sections.filter(s =>
        s.visible && s.zone === SECTION_ZONE_KEYS.PRODUCT_TOP
    );

    const trustSections = sections.filter(s =>
        s.visible && s.zone === SECTION_ZONE_KEYS.PRODUCT_INFO_TRUST
    );

    const inlineSections = sections.filter(s =>
        s.visible && s.zone === SECTION_ZONE_KEYS.PRODUCT_INFO_INLINE
    );

    const bottomSections = sections.filter(s =>
        s.visible && s.zone === SECTION_ZONE_KEYS.PRODUCT_BOTTOM
    );

    // Check if we have a custom trust section or should use default
    const hasCustomTrustSection = trustSections.length > 0;

    return (
        <div className="bg-white min-h-screen">
            {/* Breadcrumb Navigation */}
            <div className="max-w-7xl mx-auto px-6 pt-6">
                <Breadcrumb items={breadcrumbItems} basePath={basePath} />
            </div>

            {/* Optional top zone sections */}
            {topSections.length > 0 && (
                <SectionRenderer
                    sections={topSections}
                    basePath={basePath}
                    products={products}
                    productsLoading={productsLoading}
                />
            )}

            <div className="max-w-7xl mx-auto px-6 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

                    {/* --- LEFT: IMAGE GALLERY --- */}
                    <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
                        {/* Main Image */}
                        <div className="aspect-[4/5] sm:aspect-[3/4] lg:aspect-square bg-gray-100 rounded-lg overflow-hidden relative group">
                            {hasImages ? (
                                <>
                                    <img
                                        src={productImages[activeImage]}
                                        alt={product.title}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Favorite Button */}
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

                        {/* Rating Summary */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center gap-0.5">
                                {[0, 1, 2, 3, 4].map((idx) => {
                                    const filled = idx < Math.round(Math.max(0, Math.min(5, ratingAverage)));
                                    return (
                                        <Star
                                            key={idx}
                                            size={16}
                                            className={filled ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}
                                        />
                                    );
                                })}
                            </div>
                            <button
                                type="button"
                                onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                {ratingCount > 0 ? `${ratingAverage.toFixed(1)} (${ratingCount} reviews)` : 'No reviews yet'}
                            </button>
                        </div>

                        {/* Price - shows variant price when selected, or "From" when not */}
                        <div className="mb-6 pb-6 border-b">
                            {hasVariants && !isSelectionComplete ? (
                                <div>
                                    <span className="text-sm text-gray-500 mr-2">From</span>
                                    <span className="text-3xl font-bold">
                                        R {Number(effectivePrice || product.price).toLocaleString('en-ZA', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-3xl font-bold">
                                    R {Number(effectivePrice || product.price).toLocaleString('en-ZA', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </span>
                            )}                </div>

                        {/* Variant Selector */}
                        {hasVariants && optionTypes.length > 0 && (
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

                        {/* Description */}
                        {descriptionHtml && (
                            <div className="mb-8">
                                <h3 className="font-bold text-sm uppercase mb-3">Description</h3>
                                <div
                                    className="text-gray-600 leading-relaxed [&_a]:text-blue-600 [&_a:hover]:underline [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mb-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-6"
                                    dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                                />
                            </div>
                        )}

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
                                        disabled={!inStock || (hasVariants && !isSelectionComplete)}
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="font-medium text-lg">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(q => currentStock ? Math.min(currentStock, q + 1) : q + 1)}
                                        className="p-3 text-gray-500 hover:text-black hover:bg-gray-50 transition rounded-r-lg"
                                        disabled={!inStock || (currentStock && quantity >= currentStock) || (hasVariants && !isSelectionComplete)}
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={hasVariants ? (!isSelectionComplete || !isInStock) : !inStock}
                                    className="flex-1 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition py-4 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500"
                                >
                                    {hasVariants && !isSelectionComplete
                                        ? 'Select Options'
                                        : (inStock ? 'Add to Cart' : 'Out of Stock')
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

                        {/* Trust Signals - Custom Section or Default */}
                        {hasCustomTrustSection ? (
                            <SectionRenderer
                                sections={trustSections}
                                basePath={basePath}
                                products={products}
                                productsLoading={productsLoading}
                            />
                        ) : (
                            // Default trust signals
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
                        )}

                        {/* Inline Sections (Product Tabs, Accordions, etc.) */}
                        {inlineSections.length > 0 && (
                            <div className="mt-8">
                                <SectionRenderer
                                    sections={inlineSections}
                                    basePath={basePath}
                                    products={products}
                                    productsLoading={productsLoading}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <ProductReviews
                    productId={product.id}
                    ratingAverage={ratingAverage}
                    ratingCount={ratingCount}
                />

            </div>

            {/* Bottom Sections (Related Products, Newsletter) */}
            {bottomSections.length > 0 && (
                <SectionRenderer
                    sections={bottomSections}
                    basePath={basePath}
                    products={products}
                    productsLoading={productsLoading}
                />
            )}
        </div>
    );
}
