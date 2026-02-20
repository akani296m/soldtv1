/**
 * Store Builder Agent
 * 
 * The core agent orchestrator that implements the agent loop.
 * This is the ENTIRE system:
 * 
 * while (user_input) {
 *   provide(StoreState + instruction)
 *   agent_outputs(Action[])
 *   validate(Action[])
 *   apply(Action[] → StoreState)
 * }
 */

import { loadStoreState, serializeState, createEmptyStoreState } from './stateManager';
import { validateAction, parseAndValidateActions } from './validator';
import { executeActions } from './executor';
import { buildSystemPrompt, buildUserMessage } from './promptBuilder';
import { ACTION_TYPES } from './types';

/**
 * Agent configuration
 */
const DEFAULT_CONFIG = {
    model: 'claude-sonnet-4-20250514', // Will be upgraded to Opus for production
    maxTokens: 4096,
    temperature: 0.7,
};

/**
 * Store Builder Agent Class
 * Manages a single stateful conversation with Claude
 */
export class StoreBuilderAgent {
    /**
     * Create a new agent instance
     * @param {string} merchantId - The merchant's ID
     * @param {Object} [config] - Agent configuration
     */
    constructor(merchantId, config = {}) {
        this.merchantId = merchantId;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.state = null;
        this.conversationHistory = [];
        this.actionHistory = [];
        this.isInitialized = false;

        // Callbacks for UI integration
        this.onStateChange = null;
        this.onActionExecuted = null;
        this.onError = null;
    }

    /**
     * Initialize the agent by loading the store state
     * @returns {Promise<Object>} The loaded StoreState
     */
    async initialize() {
        try {
            this.state = await loadStoreState(this.merchantId);
            this.isInitialized = true;
            console.log('[Agent] Initialized with state:', this.state.meta);
            return this.state;
        } catch (error) {
            console.error('[Agent] Failed to initialize:', error);
            // Use empty state on error
            this.state = createEmptyStoreState();
            this.state.meta.merchant_id = this.merchantId;
            this.isInitialized = true;
            throw error;
        }
    }

    /**
     * Process a user instruction
     * This is the main agent loop entry point
     * @param {string} instruction - User's natural language instruction
     * @param {Object} [context] - Optional context (selected products, etc.)
     * @returns {Promise<AgentResponse>} The agent's response
     */
    async process(instruction, context = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const startTime = Date.now();
        const response = {
            success: false,
            thinking: '',
            actions: [],
            mutations: [],
            explanation: '',
            error: null,
            executionTimeMs: 0,
        };

        try {
            // 1. Build the prompt with current state
            const systemPrompt = buildSystemPrompt(this.state);
            const userMessage = buildUserMessage(instruction, context);

            // 2. Call Claude
            const llmResponse = await this.callLLM(systemPrompt, userMessage);

            // 3. Parse the response
            const parsed = this.parseLLMResponse(llmResponse);
            response.thinking = parsed.thinking || '';
            response.explanation = parsed.explanation || '';

            if (!parsed.actions || parsed.actions.length === 0) {
                response.success = true;
                response.explanation = parsed.explanation || 'No actions needed for this request.';
                return response;
            }

            // 4. Validate all actions
            const validatedActions = [];
            const validationErrors = [];

            for (const action of parsed.actions) {
                const validation = validateAction(action);
                if (validation.valid) {
                    validatedActions.push(validation.sanitized);
                } else {
                    validationErrors.push(...validation.errors);
                }
            }

            if (validationErrors.length > 0) {
                console.warn('[Agent] Validation errors:', validationErrors);
                // Continue with valid actions only
            }

            if (validatedActions.length === 0) {
                response.error = `All actions failed validation: ${validationErrors.join(', ')}`;
                return response;
            }

            response.actions = validatedActions;

            // 5. Execute actions and mutate state
            const execution = await executeActions(this.state, validatedActions);
            this.state = execution.state;
            response.mutations = execution.mutations;

            // 6. Record in history
            this.conversationHistory.push({
                role: 'user',
                content: instruction,
                timestamp: new Date().toISOString(),
            });
            this.conversationHistory.push({
                role: 'assistant',
                content: response.explanation,
                actions: validatedActions,
                timestamp: new Date().toISOString(),
            });
            this.actionHistory.push(...validatedActions);

            // 7. Trigger callbacks
            if (this.onStateChange) {
                this.onStateChange(this.state);
            }
            if (this.onActionExecuted) {
                response.mutations.forEach(m => this.onActionExecuted(m));
            }

            response.success = execution.mutations.every(m => m.success);

        } catch (error) {
            console.error('[Agent] Error processing instruction:', error);
            response.error = error.message;
            if (this.onError) {
                this.onError(error);
            }
        }

        response.executionTimeMs = Date.now() - startTime;
        return response;
    }

    /**
     * Call the LLM with the given prompts
     * @param {string} systemPrompt - The system prompt
     * @param {string} userMessage - The user message
     * @returns {Promise<string>} The LLM response
     */
    async callLLM(systemPrompt, userMessage) {
        // Check for API key
        const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

        if (!apiKey) {
            // In demo mode without API key, return a mock response
            console.warn('[Agent] No API key found, using mock response');
            return this.getMockResponse(userMessage);
        }

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true',
                },
                body: JSON.stringify({
                    model: this.config.model,
                    max_tokens: this.config.maxTokens,
                    temperature: this.config.temperature,
                    system: systemPrompt,
                    messages: [
                        {
                            role: 'user',
                            content: userMessage,
                        },
                    ],
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API request failed');
            }

            const data = await response.json();
            return data.content[0]?.text || '';

        } catch (error) {
            console.error('[Agent] LLM call failed:', error);
            throw error;
        }
    }

    /**
     * Parse the LLM response to extract actions
     * @param {string} response - Raw LLM response
     * @returns {Object} Parsed response with thinking, actions, explanation
     */
    parseLLMResponse(response) {
        try {
            // Try to extract JSON from the response
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }

            // Try parsing entire response as JSON
            const parsed = JSON.parse(response);
            return parsed;

        } catch (e) {
            console.warn('[Agent] Failed to parse JSON response, attempting extraction');

            // Try to extract just the actions array
            const actionsMatch = response.match(/"actions"\s*:\s*(\[[\s\S]*?\])/);
            if (actionsMatch) {
                try {
                    const actions = JSON.parse(actionsMatch[1]);
                    return { actions, thinking: '', explanation: response };
                } catch (e2) {
                    // Fall through
                }
            }

            return {
                thinking: '',
                actions: [],
                explanation: response,
            };
        }
    }

    /**
     * Generate a mock response for demo/testing without API key
     * @param {string} userMessage - The user message
     * @returns {string} Mock JSON response
     */
    getMockResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();

        // Basic intent detection for demo
        if (lowerMessage.includes('headline') || lowerMessage.includes('hero')) {
            return JSON.stringify({
                thinking: 'User wants to update the hero headline',
                actions: [
                    {
                        type: ACTION_TYPES.SET_HERO_HEADLINE,
                        payload: { headline: 'Welcome to Our Store\\nDiscover Amazing Products' },
                    },
                ],
                explanation: 'I\'ve updated the hero headline with a compelling message.',
            });
        }

        if (lowerMessage.includes('product') && lowerMessage.includes('add')) {
            return JSON.stringify({
                thinking: 'User wants to add a new product',
                actions: [
                    {
                        type: ACTION_TYPES.CREATE_PRODUCT,
                        payload: {
                            title: 'Sample Product',
                            price: 2999,
                            description: 'A wonderful product for your needs.',
                            category: 'general',
                            inventory: 50,
                        },
                    },
                ],
                explanation: 'I\'ve added a new sample product to your store.',
            });
        }

        if (lowerMessage.includes('section') && lowerMessage.includes('add')) {
            return JSON.stringify({
                thinking: 'User wants to add a new section',
                actions: [
                    {
                        type: ACTION_TYPES.ADD_SECTION,
                        payload: {
                            section_type: 'newsletter',
                            settings: {
                                title: 'Stay Updated',
                                subtitle: 'Subscribe to our newsletter for exclusive offers',
                            },
                        },
                    },
                ],
                explanation: 'I\'ve added a newsletter section to capture email signups.',
            });
        }

        return JSON.stringify({
            thinking: 'Understanding the request',
            actions: [],
            explanation: 'I understand your request. In a full implementation, I would analyze your store state and generate appropriate actions. For this demo, please try specific commands like "update the hero headline" or "add a new product".',
        });
    }

    /**
     * Get the current store state
     * @returns {Object} Current StoreState
     */
    getState() {
        return this.state;
    }

    /**
     * Get the conversation history
     * @returns {Object[]} Conversation history
     */
    getHistory() {
        return this.conversationHistory;
    }

    /**
     * Get the action history
     * @returns {Object[]} All executed actions
     */
    getActionHistory() {
        return this.actionHistory;
    }

    /**
     * Reset the agent state (reload from database)
     * @returns {Promise<Object>} Fresh StoreState
     */
    async reset() {
        this.conversationHistory = [];
        this.actionHistory = [];
        return await this.initialize();
    }

    /**
     * Serialize the agent state for debugging/logging
     * @returns {Object} Serialized agent state
     */
    serialize() {
        return {
            merchantId: this.merchantId,
            state: this.state,
            conversationHistory: this.conversationHistory,
            actionHistory: this.actionHistory,
            isInitialized: this.isInitialized,
        };
    }
}

/**
 * Create and initialize an agent instance
 * @param {string} merchantId - The merchant's ID
 * @param {Object} [config] - Optional configuration
 * @returns {Promise<StoreBuilderAgent>} Initialized agent
 */
export async function createAgent(merchantId, config = {}) {
    const agent = new StoreBuilderAgent(merchantId, config);
    await agent.initialize();
    return agent;
}
