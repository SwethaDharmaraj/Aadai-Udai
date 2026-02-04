const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Testing connection to:', supabaseUrl);

async function test() {
    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing credentials in .env');
        return;
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: profiles, error } = await supabase.from('profiles').select('id').limit(1);

    if (error) {
        console.error('Connection Test Failed:', JSON.stringify(error, null, 2));
    } else {
        console.log('Connection Test Successful! Profiles table found.');
    }

    const { error: prodError } = await supabase.from('products').select('id').limit(1);
    if (prodError) {
        console.log('Products table NOT FOUND or accessible:', prodError.message);
    } else {
        console.log('Products table found!');
    }
}

test();
