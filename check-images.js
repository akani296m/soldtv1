import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzpznlecoaumargapikq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6cHpubGVjb2F1bWFyZ2FwaWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzg5MzUsImV4cCI6MjA4MzIxNDkzNX0.Yjy6tYJJDQUuYugf2baAtDuwVxOhfFvYjtvCAp2bXbk';

const supabase = createClient(supabaseUrl, supabaseKey);

const { data, error } = await supabase
    .from('products')
    .select('id, title, images')
    .order('id', { ascending: true });

if (error) {
    console.error('Error:', error);
} else {
    console.log('Products and their images:');
    data.forEach(product => {
        console.log(`\n--- ${product.title} (ID: ${product.id}) ---`);
        console.log('Images structure:');
        console.log(JSON.stringify(product.images, null, 2));
    });
}
