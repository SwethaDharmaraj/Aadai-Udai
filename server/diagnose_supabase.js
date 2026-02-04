const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function diagnose() {
    console.log('--- Supabase Diagnostic ---');
    console.log('URL:', supabaseUrl);

    // 1. Check Connection & Auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('[-] Auth Connection Failed:', authError.message);
    } else {
        console.log('[+] Auth Connection Successful. Found', users.length, 'users.');
    }

    // 2. Check Storage Buckets
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    if (storageError) {
        console.error('[-] Storage Connection Failed:', storageError.message);
    } else {
        console.log('[+] Storage Buckets:', buckets.map(b => b.name));
        const hasProducts = buckets.find(b => b.name === 'products');
        if (!hasProducts) {
            console.warn('[!] MISSING BUCKET: "products" bucket is required for image uploads.');
        } else if (!hasProducts.public) {
            console.warn('[!] BUCKET NOT PUBLIC: "products" bucket should be public for images to show.');
        }
    }

    // 3. Check Tables
    const tables = ['profiles', 'products', 'orders'];
    for (const table of tables) {
        const { error: tableError } = await supabase.from(table).select('id').limit(1);
        if (tableError) {
            console.error(`[-] Table "${table}" access failed:`, tableError.message);
        } else {
            console.log(`[+] Table "${table}" is accessible.`);
        }
    }
}

diagnose();
