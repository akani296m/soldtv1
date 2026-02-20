import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumb navigation component for storefront pages
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of breadcrumb items: { label: string, path?: string }
 *   - Items with a path are clickable links
 *   - The last item (current page) typically has no path
 * @param {string} props.basePath - Base path for the merchant storefront (e.g., '/s/merchant-slug' or '')
 * @param {boolean} props.showHomeIcon - Whether to show home icon for the first item (default: true)
 */
export default function Breadcrumb({ items = [], basePath = '', showHomeIcon = true }) {
    if (!items || items.length === 0) return null;

    return (
        <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center flex-wrap gap-1 text-sm">
                {items.map((item, index) => {
                    const isFirst = index === 0;
                    const isLast = index === items.length - 1;
                    const hasLink = item.path !== undefined && item.path !== null;

                    return (
                        <li key={index} className="flex items-center">
                            {/* Separator (chevron) - shown before all items except the first */}
                            {!isFirst && (
                                <ChevronRight
                                    size={14}
                                    className="mx-2 text-gray-400 flex-shrink-0"
                                />
                            )}

                            {/* Breadcrumb item */}
                            {hasLink && !isLast ? (
                                <Link
                                    to={`${basePath}${item.path}`}
                                    className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    {isFirst && showHomeIcon && (
                                        <Home size={14} className="flex-shrink-0" />
                                    )}
                                    <span className="hover:underline">{item.label}</span>
                                </Link>
                            ) : (
                                <span
                                    className={`flex items-center gap-1.5 ${isLast
                                            ? 'text-gray-900 font-medium truncate max-w-[200px] sm:max-w-[300px]'
                                            : 'text-gray-500'
                                        }`}
                                    title={isLast ? item.label : undefined}
                                >
                                    {isFirst && showHomeIcon && (
                                        <Home size={14} className="flex-shrink-0" />
                                    )}
                                    {item.label}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
