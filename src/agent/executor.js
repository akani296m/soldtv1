/**
 * Action Executor
 * 
 * Applies validated actions to the StoreState.
 * Each action is:
 * - Deterministic
 * - Validated (already passed through validator)
 * - Replayable
 * 
 * This module also handles persisting changes to the database.
 */

import { supabase } from '../lib/supabase';
import { ACTION_TYPES } from './types';
import { getSectionDefaults } from '../components/storefront/sections';

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
 * Execute a single action and return the new state
 * @param {Object} state - Current StoreState
 * @param {Object} action - Validated action { type, payload }
 * @returns {Promise<{ state: Object, mutation: Object }>} New state and mutation details
 */
export async function executeAction(state, action) {
    const { type, payload } = action;
    const merchantId = state.meta.merchant_id;

    // Clone state for immutability
    const newState = JSON.parse(JSON.stringify(state));
    const mutation = { type, payload, success: false, error: null };

    try {
        switch (type) {
            // =====================================================================
            // PRODUCT ACTIONS
            // =====================================================================

            case ACTION_TYPES.CREATE_PRODUCT: {
                const newProduct = {
                    id: generateUUID(),
                    title: payload.title,
                    price: payload.price || 0,
                    description: payload.description || '',
                    category: payload.category || '',
                    inventory: payload.inventory || 0,
                    images: payload.images || [],
                    tags: payload.tags || [],
                    is_active: payload.is_active !== false,
                };

                // Persist to database
                const { data, error } = await supabase
                    .from('products')
                    .insert({
                        id: newProduct.id,
                        merchant_id: merchantId,
                        title: newProduct.title,
                        price: newProduct.price,
                        description: newProduct.description,
                        category: newProduct.category,
                        inventory: newProduct.inventory,
                        images: newProduct.images,
                        tags: newProduct.tags,
                        is_active: newProduct.is_active,
                    })
                    .select()
                    .single();

                if (error) throw error;

                newState.products.unshift(newProduct);
                mutation.success = true;
                mutation.result = { product_id: newProduct.id };
                break;
            }

            case ACTION_TYPES.UPDATE_PRODUCT: {
                const productIndex = newState.products.findIndex(p => p.id === payload.product_id);
                if (productIndex === -1) {
                    throw new Error(`Product not found: ${payload.product_id}`);
                }

                const updates = {};
                const stateUpdates = {};

                if (payload.title !== undefined) {
                    updates.title = payload.title;
                    stateUpdates.title = payload.title;
                }
                if (payload.price !== undefined) {
                    updates.price = payload.price;
                    stateUpdates.price = payload.price;
                }
                if (payload.description !== undefined) {
                    updates.description = payload.description;
                    stateUpdates.description = payload.description;
                }
                if (payload.category !== undefined) {
                    updates.category = payload.category;
                    stateUpdates.category = payload.category;
                }
                if (payload.inventory !== undefined) {
                    updates.inventory = payload.inventory;
                    stateUpdates.inventory = payload.inventory;
                }
                if (payload.images !== undefined) {
                    updates.images = payload.images;
                    stateUpdates.images = payload.images;
                }
                if (payload.tags !== undefined) {
                    updates.tags = payload.tags;
                    stateUpdates.tags = payload.tags;
                }
                if (payload.is_active !== undefined) {
                    updates.is_active = payload.is_active;
                    stateUpdates.is_active = payload.is_active;
                }

                // Persist to database
                const { error } = await supabase
                    .from('products')
                    .update(updates)
                    .eq('id', payload.product_id)
                    .eq('merchant_id', merchantId);

                if (error) throw error;

                newState.products[productIndex] = {
                    ...newState.products[productIndex],
                    ...stateUpdates,
                };
                mutation.success = true;
                break;
            }

            case ACTION_TYPES.DELETE_PRODUCT: {
                const productIndex = newState.products.findIndex(p => p.id === payload.product_id);
                if (productIndex === -1) {
                    throw new Error(`Product not found: ${payload.product_id}`);
                }

                // Delete from database
                const { error } = await supabase
                    .from('products')
                    .delete()
                    .eq('id', payload.product_id)
                    .eq('merchant_id', merchantId);

                if (error) throw error;

                newState.products.splice(productIndex, 1);
                mutation.success = true;
                break;
            }

            // =====================================================================
            // HERO ACTIONS
            // =====================================================================

            case ACTION_TYPES.SET_HERO_HEADLINE: {
                newState.homepage.hero.headline = payload.headline;
                await updateHeroSection(merchantId, newState.homepage.hero);
                mutation.success = true;
                break;
            }

            case ACTION_TYPES.SET_HERO_SUBHEADLINE: {
                newState.homepage.hero.subheadline = payload.subheadline;
                await updateHeroSection(merchantId, newState.homepage.hero);
                mutation.success = true;
                break;
            }

            case ACTION_TYPES.SET_HERO_CTA: {
                newState.homepage.hero.cta_text = payload.text;
                if (payload.link) {
                    newState.homepage.hero.cta_link = payload.link;
                }
                await updateHeroSection(merchantId, newState.homepage.hero);
                mutation.success = true;
                break;
            }

            case ACTION_TYPES.SET_HERO_IMAGE: {
                // Find asset by ID
                const asset = newState.assets.find(a => a.id === payload.image_id);
                if (asset && asset.url) {
                    newState.homepage.hero.image = asset.url;
                } else {
                    newState.homepage.hero.image = payload.image_id;
                }
                await updateHeroSection(merchantId, newState.homepage.hero);
                mutation.success = true;
                break;
            }

            case ACTION_TYPES.SET_HERO_LAYOUT: {
                newState.homepage.hero.layout = payload.layout;
                await updateHeroSection(merchantId, newState.homepage.hero);
                mutation.success = true;
                break;
            }

            // =====================================================================
            // SECTION ACTIONS
            // =====================================================================

            case ACTION_TYPES.ADD_SECTION: {
                const newSection = {
                    id: generateUUID(),
                    type: payload.section_type,
                    position: payload.position ?? newState.homepage.sections.length,
                    visible: true,
                    settings: {
                        ...getSectionDefaults(payload.section_type),
                        ...(payload.settings || {}),
                    },
                };

                // Persist to database
                const { error } = await supabase
                    .from('storefront_sections')
                    .insert({
                        id: newSection.id,
                        merchant_id: merchantId,
                        page_type: 'home',
                        section_type: payload.section_type,
                        position: newSection.position,
                        is_visible: true,
                        settings: newSection.settings,
                    });

                if (error) throw error;

                newState.homepage.sections.push(newSection);
                newState.homepage.sections.sort((a, b) => a.position - b.position);
                mutation.success = true;
                mutation.result = { section_id: newSection.id };
                break;
            }

            case ACTION_TYPES.REMOVE_SECTION: {
                const sectionIndex = newState.homepage.sections.findIndex(s => s.id === payload.section_id);
                if (sectionIndex === -1) {
                    throw new Error(`Section not found: ${payload.section_id}`);
                }

                // Delete from database
                const { error } = await supabase
                    .from('storefront_sections')
                    .delete()
                    .eq('id', payload.section_id)
                    .eq('merchant_id', merchantId);

                if (error) throw error;

                newState.homepage.sections.splice(sectionIndex, 1);
                mutation.success = true;
                break;
            }

            case ACTION_TYPES.UPDATE_SECTION: {
                const section = newState.homepage.sections.find(s => s.id === payload.section_id);
                if (!section) {
                    throw new Error(`Section not found: ${payload.section_id}`);
                }

                // Merge settings
                const newSettings = {
                    ...section.settings,
                    ...mapSimplifiedToFullSettings(section.type, payload.settings),
                };

                // Persist to database
                const { error } = await supabase
                    .from('storefront_sections')
                    .update({ settings: newSettings })
                    .eq('id', payload.section_id)
                    .eq('merchant_id', merchantId);

                if (error) throw error;

                section.settings = newSettings;
                mutation.success = true;
                break;
            }

            case ACTION_TYPES.REORDER_SECTIONS: {
                const reorderedSections = [];
                payload.section_ids.forEach((id, index) => {
                    const section = newState.homepage.sections.find(s => s.id === id);
                    if (section) {
                        section.position = index;
                        reorderedSections.push(section);
                    }
                });

                // Update positions in database
                for (const section of reorderedSections) {
                    await supabase
                        .from('storefront_sections')
                        .update({ position: section.position })
                        .eq('id', section.id)
                        .eq('merchant_id', merchantId);
                }

                newState.homepage.sections = reorderedSections;
                mutation.success = true;
                break;
            }

            // =====================================================================
            // BRAND ACTIONS
            // =====================================================================

            case ACTION_TYPES.SET_BRAND_INFO: {
                const updates = {};

                if (payload.name) {
                    newState.brand.name = payload.name;
                    updates.store_name = payload.name;
                }
                if (payload.category) {
                    newState.brand.category = payload.category;
                    updates.category = payload.category;
                }
                if (payload.tone) {
                    newState.brand.tone = payload.tone;
                    updates.brand_tone = payload.tone;
                }
                if (payload.tagline) {
                    newState.brand.tagline = payload.tagline;
                    updates.tagline = payload.tagline;
                }

                if (Object.keys(updates).length > 0) {
                    const { error } = await supabase
                        .from('merchants')
                        .update(updates)
                        .eq('id', merchantId);

                    if (error) throw error;
                }

                mutation.success = true;
                break;
            }

            // =====================================================================
            // BULK ACTIONS
            // =====================================================================

            case ACTION_TYPES.GENERATE_PRODUCT_DESCRIPTIONS: {
                // This is a special action - the descriptions are provided in the
                // action payload after Claude generates them
                if (payload.descriptions && typeof payload.descriptions === 'object') {
                    for (const [productId, description] of Object.entries(payload.descriptions)) {
                        const product = newState.products.find(p => p.id === productId);
                        if (product) {
                            product.description = description;

                            await supabase
                                .from('products')
                                .update({ description })
                                .eq('id', productId)
                                .eq('merchant_id', merchantId);
                        }
                    }
                }
                mutation.success = true;
                break;
            }

            default:
                throw new Error(`Unknown action type: ${type}`);
        }

    } catch (error) {
        console.error(`[Executor] Error executing ${type}:`, error);
        mutation.success = false;
        mutation.error = error.message;
        // Return original state on error
        return { state, mutation };
    }

    // Update meta
    newState.meta.last_updated = new Date().toISOString();

    return { state: newState, mutation };
}

/**
 * Execute multiple actions in sequence
 * @param {Object} state - Current StoreState
 * @param {Object[]} actions - Array of validated actions
 * @returns {Promise<{ state: Object, mutations: Object[] }>}
 */
export async function executeActions(state, actions) {
    let currentState = state;
    const mutations = [];

    for (const action of actions) {
        const result = await executeAction(currentState, action);
        currentState = result.state;
        mutations.push(result.mutation);

        // Stop on first error (actions are sequential)
        if (!result.mutation.success) {
            break;
        }
    }

    return { state: currentState, mutations };
}

/**
 * Update hero section in database
 * @param {string} merchantId - Merchant ID
 * @param {Object} hero - Hero state
 */
async function updateHeroSection(merchantId, hero) {
    // Find existing hero section
    const { data: existing } = await supabase
        .from('storefront_sections')
        .select('id, settings')
        .eq('merchant_id', merchantId)
        .eq('page_type', 'home')
        .eq('section_type', 'hero')
        .single();

    const heroSettings = {
        ...(existing?.settings || getSectionDefaults('hero')),
        title: hero.headline,
        subtitle: hero.subheadline,
        button_text: hero.cta_text,
        button_link: hero.cta_link,
        background_image: hero.image,
        layout: hero.layout,
    };

    if (existing) {
        await supabase
            .from('storefront_sections')
            .update({ settings: heroSettings })
            .eq('id', existing.id);
    } else {
        await supabase
            .from('storefront_sections')
            .insert({
                id: generateUUID(),
                merchant_id: merchantId,
                page_type: 'home',
                section_type: 'hero',
                position: 0,
                is_visible: true,
                settings: heroSettings,
            });
    }
}

/**
 * Map simplified settings (from agent) to full section settings
 * @param {string} sectionType - Section type
 * @param {Object} simplified - Simplified settings from agent
 * @returns {Object} Full settings object
 */
function mapSimplifiedToFullSettings(sectionType, simplified) {
    if (!simplified) return {};

    const mapping = {
        hero: {
            headline: 'title',
            subheadline: 'subtitle',
            cta_text: 'button_text',
            cta_link: 'button_link',
        },
        featured_products: {
            product_count: 'productCount',
        },
        newsletter: {
            button_text: 'button_text',
        },
    };

    const typeMapping = mapping[sectionType] || {};
    const result = {};

    for (const [key, value] of Object.entries(simplified)) {
        const mappedKey = typeMapping[key] || key;
        result[mappedKey] = value;
    }

    return result;
}
