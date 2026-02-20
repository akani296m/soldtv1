import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzpznlecoaumargapikq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6cHpubGVjb2F1bWFyZ2FwaWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzg5MzUsImV4cCI6MjA4MzIxNDkzNX0.Yjy6tYJJDQUuYugf2baAtDuwVxOhfFvYjtvCAp2bXbk';

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to recursively extract the actual URL from nested objects
const extractImageUrl = (item) => {
    if (typeof item === 'string') {
        return item;
    }
    if (item && typeof item === 'object' && item.url) {
        return extractImageUrl(item.url);
    }
    return null;
};

// Fetch all products
const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('*');

if (fetchError) {
    console.error('Error fetching products:', fetchError);
    process.exit(1);
}

console.log(`Found ${products.length} products. Fixing image data...\n`);

// Fix each product's images
for (const product of products) {
    if (!product.images || !Array.isArray(product.images)) {
        console.log(`Skipping product ${product.id} (${product.title}) - no images`);
        continue;
    }

    // Extract actual URLs from nested objects
    const fixedImages = product.images
        .map(img => extractImageUrl(img))
        .filter(url => url !== null);

    console.log(`Product ${product.id} (${product.title}):`);
    console.log(`  Before: ${JSON.stringify(product.images).substring(0, 100)}...`);
    console.log(`  After: ${JSON.stringify(fixedImages)}`);

    // Update the product with fixed images
    const { error: updateError } = await supabase
        .from('products')
        .update({ images: fixedImages })
        .eq('id', product.id);

    if (updateError) {
        console.error(`  ❌ Error updating: ${updateError.message}`);
    } else {
        console.log(`  ✅ Updated successfully\n`);
    }
}

console.log('Done!');
