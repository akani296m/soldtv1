import React from 'react';

/**
 * Rich Text Section Component
 * Simple content section for custom text, announcements, or info
 */
export default function RichTextSection({ settings = {}, basePath = '/store' }) {
    const {
        title = '',
        content = 'Add your content here...',
        text_alignment = 'center',
        background_color = '#ffffff',
        text_color = '#111827',
        padding_y = 'medium' // 'small', 'medium', 'large'
    } = settings;

    const paddingClasses = {
        small: 'py-8',
        medium: 'py-16',
        large: 'py-24'
    };

    const alignmentClasses = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right'
    };

    return (
        <section
            className={`${paddingClasses[padding_y] || paddingClasses.medium} px-6`}
            style={{ backgroundColor: background_color, color: text_color }}
        >
            <div className={`max-w-4xl mx-auto ${alignmentClasses[text_alignment] || alignmentClasses.center}`}>
                {title && (
                    <h2 className="text-3xl font-bold mb-6">{title}</h2>
                )}
                <div
                    className="prose prose-lg max-w-none"
                    style={{ color: text_color }}
                    dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }}
                />
            </div>
        </section>
    );
}

// Section metadata for the editor
RichTextSection.sectionMeta = {
    type: 'rich_text',
    name: 'Rich Text',
    description: 'Add custom text content, announcements, or information',
    icon: 'FileText',
    defaultSettings: {
        title: '',
        content: 'Add your content here...',
        text_alignment: 'center',
        background_color: '#ffffff',
        text_color: '#111827',
        padding_y: 'medium'
    },
    settingsSchema: [
        { key: 'title', type: 'text', label: 'Title (optional)', placeholder: 'Section title...' },
        { key: 'content', type: 'textarea', label: 'Content', placeholder: 'Enter your text...', rows: 6 },
        {
            key: 'text_alignment', type: 'select', label: 'Text Alignment', options: [
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Right' }
            ]
        },
        {
            key: 'padding_y', type: 'select', label: 'Vertical Padding', options: [
                { value: 'small', label: 'Small' },
                { value: 'medium', label: 'Medium' },
                { value: 'large', label: 'Large' }
            ]
        },
        { key: 'background_color', type: 'color', label: 'Background Color' },
        { key: 'text_color', type: 'color', label: 'Text Color' }
    ]
};
