import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Catalog Header Section
 * Hero banner for the catalog/shop all products page
 */
export default function CatalogHeaderSection({ settings = {}, basePath = '/store' }) {
    const {
        title = 'Shop All Products',
        subtitle = 'Browse our complete collection',
        background_color = '#f9fafb',
        text_color = '#111827',
        show_breadcrumb = true
    } = settings;

    return (
        <section
            className="py-12 px-6"
            style={{ backgroundColor: background_color, color: text_color }}
        >
            <div className="max-w-7xl mx-auto">
                {show_breadcrumb && (
                    <nav className="text-sm mb-4">
                        <Link to={basePath} className="text-gray-500 hover:text-gray-700">
                            Home
                        </Link>
                        <span className="mx-2 text-gray-400">/</span>
                        <span>Shop</span>
                    </nav>
                )}
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
                {subtitle && (
                    <p className="text-gray-600">{subtitle}</p>
                )}
            </div>
        </section>
    );
}

// Section metadata
CatalogHeaderSection.sectionMeta = {
    type: 'catalog_header',
    name: 'Catalog Header',
    description: 'Header section for the catalog page with title and breadcrumbs',
    icon: 'LayoutList',
    pageTypes: ['catalog'], // Only available on catalog page
    defaultSettings: {
        title: 'Shop All Products',
        subtitle: 'Browse our complete collection',
        background_color: '#f9fafb',
        text_color: '#111827',
        show_breadcrumb: true
    },
    settingsSchema: [
        { key: 'title', type: 'text', label: 'Page Title', placeholder: 'Shop All Products' },
        { key: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Browse our complete collection' },
        { key: 'show_breadcrumb', type: 'toggle', label: 'Show Breadcrumbs' },
        { key: 'background_color', type: 'color', label: 'Background Color' },
        { key: 'text_color', type: 'color', label: 'Text Color' }
    ]
};
