import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzpznlecoaumargapikq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6cHpubGVjb2F1bWFyZ2FwaWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzg5MzUsImV4cCI6MjA4MzIxNDkzNX0.Yjy6tYJJDQUuYugf2baAtDuwVxOhfFvYjtvCAp2bXbk';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Testing Supabase Storage configuration...\n');

// Test 1: List all buckets
console.log('1. Listing all storage buckets:');
const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
if (bucketsError) {
    console.error('   Error:', bucketsError);
} else {
    buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (public: ${bucket.public}, id: ${bucket.id})`);
    });
}

// Test 2: Check if product-images bucket exists and its config
console.log('\n2. Checking product-images bucket:');
const productImagesBucket = buckets?.find(b => b.name === 'product-images');
if (productImagesBucket) {
    console.log(`   ✅ Bucket exists`);
    console.log(`   - Public: ${productImagesBucket.public}`);
    console.log(`   - ID: ${productImagesBucket.id}`);

    if (!productImagesBucket.public) {
        console.log(`   ⚠️  WARNING: Bucket is PRIVATE! This is why images return 400 errors.`);
        console.log(`   ⚠️  To fix: Go to Supabase Dashboard → Storage → product-images → Settings → Make bucket public`);
    }
} else {
    console.log(`   ❌ Bucket "product-images" does not exist!`);
}

// Test 3: Try to list files in the products folder
console.log('\n3. Listing files in products/ folder:');
const { data: files, error: filesError } = await supabase.storage
    .from('product-images')
    .list('products', { limit: 10 });

if (filesError) {
    console.error('   Error:', filesError);
} else {
    console.log(`   Found ${files.length} files:`);
    files.forEach(file => {
        console.log(`   - ${file.name}`);
    });
}

// Test 4: Try to get public URL for one of the existing images
if (files && files.length > 0) {
    console.log('\n4. Testing public URL generation:');
    const testFilePath = `products/${files[0].name}`;
    const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(testFilePath);

    console.log(`   Generated URL: ${publicUrl}`);
    console.log(`   Testing accessibility...`);

    try {
        const response = await fetch(publicUrl);
        console.log(`   HTTP Status: ${response.status} (${response.ok ? 'OK' : 'FAILED'})`);
    } catch (error) {
        console.log(`   Fetch error: ${error.message}`);
    }
}
