# Fix for 'Transaction Not Found' Error

## Problem
The error occurs because your Supabase `transactions` table is missing several columns that the backend is trying to use (like `transaction_id`, `payment_method`, etc.).

```
Confirm Payment Error: Transaction not found in DB
```

## Solution

### Step 1: Fix the Transactions Table

**Go to your Supabase SQL Editor:**
https://supabase.com/dashboard/project/qzogudkhuzvcfkrqaoxg/sql/new

**Paste this SQL and click "Run":**
```sql
-- 1. Add missing columns to transactions table
alter table public.transactions 
add column if not exists payment_method text,
add column if not exists payment_status text default 'pending',
add column if not exists transaction_id text,
add column if not exists razorpay_order_id text,
add column if not exists razorpay_payment_id text,
add column if not exists razorpay_signature text;

-- 2. Force a refresh of the schema cache
NOTIFY pgrst, 'reload config';

-- 3. Update permissions to ensure users can insert/update their transactions
drop policy if exists "Users view own transactions" on transactions;
create policy "Users view own transactions" on transactions for select using ( auth.uid() = user_id );

drop policy if exists "Users can insert transactions" on transactions;
create policy "Users can insert transactions" on transactions for insert with check ( auth.uid() = user_id );

drop policy if exists "Users can update transactions" on transactions;
create policy "Users can update transactions" on transactions for update using ( auth.uid() = user_id );
```

### Step 2: Fix the Products Table (If not already done)
Make sure the `variant_stock` column is also added:
```sql
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS variant_stock JSONB DEFAULT '{}'::jsonb;
```

### Step 3: Test
After running the SQL above, try placing an order again. The transaction should now save correctly and be found during verification.

---

## Why this happened
The database table was created with a basic structure, but as we added more features (Razorpay, size-based stock), we needed more columns. If those columns aren't added to the actual database in Supabase, the backend cannot save the data properly.
