import { PAGE_TYPES, SECTION_ZONES, getSectionZone } from '../components/storefront/sections';

export const SECTION_ZONE_KEYS = {
    HEADER_ANNOUNCEMENT: 'header.announcement',
    HOME_MAIN: 'home.main',
    CATALOG_TOP: 'catalog.top',
    CATALOG_BOTTOM: 'catalog.bottom',
    PRODUCT_TOP: 'product.top',
    PRODUCT_INFO_TRUST: 'product.info.trust',
    PRODUCT_INFO_INLINE: 'product.info.inline',
    PRODUCT_BOTTOM: 'product.bottom'
};

const CATALOG_BOTTOM_TYPES = new Set(['newsletter', 'trust_badges']);

/**
 * Infer a canonical zone for a section when zone is missing (legacy rows/templates).
 */
export function inferSectionZone(pageType, sectionType) {
    if (sectionType === 'announcement_bar') {
        return SECTION_ZONE_KEYS.HEADER_ANNOUNCEMENT;
    }

    switch (pageType) {
        case PAGE_TYPES.CATALOG:
            if (sectionType === 'catalog_header') return SECTION_ZONE_KEYS.CATALOG_TOP;
            if (CATALOG_BOTTOM_TYPES.has(sectionType)) return SECTION_ZONE_KEYS.CATALOG_BOTTOM;
            return SECTION_ZONE_KEYS.CATALOG_TOP;
        case PAGE_TYPES.PRODUCT: {
            const productZone = getSectionZone(sectionType);
            if (productZone === SECTION_ZONES.TRUST) return SECTION_ZONE_KEYS.PRODUCT_INFO_TRUST;
            if (productZone === SECTION_ZONES.INLINE) return SECTION_ZONE_KEYS.PRODUCT_INFO_INLINE;
            return SECTION_ZONE_KEYS.PRODUCT_BOTTOM;
        }
        case PAGE_TYPES.HOME:
        default:
            return SECTION_ZONE_KEYS.HOME_MAIN;
    }
}

export function safeParseSectionSettings(rawSettings, sectionType, getDefaults) {
    if (!rawSettings) {
        return { settings: getDefaults(sectionType), parseError: false };
    }

    if (typeof rawSettings === 'object') {
        return { settings: rawSettings, parseError: false };
    }

    try {
        return { settings: JSON.parse(rawSettings), parseError: false };
    } catch (error) {
        console.error('[sectionZones] Invalid section settings, falling back to defaults:', error);
        return { settings: getDefaults(sectionType), parseError: true };
    }
}

export function normalizeSection(rawSection, pageType, getDefaults) {
    const { settings, parseError } = safeParseSectionSettings(rawSection.settings, rawSection.type, getDefaults);
    return {
        id: rawSection.id,
        type: rawSection.type,
        position: Number.isFinite(rawSection.position) ? rawSection.position : 0,
        visible: rawSection.visible !== false,
        settings,
        zone: rawSection.zone || inferSectionZone(pageType, rawSection.type),
        is_locked: !!rawSection.is_locked,
        settings_parse_error: parseError
    };
}

export function normalizeSections(rawSections, pageType, getDefaults) {
    return rawSections.map(section => normalizeSection(section, pageType, getDefaults));
}

export function sortSectionsByZoneAndPosition(sections) {
    return [...sections].sort((a, b) => {
        if (a.zone === b.zone) {
            return (a.position ?? 0) - (b.position ?? 0);
        }
        return (a.zone || '').localeCompare(b.zone || '');
    });
}

/**
 * Reindex section positions independently within each zone.
 */
export function normalizeZonePositions(sections) {
    const byZone = new Map();

    sortSectionsByZoneAndPosition(sections).forEach((section) => {
        const zone = section.zone || '';
        if (!byZone.has(zone)) {
            byZone.set(zone, []);
        }
        byZone.get(zone).push(section);
    });

    const normalized = [];
    byZone.forEach((zoneSections) => {
        zoneSections.forEach((section, index) => {
            normalized.push({
                ...section,
                position: index
            });
        });
    });

    return normalized;
}

export function reorderSectionsWithinZone(sections, zone, startIndex, endIndex) {
    const inZone = sections
        .filter(section => section.zone === zone)
        .sort((a, b) => a.position - b.position);

    const moving = inZone[startIndex];
    if (!moving) return sections;

    const reordered = [...inZone];
    reordered.splice(startIndex, 1);
    reordered.splice(endIndex, 0, moving);

    const updates = new Map(
        reordered.map((section, index) => [section.id, index])
    );

    const patched = sections.map((section) => {
        if (section.zone !== zone) return section;
        return {
            ...section,
            position: updates.get(section.id) ?? section.position
        };
    });

    return normalizeZonePositions(patched);
}

export function getSectionsForZone(sections, zone) {
    return sections
        .filter(section => section.zone === zone)
        .sort((a, b) => a.position - b.position);
}

export function getDefaultZoneForNewSection(pageType, sectionType) {
    return inferSectionZone(pageType, sectionType);
}
