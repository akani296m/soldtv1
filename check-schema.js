import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzpznlecoaumargapikq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6cHpubGVjb2F1bWFyZ2FwaWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzg5MzUsImV4cCI6MjA4MzIxNDkzNX0.Yjy6tYJJDQUuYugf2baAtDuwVxOhfFvYjtvCAp2bXbk';

const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch one product to see the actual schema
const { data, error } = await supabase
    .from('products')
    .select('*')
    .limit(1);

if (error) {
    console.error('Error:', error);
} else {
    console.log('Sample product data:');
    console.log(JSON.stringify(data[0], null, 2));
    console.log('\nAvailable columns:');
    if (data[0]) {
        console.log(Object.keys(data[0]).join(', '));
    }
}
