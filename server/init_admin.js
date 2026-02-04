/* eslint-disable */
require('dotenv').config({ path: './.env' });
const { supabaseAdmin } = require('./config/supabase');

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
    console.error('[!] ADMIN_EMAIL or ADMIN_PASSWORD missing in .env');
    process.exit(1);
}

async function initAdmin() {
    console.log(`[*] Initializing Admin Account: ${email}`);

    try {
        // 1. Check if user exists in Auth
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (user) {
            console.log('[*] Admin user already exists in Auth. Updating password and verification...');
            const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                user.id,
                {
                    password: password,
                    email_confirm: true,
                    user_metadata: { role: 'admin', name: 'Admin User' }
                }
            );
            if (updateError) throw updateError;
            console.log('[+] Auth user updated.');
        } else {
            console.log('[*] Creating new Admin user...');
            const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { role: 'admin', name: 'Admin User' }
            });
            if (createError) throw createError;
            user = data.user;
            console.log('[+] Admin user created.');
        }

        // 2. Ensure Profile exists with 'admin' role
        console.log('[*] Updating Profile role...');
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: user.id,
                email: email,
                name: 'Admin User',
                role: 'admin',
                phone: '0000000000'
            });

        if (profileError) {
            // If schema doesn't match exactly, try minimal update
            console.warn('[!] Full profile upsert failed, trying minimal role update:', profileError.message);
            const { error: retryError } = await supabaseAdmin
                .from('profiles')
                .update({ role: 'admin' })
                .eq('id', user.id);
            if (retryError) throw retryError;
        }

        console.log('[+] Admin Setup Complete!');
        console.log(`[+] Login with: ${email} / ${password}`);

    } catch (err) {
        console.error('[!] Admin Init Failed:', err.message);
    }
}

initAdmin();
