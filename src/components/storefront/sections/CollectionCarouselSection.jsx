import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Package, FolderOpen } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

/**
 * Collection Carousel Section Component
 * Displays products from a selected collection in a scrollable carousel
 * 
 * @param {Object} settings - Section settings
 * @param {string} basePath - Base path for links
 * @param {string} merchantId - Merchant ID for fetching collection
 */
export default function CollectionCarouselSection({
    settings = {},
    basePath = '/store',
    merchantId = null
}) {
    const {
        title = 'Shop the Collection',
        subtitle = '',
        collection_id = null,
        show_collection_name = true,
        show_prices = true,
        show_navigation = true,
        items_per_view = 4,
        auto_scroll = false,
        scroll_interval = 5000
    } = settings;

    const [collection, setCollection] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scrollPosition, setScrollPosition] = useState(0);
    const carouselRef = useRef(null);
    const autoScrollRef = useRef(null);

    // Fetch collection and its products
    useEffect(() => {
        if (!collection_id) {
            setLoading(false);
            return;
        }

        const fetchCollection = async () => {
            try {
                setLoading(true);

                const { data, error } = await supabase
                    .from('collections')
                    .select(`
                        *,
                        collection_products (
                            id,
                            sort_order,
                            products (
                                id,
                                title,
                                price,
                                images,
                                is_active
                            )
                        )
                    `)
                    .eq('id', collection_id)
                    .eq('is_active', true)
                    .single();

                if (error) throw error;

                setCollection(data);

                // Extract and sort products
                const collectionProducts = data.collection_products
                    ?.map(cp => cp.products)
                    .filter(p => p && p.is_active)
                    .sort((a, b) => {
                        const sortA = data.collection_products.find(cp => cp.products.id === a.id)?.sort_order || 0;
                        const sortB = data.collection_products.find(cp => cp.products.id === b.id)?.sort_order || 0;
                        return sortA - sortB;
                    }) || [];

                setProducts(collectionProducts);
            } catch (err) {
                console.error('Error fetching collection:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCollection();
    }, [collection_id]);

    // Auto-scroll functionality
    useEffect(() => {
        if (auto_scroll && products.length > items_per_view) {
            autoScrollRef.current = setInterval(() => {
                scrollNext();
            }, scroll_interval);

            return () => {
                if (autoScrollRef.current) {
                    clearInterval(autoScrollRef.current);
                }
            };
        }
    }, [auto_scroll, scroll_interval, products.length, items_per_view]);

    // Helper to extract actual URL from nested objects
    const getImageUrl = (imageItem) => {
        if (!imageItem) return null;
        if (typeof imageItem === 'string') return imageItem;
        if (imageItem.url) return getImageUrl(imageItem.url);
        return null;
    };

    const scrollNext = () => {
        if (!carouselRef.current) return;
        const container = carouselRef.current;
        const itemWidth = container.scrollWidth / products.length;
        const maxScroll = container.scrollWidth - container.clientWidth;
        const nextPosition = Math.min(scrollPosition + itemWidth * items_per_view, maxScroll);

        container.scrollTo({ left: nextPosition, behavior: 'smooth' });
        setScrollPosition(nextPosition);
    };

    const scrollPrev = () => {
        if (!carouselRef.current) return;
        const container = carouselRef.current;
        const itemWidth = container.scrollWidth / products.length;
        const nextPosition = Math.max(scrollPosition - itemWidth * items_per_view, 0);

        container.scrollTo({ left: nextPosition, behavior: 'smooth' });
        setScrollPosition(nextPosition);
    };

    const handleScroll = () => {
        if (carouselRef.current) {
            setScrollPosition(carouselRef.current.scrollLeft);
        }
    };

    const canScrollLeft = scrollPosition > 0;
    const canScrollRight = carouselRef.current
        ? scrollPosition < carouselRef.current.scrollWidth - carouselRef.current.clientWidth - 10
        : false;

    // If no collection selected in editor
    if (!collection_id) {
        return (
            <section className="py-20 max-w-7xl mx-auto px-6">
                <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <FolderOpen className="mx-auto text-gray-300 mb-4" size={64} />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No Collection Selected</h3>
                    <p className="text-gray-500">Select a collection in the editor settings to display products</p>
                </div>
            </section>
        );
    }

    if (loading) {
        return (
            <section className="py-20 max-w-7xl mx-auto px-6">
                <div className="mb-10">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-4 gap-6">
                    {[...Array(items_per_view)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="aspect-[3/4] bg-gray-200 mb-4 rounded-sm"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (products.length === 0) {
        return (
            <section className="py-20 max-w-7xl mx-auto px-6">
                <div className="text-center py-20 bg-gray-50 rounded-lg">
                    <Package className="mx-auto text-gray-300 mb-4" size={64} />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                        Collection is Empty
                    </h3>
                    <p className="text-gray-500">
                        {collection?.name} doesn't have any products yet
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="py-20 max-w-7xl mx-auto px-6">
            {/* Header */}
            <div className="mb-10">
                <h2 className="text-3xl font-bold mb-2">
                    {show_collection_name && collection?.name ? collection.name : title}
                </h2>
                {subtitle && <p className="text-gray-500">{subtitle}</p>}
                {show_collection_name && collection?.description && !subtitle && (
                    <p className="text-gray-500">{collection.description}</p>
                )}
            </div>

            {/* Carousel Container */}
            <div className="relative group">
                {/* Navigation Buttons */}
                {show_navigation && (
                    <>
                        {canScrollLeft && (
                            <button
                                onClick={scrollPrev}
                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-lg rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
                                aria-label="Previous"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}
                        {canScrollRight && (
                            <button
                                onClick={scrollNext}
                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-lg rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
                                aria-label="Next"
                            >
                                <ChevronRight size={24} />
                            </button>
                        )}
                    </>
                )}

                {/* Carousel */}
                <div
                    ref={carouselRef}
                    onScroll={handleScroll}
                    className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {products.map((product) => {
                        const imageUrl = product.images && product.images[0]
                            ? getImageUrl(product.images[0])
                            : null;

                        return (
                            <Link
                                to={`${basePath}/product/${product.id}`}
                                key={product.id}
                                className="flex-shrink-0 group cursor-pointer"
                                style={{ width: `calc((100% - ${(items_per_view - 1) * 1.5}rem) / ${items_per_view})` }}
                            >
                                <div className="relative aspect-[3/4] bg-gray-100 mb-4 overflow-hidden rounded-sm">
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={product.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                            <Package className="text-gray-400" size={48} />
                                        </div>
                                    )}
                                    {/* Quick View Button */}
                                    <button className="absolute bottom-4 left-4 right-4 bg-white text-black py-3 font-medium text-sm opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                                        View Product
                                    </button>
                                </div>
                                <h3 className="font-medium text-gray-900 group-hover:text-gray-600 transition truncate">
                                    {product.title}
                                </h3>
                                {show_prices && (
                                    <p className="text-gray-500 mt-1">
                                        R {Number(product.price).toLocaleString('en-ZA', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </p>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Scroll Indicators (dots) */}
            {products.length > items_per_view && (
                <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: Math.ceil(products.length / items_per_view) }).map((_, index) => {
                        const isActive = scrollPosition >= (index * carouselRef.current?.scrollWidth / Math.ceil(products.length / items_per_view)) &&
                            scrollPosition < ((index + 1) * carouselRef.current?.scrollWidth / Math.ceil(products.length / items_per_view));
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    if (carouselRef.current) {
                                        const targetPosition = (index * carouselRef.current.scrollWidth) / Math.ceil(products.length / items_per_view);
                                        carouselRef.current.scrollTo({ left: targetPosition, behavior: 'smooth' });
                                        setScrollPosition(targetPosition);
                                    }
                                }}
                                className={`h-2 rounded-full transition-all ${isActive ? 'w-8 bg-black' : 'w-2 bg-gray-300'
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        );
                    })}
                </div>
            )}
        </section>
    );
}

// Section metadata for the editor
CollectionCarouselSection.sectionMeta = {
    type: 'collection_carousel',
    name: 'Collection Carousel',
    description: 'Display products from a collection in a scrollable carousel',
    icon: 'FolderOpen',
    defaultSettings: {
        title: 'Shop the Collection',
        subtitle: '',
        collection_id: null,
        show_collection_name: true,
        show_prices: true,
        show_navigation: true,
        items_per_view: 4,
        auto_scroll: false,
        scroll_interval: 5000
    },
    settingsSchema: [
        { key: 'title', type: 'text', label: 'Fallback Title', placeholder: 'Shop the Collection', helperText: 'Used when collection name is hidden' },
        { key: 'subtitle', type: 'text', label: 'Subtitle (Optional)', placeholder: 'Optional description...' },
        { key: 'collection_id', type: 'collection_select', label: 'Select Collection', required: true },
        { key: 'show_collection_name', type: 'toggle', label: 'Show Collection Name as Title' },
        { key: 'show_prices', type: 'toggle', label: 'Show Product Prices' },
        { key: 'show_navigation', type: 'toggle', label: 'Show Navigation Arrows' },
        {
            key: 'items_per_view',
            type: 'select',
            label: 'Items Per View',
            options: [
                { value: 2, label: '2 Items' },
                { value: 3, label: '3 Items' },
                { value: 4, label: '4 Items' },
                { value: 5, label: '5 Items' },
                { value: 6, label: '6 Items' }
            ]
        },
        { key: 'auto_scroll', type: 'toggle', label: 'Auto-Scroll Carousel' },
        { key: 'scroll_interval', type: 'number', label: 'Auto-Scroll Speed (ms)', min: 2000, max: 10000, step: 500, helperText: 'Time between auto-scrolls' }
    ]
};
