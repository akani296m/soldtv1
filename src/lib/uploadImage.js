import { supabase } from './supabase';

/**
 * Uploads an image file to Supabase Storage and returns the public URL
 * @param {File} file - The image file to upload
 * @param {string} bucket - The storage bucket name (default: 'product-images')
 * @param {string} folder - The folder path within the bucket (default: 'products')
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadImage(file, bucket = 'product-images', folder = 'products') {
    try {
        // Generate a unique filename to avoid collisions
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        // Upload the file to Supabase Storage
        const { data, error } = await supabase.storage
            .from(bucket) // Use the provided bucket name
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Upload error:', error);
            return { success: false, error: error.message };
        }

        // Get the public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return { success: true, url: publicUrl };
    } catch (err) {
        console.error('Upload exception:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Deletes an image from Supabase Storage
 * @param {string} imageUrl - The public URL of the image to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteImage(imageUrl) {
    try {
        // Extract the file path from the public URL
        const urlParts = imageUrl.split('/product-images/');
        if (urlParts.length < 2) {
            return { success: false, error: 'Invalid image URL' };
        }

        const filePath = urlParts[1];

        const { error } = await supabase.storage
            .from('product-images')
            .remove([filePath]);

        if (error) {
            console.error('Delete error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('Delete exception:', err);
        return { success: false, error: err.message };
    }
}
