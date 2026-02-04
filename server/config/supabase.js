const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('SUPABASE_URL and SUPABASE_ANON_KEY must be provided in .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Administrative client that bypasses RLS
const supabaseAdmin = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : supabase;

module.exports = { supabase, supabaseAdmin };
