-- Allow anon role full access to all tables (for backend using anon key)
-- Use SUPABASE_SERVICE_ROLE_KEY instead to bypass RLS if you prefer

DROP POLICY IF EXISTS "anon_suppliers" ON suppliers;
CREATE POLICY "anon_suppliers" ON suppliers FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_customers" ON customers;
CREATE POLICY "anon_customers" ON customers FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_packing_types" ON packing_types;
CREATE POLICY "anon_packing_types" ON packing_types FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_locations" ON locations;
CREATE POLICY "anon_locations" ON locations FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_olfactive_notes" ON olfactive_notes;
CREATE POLICY "anon_olfactive_notes" ON olfactive_notes FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_perfumes" ON perfumes;
CREATE POLICY "anon_perfumes" ON perfumes FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_perfume_olfactive_notes" ON perfume_olfactive_notes;
CREATE POLICY "anon_perfume_olfactive_notes" ON perfume_olfactive_notes FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_gate_in_logs" ON gate_in_logs;
CREATE POLICY "anon_gate_in_logs" ON gate_in_logs FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_gate_out_logs" ON gate_out_logs;
CREATE POLICY "anon_gate_out_logs" ON gate_out_logs FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_transfer_logs" ON transfer_logs;
CREATE POLICY "anon_transfer_logs" ON transfer_logs FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_users_full" ON users;
CREATE POLICY "anon_users_full" ON users FOR ALL TO anon USING (true) WITH CHECK (true);
