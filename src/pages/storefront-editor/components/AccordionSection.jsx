import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Collapsible accordion section for the editor sidebar
 */
export default function AccordionSection({
    title,
    icon: Icon,
    children,
    defaultOpen = false,
    badge = null
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            {/* Header */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {Icon && <Icon size={18} className="text-gray-600" />}
                    <span className="font-medium text-gray-800">{title}</span>
                    {badge && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                            {badge}
                        </span>
                    )}
                </div>
                <ChevronDown
                    size={18}
                    className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Content */}
            <div
                className={`transition-all duration-200 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="p-4 space-y-4 border-t border-gray-100">
                    {children}
                </div>
            </div>
        </div>
    );
}
