/* eslint-disable */
require('dotenv').config({ path: './.env' });
const { supabaseAdmin } = require('./config/supabase');

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is missing in .env');
    process.exit(1);
}

async function setup() {
    try {
        console.log('--- STORAGE SETUP ---');
        console.log('[*] Checking credentials...');
        console.log('[*] Using Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 15) + '...');

        console.log('[*] Creating "products" bucket...');
        const { data, error } = await supabaseAdmin.storage.createBucket('products', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
        });

        if (error) {
            console.log('[!] Bucket "products" already exists or failed:', error.message);

            if (error.message.includes('already exists')) {
                console.log('[*] Updating bucket to be public...');
                const { error: updateError } = await supabaseAdmin.storage.updateBucket('products', { public: true });
                if (updateError) {
                    console.error('[!] Update Failed:', updateError.message);
                } else {
                    console.log('[+] Bucket updated successfully!');
                }
            }
        } else {
            console.log('[+] Bucket "products" created successfully!');
        }

    } catch (e) {
        console.error('[!] Script Crash:', e);
    }
}

setup();
