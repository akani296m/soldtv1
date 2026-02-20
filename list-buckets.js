import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzpznlecoaumargapikq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6cHpubGVjb2F1bWFyZ2FwaWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzg5MzUsImV4cCI6MjA4MzIxNDkzNX0.Yjy6tYJJDQUuYugf2baAtDuwVxOhfFvYjtvCAp2bXbk';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Listing ALL storage buckets...\n');

const { data: buckets, error } = await supabase.storage.listBuckets();

if (error) {
    console.error('Error:', error);
} else {
    if (buckets.length === 0) {
        console.log('No buckets found!');
    } else {
        console.log(`Found ${buckets.length} bucket(s):\n`);
        buckets.forEach((bucket, i) => {
            console.log(`${i + 1}. Name: ${bucket.name}`);
            console.log(`   ID: ${bucket.id}`);
            console.log(`   Public: ${bucket.public}`);
            console.log(`   Created: ${bucket.created_at}`);
            console.log('');
        });
    }
}
