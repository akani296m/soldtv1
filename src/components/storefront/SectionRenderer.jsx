import React from 'react';
import { getSectionComponent, SECTION_TYPES } from './sections';

/**
 * Section Renderer Component
 * Dynamically renders an array of sections based on their type and settings
 * 
 * @param {Object} props
 * @param {Array} props.sections - Array of section objects to render
 * @param {string} props.basePath - Base path for links (e.g., '/store' or '/s/merchant-slug')
 * @param {Array} props.products - Products array for product-related sections
 * @param {boolean} props.productsLoading - Loading state for products
 * @param {boolean} props.isEditing - Whether we're in editor mode (shows hidden sections faded)
 * @param {string} props.selectedSectionId - ID of currently selected section (for editor highlighting)
 * @param {function} props.onSectionClick - Callback when a section is clicked (for editor)
 */
export default function SectionRenderer({
    sections = [],
    basePath = '/store',
    products = [],
    productsLoading = false,
    isEditing = false,
    selectedSectionId = null,
    onSectionClick = null
}) {
    // Sort sections by position and filter hidden ones (unless editing)
    // Note: announcement_bar sections are excluded here as they're rendered by StorefrontLayout above the header
    const visibleSections = sections
        .filter(section => {
            // Always exclude announcement bars in non-edit mode (they render in layout)
            if (!isEditing && section.type === 'announcement_bar') {
                return false;
            }
            return isEditing || section.visible;
        })
        .sort((a, b) => a.position - b.position);

    if (visibleSections.length === 0) {
        if (!isEditing) return null;
        return (
            <div className="min-h-[400px] flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                    <p className="text-lg font-medium">No sections to display</p>
                    <p className="text-sm mt-1">Add sections using the editor</p>
                </div>
            </div>
        );
    }

    /**
     * Get additional props for specific section types
     */
    const getSectionProps = (sectionType) => {
        switch (sectionType) {
            case SECTION_TYPES.FEATURED_PRODUCTS:
                return {
                    products,
                    productsLoading
                };
            default:
                return {};
        }
    };

    return (
        <div className="bg-white">
            {visibleSections.map((section) => {
                const SectionComponent = getSectionComponent(section.type);
                const isSelected = selectedSectionId === section.id;
                const isHidden = !section.visible;
                const additionalProps = getSectionProps(section.type);

                if (!SectionComponent) {
                    console.warn(`[SectionRenderer] Unknown section type: ${section.type}`);
                    if (!isEditing) return null;

                    return (
                        <div
                            key={section.id}
                            className={`
                                border border-dashed border-amber-300 bg-amber-50 text-amber-800 rounded-lg p-4 my-2
                                ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}
                                ${onSectionClick ? 'cursor-pointer' : ''}
                            `}
                            onClick={() => onSectionClick && onSectionClick(section.id)}
                        >
                            <p className="text-sm font-medium">Unknown section: {section.type}</p>
                            <p className="text-xs mt-1">This section type is not registered and will be skipped on storefront.</p>
                        </div>
                    );
                }

                // Wrapper for editor mode interactions
                if (isEditing) {
                    return (
                        <div
                            key={section.id}
                            className={`
                                relative transition-all duration-200
                                ${isHidden ? 'opacity-40' : ''}
                                ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}
                                ${onSectionClick ? 'cursor-pointer' : ''}
                            `}
                            onClick={() => onSectionClick && onSectionClick(section.id)}
                        >
                            {/* Hidden indicator badge */}
                            {isHidden && (
                                <div className="absolute top-2 right-2 z-10 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                                    Hidden
                                </div>
                            )}

                            {/* Section type label for editor */}
                            <div className="absolute top-2 left-2 z-10 bg-blue-500 text-white text-xs px-2 py-1 rounded capitalize">
                                {section.type.replace(/_/g, ' ')}
                            </div>

                            <SectionComponent
                                settings={section.settings}
                                basePath={basePath}
                                {...additionalProps}
                            />
                        </div>
                    );
                }

                // Normal render mode
                return (
                    <SectionComponent
                        key={section.id}
                        settings={section.settings}
                        basePath={basePath}
                        {...additionalProps}
                    />
                );
            })}
        </div>
    );
}
