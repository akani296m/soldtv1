import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzpznlecoaumargapikq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6cHpubGVjb2F1bWFyZ2FwaWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzg5MzUsImV4cCI6MjA4MzIxNDkzNX0.Yjy6tYJJDQUuYugf2baAtDuwVxOhfFvYjtvCAp2bXbk';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Creating product-images storage bucket...\n');

// Note: Creating buckets via the anon key may not work due to permissions
// You might need to do this via the Supabase Dashboard instead

const { data, error } = await supabase.storage.createBucket('product-images', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
});

if (error) {
    console.error('❌ Error creating bucket:', error);
    console.log('\n⚠️  The anon API key likely doesn\'t have permission to create buckets.');
    console.log('📝 Please create the bucket manually in the Supabase Dashboard:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/zzpznlecoaumargapikq/storage/buckets');
    console.log('   2. Click "New bucket"');
    console.log('   3. Name it: product-images');
    console.log('   4. Make it PUBLIC (important!)');
    console.log('   5. Click "Create bucket"');
} else {
    console.log('✅ Bucket created successfully!');
    console.log('   Data:', data);
}
