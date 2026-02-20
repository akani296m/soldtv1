import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Package, Loader2 } from 'lucide-react';
import { useMerchantProducts } from '../hooks/useMerchantProducts';
import { useMerchant } from '../context/MerchantContext';
import { useSections } from '../../hooks/useSections';
import SectionRenderer from '../../components/storefront/SectionRenderer';
import { PAGE_TYPES } from '../../components/storefront/sections';
import { SECTION_ZONE_KEYS } from '../../lib/sectionZones';
import ProductCard from '../components/ProductCard';
import { richTextToPlainText } from '../../lib/richText';

export default function Catalog() {
    const { merchantSlug } = useParams();
    const { merchant, isCustomDomain, loading: merchantLoading } = useMerchant();
    const { products, loading: productsLoading } = useMerchantProducts();

    // Fetch catalog-specific sections
    const { sections, loading: sectionsLoading } = useSections(merchant?.id, PAGE_TYPES.CATALOG);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [showFilters, setShowFilters] = useState(false);

    // Base path for this merchant's storefront
    const basePath = isCustomDomain ? '' : `/s/${merchantSlug}`;

    // Update document title with store name
    useEffect(() => {
        if (!merchant) return;
        const storeName = merchant.store_name || merchant.business_name || 'Store';
        document.title = `Products | ${storeName}`;
    }, [merchant]);

    // Get all unique categories from products
    const categories = useMemo(() => {
        const cats = new Set();
        products.forEach(product => {
            if (product.category) {
                cats.add(product.category);
            }
        });
        return Array.from(cats).sort();
    }, [products]);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let filtered = products.filter(p => p.is_active);

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(product =>
                product.title?.toLowerCase().includes(query) ||
                richTextToPlainText(product.description).toLowerCase().includes(query) ||
                (Array.isArray(product.tags) && product.tags.some(tag => tag.toLowerCase().includes(query)))
            );
        }

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(product => product.category === selectedCategory);
        }

        const sorted = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'price-low':
                    return (a.price || 0) - (b.price || 0);
                case 'price-high':
                    return (b.price || 0) - (a.price || 0);
                case 'name-asc':
                    return (a.title || '').localeCompare(b.title || '');
                case 'name-desc':
                    return (b.title || '').localeCompare(a.title || '');
                case 'newest':
                default:
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            }
        });

        return sorted;
    }, [products, searchQuery, selectedCategory, sortBy]);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setSortBy('newest');
    };

    const hasActiveFilters = searchQuery || selectedCategory !== 'all' || sortBy !== 'newest';

    // Loading state
    if (merchantLoading || sectionsLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={48} className="animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Loading catalog...</p>
                </div>
            </div>
        );
    }

    // Zone-based section buckets
    const topSections = sections.filter(s =>
        s.visible && s.zone === SECTION_ZONE_KEYS.CATALOG_TOP
    );

    const bottomSections = sections.filter(s =>
        s.visible && s.zone === SECTION_ZONE_KEYS.CATALOG_BOTTOM
    );

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Top Sections (Header, Banners) */}
            {topSections.length > 0 && (
                <SectionRenderer
                    sections={topSections}
                    basePath={basePath}
                    products={products}
                    productsLoading={productsLoading}
                />
            )}

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Fallback Header if no catalog_header section */}
                {!sections.some(s => s.type === 'catalog_header' && s.visible) && (
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Shop All Products</h1>
                        <p className="text-gray-600">
                            {productsLoading ? 'Loading products...' : `${filteredProducts.length} products available`}
                        </p>
                    </div>
                )}

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search Bar */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        {/* Filter Toggle (Mobile) */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="md:hidden flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                            <SlidersHorizontal size={20} />
                            Filters
                            {hasActiveFilters && (
                                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            )}
                        </button>

                        {/* Category Filter (Desktop) */}
                        <div className="hidden md:block min-w-[200px]">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white cursor-pointer"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sort (Desktop) */}
                        <div className="hidden md:block min-w-[200px]">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white cursor-pointer"
                            >
                                <option value="newest">Newest First</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="name-asc">Name: A to Z</option>
                                <option value="name-desc">Name: Z to A</option>
                            </select>
                        </div>
                    </div>

                    {/* Mobile Filters Dropdown */}
                    {showFilters && (
                        <div className="md:hidden mt-4 pt-4 border-t space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="name-asc">Name: A to Z</option>
                                    <option value="name-desc">Name: Z to A</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Active Filters */}
                    {hasActiveFilters && (
                        <div className="mt-4 flex items-center gap-3 flex-wrap">
                            <span className="text-sm text-gray-600">Active filters:</span>
                            {searchQuery && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                    Search: "{searchQuery}"
                                    <button onClick={() => setSearchQuery('')} className="hover:text-blue-600">
                                        <X size={14} />
                                    </button>
                                </span>
                            )}
                            {selectedCategory !== 'all' && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                    Category: {selectedCategory}
                                    <button onClick={() => setSelectedCategory('all')} className="hover:text-blue-600">
                                        <X size={14} />
                                    </button>
                                </span>
                            )}
                            {sortBy !== 'newest' && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                    Sort: {sortBy}
                                    <button onClick={() => setSortBy('newest')} className="hover:text-blue-600">
                                        <X size={14} />
                                    </button>
                                </span>
                            )}
                            <button
                                onClick={clearFilters}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                {/* Loading State */}
                {productsLoading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                    </div>
                )}

                {/* Empty State */}
                {!productsLoading && filteredProducts.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-lg">
                        <Package className="mx-auto text-gray-300 mb-4" size={80} strokeWidth={1.5} />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {hasActiveFilters ? 'No products found' : 'No products available'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {hasActiveFilters
                                ? 'Try adjusting your filters to see more results.'
                                : 'Check back soon for new products!'}
                        </p>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                )}

                {/* Product Grid */}
                {!productsLoading && filteredProducts.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                basePath={basePath}
                            />
                        ))}
                    </div>
                )}

                {/* Results Count */}
                {!productsLoading && filteredProducts.length > 0 && (
                    <div className="mt-8 text-center text-sm text-gray-500">
                        Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                    </div>
                )}
            </div>

            {/* Bottom Sections (Newsletter, Trust Badges) */}
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
