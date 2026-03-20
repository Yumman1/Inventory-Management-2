-- Fix: Disable RLS on all tables
-- Run this in Supabase Dashboard > SQL Editor if you get "new row violates row-level security policy"
-- Your backend uses the service role key, but if RLS was enabled and 005 wasn't applied, inserts fail.

ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE packing_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE olfactive_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE perfumes DISABLE ROW LEVEL SECURITY;
ALTER TABLE perfume_olfactive_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE gate_in_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE gate_out_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_state DISABLE ROW LEVEL SECURITY;
