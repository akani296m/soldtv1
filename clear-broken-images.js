import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzpznlecoaumargapikq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6cHpubGVjb2F1bWFyZ2FwaWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzg5MzUsImV4cCI6MjA4MzIxNDkzNX0.Yjy6tYJJDQUuYugf2baAtDuwVxOhfFvYjtvCAp2bXbk';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Clearing broken image references from database...\n');

// Fetch all products
const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, title, images');

if (fetchError) {
    console.error('Error fetching products:', fetchError);
    process.exit(1);
}

console.log(`Found ${products.length} products.\n`);

// Clear images for each product (set to empty array)
for (const product of products) {
    console.log(`Product ${product.id} (${product.title}):`);
    console.log(`  Current images: ${product.images?.length || 0}`);

    const { error: updateError } = await supabase
        .from('products')
        .update({ images: [] })
        .eq('id', product.id);

    if (updateError) {
        console.error(`  ❌ Error updating: ${updateError.message}`);
    } else {
        console.log(`  ✅ Cleared images\n`);
    }
}

console.log('✅ Done! You can now upload new images through the product editor.');
