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
        console.log('ERROR (transactions):', error.message);
    } else {
        console.log('SUCCESS: transactions columns found.');
    }

    console.log('Checking cart_items columns...');
    const { data: cData, error: cError } = await supabaseAdmin
        .from('cart_items')
        .select('user_id, product_id, quantity, size')
        .limit(1);

    if (cError) {
        console.log('ERROR (cart_items):', cError.message);
    } else {
        console.log('SUCCESS: cart_items columns found.');
    }
}

checkColumns();
