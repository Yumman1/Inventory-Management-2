-- Phase 1: Perfume-Olfactive Notes junction table (many-to-many)
CREATE TABLE perfume_olfactive_notes (
  perfume_id TEXT NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
  olfactive_note_id TEXT NOT NULL REFERENCES olfactive_notes(id) ON DELETE CASCADE,
  PRIMARY KEY (perfume_id, olfactive_note_id)
);

-- Migrate existing JSONB data to junction table
INSERT INTO perfume_olfactive_notes (perfume_id, olfactive_note_id)
SELECT p.id, onotes.id
FROM perfumes p
CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(p.olfactive_notes, '[]'::jsonb)) AS note_name
JOIN olfactive_notes onotes ON onotes.name = note_name;

-- Drop olfactive_notes column from perfumes
ALTER TABLE perfumes DROP COLUMN IF EXISTS olfactive_notes;

-- Phase 2: Batch stock validation function
CREATE OR REPLACE FUNCTION get_batch_available_weight(
  p_perfume_id TEXT,
  p_main_location_id TEXT,
  p_sub_location_id TEXT DEFAULT NULL,
  p_batch_number TEXT DEFAULT NULL
) RETURNS NUMERIC AS $$
DECLARE
  v_batch TEXT;
  v_net NUMERIC;
BEGIN
  v_batch := COALESCE(NULLIF(TRIM(p_batch_number), ''), 'Unknown Batch');

  SELECT COALESCE(SUM(weight), 0) INTO v_net
  FROM (
    SELECT net_weight AS weight FROM gate_in_logs
    WHERE perfume_id = p_perfume_id AND main_location_id = p_main_location_id
      AND (p_sub_location_id IS NULL OR sub_location_id = p_sub_location_id)
      AND COALESCE(NULLIF(TRIM(import_reference), ''), 'Unknown Batch') = v_batch
    UNION ALL
    SELECT -net_weight FROM gate_out_logs
    WHERE perfume_id = p_perfume_id AND main_location_id = p_main_location_id
      AND (p_sub_location_id IS NULL OR sub_location_id = p_sub_location_id)
      AND COALESCE(NULLIF(TRIM(batch_number), ''), 'Unknown Batch') = v_batch
    UNION ALL
    SELECT -net_weight FROM transfer_logs
    WHERE perfume_id = p_perfume_id AND from_main_location_id = p_main_location_id
      AND (p_sub_location_id IS NULL OR from_sub_location_id = p_sub_location_id)
      AND COALESCE(NULLIF(TRIM(batch_number), ''), 'Unknown Batch') = v_batch
    UNION ALL
    SELECT net_weight FROM transfer_logs
    WHERE perfume_id = p_perfume_id AND to_main_location_id = p_main_location_id
      AND (p_sub_location_id IS NULL OR to_sub_location_id = p_sub_location_id)
      AND COALESCE(NULLIF(TRIM(batch_number), ''), 'Unknown Batch') = v_batch
  ) t;

  RETURN v_net;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger function to block gate-out/transfer if insufficient batch stock
CREATE OR REPLACE FUNCTION trg_check_batch_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_available NUMERIC;
  v_main TEXT;
  v_sub TEXT;
  v_batch TEXT;
BEGIN
  v_main := CASE TG_TABLE_NAME
    WHEN 'gate_out_logs' THEN NEW.main_location_id
    WHEN 'transfer_logs' THEN NEW.from_main_location_id
  END;
  v_sub := CASE TG_TABLE_NAME
    WHEN 'gate_out_logs' THEN NEW.sub_location_id
    WHEN 'transfer_logs' THEN NEW.from_sub_location_id
  END;
  v_batch := COALESCE(NULLIF(TRIM(NEW.batch_number), ''), 'Unknown Batch');

  v_available := get_batch_available_weight(NEW.perfume_id, v_main, v_sub, v_batch);

  -- For UPDATE, add back the weight being edited (exclude current row from check)
  IF TG_OP = 'UPDATE' THEN
    v_available := v_available + OLD.net_weight;
  END IF;

  IF v_available < NEW.net_weight THEN
    RAISE EXCEPTION 'Insufficient batch stock: available %.3f, requested %.3f (perfume_id=%, location=%, batch=%)',
      v_available, NEW.net_weight, NEW.perfume_id, v_main, v_batch;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to gate_out_logs
DROP TRIGGER IF EXISTS trg_check_batch_stock_gate_out ON gate_out_logs;
CREATE TRIGGER trg_check_batch_stock_gate_out
  BEFORE INSERT OR UPDATE OF net_weight, perfume_id, main_location_id, sub_location_id, batch_number
  ON gate_out_logs
  FOR EACH ROW EXECUTE FUNCTION trg_check_batch_stock();

-- Attach trigger to transfer_logs
DROP TRIGGER IF EXISTS trg_check_batch_stock_transfer ON transfer_logs;
CREATE TRIGGER trg_check_batch_stock_transfer
  BEFORE INSERT OR UPDATE OF net_weight, perfume_id, from_main_location_id, from_sub_location_id, batch_number
  ON transfer_logs
  FOR EACH ROW EXECUTE FUNCTION trg_check_batch_stock();

-- Phase 3: User auth fields for login
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Seed default admin credentials (email: admin@scentvault.local, password: admin123 - change in production!)
UPDATE users SET email = 'admin@scentvault.local', password_hash = crypt('admin123', gen_salt('bf'))
WHERE id = 'admin-1';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = 'admin-1' AND password_hash IS NOT NULL) THEN
    UPDATE users SET email = 'admin@scentvault.local', password_hash = crypt('admin123', gen_salt('bf'))
    WHERE id = 'admin-1';
  END IF;
END $$;

-- Phase 4: Row Level Security (RLS)
-- Helper to get current app user role (set by backend per request when using anon key)
CREATE OR REPLACE FUNCTION get_app_user_role() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.user_role', true), '')::TEXT;
$$ LANGUAGE sql STABLE;

-- Admin: full access
-- Operator: read master data, write transactions (gate_in, gate_out, transfer), no prices
-- Viewer: read-only

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE olfactive_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfume_olfactive_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_in_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_out_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

-- Admin: full access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "admin_all_suppliers" ON suppliers FOR ALL USING (get_app_user_role() = 'Admin');
CREATE POLICY "admin_all_customers" ON customers FOR ALL USING (get_app_user_role() = 'Admin');
CREATE POLICY "admin_all_packing_types" ON packing_types FOR ALL USING (get_app_user_role() = 'Admin');
CREATE POLICY "admin_all_locations" ON locations FOR ALL USING (get_app_user_role() = 'Admin');
CREATE POLICY "admin_all_olfactive_notes" ON olfactive_notes FOR ALL USING (get_app_user_role() = 'Admin');
CREATE POLICY "admin_all_perfumes" ON perfumes FOR ALL USING (get_app_user_role() = 'Admin');
CREATE POLICY "admin_all_perfume_olfactive_notes" ON perfume_olfactive_notes FOR ALL USING (get_app_user_role() = 'Admin');
CREATE POLICY "admin_all_gate_in" ON gate_in_logs FOR ALL USING (get_app_user_role() = 'Admin');
CREATE POLICY "admin_all_gate_out" ON gate_out_logs FOR ALL USING (get_app_user_role() = 'Admin');
CREATE POLICY "admin_all_transfers" ON transfer_logs FOR ALL USING (get_app_user_role() = 'Admin');
CREATE POLICY "admin_all_users" ON users FOR ALL USING (get_app_user_role() = 'Admin');
CREATE POLICY "admin_all_app_state" ON app_state FOR ALL USING (get_app_user_role() = 'Admin');

-- Operator: read master data, write transactions
CREATE POLICY "operator_read_suppliers" ON suppliers FOR SELECT USING (get_app_user_role() = 'Operator');
CREATE POLICY "operator_read_customers" ON customers FOR SELECT USING (get_app_user_role() = 'Operator');
CREATE POLICY "operator_read_packing_types" ON packing_types FOR SELECT USING (get_app_user_role() = 'Operator');
CREATE POLICY "operator_read_locations" ON locations FOR SELECT USING (get_app_user_role() = 'Operator');
CREATE POLICY "operator_read_olfactive_notes" ON olfactive_notes FOR SELECT USING (get_app_user_role() = 'Operator');
CREATE POLICY "operator_read_perfumes" ON perfumes FOR SELECT USING (get_app_user_role() = 'Operator');
CREATE POLICY "operator_read_perfume_olfactive_notes" ON perfume_olfactive_notes FOR SELECT USING (get_app_user_role() = 'Operator');
CREATE POLICY "operator_write_gate_in" ON gate_in_logs FOR ALL USING (get_app_user_role() = 'Operator');
CREATE POLICY "operator_write_gate_out" ON gate_out_logs FOR ALL USING (get_app_user_role() = 'Operator');
CREATE POLICY "operator_write_transfers" ON transfer_logs FOR ALL USING (get_app_user_role() = 'Operator');
CREATE POLICY "operator_read_users" ON users FOR SELECT USING (get_app_user_role() = 'Operator');
CREATE POLICY "operator_read_app_state" ON app_state FOR SELECT USING (get_app_user_role() = 'Operator');
CREATE POLICY "operator_write_app_state" ON app_state FOR ALL USING (get_app_user_role() = 'Operator'); -- for current user

-- Viewer: read-only
CREATE POLICY "viewer_read_suppliers" ON suppliers FOR SELECT USING (get_app_user_role() = 'Viewer');
CREATE POLICY "viewer_read_customers" ON customers FOR SELECT USING (get_app_user_role() = 'Viewer');
CREATE POLICY "viewer_read_packing_types" ON packing_types FOR SELECT USING (get_app_user_role() = 'Viewer');
CREATE POLICY "viewer_read_locations" ON locations FOR SELECT USING (get_app_user_role() = 'Viewer');
CREATE POLICY "viewer_read_olfactive_notes" ON olfactive_notes FOR SELECT USING (get_app_user_role() = 'Viewer');
CREATE POLICY "viewer_read_perfumes" ON perfumes FOR SELECT USING (get_app_user_role() = 'Viewer');
CREATE POLICY "viewer_read_perfume_olfactive_notes" ON perfume_olfactive_notes FOR SELECT USING (get_app_user_role() = 'Viewer');
CREATE POLICY "viewer_read_gate_in" ON gate_in_logs FOR SELECT USING (get_app_user_role() = 'Viewer');
CREATE POLICY "viewer_read_gate_out" ON gate_out_logs FOR SELECT USING (get_app_user_role() = 'Viewer');
CREATE POLICY "viewer_read_transfers" ON transfer_logs FOR SELECT USING (get_app_user_role() = 'Viewer');
CREATE POLICY "viewer_read_users" ON users FOR SELECT USING (get_app_user_role() = 'Viewer');
CREATE POLICY "viewer_read_app_state" ON app_state FOR SELECT USING (get_app_user_role() = 'Viewer');
