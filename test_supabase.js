const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Testing connection to:', supabaseUrl);

async function test() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Test basic connectivity by fetching a single row from a known table (profiles exists)
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

    if (error) {
        console.error('Connection Test Failed:', error);
    } else {
        console.log('Connection Test Successful! Profiles table found.');
    }

    // 2. Test if products table exists
    const { error: prodError } = await supabase.from('products').select('id').limit(1);
    if (prodError) {
        console.log('Products table NOT FOUND or accessible:', prodError.message);
    } else {
        console.log('Products table found!');
    }
}

test();
