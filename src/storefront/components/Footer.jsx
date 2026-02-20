import React from 'react';
import { Link } from 'react-router-dom';
import { FaXTwitter, FaLinkedin, FaInstagram, FaYoutube, FaPinterest } from 'react-icons/fa6';
import { getFooterBlockEnabled } from '../../lib/footerConfig';

const SOCIAL_ICON_MAP = {
    x: FaXTwitter,
    linkedin: FaLinkedin,
    instagram: FaInstagram,
    youtube: FaYoutube,
    pinterest: FaPinterest,
};

function isExternalUrl(path = '') {
    return /^https?:\/\//i.test(path) || path.startsWith('mailto:') || path.startsWith('tel:');
}

function toStorePath(basePath, path = '/') {
    if (isExternalUrl(path)) return path;
    if (path === '/') return basePath || '/';
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${basePath}${normalized}`;
}

function FooterNavLink({ basePath, path, children, className, style }) {
    if (isExternalUrl(path)) {
        return (
            <a href={path} target="_blank" rel="noopener noreferrer" className={className} style={style}>
                {children}
            </a>
        );
    }

    return (
        <Link to={toStorePath(basePath, path)} className={className} style={style}>
            {children}
        </Link>
    );
}

export default function Footer({
    storeName,
    logoUrl,
    basePath,
    footerConfig,
}) {
    const currentYear = new Date().getFullYear();
    const textColor = footerConfig?.style?.textColor || '#F9FAFB';
    const linkColor = footerConfig?.style?.linkColor || '#D1D5DB';
    const borderColor = footerConfig?.style?.borderColor || '#374151';
    const buttonBackground = footerConfig?.style?.buttonBackground || '#F9FAFB';
    const buttonText = footerConfig?.style?.buttonText || '#111827';
    const formElementBorder = footerConfig?.style?.formElementBorder || '#374151';

    const renderedCopyright = (footerConfig?.copyright?.text || '')
        .replace(/\{\{year\}\}/g, String(currentYear))
        .replace(/\{\{store_name\}\}/g, storeName);

    const showLinkGroups = getFooterBlockEnabled(footerConfig, 'link_groups');
    const showNewsletter = getFooterBlockEnabled(footerConfig, 'newsletter');
    const showSocial = getFooterBlockEnabled(footerConfig, 'social');
    const showLegal = getFooterBlockEnabled(footerConfig, 'legal');
    const showCopyright = getFooterBlockEnabled(footerConfig, 'copyright');

    const sortedGroups = (footerConfig?.linkGroups || [])
        .filter((group) => group.enabled !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const legalLinks = (footerConfig?.legal?.policyLinks || [])
        .filter((link) => link.enabled !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const socialLinks = (footerConfig?.social?.links || [])
        .filter((link) => link.enabled && link.url)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const footerLogo = footerConfig?.branding?.footerLogoUrl || logoUrl;
    const showFooterLogo = footerConfig?.branding?.showLogo !== false && !!footerLogo;

    return (
        <footer
            className="px-6 md:px-12 lg:px-20"
            style={{
                backgroundColor: footerConfig?.style?.backgroundColor || '#111827',
                color: textColor,
                paddingTop: 'var(--spacing-section)',
                paddingBottom: 'var(--spacing-card)',
            }}
        >
            <div className="mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 mb-12" style={{ maxWidth: 'var(--spacing-container)' }}>
                <div className="col-span-12 md:col-span-4 lg:col-span-3">
                    <div className="flex flex-col items-start gap-3">
                        {showFooterLogo ? (
                            <img src={footerLogo} alt={storeName} className="h-10 w-auto object-contain rounded" />
                        ) : (
                            <p className="font-bold tracking-wide uppercase">{storeName}</p>
                        )}
                    </div>
                </div>

                {showLinkGroups && (
                    <div className="col-span-12 md:col-span-8 lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedGroups.map((group) => (
                            <div key={group.id}>
                                <h3 className="font-semibold text-sm uppercase tracking-wider mb-3" style={{ color: textColor }}>{group.name}</h3>
                                <ul className="space-y-2">
                                    {(group.links || [])
                                        .filter((link) => link.enabled !== false)
                                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                        .map((link) => (
                                            <li key={link.id}>
                                                <FooterNavLink
                                                    basePath={basePath}
                                                    path={link.path}
                                                    className="text-sm transition-opacity hover:opacity-80"
                                                    style={{ color: linkColor }}
                                                >
                                                    {link.label}
                                                </FooterNavLink>
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}

                <div className="col-span-12 lg:col-span-3 space-y-5">
                    {showNewsletter && (
                        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                            <h3 className="font-semibold text-sm uppercase tracking-wider" style={{ color: textColor }}>
                                {footerConfig?.newsletter?.heading || 'Join our newsletter'}
                            </h3>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Your email"
                                    className="flex-1 px-3 py-2 text-sm bg-transparent border rounded-md focus:outline-none"
                                    style={{ borderColor: formElementBorder, color: textColor }}
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-semibold rounded-md"
                                    style={{ backgroundColor: buttonBackground, color: buttonText }}
                                >
                                    {footerConfig?.newsletter?.buttonText || 'Subscribe'}
                                </button>
                            </div>
                        </form>
                    )}

                    {showSocial && socialLinks.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-sm uppercase tracking-wider mb-3" style={{ color: textColor }}>Social</h3>
                            <div className="flex gap-2">
                                {socialLinks.map((social) => {
                                    const Icon = SOCIAL_ICON_MAP[social.id];
                                    if (!Icon) return null;
                                    return (
                                        <a
                                            key={social.id}
                                            href={social.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={social.label}
                                            className="p-2 rounded-full transition-opacity hover:opacity-80"
                                            style={{ border: `1px solid ${borderColor}` }}
                                        >
                                            <Icon size={16} />
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div
                className="mx-auto border-t pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                style={{ maxWidth: 'var(--spacing-container)', borderColor }}
            >
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {showLegal && legalLinks.map((link) => (
                        <FooterNavLink
                            key={link.id}
                            basePath={basePath}
                            path={link.path}
                            className="text-sm transition-opacity hover:opacity-80"
                            style={{ color: linkColor }}
                        >
                            {link.label}
                        </FooterNavLink>
                    ))}
                </div>

                {showCopyright && (
                    <p className="text-sm" style={{ color: linkColor }}>
                        {renderedCopyright}
                    </p>
                )}
            </div>
        </footer>
    );
}
