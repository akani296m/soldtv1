/**
 * useAgent Hook
 * 
 * React hook for using the Store Builder Agent in components.
 * Provides reactive state updates and easy integration.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { StoreBuilderAgent } from '../agent/agent';

/**
 * Hook to use the Store Builder Agent
 * @param {string} merchantId - The merchant's ID
 * @param {Object} [config] - Optional agent configuration
 * @returns {Object} Agent state and methods
 */
export function useAgent(merchantId, config = {}) {
    const agentRef = useRef(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [storeState, setStoreState] = useState(null);
    const [conversationHistory, setConversationHistory] = useState([]);
    const [lastResponse, setLastResponse] = useState(null);

    // Initialize agent when merchantId changes
    useEffect(() => {
        if (!merchantId) {
            setIsLoading(false);
            return;
        }

        const initAgent = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const agent = new StoreBuilderAgent(merchantId, config);

                // Set up callbacks
                agent.onStateChange = (newState) => {
                    setStoreState(newState);
                };

                agent.onError = (err) => {
                    setError(err.message || 'An error occurred');
                };

                await agent.initialize();

                agentRef.current = agent;
                setStoreState(agent.getState());
                setConversationHistory(agent.getHistory());
                setIsInitialized(true);

            } catch (err) {
                console.error('[useAgent] Initialization error:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        initAgent();

        return () => {
            agentRef.current = null;
        };
    }, [merchantId]);

    /**
     * Send an instruction to the agent
     * @param {string} instruction - Natural language instruction
     * @param {Object} [context] - Optional context
     * @returns {Promise<Object>} Agent response
     */
    const sendInstruction = useCallback(async (instruction, context = {}) => {
        if (!agentRef.current) {
            throw new Error('Agent not initialized');
        }

        setIsProcessing(true);
        setError(null);

        try {
            const response = await agentRef.current.process(instruction, context);

            setStoreState(agentRef.current.getState());
            setConversationHistory(agentRef.current.getHistory());
            setLastResponse(response);

            if (!response.success && response.error) {
                setError(response.error);
            }

            return response;

        } catch (err) {
            console.error('[useAgent] Process error:', err);
            setError(err.message);
            throw err;
        } finally {
            setIsProcessing(false);
        }
    }, []);

    /**
     * Reset the agent and reload state
     */
    const reset = useCallback(async () => {
        if (!agentRef.current) return;

        setIsLoading(true);
        setError(null);

        try {
            await agentRef.current.reset();
            setStoreState(agentRef.current.getState());
            setConversationHistory([]);
            setLastResponse(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Get the raw agent instance (for advanced use cases)
     */
    const getAgent = useCallback(() => agentRef.current, []);

    return {
        // State
        isInitialized,
        isLoading,
        isProcessing,
        error,
        storeState,
        conversationHistory,
        lastResponse,

        // Methods
        sendInstruction,
        reset,
        getAgent,
    };
}
