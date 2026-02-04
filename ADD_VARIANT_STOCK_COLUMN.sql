-- Add variant_stock column to products table
ALTER TABLE products 
ADD COLUMN variant_stock JSONB DEFAULT '{}'::jsonb;

-- Comment: This column stores stock levels for each size variant
-- Example format: {"S": 10, "M": 5, "L": 0}
