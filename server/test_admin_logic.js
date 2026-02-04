/* eslint-disable */
require('dotenv').config({ path: './.env' });
const { supabaseAdmin } = require('./config/supabase');

async function test() {
    console.log('--- ADMIN LOGIC TEST ---');
    console.log('URL defined:', !!process.env.SUPABASE_URL);
    console.log('Service Role Key defined:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    // 1. Dashboard Stats (Simulates exports.dashboard)
    try {
        console.log('\n[*] Testing Dashboard Queries...');
        // Users Count
        const { count: uCount, error: uError } = await supabaseAdmin
            .from('profiles')
            .select('id', { count: 'exact', head: true });

        if (uError) console.error('[-] Users Count Error:', uError.message);
        else console.log('[+] Users Count:', uCount);

        // Products Count
        const { count: pCount, error: pError } = await supabaseAdmin
            .from('products')
            .select('id', { count: 'exact', head: true });

        if (pError) console.error('[-] Products Count Error:', pError.message);
        else console.log('[+] Products Count:', pCount);

    } catch (e) {
        console.error('[-] Dashboard Exception:', e.message);
        if (e.message.includes('relation') && e.message.includes('does not exist')) {
            console.error('\n[CRITICAL] DATABASE TABLES MISSING! "profiles" table not found.');
            console.error('PLEASE RUN THE "server/supabase_schema.sql" IN SUPABASE DASHBOARD.');
        }
    }

    // 2. Storage Upload (Simulates exports.createProduct upload)
    try {
        console.log('\n[*] Testing Storage Upload (products bucket)...');
        const fileName = `test_upload_${Date.now()}.txt`;
        const fileContent = Buffer.from('Hello Supabase');

        const { data, error } = await supabaseAdmin.storage
            .from('products')
            .upload(fileName, fileContent, {
                contentType: 'text/plain',
                upsert: true
            });

        if (error) {
            console.error('[-] Upload Error:', error.message);
            if (error.message.includes('not found')) {
                console.log('    (Hint: Does the bucket "products" exist?)');
            }
        } else {
            console.log('[+] Upload Success:', data.path);

            // Get Public URL
            const { data: urlData } = supabaseAdmin.storage.from('products').getPublicUrl(fileName);
            console.log('[+] Public URL:', urlData.publicUrl);

            // Cleanup
            await supabaseAdmin.storage.from('products').remove([fileName]);
            console.log('[+] Test file cleaned up.');
        }
    } catch (e) { console.error('[-] Upload Exception:', e.message); }
}

test();
