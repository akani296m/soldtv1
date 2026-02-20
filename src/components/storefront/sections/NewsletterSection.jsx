import React, { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

/**
 * Newsletter/Email Capture Section Component
 * Dark banner with email signup form
 */
export default function NewsletterSection({ settings = {}, basePath = '/store' }) {
    const {
        title = 'Join the Movement',
        subtitle = 'Sign up for our newsletter and get 15% off your first order, plus early access to new drops.',
        button_text = 'Sign Up',
        placeholder_text = 'Enter your email',
        background_color = '#000000',
        text_color = '#ffffff',
        success_message = 'Thanks for subscribing!'
    } = settings;

    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            setErrorMessage('Please enter a valid email address');
            setStatus('error');
            return;
        }

        setStatus('loading');

        // TODO: Integrate with email service (Mailchimp, ConvertKit, etc.)
        // For now, simulate a successful submission
        await new Promise(resolve => setTimeout(resolve, 1000));

        setStatus('success');
        setEmail('');

        // Reset after 3 seconds
        setTimeout(() => {
            setStatus('idle');
        }, 3000);
    };

    return (
        <section
            className="py-24 px-6 text-center"
            style={{
                backgroundColor: background_color,
                color: text_color
            }}
        >
            <h2 className="text-3xl font-bold mb-6">{title}</h2>
            {subtitle && (
                <p
                    className="max-w-xl mx-auto mb-8"
                    style={{ opacity: 0.7 }}
                >
                    {subtitle}
                </p>
            )}

            {status === 'success' ? (
                <div className="flex items-center justify-center gap-2 text-green-400">
                    <CheckCircle size={24} />
                    <span className="text-lg font-medium">{success_message}</span>
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto"
                >
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (status === 'error') setStatus('idle');
                        }}
                        placeholder={placeholder_text}
                        className="px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded focus:outline-none focus:border-white w-full"
                        disabled={status === 'loading'}
                    />
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="bg-white text-black px-6 py-3 font-bold rounded hover:bg-gray-200 transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {status === 'loading' ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Signing up...
                            </>
                        ) : (
                            button_text
                        )}
                    </button>
                </form>
            )}

            {status === 'error' && errorMessage && (
                <p className="mt-4 text-red-400 text-sm">{errorMessage}</p>
            )}
        </section>
    );
}

// Section metadata for the editor
NewsletterSection.sectionMeta = {
    type: 'newsletter',
    name: 'Newsletter Signup',
    description: 'Email capture section with signup form',
    icon: 'Mail',
    defaultSettings: {
        title: 'Join the Movement',
        subtitle: 'Sign up for our newsletter and get 15% off your first order, plus early access to new drops.',
        button_text: 'Sign Up',
        placeholder_text: 'Enter your email',
        background_color: '#000000',
        text_color: '#ffffff',
        success_message: 'Thanks for subscribing!'
    },
    settingsSchema: [
        { key: 'title', type: 'text', label: 'Headline', placeholder: 'Join the Movement' },
        { key: 'subtitle', type: 'textarea', label: 'Description', placeholder: 'Tell visitors why they should subscribe...' },
        { key: 'button_text', type: 'text', label: 'Button Text', placeholder: 'Sign Up' },
        { key: 'placeholder_text', type: 'text', label: 'Input Placeholder', placeholder: 'Enter your email' },
        { key: 'success_message', type: 'text', label: 'Success Message', placeholder: 'Thanks for subscribing!' },
        { key: 'background_color', type: 'color', label: 'Background Color' },
        { key: 'text_color', type: 'color', label: 'Text Color' }
    ]
};
