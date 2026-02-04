-- 1. OPEN SUPABASE DASHBOARD -> SQL EDITOR
-- 2. RUN THIS SCRIPT TO FIX THE TRANSACTIONS TABLE

-- Add missing columns to transactions table if they don't exist
alter table public.transactions 
add column if not exists payment_method text,
add column if not exists payment_status text default 'pending',
add column if not exists transaction_id text,
add column if not exists razorpay_order_id text,
add column if not exists razorpay_payment_id text,
add column if not exists razorpay_signature text;

-- Force a refresh of the schema cache so Supabase API sees the new columns
NOTIFY pgrst, 'reload config';

-- Double check permissions
alter table public.transactions enable row level security;

-- Re-apply policies just in case
drop policy if exists "Users view own transactions" on transactions;
create policy "Users view own transactions" on transactions for select using ( auth.uid() = user_id );

drop policy if exists "Users can insert transactions" on transactions;
create policy "Users can insert transactions" on transactions for insert with check ( auth.uid() = user_id );

drop policy if exists "Users can update transactions" on transactions;
create policy "Users can update transactions" on transactions for update using ( auth.uid() = user_id );
