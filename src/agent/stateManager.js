/**
 * State Manager
 * 
 * Manages the canonical StoreState object.
 * - Converts database models → StoreState (for Claude to see)
 * - Applies actions → StoreState mutations
 * - Converts StoreState → database updates
 * 
 * Claude NEVER sees the database directly.
 * Claude ONLY sees the StoreState JSON snapshot.
 */

import { supabase } from '../lib/supabase';
import { getSectionDefaults, SECTION_TYPES as SECTION_COMPONENTS } from '../components/storefront/sections';

/**
 * Generate a UUID v4
 */
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

/**
 * Create an empty StoreState
 * @returns {Object} Empty StoreState
 */
export function createEmptyStoreState() {
    return {
        brand: {
            name: '',
            category: '',
            tone: 'minimal',
            tagline: '',
        },
        products: [],
        homepage: {
            hero: {
                headline: '',
                subheadline: '',
                cta_text: 'Shop Now',
                cta_link: '/products',
                image: '',
                layout: 'centered',
            },
            sections: [],
            template: 'default',
        },
        assets: [],
        meta: {
            merchant_id: '',
            last_updated: new Date().toISOString(),
        },
    };
}

/**
 * Load StoreState from database for a merchant
 * @param {string} merchantId - The merchant's ID
 * @returns {Promise<Object>} The StoreState object
 */
export async function loadStoreState(merchantId) {
    const state = createEmptyStoreState();
    state.meta.merchant_id = merchantId;

    try {
        // Load merchant info (brand)
        const { data: merchant, error: merchantError } = await supabase
            .from('merchants')
            .select('*')
            .eq('id', merchantId)
            .single();

        if (merchantError) throw merchantError;

        if (merchant) {
            state.brand = {
                name: merchant.store_name || merchant.business_name || '',
                category: merchant.category || '',
                tone: merchant.brand_tone || 'minimal',
                tagline: merchant.tagline || '',
            };
        }

        // Load products
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*')
            .eq('merchant_id', merchantId)
            .order('created_at', { ascending: false });

        if (productsError) throw productsError;

        state.products = (products || []).map(p => ({
            id: p.id,
            title: p.title || '',
            price: p.price || 0,
            description: p.description || '',
            category: p.category || '',
            inventory: p.inventory || 0,
            images: extractImageLabels(p.images),
            tags: p.tags || [],
            is_active: p.is_active !== false,
        }));

        // Load homepage sections
        const { data: sections, error: sectionsError } = await supabase
            .from('storefront_sections')
            .select('*')
            .eq('merchant_id', merchantId)
            .eq('page_type', 'home')
            .order('position', { ascending: true });

        if (sectionsError) throw sectionsError;

        // Find hero section and extract its settings
        const heroSection = (sections || []).find(s => s.section_type === 'hero');
        if (heroSection) {
            const settings = typeof heroSection.settings === 'string'
                ? JSON.parse(heroSection.settings)
                : heroSection.settings || {};

            state.homepage.hero = {
                headline: settings.title || '',
                subheadline: settings.subtitle || '',
                cta_text: settings.button_text || 'Shop Now',
                cta_link: settings.button_link || '/products',
                image: settings.background_image || '',
                layout: settings.layout || 'centered',
            };
        }

        // Map all sections to simplified format
        state.homepage.sections = (sections || []).map(s => {
            const settings = typeof s.settings === 'string'
                ? JSON.parse(s.settings)
                : s.settings || {};

            return {
                id: s.id,
                type: s.section_type,
                position: s.position,
                visible: s.is_visible,
                settings: simplifySettings(s.section_type, settings),
            };
        });

        // Generate asset list from product images and hero
        state.assets = generateAssetList(state);

        state.meta.last_updated = new Date().toISOString();

    } catch (error) {
        console.error('[StateManager] Error loading state:', error);
        throw error;
    }

    return state;
}

/**
 * Extract image labels from product images array
 * @param {any[]} images - Product images (can be URLs, objects, etc.)
 * @returns {string[]} Array of image labels
 */
function extractImageLabels(images) {
    if (!images || !Array.isArray(images)) return [];

    return images.map((img, index) => {
        if (typeof img === 'string') {
            // Extract filename from URL
            const filename = img.split('/').pop()?.split('?')[0] || `image-${index + 1}`;
            return filename;
        }
        if (img && typeof img === 'object') {
            return img.label || img.name || img.url?.split('/').pop() || `image-${index + 1}`;
        }
        return `image-${index + 1}`;
    });
}

/**
 * Simplify section settings for Claude (remove complex nested objects)
 * @param {string} sectionType - The section type
 * @param {Object} settings - Full settings object
 * @returns {Object} Simplified settings
 */
function simplifySettings(sectionType, settings) {
    // For now, pass through key settings based on type
    const simplified = {};

    switch (sectionType) {
        case 'hero':
            simplified.headline = settings.title || '';
            simplified.subheadline = settings.subtitle || '';
            simplified.cta_text = settings.button_text || '';
            simplified.cta_link = settings.button_link || '';
            simplified.layout = settings.layout || 'centered';
            break;

        case 'featured_products':
            simplified.title = settings.title || '';
            simplified.subtitle = settings.subtitle || '';
            simplified.product_count = settings.productCount || 4;
            break;

        case 'newsletter':
            simplified.title = settings.title || '';
            simplified.subtitle = settings.subtitle || '';
            simplified.button_text = settings.button_text || '';
            break;

        case 'rich_text':
            simplified.content = settings.content || '';
            simplified.alignment = settings.alignment || 'center';
            break;

        case 'announcement_bar':
            simplified.message = settings.text || '';
            simplified.link = settings.link || '';
            break;

        default:
            // For other types, just pass key string values
            Object.entries(settings).forEach(([key, value]) => {
                if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                    simplified[key] = value;
                }
            });
    }

    return simplified;
}

/**
 * Generate asset list from store state
 * @param {Object} state - The StoreState
 * @returns {Object[]} Array of ImageAsset objects
 */
function generateAssetList(state) {
    const assets = [];
    let assetIndex = 1;

    // Add hero image
    if (state.homepage.hero.image) {
        assets.push({
            id: `asset_hero`,
            label: state.homepage.hero.image.split('/').pop() || 'hero-image',
            url: state.homepage.hero.image,
            description: 'Homepage hero background',
        });
    }

    // Add product images
    state.products.forEach(product => {
        product.images.forEach((imgLabel, imgIndex) => {
            assets.push({
                id: `asset_${assetIndex++}`,
                label: imgLabel,
                description: `${product.title} - Image ${imgIndex + 1}`,
            });
        });
    });

    return assets;
}

/**
 * Serialize StoreState to a compressed string for Claude
 * @param {Object} state - The StoreState
 * @returns {string} JSON string
 */
export function serializeState(state) {
    return JSON.stringify(state, null, 2);
}

/**
 * Create a summary of the store state for the system prompt
 * @param {Object} state - The StoreState
 * @returns {string} Human-readable summary
 */
export function summarizeState(state) {
    const lines = [
        `STORE: ${state.brand.name || 'Unnamed Store'}`,
        `CATEGORY: ${state.brand.category || 'Not set'}`,
        `TONE: ${state.brand.tone || 'minimal'}`,
        `PRODUCTS: ${state.products.length} items`,
        `HERO: "${state.homepage.hero.headline || 'No headline'}"`,
        `SECTIONS: ${state.homepage.sections.length} sections on homepage`,
        `ASSETS: ${state.assets.length} images available`,
    ];

    return lines.join('\n');
}

/**
 * Get available section types with their descriptions
 * @returns {Object[]} Array of section type info
 */
export function getAvailableSectionTypes() {
    return Object.entries(SECTION_COMPONENTS).map(([key, value]) => ({
        type: key,
        name: value,
        description: `Section type: ${key}`,
    }));
}
