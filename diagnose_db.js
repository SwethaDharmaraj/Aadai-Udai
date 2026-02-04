const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });
const { supabaseAdmin } = require('./server/config/supabase');

async function checkTables() {
    const tables = ['profiles', 'products', 'orders', 'order_items', 'cart_items', 'transactions', 'reviews'];
    console.log('--- TABLE DIAGNOSTICS ---');
    for (const table of tables) {
        const { error } = await supabaseAdmin.from(table).select('count', { count: 'exact', head: true });
        if (error) {
            console.log(`[MISSING] ${table}: ${error.message} (code: ${error.code})`);
        } else {
            console.log(`[EXISTS ] ${table}`);
        }
    }
}

checkTables();
