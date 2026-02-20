import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Star } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { richTextToPlainText } from '../../lib/richText';

function getImageUrl(imageItem) {
    if (!imageItem) return null;
    if (typeof imageItem === 'string') return imageItem;
    if (imageItem.url) return getImageUrl(imageItem.url);
    return null;
}

function formatPrice(price, priceFormat = 'default') {
    const formatted = `R ${Number(price || 0).toLocaleString('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
    return priceFormat === 'fromPrice' ? `From ${formatted}` : formatted;
}

function lineClampStyle(lines = 2) {
    return {
        display: '-webkit-box',
        WebkitLineClamp: String(lines),
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
    };
}

function StarRating({ average = 0, count = 0 }) {
    const normalizedAverage = Number.isFinite(average) ? Math.max(0, Math.min(5, average)) : 0;
    const hasReviews = count > 0;

    return (
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <div className="flex items-center gap-0.5">
                {[0, 1, 2, 3, 4].map((index) => {
                    const isFilled = index < Math.round(normalizedAverage);
                    return (
                        <Star
                            key={index}
                            size={12}
                            className={isFilled ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}
                        />
                    );
                })}
            </div>
            {hasReviews ? (
                <span>{normalizedAverage.toFixed(1)} ({count})</span>
            ) : (
                <span>No reviews</span>
            )}
        </div>
    );
}

export default function ProductCard({
    product,
    basePath,
    variant: variantProp,
}) {
    const { productCardVariant: contextVariant, theme } = useTheme();
    const variant = variantProp || contextVariant;

    const cardSettings = {
        imageAspectRatio: theme?.productCard?.imageAspectRatio || '3:4',
        showCategory: theme?.productCard?.showCategory ?? true,
        showBadges: theme?.productCard?.showBadges ?? true,
        showDescription: theme?.productCard?.showDescription ?? true,
        showTags: theme?.productCard?.showTags ?? true,
        titleTruncation: Number(theme?.productCard?.titleTruncation || 2),
        priceFormat: theme?.productCard?.priceFormat || 'default',
        hoverEffect: theme?.productCard?.hoverEffect || 'quickView',
    };

    const imageUrl = product.images?.[0] ? getImageUrl(product.images[0]) : null;
    const productPath = `${basePath}/product/${product.id}`;
    const inStock = product.inventory === null || product.inventory > 0;
    const lowStock = product.inventory !== null && product.inventory > 0 && product.inventory <= 5;
    const ratingAverage = Number(product.rating_average || 0);
    const ratingCount = Number(product.rating_count || 0);
    const descriptionText = richTextToPlainText(product.description);

    const aspectClasses = {
        '1:1': 'aspect-square',
        '3:4': 'aspect-[3/4]',
        '4:5': 'aspect-[4/5]',
    };

    const cardVariantClasses = {
        default: 'group overflow-hidden block transition-shadow hover:shadow-lg',
        overlay: 'group overflow-hidden block transition-transform hover:-translate-y-0.5',
        minimal: 'group overflow-hidden block',
    };

    return (
        <Link
            to={productPath}
            className={cardVariantClasses[variant] || cardVariantClasses.default}
            style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: variant === 'minimal' ? 'none' : 'var(--shadow-sm)'
            }}
        >
            <div className={`relative ${aspectClasses[cardSettings.imageAspectRatio] || 'aspect-[3/4]'} overflow-hidden`}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={product.title}
                        className={`w-full h-full object-cover ${cardSettings.hoverEffect === 'zoom' || cardSettings.hoverEffect === 'quickView' ? 'transition-transform duration-700 group-hover:scale-105' : ''}`}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
                        <Package size={48} style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                )}

                {cardSettings.showBadges && lowStock && (
                    <span
                        className="absolute top-3 left-3 px-2 py-1 text-xs font-bold rounded"
                        style={{ backgroundColor: 'var(--color-warning)', color: '#fff' }}
                    >
                        Only {product.inventory} left
                    </span>
                )}

                {cardSettings.showBadges && !inStock && (
                    <span
                        className="absolute top-3 left-3 px-2 py-1 text-xs font-bold rounded"
                        style={{ backgroundColor: 'var(--color-error)', color: '#fff' }}
                    >
                        Out of Stock
                    </span>
                )}

                {cardSettings.hoverEffect === 'quickView' && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                        <span
                            className="px-4 py-2 text-sm font-medium shadow-lg"
                            style={{
                                backgroundColor: 'var(--color-background)',
                                color: 'var(--color-text)',
                                borderRadius: 'var(--radius-md)'
                            }}
                        >
                            Quick View
                        </span>
                    </div>
                )}
            </div>

            <div style={{ padding: 'var(--spacing-card)' }}>
                {cardSettings.showCategory && product.category && (
                    <span
                        className="text-xs uppercase tracking-wider"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        {product.category}
                    </span>
                )}

                <h3
                    className="font-semibold mt-1 mb-2 transition-colors group-hover:opacity-70"
                    style={{ color: 'var(--color-text)', ...lineClampStyle(cardSettings.titleTruncation) }}
                >
                    {product.title}
                </h3>

                {cardSettings.showDescription && descriptionText && (
                    <p
                        className="text-sm mb-3"
                        style={{ color: 'var(--color-text-muted)', ...lineClampStyle(2) }}
                    >
                        {descriptionText}
                    </p>
                )}

                <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                        {formatPrice(product.price, cardSettings.priceFormat)}
                    </span>
                    {inStock && !lowStock && (
                        <span className="text-xs font-medium" style={{ color: 'var(--color-success)' }}>
                            In Stock
                        </span>
                    )}
                </div>

                <div className="mb-3">
                    <StarRating average={ratingAverage} count={ratingCount} />
                </div>

                <div
                    className="w-full text-center text-sm font-medium py-2 px-3"
                    style={{
                        backgroundColor: 'var(--color-background)',
                        color: 'var(--color-text)',
                        borderRadius: 'var(--radius-md)'
                    }}
                >
                    View Product
                </div>

                {cardSettings.showTags && Array.isArray(product.tags) && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                        {product.tags.slice(0, 3).map((tag, idx) => (
                            <span
                                key={`${product.id}-tag-${idx}`}
                                className="px-2 py-1 text-xs"
                                style={{
                                    backgroundColor: 'var(--color-background)',
                                    color: 'var(--color-text-muted)',
                                    borderRadius: 'var(--radius-sm)'
                                }}
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
}
