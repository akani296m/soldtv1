/**
 * AI Store Builder - Demo Page
 * 
 * Internal demo interface for the Store Builder Agent.
 * Shows real-time state updates and action execution.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bot,
    Send,
    Loader2,
    RefreshCw,
    ChevronDown,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Zap,
    Code,
    Home,
    MessageSquare,
    Settings,
    Sparkles
} from 'lucide-react';
import { useAdminMerchant } from '../../context/adminMerchantContext';
import { useAgent } from '../../hooks/useAgent';

// Sample prompts for the demo
const SAMPLE_PROMPTS = [
    "Update the hero headline to something catchy for a skincare brand",
    "Add a newsletter section to the homepage",
    "Create a new product called 'Hydrating Serum' priced at R299",
    "Change the brand tone to premium",
    "Set the hero CTA to 'Explore Collection'",
    "Add a trust badges section with free shipping info",
    "Update the hero subheadline to emphasize natural ingredients",
];

export default function AIStoreBuilder() {
    const navigate = useNavigate();
    const { merchantId, loading: merchantLoading } = useAdminMerchant();
    const inputRef = useRef(null);
    const chatEndRef = useRef(null);

    // Agent hook
    const {
        isInitialized,
        isLoading,
        isProcessing,
        error,
        storeState,
        conversationHistory,
        lastResponse,
        sendInstruction,
        reset,
    } = useAgent(merchantId);

    // Local state
    const [inputValue, setInputValue] = useState('');
    const [showState, setShowState] = useState(false);
    const [showActions, setShowActions] = useState(true);
    const [messages, setMessages] = useState([]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Add welcome message on init
    useEffect(() => {
        if (isInitialized && messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: `👋 Hi! I'm your AI store builder. I can help you customize your storefront by understanding natural language commands.\n\nTry things like:\n• "Update the hero headline"\n• "Add a newsletter section"\n• "Create a new product"\n\nWhat would you like to do?`,
                timestamp: new Date().toISOString(),
            }]);
        }
    }, [isInitialized]);

    const handleSubmit = async (e) => {
        e?.preventDefault();

        const instruction = inputValue.trim();
        if (!instruction || isProcessing) return;

        // Add user message
        const userMessage = {
            role: 'user',
            content: instruction,
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');

        // Process with agent
        try {
            const response = await sendInstruction(instruction);

            // Add assistant response
            const assistantMessage = {
                role: 'assistant',
                content: response.explanation || 'Done!',
                thinking: response.thinking,
                actions: response.actions,
                mutations: response.mutations,
                success: response.success,
                executionTimeMs: response.executionTimeMs,
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, assistantMessage]);

        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ Error: ${err.message}`,
                success: false,
                timestamp: new Date().toISOString(),
            }]);
        }
    };

    const handleSamplePrompt = (prompt) => {
        setInputValue(prompt);
        inputRef.current?.focus();
    };

    const handleReset = async () => {
        await reset();
        setMessages([{
            role: 'assistant',
            content: '🔄 Agent reset. Store state reloaded from database. Ready for new instructions!',
            timestamp: new Date().toISOString(),
        }]);
    };

    if (merchantLoading || isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
                    <p className="text-gray-400">Initializing AI Agent...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">AI Store Builder</h1>
                            <p className="text-xs text-gray-500">Powered by Claude Opus</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition text-sm"
                        >
                            <RefreshCw size={16} />
                            Reset
                        </button>
                        <button
                            onClick={() => navigate('/home')}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition text-sm"
                        >
                            <Home size={16} />
                            Dashboard
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto flex gap-6 p-6">
                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col min-h-[calc(100vh-8rem)]">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                        {messages.map((msg, idx) => (
                            <MessageBubble key={idx} message={msg} showActions={showActions} />
                        ))}

                        {isProcessing && (
                            <div className="flex items-center gap-3 text-gray-400">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <Loader2 size={16} className="animate-spin text-purple-400" />
                                </div>
                                <span className="text-sm">Thinking...</span>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* Sample Prompts */}
                    {messages.length <= 1 && (
                        <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2">Try these:</p>
                            <div className="flex flex-wrap gap-2">
                                {SAMPLE_PROMPTS.slice(0, 4).map((prompt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSamplePrompt(prompt)}
                                        className="px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition truncate max-w-xs"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Tell me what to build..."
                            disabled={isProcessing}
                            className="w-full px-5 py-4 pr-14 rounded-2xl bg-gray-800 border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none text-white placeholder-gray-500 transition"
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isProcessing}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:bg-gray-700 disabled:text-gray-500 flex items-center justify-center transition"
                        >
                            {isProcessing ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Send size={18} />
                            )}
                        </button>
                    </form>
                </div>

                {/* Sidebar - State Inspector */}
                <div className="w-80 shrink-0">
                    <div className="sticky top-24 space-y-4">
                        {/* State Toggle */}
                        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                            <button
                                onClick={() => setShowState(!showState)}
                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700/50 transition"
                            >
                                <span className="flex items-center gap-2 font-medium">
                                    <Code size={16} className="text-purple-400" />
                                    Store State
                                </span>
                                {showState ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>

                            {showState && storeState && (
                                <div className="px-4 pb-4 max-h-96 overflow-y-auto">
                                    <pre className="text-xs text-gray-400 overflow-x-auto">
                                        {JSON.stringify(storeState, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-3">
                            <h3 className="font-medium flex items-center gap-2">
                                <Sparkles size={16} className="text-yellow-400" />
                                Store Overview
                            </h3>

                            {storeState && (
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Store Name</span>
                                        <span>{storeState.brand?.name || 'Not set'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Category</span>
                                        <span className="capitalize">{storeState.brand?.category || 'Not set'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Brand Tone</span>
                                        <span className="capitalize">{storeState.brand?.tone || 'minimal'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Products</span>
                                        <span>{storeState.products?.length || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Sections</span>
                                        <span>{storeState.homepage?.sections?.length || 0}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Settings Toggle */}
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="flex items-center gap-2 text-sm">
                                    <Settings size={16} className="text-gray-400" />
                                    Show action details
                                </span>
                                <input
                                    type="checkbox"
                                    checked={showActions}
                                    onChange={(e) => setShowActions(e.target.checked)}
                                    className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                                />
                            </label>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                <p className="text-red-400 text-sm flex items-center gap-2">
                                    <XCircle size={16} />
                                    {error}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Message Bubble Component
 */
function MessageBubble({ message, showActions }) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl ${isUser ? 'order-2' : ''}`}>
                <div className="flex items-start gap-3">
                    {!isUser && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                            <Bot size={16} />
                        </div>
                    )}

                    <div>
                        <div
                            className={`px-4 py-3 rounded-2xl ${isUser
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-gray-800 text-gray-100'
                                }`}
                        >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>

                        {/* Thinking (if available) */}
                        {message.thinking && (
                            <p className="text-xs text-gray-500 mt-2 italic">
                                💭 {message.thinking}
                            </p>
                        )}

                        {/* Actions (if available and enabled) */}
                        {showActions && message.actions && message.actions.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {message.actions.map((action, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 text-xs bg-gray-800/50 rounded-lg px-3 py-2"
                                    >
                                        <Zap size={12} className="text-yellow-400" />
                                        <code className="text-purple-400">{action.type}</code>
                                        {message.mutations?.[idx]?.success ? (
                                            <CheckCircle2 size={12} className="text-green-400 ml-auto" />
                                        ) : message.mutations?.[idx]?.error ? (
                                            <XCircle size={12} className="text-red-400 ml-auto" />
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Execution time */}
                        {message.executionTimeMs && (
                            <p className="text-xs text-gray-600 mt-1">
                                Executed in {message.executionTimeMs}ms
                            </p>
                        )}
                    </div>

                    {isUser && (
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                            <MessageSquare size={16} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
