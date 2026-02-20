/**
 * Agent Type Definitions
 * 
 * This file defines the canonical schemas for:
 * 1. StoreState - The entire world the agent can see
 * 2. Actions - The only things the agent can do
 * 3. Validation schemas for each action
 */

// =============================================================================
// STORE STATE SCHEMA
// This is the ONLY data structure Claude sees
// =============================================================================

/**
 * @typedef {Object} BrandState
 * @property {string} category - Store category (e.g., "skincare", "fashion", "electronics")
 * @property {string} tone - Brand voice (e.g., "premium", "playful", "minimal", "bold")
 * @property {string} name - Store name
 * @property {string} [tagline] - Optional brand tagline
 */

/**
 * @typedef {Object} ProductState
 * @property {string} id - Unique product identifier
 * @property {string} title - Product name
 * @property {number} price - Price in cents
 * @property {string} description - Product description
 * @property {string} category - Product category
 * @property {number} inventory - Stock count
 * @property {string[]} images - Array of image labels/URLs
 * @property {string[]} tags - Product tags
 * @property {boolean} is_active - Whether product is visible
 */

/**
 * @typedef {Object} HomepageState
 * @property {Object} hero - Hero section state
 * @property {string} hero.headline - Main headline text
 * @property {string} hero.subheadline - Supporting text
 * @property {string} hero.cta_text - Call-to-action button text
 * @property {string} hero.cta_link - CTA destination
 * @property {string} hero.image - Hero background image label
 * @property {string} hero.layout - Layout variant (centered, left, split)
 * @property {Object[]} sections - Array of page sections
 * @property {string} template - Selected template ID
 */

/**
 * @typedef {Object} ImageAsset
 * @property {string} id - Unique image identifier
 * @property {string} label - Descriptive filename/label
 * @property {string} [url] - Optional actual URL
 * @property {string} [description] - Optional description for AI context
 */

/**
 * @typedef {Object} StoreState
 * @property {BrandState} brand - Brand configuration
 * @property {ProductState[]} products - All products
 * @property {HomepageState} homepage - Homepage configuration
 * @property {ImageAsset[]} assets - Available image assets
 * @property {Object} meta - Metadata about the store
 */

export const STORE_STATE_SCHEMA = {
    brand: {
        category: 'string',
        tone: 'string',
        name: 'string',
        tagline: 'string?',
    },
    products: [{
        id: 'string',
        title: 'string',
        price: 'number',
        description: 'string',
        category: 'string',
        inventory: 'number',
        images: ['string'],
        tags: ['string'],
        is_active: 'boolean',
    }],
    homepage: {
        hero: {
            headline: 'string',
            subheadline: 'string',
            cta_text: 'string',
            cta_link: 'string',
            image: 'string',
            layout: 'string',
        },
        sections: ['object'],
        template: 'string',
    },
    assets: [{
        id: 'string',
        label: 'string',
        url: 'string?',
        description: 'string?',
    }],
    meta: {
        merchant_id: 'string',
        last_updated: 'string',
    },
};

// =============================================================================
// ACTION TYPES
// These are the ONLY things the agent can emit
// =============================================================================

export const ACTION_TYPES = {
    // Product Actions
    CREATE_PRODUCT: 'CreateProduct',
    UPDATE_PRODUCT: 'UpdateProduct',
    DELETE_PRODUCT: 'DeleteProduct',

    // Homepage Hero Actions
    SET_HERO_HEADLINE: 'SetHeroHeadline',
    SET_HERO_SUBHEADLINE: 'SetHeroSubheadline',
    SET_HERO_CTA: 'SetHeroCTA',
    SET_HERO_IMAGE: 'SetHeroImage',
    SET_HERO_LAYOUT: 'SetHeroLayout',

    // Section Actions
    ADD_SECTION: 'AddSection',
    REMOVE_SECTION: 'RemoveSection',
    UPDATE_SECTION: 'UpdateSection',
    REORDER_SECTIONS: 'ReorderSections',

    // Template Actions
    SELECT_TEMPLATE: 'SelectTemplate',

    // Brand Actions
    SET_BRAND_INFO: 'SetBrandInfo',

    // Bulk Actions
    GENERATE_PRODUCT_DESCRIPTIONS: 'GenerateProductDescriptions',
};

// =============================================================================
// ACTION SCHEMAS
// Validation schemas for each action type
// =============================================================================

export const ACTION_SCHEMAS = {
    [ACTION_TYPES.CREATE_PRODUCT]: {
        type: 'object',
        required: ['title', 'price'],
        properties: {
            title: { type: 'string', minLength: 1, maxLength: 200 },
            price: { type: 'number', min: 0 },
            description: { type: 'string', maxLength: 2000 },
            category: { type: 'string', maxLength: 100 },
            inventory: { type: 'number', min: 0 },
            images: { type: 'array', items: { type: 'string' } },
            tags: { type: 'array', items: { type: 'string' } },
            is_active: { type: 'boolean' },
        },
    },

    [ACTION_TYPES.UPDATE_PRODUCT]: {
        type: 'object',
        required: ['product_id'],
        properties: {
            product_id: { type: 'string' },
            title: { type: 'string', minLength: 1, maxLength: 200 },
            price: { type: 'number', min: 0 },
            description: { type: 'string', maxLength: 2000 },
            category: { type: 'string', maxLength: 100 },
            inventory: { type: 'number', min: 0 },
            images: { type: 'array', items: { type: 'string' } },
            tags: { type: 'array', items: { type: 'string' } },
            is_active: { type: 'boolean' },
        },
    },

    [ACTION_TYPES.DELETE_PRODUCT]: {
        type: 'object',
        required: ['product_id'],
        properties: {
            product_id: { type: 'string' },
        },
    },

    [ACTION_TYPES.SET_HERO_HEADLINE]: {
        type: 'object',
        required: ['headline'],
        properties: {
            headline: { type: 'string', minLength: 1, maxLength: 200 },
        },
    },

    [ACTION_TYPES.SET_HERO_SUBHEADLINE]: {
        type: 'object',
        required: ['subheadline'],
        properties: {
            subheadline: { type: 'string', maxLength: 500 },
        },
    },

    [ACTION_TYPES.SET_HERO_CTA]: {
        type: 'object',
        required: ['text'],
        properties: {
            text: { type: 'string', minLength: 1, maxLength: 50 },
            link: { type: 'string', maxLength: 200 },
        },
    },

    [ACTION_TYPES.SET_HERO_IMAGE]: {
        type: 'object',
        required: ['image_id'],
        properties: {
            image_id: { type: 'string' },
        },
    },

    [ACTION_TYPES.SET_HERO_LAYOUT]: {
        type: 'object',
        required: ['layout'],
        properties: {
            layout: { type: 'string', enum: ['centered', 'left', 'split'] },
        },
    },

    [ACTION_TYPES.ADD_SECTION]: {
        type: 'object',
        required: ['section_type'],
        properties: {
            section_type: {
                type: 'string',
                enum: [
                    'hero', 'featured_products', 'newsletter', 'trust_badges',
                    'rich_text', 'image_banner', 'faq', 'announcement_bar',
                    'catalog_header', 'product_trust', 'related_products'
                ]
            },
            position: { type: 'number', min: 0 },
            settings: { type: 'object' },
        },
    },

    [ACTION_TYPES.REMOVE_SECTION]: {
        type: 'object',
        required: ['section_id'],
        properties: {
            section_id: { type: 'string' },
        },
    },

    [ACTION_TYPES.UPDATE_SECTION]: {
        type: 'object',
        required: ['section_id', 'settings'],
        properties: {
            section_id: { type: 'string' },
            settings: { type: 'object' },
        },
    },

    [ACTION_TYPES.REORDER_SECTIONS]: {
        type: 'object',
        required: ['section_ids'],
        properties: {
            section_ids: { type: 'array', items: { type: 'string' } },
        },
    },

    [ACTION_TYPES.SELECT_TEMPLATE]: {
        type: 'object',
        required: ['template_id'],
        properties: {
            template_id: { type: 'string' },
        },
    },

    [ACTION_TYPES.SET_BRAND_INFO]: {
        type: 'object',
        properties: {
            name: { type: 'string', maxLength: 100 },
            category: { type: 'string', maxLength: 50 },
            tone: { type: 'string', enum: ['premium', 'playful', 'minimal', 'bold', 'warm', 'professional'] },
            tagline: { type: 'string', maxLength: 200 },
        },
    },

    [ACTION_TYPES.GENERATE_PRODUCT_DESCRIPTIONS]: {
        type: 'object',
        required: ['product_ids'],
        properties: {
            product_ids: { type: 'array', items: { type: 'string' } },
            style: { type: 'string', enum: ['short', 'detailed', 'persuasive', 'minimal'] },
        },
    },
};

// =============================================================================
// SECTION TYPE METADATA
// What sections are available and their configurable properties
// =============================================================================

export const SECTION_TYPES = {
    hero: {
        name: 'Hero Banner',
        description: 'Full-width hero with headline, CTA, and background image',
        settings: ['headline', 'subheadline', 'cta_text', 'cta_link', 'background_image', 'layout', 'overlay_opacity'],
    },
    featured_products: {
        name: 'Featured Products',
        description: 'Grid of highlighted products',
        settings: ['title', 'subtitle', 'product_count', 'columns'],
    },
    newsletter: {
        name: 'Newsletter Signup',
        description: 'Email capture section',
        settings: ['title', 'subtitle', 'button_text', 'placeholder'],
    },
    trust_badges: {
        name: 'Trust Badges',
        description: 'Social proof and trust indicators',
        settings: ['badges'],
    },
    rich_text: {
        name: 'Rich Text',
        description: 'Custom text content block',
        settings: ['content', 'alignment'],
    },
    image_banner: {
        name: 'Image Banner',
        description: 'Full-width promotional image',
        settings: ['image', 'link', 'alt_text'],
    },
    faq: {
        name: 'FAQ Section',
        description: 'Frequently asked questions accordion',
        settings: ['title', 'items'],
    },
    announcement_bar: {
        name: 'Announcement Bar',
        description: 'Top banner for promotions',
        settings: ['message', 'link', 'background_color'],
    },
};

// =============================================================================
// BRAND TONES
// Predefined brand voice options
// =============================================================================

export const BRAND_TONES = {
    premium: {
        description: 'Sophisticated, luxurious, exclusive',
        copyStyle: 'Elegant and refined language, emphasizes quality and craftsmanship',
    },
    playful: {
        description: 'Fun, energetic, youthful',
        copyStyle: 'Casual tone, uses emojis, friendly and approachable',
    },
    minimal: {
        description: 'Clean, simple, focused',
        copyStyle: 'Concise and direct, lets products speak for themselves',
    },
    bold: {
        description: 'Confident, impactful, striking',
        copyStyle: 'Strong statements, action-oriented, memorable',
    },
    warm: {
        description: 'Friendly, caring, personal',
        copyStyle: 'Conversational, empathetic, community-focused',
    },
    professional: {
        description: 'Trustworthy, expert, reliable',
        copyStyle: 'Clear and authoritative, fact-based, credibility-focused',
    },
};

// =============================================================================
// STORE CATEGORIES
// Common store types for classification
// =============================================================================

export const STORE_CATEGORIES = [
    'skincare',
    'fashion',
    'electronics',
    'home_decor',
    'food_beverage',
    'jewelry',
    'sports',
    'books',
    'art',
    'wellness',
    'beauty',
    'accessories',
    'kids',
    'pets',
    'outdoor',
    'vintage',
    'handmade',
    'subscription',
];
