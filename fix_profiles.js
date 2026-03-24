const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });
const { supabaseAdmin } = require('./server/config/supabase');

async function fixProfilesTable() {
    console.log('Fixing profiles table...');

    // Add is_active column if it doesn't exist
    // Note: Supabase JS library doesn't support ALTER TABLE directly.
    // We have to use the SQL editor or a workaround.
    // However, we can try to find if it exists first.

    const { data, error } = await supabaseAdmin.from('profiles').select('is_active').limit(1);

    if (error && error.code === 'PGRST204') {
        console.log('is_active column missing. You need to run this in Supabase SQL Editor:');
        console.log('ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT TRUE;');
    } else if (error) {
        console.log('Error checking column:', error.message);
    } else {
        console.log('is_active column already exists.');
    }
}

fixProfilesTable();
