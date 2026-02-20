import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadImage } from '../../../lib/uploadImage';

/**
 * Reusable image uploader component with preview
 */
export default function ImageUploader({
    value,
    onChange,
    label,
    bucket = 'product-images',
    folder = 'storefront',
    aspectRatio = 'aspect-video',
    placeholder = 'Upload an image'
}) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB');
            return;
        }

        try {
            setUploading(true);
            setError(null);

            const result = await uploadImage(file, bucket, folder);

            if (result.error) {
                throw new Error(result.error);
            }

            onChange(result.url);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload image');
        } finally {
            setUploading(false);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = () => {
        onChange('');
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}

            {/* Preview or Upload Area */}
            <div className={`relative ${aspectRatio} bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors`}>
                {value ? (
                    <>
                        <img
                            src={value}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        {/* Overlay with actions */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition"
                                disabled={uploading}
                            >
                                <Upload size={20} />
                            </button>
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition"
                                disabled={uploading}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 transition"
                        disabled={uploading}
                    >
                        {uploading ? (
                            <Loader2 size={32} className="animate-spin mb-2" />
                        ) : (
                            <ImageIcon size={32} className="mb-2 opacity-50" />
                        )}
                        <span className="text-sm">
                            {uploading ? 'Uploading...' : placeholder}
                        </span>
                    </button>
                )}

                {/* Loading overlay */}
                {uploading && value && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader2 size={32} className="animate-spin text-blue-500" />
                    </div>
                )}
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Error message */}
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {/* URL Input fallback */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">or paste URL:</span>
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                />
            </div>
        </div>
    );
}
