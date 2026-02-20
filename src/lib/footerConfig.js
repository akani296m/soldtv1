const DEFAULT_LINK_GROUPS = [
    {
        id: 'shop',
        name: 'Shop',
        enabled: true,
        order: 0,
        links: [
            { id: 'all_products', label: 'All Products', path: '/products', enabled: true, order: 0 },
            { id: 'new_arrivals', label: 'New Arrivals', path: '/products', enabled: true, order: 1 },
        ],
    },
    {
        id: 'support',
        name: 'Support',
        enabled: true,
        order: 1,
        links: [
            { id: 'shipping_policy', label: 'Shipping Policy', path: '/shipping-policy', enabled: true, order: 0 },
            { id: 'returns_policy', label: 'Returns Policy', path: '/returns', enabled: true, order: 1 },
            { id: 'faq', label: 'FAQ', path: '/faq', enabled: true, order: 2 },
        ],
    },
];

const DEFAULT_POLICY_LINKS = [
    { id: 'privacy', label: 'Privacy Policy', path: '/privacy-policy', enabled: true, order: 0 },
    { id: 'terms', label: 'Terms of Service', path: '/terms', enabled: true, order: 1 },
    { id: 'shipping', label: 'Shipping Policy', path: '/shipping-policy', enabled: true, order: 2 },
    { id: 'returns', label: 'Returns Policy', path: '/returns', enabled: true, order: 3 },
];

const DEFAULT_SOCIAL_LINKS = [
    { id: 'x', label: 'X', enabled: false, url: '', order: 0 },
    { id: 'linkedin', label: 'LinkedIn', enabled: false, url: '', order: 1 },
    { id: 'instagram', label: 'Instagram', enabled: false, url: '', order: 2 },
    { id: 'youtube', label: 'YouTube', enabled: false, url: '', order: 3 },
    { id: 'pinterest', label: 'Pinterest', enabled: false, url: '', order: 4 },
];

const DEFAULT_BLOCKS = [
    { type: 'link_groups', label: 'Link Groups', enabled: true, required: false, order: 0 },
    { type: 'newsletter', label: 'Newsletter Signup', enabled: true, required: false, order: 1 },
    { type: 'social', label: 'Social Media', enabled: true, required: false, order: 2 },
    { type: 'legal', label: 'Legal / Policies', enabled: true, required: true, order: 3 },
    { type: 'copyright', label: 'Copyright', enabled: true, required: true, order: 4 },
];

export const REQUIRED_FOOTER_BLOCK_TYPES = DEFAULT_BLOCKS
    .filter((block) => block.required)
    .map((block) => block.type);

export const DEFAULT_FOOTER_CONFIG = {
    branding: {
        showLogo: true,
        footerLogoUrl: '',
    },
    style: {
        backgroundColor: '#111827',
        accentBackground: '#1F2937',
        borderColor: '#374151',
        textColor: '#F9FAFB',
        buttonBackground: '#F9FAFB',
        buttonText: '#111827',
        linkColor: '#D1D5DB',
        formElementBorder: '#374151',
        errorColor: '#EF4444',
        salesPriceColor: '#10B981',
    },
    blocks: DEFAULT_BLOCKS,
    linkGroups: DEFAULT_LINK_GROUPS,
    legal: {
        policyLinks: DEFAULT_POLICY_LINKS,
    },
    newsletter: {
        heading: 'Join our newsletter',
        buttonText: 'Subscribe',
    },
    social: {
        links: DEFAULT_SOCIAL_LINKS,
    },
    copyright: {
        text: '© {{year}} {{store_name}}. All rights reserved.',
    },
};

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

export function createFooterId(prefix) {
    const random = Math.random().toString(36).slice(2, 8);
    return `${prefix}_${Date.now()}_${random}`;
}

function normalizeLinks(links = []) {
    if (!Array.isArray(links)) return [];
    return links.map((link, index) => ({
        id: link.id || createFooterId('link'),
        label: link.label || `Link ${index + 1}`,
        path: typeof link.path === 'string' ? link.path : '/',
        enabled: link.enabled !== false,
        order: Number.isFinite(link.order) ? link.order : index,
    }));
}

function migrateLegacyFooterItems(legacyItems = []) {
    if (!Array.isArray(legacyItems) || legacyItems.length === 0) {
        return clone(DEFAULT_LINK_GROUPS);
    }

    const groups = new Map();
    legacyItems.forEach((item, index) => {
        const groupName = (item.section || 'Other').trim() || 'Other';
        if (!groups.has(groupName)) {
            groups.set(groupName, {
                id: createFooterId('group'),
                name: groupName,
                enabled: true,
                order: groups.size,
                links: [],
            });
        }

        groups.get(groupName).links.push({
            id: item.id || createFooterId('link'),
            label: item.label || `Link ${index + 1}`,
            path: item.path || '/',
            enabled: item.enabled !== false,
            order: Number.isFinite(item.order) ? item.order : index,
        });
    });

    return Array.from(groups.values()).map((group, index) => ({
        ...group,
        order: index,
        links: group.links
            .sort((a, b) => a.order - b.order)
            .map((link, linkIndex) => ({ ...link, order: linkIndex })),
    }));
}

function mergeBlocks(blocks = []) {
    const byType = new Map(DEFAULT_BLOCKS.map((block) => [block.type, { ...block }]));
    if (Array.isArray(blocks)) {
        blocks.forEach((block, index) => {
            if (!block?.type || !byType.has(block.type)) return;
            const defaults = byType.get(block.type);
            byType.set(block.type, {
                ...defaults,
                enabled: block.enabled !== false,
                order: Number.isFinite(block.order) ? block.order : defaults.order ?? index,
            });
        });
    }

    return Array.from(byType.values())
        .sort((a, b) => a.order - b.order)
        .map((block, index) => ({
            ...block,
            enabled: block.required ? true : block.enabled,
            order: index,
        }));
}

export function getFooterBlockEnabled(config, blockType) {
    const block = config?.blocks?.find((entry) => entry.type === blockType);
    if (!block) return false;
    return block.required ? true : block.enabled !== false;
}

export function parseFooterConfig(menuConfig) {
    const base = clone(DEFAULT_FOOTER_CONFIG);
    let raw = menuConfig || {};
    if (typeof menuConfig === 'string') {
        try {
            raw = JSON.parse(menuConfig);
        } catch {
            raw = {};
        }
    }
    const footerConfig = raw.footer_config || raw.footerConfig || {};

    const linkGroups = Array.isArray(footerConfig.linkGroups) && footerConfig.linkGroups.length > 0
        ? footerConfig.linkGroups
        : migrateLegacyFooterItems(raw.footer);

    base.branding.showLogo = footerConfig?.branding?.showLogo !== false;
    base.branding.footerLogoUrl = footerConfig?.branding?.footerLogoUrl || '';

    base.style.backgroundColor = footerConfig?.style?.backgroundColor || base.style.backgroundColor;
    base.style.accentBackground = footerConfig?.style?.accentBackground || base.style.accentBackground;
    base.style.borderColor = footerConfig?.style?.borderColor || base.style.borderColor;
    base.style.textColor = footerConfig?.style?.textColor || base.style.textColor;
    base.style.buttonBackground = footerConfig?.style?.buttonBackground || base.style.buttonBackground;
    base.style.buttonText = footerConfig?.style?.buttonText || base.style.buttonText;
    base.style.linkColor = footerConfig?.style?.linkColor || base.style.linkColor;
    base.style.formElementBorder = footerConfig?.style?.formElementBorder || base.style.formElementBorder;
    base.style.errorColor = footerConfig?.style?.errorColor || base.style.errorColor;
    base.style.salesPriceColor = footerConfig?.style?.salesPriceColor || base.style.salesPriceColor;

    base.blocks = mergeBlocks(footerConfig?.blocks);

    base.linkGroups = [...linkGroups]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((group, index) => ({
            id: group.id || createFooterId('group'),
            name: group.name || `Group ${index + 1}`,
            enabled: group.enabled !== false,
            order: index,
            links: normalizeLinks(group.links)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((link, linkIndex) => ({ ...link, order: linkIndex })),
        }));

    base.legal.policyLinks = normalizeLinks(footerConfig?.legal?.policyLinks || base.legal.policyLinks)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((link, index) => ({ ...link, order: index }));

    base.newsletter.heading = footerConfig?.newsletter?.heading || base.newsletter.heading;
    base.newsletter.buttonText = footerConfig?.newsletter?.buttonText || base.newsletter.buttonText;

    base.social.links = (Array.isArray(footerConfig?.social?.links) ? footerConfig.social.links : base.social.links)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((item, index) => ({
            id: item.id || createFooterId('social'),
            label: item.label || `Social ${index + 1}`,
            enabled: item.enabled === true,
            url: item.url || '',
            order: index,
        }));

    base.copyright.text = footerConfig?.copyright?.text || base.copyright.text;

    return base;
}

export function buildLegacyFooterItemsFromConfig(config) {
    const groups = Array.isArray(config?.linkGroups) ? config.linkGroups : [];

    return groups
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .flatMap((group) => {
            const sectionName = group.name || 'Other';
            return (group.links || [])
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((link, index) => ({
                    id: link.id || createFooterId('link'),
                    label: link.label || `Link ${index + 1}`,
                    section: sectionName,
                    path: link.path || '/',
                    enabled: link.enabled !== false,
                    order: Number.isFinite(link.order) ? link.order : index,
                }));
        });
}
