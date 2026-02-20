import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Package } from 'lucide-react';

/**
 * Related Products Section
 * Shows related products on the product detail page
 */
export default function RelatedProductsSection({
    settings = {},
    basePath = '/store',
    products = [],
    productsLoading = false
}) {
    const {
        title = 'You May Also Like',
        subtitle = '',
        product_count = 4,
        show_view_all = true,
        layout = 'grid-4'
    } = settings;

    // Helper to extract actual URL from nested objects
    const getImageUrl = (imageItem) => {
        if (!imageItem) return null;
        if (typeof imageItem === 'string') return imageItem;
        if (imageItem.url) return getImageUrl(imageItem.url);
        return null;
    };

    const activeProducts = products.filter(p => p.is_active);
    const displayedProducts = activeProducts.slice(0, product_count);

    const gridClasses = {
        'grid-4': 'grid-cols-2 md:grid-cols-4',
        'grid-3': 'grid-cols-2 md:grid-cols-3',
        'grid-2': 'grid-cols-1 md:grid-cols-2'
    };

    if (productsLoading) {
        return (
            <section className="py-12 border-t">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-2xl font-bold mb-6">{title}</h2>
                    <div className={`grid ${gridClasses[layout]} gap-6`}>
                        {[...Array(product_count)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (displayedProducts.length === 0) {
        return null; // Don't show section if no products
    }

    return (
        <section className="py-12 border-t">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-2xl font-bold">{title}</h2>
                        {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
                    </div>
                    {show_view_all && activeProducts.length > product_count && (
                        <Link
                            to={`${basePath}/products`}
                            className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
                        >
                            View All <ArrowRight size={16} />
                        </Link>
                    )}
                </div>

                {/* Products Grid */}
                <div className={`grid ${gridClasses[layout]} gap-6`}>
                    {displayedProducts.map((product) => {
                        const imageUrl = product.images?.[0] ? getImageUrl(product.images[0]) : null;

                        return (
                            <Link
                                to={`${basePath}/product/${product.id}`}
                                key={product.id}
                                className="group"
                            >
                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={product.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="text-gray-300" size={40} />
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-medium text-gray-900 group-hover:text-gray-600 transition line-clamp-1">
                                    {product.title}
                                </h3>
                                <p className="text-gray-500 text-sm mt-1">
                                    R {Number(product.price).toLocaleString('en-ZA', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// Section metadata
RelatedProductsSection.sectionMeta = {
    type: 'related_products',
    name: 'Related Products',
    description: 'Grid of related products for product detail pages',
    icon: 'Grid',
    pageTypes: ['product'], // Only available on product page
    zone: 'bottom', // Renders as full-width section at the bottom
    defaultSettings: {
        title: 'You May Also Like',
        subtitle: '',
        product_count: 4,
        show_view_all: true,
        layout: 'grid-4'
    },
    settingsSchema: [
        { key: 'title', type: 'text', label: 'Section Title', placeholder: 'You May Also Like' },
        { key: 'subtitle', type: 'text', label: 'Subtitle (optional)', placeholder: '' },
        { key: 'product_count', type: 'number', label: 'Number of Products', min: 2, max: 8 },
        { key: 'show_view_all', type: 'toggle', label: 'Show "View All" Link' },
        {
            key: 'layout', type: 'select', label: 'Grid Layout', options: [
                { value: 'grid-4', label: '4 Columns' },
                { value: 'grid-3', label: '3 Columns' },
                { value: 'grid-2', label: '2 Columns' }
            ]
        }
    ]
};
