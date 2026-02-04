const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addVariantStockColumn() {
    try {
        console.log('Adding variant_stock column to products table...');

        // Execute the SQL to add the column
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
        -- Add variant_stock column to products table if it doesn't exist
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'variant_stock'
          ) THEN
            ALTER TABLE products 
            ADD COLUMN variant_stock JSONB DEFAULT '{}'::jsonb;
            
            RAISE NOTICE 'variant_stock column added successfully';
          ELSE
            RAISE NOTICE 'variant_stock column already exists';
          END IF;
        END $$;
      `
        });

        if (error) {
            console.error('Error executing SQL:', error);
            console.log('\nTrying alternative method...');

            // Alternative: Try using the SQL editor endpoint directly
            console.log('\nPlease run this SQL manually in your Supabase SQL Editor:');
            console.log('---------------------------------------------------');
            console.log(`
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS variant_stock JSONB DEFAULT '{}'::jsonb;

-- Comment: This column stores stock levels for each size variant
-- Example format: {"S": 10, "M": 5, "L": 0}
      `);
            console.log('---------------------------------------------------');
            console.log('\nSteps:');
            console.log('1. Go to https://supabase.com/dashboard/project/qzogudkhuzvcfkrqaoxg/sql/new');
            console.log('2. Paste the SQL above');
            console.log('3. Click "Run"');

            return;
        }

        console.log('✅ Migration completed successfully!');
        console.log('The variant_stock column has been added to the products table.');

    } catch (err) {
        console.error('Unexpected error:', err);
        console.log('\nPlease run this SQL manually in your Supabase SQL Editor:');
        console.log('---------------------------------------------------');
        console.log(`
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS variant_stock JSONB DEFAULT '{}'::jsonb;

-- Comment: This column stores stock levels for each size variant
-- Example format: {"S": 10, "M": 5, "L": 0}
    `);
        console.log('---------------------------------------------------');
    }
}

addVariantStockColumn();
