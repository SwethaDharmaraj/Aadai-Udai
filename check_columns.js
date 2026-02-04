const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });
const { supabaseAdmin } = require('./server/config/supabase');

async function checkColumns() {
    console.log('Checking transactions columns...');
    const { data, error } = await supabaseAdmin
        .from('transactions')
        .select('payment_method, razorpay_order_id')
        .limit(1);

    if (error) {
        console.log('ERROR: Columns missing or API error:', error.message);
    } else {
        console.log('SUCCESS: Columns found.');
    }
}

checkColumns();
