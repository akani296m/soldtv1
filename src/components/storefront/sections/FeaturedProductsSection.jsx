import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Package } from 'lucide-react';
import ProductCard from '../../../storefront/components/ProductCard';

/**
 * Featured Products Section Component
 * Displays a grid of featured/trending products
 * 
 * @param {Object} settings - Section settings
 * @param {string} basePath - Base path for links
 * @param {Array} products - Optional products array (for storefront use)
 * @param {boolean} productsLoading - Optional loading state (for storefront use)
 */
export default function FeaturedProductsSection({
    settings = {},
    basePath = '/store',
    products: propProducts = null,
    productsLoading: propLoading = false
}) {
    const {
        title = 'Trending Now',
        subtitle = 'Our best-selling pieces this week.',
        product_count = 4,
        show_view_all = true,
        view_all_text = 'View All',
        collection = 'all', // For future: filter by collection
        layout = 'grid-4' // 'grid-4', 'grid-3', 'grid-2'
    } = settings;

    // Use provided products or empty array
    const products = propProducts || [];
    const loading = propLoading;

    // Filter for active products and limit by count
    const activeProducts = products.filter(p => p.is_active);
    const displayedProducts = activeProducts.slice(0, product_count);

    const gridClasses = {
        'grid-4': 'grid-cols-1 md:grid-cols-4',
        'grid-3': 'grid-cols-1 md:grid-cols-3',
        'grid-2': 'grid-cols-1 md:grid-cols-2'
    };

    return (
        <section className="py-20 max-w-7xl mx-auto px-6">
            {/* Header */}
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h2 className="text-3xl font-bold mb-2">{title}</h2>
                    {subtitle && <p className="text-gray-500">{subtitle}</p>}
                </div>
                {show_view_all && activeProducts.length > product_count && (
                    <Link
                        to={`${basePath}/products`}
                        className="hidden md:flex items-center gap-2 text-sm font-bold border-b border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition"
                    >
                        {view_all_text} <ArrowRight size={16} />
                    </Link>
                )}
            </div>

            {/* Products Grid */}
            {loading ? (
                // Loading skeleton
                <div className={`grid ${gridClasses[layout] || gridClasses['grid-4']} gap-8`}>
                    {[...Array(product_count)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="aspect-[3/4] bg-gray-200 mb-4 rounded-sm"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : displayedProducts.length === 0 ? (
                // Empty state
                <div className="text-center py-20 bg-gray-50 rounded-lg">
                    <Package className="mx-auto text-gray-300 mb-4" size={64} />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No Products Available Yet</h3>
                    <p className="text-gray-500">Check back soon for new arrivals!</p>
                </div>
            ) : (
                <div className={`grid ${gridClasses[layout] || gridClasses['grid-4']} gap-8`}>
                    {displayedProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            basePath={basePath}
                        />
                    ))}
                </div>
            )}

            {/* Mobile View All Button */}
            {!loading && show_view_all && activeProducts.length > product_count && (
                <div className="mt-8 md:hidden">
                    <Link
                        to={`${basePath}/products`}
                        className="block w-full text-center border border-gray-300 py-3 font-medium rounded"
                    >
                        View All Products
                    </Link>
                </div>
            )}
        </section>
    );
}

// Section metadata for the editor
FeaturedProductsSection.sectionMeta = {
    type: 'featured_products',
    name: 'Featured Products',
    description: 'Display a grid of featured or trending products',
    icon: 'Grid',
    defaultSettings: {
        title: 'Trending Now',
        subtitle: 'Our best-selling pieces this week.',
        product_count: 4,
        show_view_all: true,
        view_all_text: 'View All',
        collection: 'all',
        layout: 'grid-4'
    },
    settingsSchema: [
        { key: 'title', type: 'text', label: 'Section Title', placeholder: 'Trending Now' },
        { key: 'subtitle', type: 'text', label: 'Section Subtitle', placeholder: 'Optional description...' },
        { key: 'product_count', type: 'number', label: 'Number of Products', min: 1, max: 12 },
        { key: 'show_view_all', type: 'toggle', label: 'Show "View All" Button' },
        { key: 'view_all_text', type: 'text', label: 'Button Text', placeholder: 'View All' },
        {
            key: 'layout', type: 'select', label: 'Grid Layout', options: [
                { value: 'grid-4', label: '4 Columns' },
                { value: 'grid-3', label: '3 Columns' },
                { value: 'grid-2', label: '2 Columns' }
            ]
        }
    ]
};
