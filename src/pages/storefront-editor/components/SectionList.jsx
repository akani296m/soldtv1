import React from 'react';
import {
    GripVertical,
    Eye,
    EyeOff,
    Trash2,
    Copy,
    ChevronRight,
    Image,
    Grid,
    Mail,
    Shield,
    FileText,
    ImageIcon,
    Plus,
    Lock
} from 'lucide-react';

// Icon mapping for section types
const SECTION_ICONS = {
    hero: Image,
    featured_products: Grid,
    newsletter: Mail,
    trust_badges: Shield,
    rich_text: FileText,
    image_banner: ImageIcon
};

/**
 * Section List Component
 * Displays list of sections with drag handle, visibility toggle, and actions
 */
export default function SectionList({
    sections = [],
    selectedSectionId = null,
    onSelectSection,
    onToggleVisibility,
    onDuplicateSection,
    onRemoveSection,
    onReorder,
    onAddSection
}) {
    const sortedSections = [...sections].sort((a, b) => a.position - b.position);

    // Simple drag and drop handling
    const handleDragStart = (e, index) => {
        e.dataTransfer.setData('dragIndex', index.toString());
        e.currentTarget.classList.add('opacity-50');
    };

    const handleDragEnd = (e) => {
        e.currentTarget.classList.remove('opacity-50');
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-blue-50');
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('bg-blue-50');
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-blue-50');
        const dragIndex = parseInt(e.dataTransfer.getData('dragIndex'));
        if (dragIndex !== dropIndex && onReorder) {
            onReorder(dragIndex, dropIndex);
        }
    };

    return (
        <div className="space-y-2">
            {/* Section List */}
            {sortedSections.map((section, index) => {
                const IconComponent = SECTION_ICONS[section.type] || FileText;
                const isSelected = selectedSectionId === section.id;
                const isVisible = section.visible;
                const isLocked = !!section.is_locked;

                return (
                    <div
                        key={section.id}
                        draggable={!isLocked}
                        onDragStart={!isLocked ? (e) => handleDragStart(e, index) : undefined}
                        onDragEnd={!isLocked ? handleDragEnd : undefined}
                        onDragOver={!isLocked ? handleDragOver : undefined}
                        onDragLeave={!isLocked ? handleDragLeave : undefined}
                        onDrop={!isLocked ? (e) => handleDrop(e, index) : undefined}
                        className={`
                            group flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer
                            ${isSelected
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                            }
                            ${!isVisible ? 'opacity-60' : ''}
                        `}
                        onClick={() => onSelectSection && onSelectSection(section.id)}
                    >
                        {/* Drag Handle */}
                        {isLocked ? (
                            <div className="text-gray-400">
                                <Lock size={14} />
                            </div>
                        ) : (
                            <div
                                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <GripVertical size={16} />
                            </div>
                        )}

                        {/* Section Icon */}
                        <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center
                            ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}
                        `}>
                            <IconComponent size={16} />
                        </div>

                        {/* Section Name */}
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate capitalize ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                {section.type.replace(/_/g, ' ')}
                            </p>
                            {section.settings?.title && (
                                <p className="text-xs text-gray-500 truncate">
                                    {section.settings.title}
                                </p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Visibility Toggle */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleVisibility && onToggleVisibility(section.id);
                                }}
                                className={`p-1.5 rounded hover:bg-gray-100 ${isVisible ? 'text-gray-500' : 'text-orange-500'}`}
                                title={isVisible ? 'Hide section' : 'Show section'}
                            >
                                {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>

                            {!isLocked && (
                                <>
                                    {/* Duplicate */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDuplicateSection && onDuplicateSection(section.id);
                                        }}
                                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                                        title="Duplicate section"
                                    >
                                        <Copy size={14} />
                                    </button>

                                    {/* Delete */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Are you sure you want to remove this section?')) {
                                                onRemoveSection && onRemoveSection(section.id);
                                            }
                                        }}
                                        className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-500"
                                        title="Remove section"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Selection Arrow */}
                        <ChevronRight
                            size={16}
                            className={`transition-transform ${isSelected ? 'text-blue-500 rotate-90' : 'text-gray-300'}`}
                        />
                    </div>
                );
            })}

            {/* Add Section Button */}
            <button
                onClick={onAddSection}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
            >
                <Plus size={18} />
                <span className="text-sm font-medium">Add Section</span>
            </button>

            {/* Empty State */}
            {sortedSections.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No sections yet</p>
                    <p className="text-xs mt-1">Click "Add Section" to get started</p>
                </div>
            )}
        </div>
    );
}
