/**
 * System Prompt Builder
 * 
 * Generates the system prompt for Claude Opus.
 * This prompt defines:
 * - What Claude can see (StoreState)
 * - What Claude can do (Actions)
 * - How Claude should respond (JSON format)
 */

import { ACTION_TYPES, SECTION_TYPES, BRAND_TONES, STORE_CATEGORIES } from './types';
import { summarizeState } from './stateManager';

/**
 * Build the complete system prompt for Claude
 * @param {Object} state - Current StoreState
 * @returns {string} The system prompt
 */
export function buildSystemPrompt(state) {
    return `You are a storefront builder AI assistant. You help merchants create and customize their online store by emitting structured actions.

## YOUR ROLE

You are a stateful orchestrator that:
1. Receives the current store state as JSON
2. Receives user instructions in natural language
3. Emits a JSON array of actions to modify the store
4. NEVER performs actions directly - you only emit action commands

## IMPORTANT CONSTRAINTS

- You can ONLY emit actions from the predefined action schema
- You can ONLY see and reference data in the StoreState
- You CANNOT browse the web, access external APIs, or generate images
- You MUST respond with valid JSON actions
- If you cannot fulfill a request with available actions, explain why

## AVAILABLE ACTIONS

${generateActionDocs()}

## SECTION TYPES

Available section types for AddSection:
${generateSectionDocs()}

## BRAND TONES

Available tones for SetBrandInfo:
${Object.entries(BRAND_TONES).map(([key, info]) => `- "${key}": ${info.description}`).join('\n')}

## STORE CATEGORIES

Common categories: ${STORE_CATEGORIES.slice(0, 12).join(', ')}

## RESPONSE FORMAT

Always respond with a JSON object containing:
1. "thinking": Your brief analysis of the request (1-2 sentences)
2. "actions": Array of action objects to execute
3. "explanation": Brief explanation of what the actions will do

Example response:
\`\`\`json
{
  "thinking": "User wants to update the hero headline to something more compelling",
  "actions": [
    {
      "type": "SetHeroHeadline",
      "payload": {
        "headline": "Premium Skincare\\nFor Radiant Skin"
      }
    }
  ],
  "explanation": "I've updated the hero headline to be more compelling and emphasize the premium skincare positioning."
}
\`\`\`

## CURRENT STORE STATE

${summarizeState(state)}

## FULL STATE JSON

\`\`\`json
${JSON.stringify(state, null, 2)}
\`\`\`

## GUIDELINES FOR GOOD COPY

When generating text content:
- Match the brand tone: ${state.brand.tone || 'minimal'}
- Keep headlines punchy (under 10 words)
- Use \\n for line breaks in headlines
- CTAs should be action-oriented (e.g., "Shop Now", "Discover More")
- Subheadlines should support the headline with benefits
- Product descriptions should highlight features AND benefits

## GUIDELINES FOR STORE STRUCTURE

1. Every store needs a hero section (headline, subheadline, CTA)
2. Featured products section showcases best items
3. Trust badges build credibility
4. Newsletter captures leads
5. Keep the homepage focused - 4-6 sections maximum

Now, respond only to user instructions with valid JSON actions.`;
}

/**
 * Generate documentation for available actions
 * @returns {string} Action documentation
 */
function generateActionDocs() {
    const actionDocs = {
        [ACTION_TYPES.CREATE_PRODUCT]: {
            description: 'Create a new product',
            required: ['title', 'price'],
            optional: ['description', 'category', 'inventory', 'images', 'tags', 'is_active'],
            example: {
                type: 'CreateProduct',
                payload: {
                    title: 'Hydrating Serum',
                    price: 4999,
                    description: 'A luxurious hydrating serum for all skin types',
                    category: 'serums',
                    inventory: 100,
                    tags: ['hydrating', 'bestseller'],
                },
            },
        },
        [ACTION_TYPES.UPDATE_PRODUCT]: {
            description: 'Update an existing product',
            required: ['product_id'],
            optional: ['title', 'price', 'description', 'category', 'inventory', 'images', 'tags', 'is_active'],
            example: {
                type: 'UpdateProduct',
                payload: {
                    product_id: 'prod_123',
                    description: 'Updated product description',
                },
            },
        },
        [ACTION_TYPES.DELETE_PRODUCT]: {
            description: 'Delete a product',
            required: ['product_id'],
            example: {
                type: 'DeleteProduct',
                payload: { product_id: 'prod_123' },
            },
        },
        [ACTION_TYPES.SET_HERO_HEADLINE]: {
            description: 'Set the hero section headline',
            required: ['headline'],
            example: {
                type: 'SetHeroHeadline',
                payload: { headline: 'Elevate Your Skincare\\nRoutine' },
            },
        },
        [ACTION_TYPES.SET_HERO_SUBHEADLINE]: {
            description: 'Set the hero section subheadline',
            required: ['subheadline'],
            example: {
                type: 'SetHeroSubheadline',
                payload: { subheadline: 'Premium formulas for radiant, healthy skin' },
            },
        },
        [ACTION_TYPES.SET_HERO_CTA]: {
            description: 'Set the hero call-to-action button',
            required: ['text'],
            optional: ['link'],
            example: {
                type: 'SetHeroCTA',
                payload: { text: 'Shop Collection', link: '/products' },
            },
        },
        [ACTION_TYPES.SET_HERO_LAYOUT]: {
            description: 'Set the hero layout style',
            required: ['layout'],
            values: ['centered', 'left', 'split'],
            example: {
                type: 'SetHeroLayout',
                payload: { layout: 'centered' },
            },
        },
        [ACTION_TYPES.ADD_SECTION]: {
            description: 'Add a new section to the homepage',
            required: ['section_type'],
            optional: ['position', 'settings'],
            example: {
                type: 'AddSection',
                payload: {
                    section_type: 'newsletter',
                    position: 3,
                    settings: { title: 'Join Our Newsletter' },
                },
            },
        },
        [ACTION_TYPES.REMOVE_SECTION]: {
            description: 'Remove a section from the homepage',
            required: ['section_id'],
            example: {
                type: 'RemoveSection',
                payload: { section_id: 'section_123' },
            },
        },
        [ACTION_TYPES.UPDATE_SECTION]: {
            description: 'Update a section\'s settings',
            required: ['section_id', 'settings'],
            example: {
                type: 'UpdateSection',
                payload: {
                    section_id: 'section_123',
                    settings: { title: 'New Title' },
                },
            },
        },
        [ACTION_TYPES.SET_BRAND_INFO]: {
            description: 'Update brand information',
            optional: ['name', 'category', 'tone', 'tagline'],
            example: {
                type: 'SetBrandInfo',
                payload: {
                    name: 'Glow Skincare',
                    category: 'skincare',
                    tone: 'premium',
                    tagline: 'Radiance Redefined',
                },
            },
        },
    };

    return Object.entries(actionDocs)
        .map(([type, doc]) => {
            let text = `### ${type}\n${doc.description}\n`;
            if (doc.required) text += `Required: ${doc.required.join(', ')}\n`;
            if (doc.optional) text += `Optional: ${doc.optional.join(', ')}\n`;
            if (doc.values) text += `Values: ${doc.values.join(', ')}\n`;
            return text;
        })
        .join('\n');
}

/**
 * Generate documentation for section types
 * @returns {string} Section type documentation
 */
function generateSectionDocs() {
    return Object.entries(SECTION_TYPES)
        .map(([type, info]) => `- "${type}": ${info.name} - ${info.description}`)
        .join('\n');
}

/**
 * Build a user message for a specific instruction
 * @param {string} instruction - User's instruction
 * @param {Object} [context] - Optional additional context
 * @returns {string} Formatted user message
 */
export function buildUserMessage(instruction, context = {}) {
    let message = instruction;

    if (context.selectedProducts && context.selectedProducts.length > 0) {
        message += `\n\nContext: The following products are selected:\n`;
        message += context.selectedProducts.map(p => `- ${p.title} (${p.id})`).join('\n');
    }

    if (context.currentSection) {
        message += `\n\nContext: Currently editing section ${context.currentSection.id} (${context.currentSection.type})`;
    }

    return message;
}
