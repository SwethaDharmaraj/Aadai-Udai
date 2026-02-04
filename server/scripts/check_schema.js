require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { supabase } = require('../config/supabase');

async function check() {
    console.log('Fetching one product...');
    try {
        const { data, error } = await supabase.from('products').select('*').limit(1);
        if (error) {
            console.error('Error:', error);
        } else {
            if (data && data.length > 0) {
                console.log('Sizes type:', typeof data[0].sizes);
                console.log('Sample sizes:', data[0].sizes);
                console.log('Sample row:', JSON.stringify(data[0], null, 2));
            } else {
                console.log('No products found.');
            }
        }
    } catch (err) {
        console.error('Exception:', err);
    }
}

check();
