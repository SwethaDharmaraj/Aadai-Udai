# Fix for variant_stock Column Error

## Problem
The error occurs because the `variant_stock` column doesn't exist in your Supabase `products` table:
```
Could not find the 'variant_stock' column of 'products' in the schema cache
```

## Solution

### Step 1: Add the Missing Column

**Go to your Supabase SQL Editor:**
https://supabase.com/dashboard/project/qzogudkhuzvcfkrqaoxg/sql/new

**Run this SQL:**
```sql
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS variant_stock JSONB DEFAULT '{}'::jsonb;
```

### Step 2: Verify the Column Was Added

**Run this query to check:**
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'products'
ORDER BY ordinal_position;
```

You should see `variant_stock` with type `jsonb` in the results.

### Step 3: Test the Update

After adding the column, try updating a product again from your admin panel. The error should be resolved.

## What is variant_stock?

The `variant_stock` column stores stock levels for each size variant of a product as a JSON object:

**Example:**
```json
{
  "S": 10,
  "M": 5,
  "L": 0,
  "XL": 15
}
```

This allows you to track inventory for each size separately, which is more accurate than just having a total stock count.

## Why This Happened

The column was defined in a separate migration file (`ADD_VARIANT_STOCK_COLUMN.sql`) but wasn't included in the main schema file. The migration was never run on your database, so the column doesn't exist yet.

I've now updated the main schema file (`server/supabase_schema.sql`) to include this column for future reference.
