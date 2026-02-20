/**
 * Header Component with Variants
 * Renders different header layouts based on theme settings
 * Uses variant prop instead of separate components to reduce duplication
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Logo Component
 */
function Logo({ storeName, logoUrl, basePath }) {
    return (
        <Link
            to={basePath || '/'}
            className="text-xl font-bold tracking-widest uppercase"
            style={{ color: 'var(--color-text)' }}
        >
            {logoUrl ? (
                <img
                    src={logoUrl}
                    alt={storeName}
                    className="h-8 max-w-[150px] object-contain"
                />
            ) : (
                <>
                    {storeName}
                    <span style={{ color: 'var(--color-text-muted)' }}>.</span>
                </>
            )}
        </Link>
    );
}

/**
 * Navigation Links Component
 */
function NavLinks({ headerItems, basePath, className = '' }) {
    return (
        <div className={`hidden md:flex items-center space-x-8 text-sm font-medium ${className}`}>
            {headerItems.map((item) => (
                <Link
                    key={item.id}
                    to={`${basePath}${item.path === '/' ? '' : item.path}`}
                    className="transition-opacity hover:opacity-70"
                    style={{ color: 'var(--color-text)' }}
                >
                    {item.label}
                </Link>
            ))}
        </div>
    );
}

/**
 * Cart Icon SVG Component
 */
function CartIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--color-text)' }}
        >
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
    );
}

/**
 * Header Actions Component (search, cart, mobile menu toggle)
 */
function HeaderActions({ basePath, cartCount, mobileMenuOpen, onToggleMenu }) {
    return (
        <div className="flex items-center space-x-6">
            <button
                className="transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-text)' }}
                aria-label="Search"
            >
                <Search size={20} />
            </button>
            <Link
                to={`${basePath}/cart`}
                className="relative transition-opacity hover:opacity-70"
                aria-label={`Cart with ${cartCount} items`}
            >
                <CartIcon />
                {cartCount > 0 && (
                    <span
                        className="absolute -top-2 -right-2 w-5 h-5 text-xs font-bold rounded-full flex items-center justify-center"
                        style={{
                            backgroundColor: 'var(--color-primary)',
                            color: 'var(--color-background)'
                        }}
                    >
                        {cartCount > 99 ? '99+' : cartCount}
                    </span>
                )}
            </Link>

            {/* Mobile menu toggle */}
            <button
                className="md:hidden transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-text)' }}
                onClick={onToggleMenu}
                aria-label="Toggle menu"
            >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>
    );
}

/**
 * Mobile Menu Component
 */
function MobileMenu({ isOpen, headerItems, basePath, onClose }) {
    if (!isOpen) return null;

    return (
        <div
            className="md:hidden absolute top-full left-0 right-0 border-b"
            style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)'
            }}
        >
            <div className="px-6 py-4 space-y-4">
                {headerItems.map((item) => (
                    <Link
                        key={item.id}
                        to={`${basePath}${item.path === '/' ? '' : item.path}`}
                        className="block py-2 text-sm font-medium transition-opacity hover:opacity-70"
                        style={{ color: 'var(--color-text)' }}
                        onClick={onClose}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}

/**
 * Header Component
 * Supports three layout variants: minimal, centered, split
 * 
 * @param {Object} props
 * @param {string} props.storeName - Store display name
 * @param {string} props.logoUrl - Logo image URL
 * @param {string} props.basePath - Base path for links
 * @param {Array} props.headerItems - Navigation menu items
 * @param {number} props.cartCount - Number of items in cart
 * @param {string} props.variant - Override variant (optional, uses theme default)
 */
export default function Header({
    storeName,
    logoUrl,
    basePath,
    headerItems = [],
    cartCount = 0,
    variant: variantProp,
}) {
    const { headerVariant: contextVariant } = useTheme();
    const variant = variantProp || contextVariant;

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleToggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);
    const handleCloseMenu = () => setMobileMenuOpen(false);

    // Common props for sub-components
    const logoProps = { storeName, logoUrl, basePath };
    const navProps = { headerItems, basePath };
    const actionsProps = { basePath, cartCount, mobileMenuOpen, onToggleMenu: handleToggleMenu };
    const mobileMenuProps = { isOpen: mobileMenuOpen, headerItems, basePath, onClose: handleCloseMenu };

    // ===== VARIANT LAYOUTS =====

    const variants = {
        // Minimal: Logo left, nav center-ish, actions right
        minimal: (
            <nav
                className="sticky top-0 z-50 backdrop-blur-md border-b relative"
                style={{
                    backgroundColor: 'rgba(var(--color-surface-rgb), 0.85)',
                    borderColor: 'var(--color-border)'
                }}
            >
                <div
                    className="mx-auto px-6 h-16 flex items-center justify-between"
                    style={{ maxWidth: 'var(--spacing-container)' }}
                >
                    <Logo {...logoProps} />
                    <NavLinks {...navProps} />
                    <HeaderActions {...actionsProps} />
                </div>
                <MobileMenu {...mobileMenuProps} />
            </nav>
        ),

        // Centered: Logo centered top row, nav centered below
        centered: (
            <nav
                className="sticky top-0 z-50 backdrop-blur-md border-b relative"
                style={{
                    backgroundColor: 'rgba(var(--color-surface-rgb), 0.85)',
                    borderColor: 'var(--color-border)'
                }}
            >
                <div
                    className="mx-auto px-6"
                    style={{ maxWidth: 'var(--spacing-container)' }}
                >
                    {/* Top row: Actions left, Logo center, Cart right */}
                    <div className="h-16 flex items-center justify-center relative">
                        <div className="absolute left-0">
                            <button
                                className="transition-opacity hover:opacity-70"
                                style={{ color: 'var(--color-text)' }}
                                aria-label="Search"
                            >
                                <Search size={20} />
                            </button>
                        </div>
                        <Logo {...logoProps} />
                        <div className="absolute right-0">
                            <HeaderActions {...actionsProps} />
                        </div>
                    </div>
                    {/* Bottom row: Nav centered */}
                    <div
                        className="hidden md:flex h-12 items-center justify-center border-t"
                        style={{ borderColor: 'var(--color-border)' }}
                    >
                        <NavLinks {...navProps} />
                    </div>
                </div>
                <MobileMenu {...mobileMenuProps} />
            </nav>
        ),

        // Split: Nav left, Logo center, Actions right
        split: (
            <nav
                className="sticky top-0 z-50 backdrop-blur-md border-b relative"
                style={{
                    backgroundColor: 'rgba(var(--color-surface-rgb), 0.85)',
                    borderColor: 'var(--color-border)'
                }}
            >
                <div
                    className="mx-auto px-6 h-16 flex items-center justify-between"
                    style={{ maxWidth: 'var(--spacing-container)' }}
                >
                    <NavLinks {...navProps} className="flex-1" />
                    <div className="flex-shrink-0 px-8">
                        <Logo {...logoProps} />
                    </div>
                    <div className="flex-1 flex justify-end">
                        <HeaderActions {...actionsProps} />
                    </div>
                </div>
                <MobileMenu {...mobileMenuProps} />
            </nav>
        ),
    };

    return variants[variant] || variants.minimal;
}
