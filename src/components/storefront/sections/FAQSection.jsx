import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';

/**
 * FAQ Section Component
 * Interactive accordion-style frequently asked questions section
 * Great for customer support and reducing support queries
 */
export default function FAQSection({ settings = {}, basePath = '/store' }) {
    const {
        title = 'Frequently Asked Questions',
        subtitle = 'Find answers to common questions about our products and services',
        faqs = [
            {
                question: 'How long does shipping take?',
                answer: 'Standard shipping typically takes 3-5 business days. Express shipping is available for 1-2 business day delivery.'
            },
            {
                question: 'What is your return policy?',
                answer: 'We offer a 30-day money-back guarantee on all orders. If you\'re not satisfied, simply return the product in its original condition for a full refund.'
            },
            {
                question: 'Do you ship internationally?',
                answer: 'Yes! We ship to most countries worldwide. International shipping times vary by location, typically 7-14 business days.'
            }
        ],
        layout = 'centered', // 'centered', 'left_aligned', 'two_column'
        style = 'modern', // 'modern', 'minimal', 'bordered'
        background_color = '#ffffff',
        accent_color = '#3B82F6',
        text_color = '#111827'
    } = settings;

    const [openIndex, setOpenIndex] = useState(null);

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    // Different layout classes
    const layoutClasses = {
        centered: 'max-w-3xl mx-auto text-center',
        left_aligned: 'max-w-4xl',
        two_column: 'max-w-6xl mx-auto'
    };

    // Style variants for the FAQ items
    const getItemStyles = () => {
        switch (style) {
            case 'minimal':
                return {
                    container: 'border-b border-gray-200 last:border-b-0',
                    question: 'py-5',
                    answer: 'pb-5'
                };
            case 'bordered':
                return {
                    container: 'border border-gray-200 rounded-xl mb-3 last:mb-0',
                    question: 'p-5',
                    answer: 'px-5 pb-5'
                };
            case 'modern':
            default:
                return {
                    container: 'bg-gray-50 rounded-2xl mb-4 last:mb-0 overflow-hidden transition-all duration-300',
                    question: 'p-5',
                    answer: 'px-5 pb-5'
                };
        }
    };

    const itemStyles = getItemStyles();

    // Render FAQs based on layout
    const renderFAQs = () => {
        if (layout === 'two_column') {
            const mid = Math.ceil(faqs.length / 2);
            const leftFaqs = faqs.slice(0, mid);
            const rightFaqs = faqs.slice(mid);

            return (
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-0">
                        {leftFaqs.map((faq, index) => renderFAQItem(faq, index))}
                    </div>
                    <div className="space-y-0">
                        {rightFaqs.map((faq, index) => renderFAQItem(faq, index + mid))}
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-0">
                {faqs.map((faq, index) => renderFAQItem(faq, index))}
            </div>
        );
    };

    const renderFAQItem = (faq, index) => {
        const isOpen = openIndex === index;

        return (
            <div
                key={index}
                className={`${itemStyles.container} ${isOpen && style === 'modern' ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : ''}`}
                style={{
                    borderColor: isOpen && style === 'bordered' ? accent_color : undefined
                }}
            >
                <button
                    onClick={() => toggleFAQ(index)}
                    className={`w-full flex items-center justify-between text-left ${itemStyles.question} group`}
                    aria-expanded={isOpen}
                >
                    <span
                        className="font-semibold text-base md:text-lg pr-4 transition-colors"
                        style={{ color: isOpen ? accent_color : text_color }}
                    >
                        {faq.question}
                    </span>
                    <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'rotate-180' : ''
                            }`}
                        style={{
                            backgroundColor: isOpen ? accent_color : 'rgba(0,0,0,0.05)',
                            color: isOpen ? '#ffffff' : text_color
                        }}
                    >
                        <ChevronDown size={18} />
                    </div>
                </button>

                {/* Answer with animation */}
                <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                >
                    <div className={itemStyles.answer}>
                        <p className="text-gray-600 leading-relaxed">
                            {faq.answer}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <section
            className="py-16 md:py-24 px-6"
            style={{ backgroundColor: background_color }}
        >
            <div className={layoutClasses[layout] || layoutClasses.centered}>
                {/* Header */}
                <div className={`mb-12 ${layout === 'centered' ? 'text-center' : ''}`}>
                    <div
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${layout === 'centered' ? 'mx-auto' : ''
                            }`}
                        style={{
                            backgroundColor: `${accent_color}15`,
                            color: accent_color
                        }}
                    >
                        <HelpCircle size={16} />
                        <span>FAQ</span>
                    </div>

                    <h2
                        className="text-3xl md:text-4xl font-bold mb-4"
                        style={{ color: text_color }}
                    >
                        {title}
                    </h2>

                    {subtitle && (
                        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* FAQ Items */}
                {renderFAQs()}

                {/* Contact CTA */}
                <div
                    className={`mt-12 p-6 rounded-2xl text-center ${layout === 'centered' ? '' : 'max-w-2xl'
                        }`}
                    style={{
                        backgroundColor: `${accent_color}08`
                    }}
                >
                    <div
                        className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
                        style={{ backgroundColor: `${accent_color}15` }}
                    >
                        <MessageCircle size={24} style={{ color: accent_color }} />
                    </div>
                    <h4 className="font-semibold text-lg mb-2" style={{ color: text_color }}>
                        Still have questions?
                    </h4>
                    <p className="text-gray-500 text-sm">
                        Can't find the answer you're looking for? Please reach out to our friendly team.
                    </p>
                </div>
            </div>
        </section>
    );
}

// Section metadata for the editor
FAQSection.sectionMeta = {
    type: 'faq',
    name: 'FAQ',
    description: 'Display frequently asked questions with expandable answers',
    icon: 'HelpCircle',
    defaultSettings: {
        title: 'Frequently Asked Questions',
        subtitle: 'Find answers to common questions about our products and services',
        faqs: [
            {
                question: 'How long does shipping take?',
                answer: 'Standard shipping typically takes 3-5 business days. Express shipping is available for 1-2 business day delivery.'
            },
            {
                question: 'What is your return policy?',
                answer: 'We offer a 30-day money-back guarantee on all orders. If you\'re not satisfied, simply return the product in its original condition for a full refund.'
            },
            {
                question: 'Do you ship internationally?',
                answer: 'Yes! We ship to most countries worldwide. International shipping times vary by location, typically 7-14 business days.'
            }
        ],
        layout: 'centered',
        style: 'modern',
        background_color: '#ffffff',
        accent_color: '#3B82F6',
        text_color: '#111827'
    },
    settingsSchema: [
        { key: 'title', type: 'text', label: 'Title', placeholder: 'Frequently Asked Questions' },
        { key: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Find answers to common questions...' },
        {
            key: 'faqs',
            type: 'array',
            label: 'Questions & Answers',
            itemSchema: [
                { key: 'question', type: 'text', label: 'Question', placeholder: 'What is your return policy?' },
                { key: 'answer', type: 'textarea', label: 'Answer', placeholder: 'We offer a 30-day money-back guarantee...', rows: 3 }
            ],
            maxItems: 10
        },
        {
            key: 'layout', type: 'select', label: 'Layout', options: [
                { value: 'centered', label: 'Centered' },
                { value: 'left_aligned', label: 'Left Aligned' },
                { value: 'two_column', label: 'Two Columns' }
            ]
        },
        {
            key: 'style', type: 'select', label: 'Style', options: [
                { value: 'modern', label: 'Modern (Cards)' },
                { value: 'minimal', label: 'Minimal (Lines)' },
                { value: 'bordered', label: 'Bordered' }
            ]
        },
        { key: 'background_color', type: 'color', label: 'Background Color' },
        { key: 'accent_color', type: 'color', label: 'Accent Color' },
        { key: 'text_color', type: 'color', label: 'Text Color' }
    ]
};
