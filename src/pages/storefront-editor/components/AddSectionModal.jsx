import React from 'react';
import { X, Image, Grid, Mail, Shield, FileText, ImageIcon, LayoutList, Package, HelpCircle, Megaphone, Scale } from 'lucide-react';
import { getAvailableSections, PAGE_TYPE_CONFIG } from '../../../components/storefront/sections';

// Icon mapping for section types
const SECTION_ICONS = {
    hero: Image,
    featured_products: Grid,
    newsletter: Mail,
    trust_badges: Shield,
    rich_text: FileText,
    image_banner: ImageIcon,
    catalog_header: LayoutList,
    product_trust: Shield,
    related_products: Package,
    faq: HelpCircle,
    announcement_bar: Megaphone,
    us_vs_them: Scale
};

/**
 * Add Section Modal
 * Displays available section types to add, filtered by page type
 */
export default function AddSectionModal({ isOpen, onClose, onAddSection, pageType = 'home' }) {
    if (!isOpen) return null;

    // Get sections available for the current page type
    const availableSections = getAvailableSections(pageType);
    const pageConfig = PAGE_TYPE_CONFIG[pageType];

    const handleAddSection = (type) => {
        onAddSection(type);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Add Section</h2>
                        <p className="text-sm text-gray-500">
                            Choose a section for your {pageConfig?.label.toLowerCase() || 'page'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Section Types Grid */}
                <div className="p-6 grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                    {availableSections.map((section) => {
                        const IconComponent = SECTION_ICONS[section.type] || FileText;

                        return (
                            <button
                                key={section.type}
                                onClick={() => handleAddSection(section.type)}
                                className="flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group text-left"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                                    <IconComponent
                                        size={24}
                                        className="text-gray-600 group-hover:text-blue-600"
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="font-medium text-gray-900 text-sm">
                                        {section.name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                        {section.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="w-full py-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
