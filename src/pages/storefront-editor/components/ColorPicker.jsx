import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Convert HEX color to RGBA string
 * @param {string} hex - Hex color code (e.g., #ffffff)
 * @param {number} opacity - Opacity value from 0 to 100
 * @returns {string} - RGBA color string
 */
function hexToRgba(hex, opacity) {
    // Handle invalid or empty hex values
    if (!hex || hex.length < 7) return `rgba(0, 0, 0, ${opacity / 100})`;

    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

/**
 * Extract hex and opacity from an RGBA string
 * @param {string} rgba - RGBA color string
 * @returns {{ hex: string, opacity: number }}
 */
function rgbaToHexOpacity(rgba) {
    if (!rgba) return { hex: '#000000', opacity: 100 };

    // If it's already a hex value, return it with full opacity
    if (rgba.startsWith('#')) {
        return { hex: rgba, opacity: 100 };
    }

    // Parse rgba(r, g, b, a) format
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return { hex: '#000000', opacity: 100 };

    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const a = match[4] ? parseFloat(match[4]) : 1;

    const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    return { hex, opacity: Math.round(a * 100) };
}

/**
 * Advanced Color Picker Component
 * Features:
 * - Native browser color picker for full color selection
 * - Editable HEX input field
 * - Optional opacity slider with RGBA output
 * - Quick preset colors for convenience
 * - Live preview updates
 */
export default function ColorPicker({
    value,
    onChange,
    label,
    showOpacity = false,
    opacity: externalOpacity,
    onOpacityChange
}) {
    const [showPresets, setShowPresets] = useState(false);

    // Parse the value to get hex and opacity
    const { hex: parsedHex, opacity: parsedOpacity } = rgbaToHexOpacity(value);
    const [localHex, setLocalHex] = useState(parsedHex);
    const [localOpacity, setLocalOpacity] = useState(externalOpacity ?? parsedOpacity);

    // Sync local state when value prop changes
    useEffect(() => {
        const { hex, opacity } = rgbaToHexOpacity(value);
        setLocalHex(hex);
        if (externalOpacity === undefined) {
            setLocalOpacity(opacity);
        }
    }, [value, externalOpacity]);

    // Update opacity from external prop
    useEffect(() => {
        if (externalOpacity !== undefined) {
            setLocalOpacity(externalOpacity);
        }
    }, [externalOpacity]);

    // Quick preset colors
    const presetColors = [
        '#000000', '#FFFFFF', '#374151', '#6B7280',
        '#EF4444', '#F97316', '#EAB308', '#22C55E',
        '#14B8A6', '#3B82F6', '#6366F1', '#8B5CF6',
        '#EC4899', '#F43F5E', '#0EA5E9', '#06B6D4'
    ];

    // Handle color change from native picker
    const handleColorChange = (newHex) => {
        setLocalHex(newHex);
        if (showOpacity || externalOpacity !== undefined) {
            const rgbaValue = hexToRgba(newHex, localOpacity);
            onChange(rgbaValue);
        } else {
            onChange(newHex);
        }
    };

    // Handle hex input change
    const handleHexInputChange = (inputValue) => {
        // Allow partial input while typing
        setLocalHex(inputValue);

        // Only update parent if valid hex
        if (/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
            if (showOpacity || externalOpacity !== undefined) {
                const rgbaValue = hexToRgba(inputValue, localOpacity);
                onChange(rgbaValue);
            } else {
                onChange(inputValue);
            }
        }
    };

    // Handle opacity change
    const handleOpacityChange = (newOpacity) => {
        const opacityNum = parseInt(newOpacity);
        setLocalOpacity(opacityNum);

        if (onOpacityChange) {
            onOpacityChange(opacityNum);
        } else {
            const rgbaValue = hexToRgba(localHex, opacityNum);
            onChange(rgbaValue);
        }
    };

    // Handle preset color selection
    const handlePresetSelect = (presetColor) => {
        setLocalHex(presetColor);
        if (showOpacity || externalOpacity !== undefined) {
            const rgbaValue = hexToRgba(presetColor, localOpacity);
            onChange(rgbaValue);
        } else {
            onChange(presetColor);
        }
    };

    // Generate preview background
    const previewBackground = showOpacity || externalOpacity !== undefined
        ? hexToRgba(localHex, localOpacity)
        : localHex;

    return (
        <div className="space-y-2">
            {/* Label */}
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}

            {/* Main Color Picker Row */}
            <div className="flex items-center gap-2">
                {/* Native Color Picker (styled as a swatch) */}
                <div className="relative">
                    <div
                        className="w-10 h-10 rounded-lg border-2 border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:border-gray-300 transition"
                        style={{
                            backgroundColor: previewBackground,
                            // Checkered background for transparency preview
                            backgroundImage: showOpacity ?
                                `linear-gradient(45deg, #ccc 25%, transparent 25%), 
                                 linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                                 linear-gradient(45deg, transparent 75%, #ccc 75%), 
                                 linear-gradient(-45deg, transparent 75%, #ccc 75%)` : 'none',
                            backgroundSize: showOpacity ? '8px 8px' : 'auto',
                            backgroundPosition: showOpacity ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto'
                        }}
                    >
                        {/* Overlay the actual color on top of checkered background */}
                        {showOpacity && (
                            <div
                                className="absolute inset-0"
                                style={{ backgroundColor: previewBackground }}
                            />
                        )}
                    </div>
                    <input
                        type="color"
                        value={localHex}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Pick a color"
                    />
                </div>

                {/* HEX Input Field */}
                <input
                    type="text"
                    value={localHex.toUpperCase()}
                    onChange={(e) => handleHexInputChange(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent font-mono uppercase"
                    maxLength={7}
                />

                {/* Toggle Presets Button */}
                <button
                    type="button"
                    onClick={() => setShowPresets(!showPresets)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    title={showPresets ? 'Hide presets' : 'Show presets'}
                >
                    {showPresets ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>

            {/* Opacity Slider - Only if showOpacity is true */}
            {showOpacity && (
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Opacity</span>
                        <span className="text-xs text-gray-700 font-medium">{localOpacity}%</span>
                    </div>
                    <div className="relative">
                        {/* Opacity slider track background - shows gradient from transparent to solid */}
                        <div
                            className="absolute inset-0 h-2 rounded-lg overflow-hidden"
                            style={{
                                background: `linear-gradient(to right, transparent, ${localHex})`,
                            }}
                        />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={localOpacity}
                            onChange={(e) => handleOpacityChange(e.target.value)}
                            className="relative w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm"
                        />
                    </div>
                </div>
            )}

            {/* Preset Colors Grid */}
            {showPresets && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Quick colors:</p>
                    <div className="grid grid-cols-8 gap-2">
                        {presetColors.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => handlePresetSelect(color)}
                                className={`
                                    w-6 h-6 rounded-md border-2 transition hover:scale-110
                                    ${localHex.toUpperCase() === color ? 'border-gray-800 ring-2 ring-gray-300' : 'border-gray-200'}
                                `}
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
