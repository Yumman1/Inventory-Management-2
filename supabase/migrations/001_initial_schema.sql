-- ScentVault Database Schema for Supabase (PostgreSQL)
-- Run this in Supabase SQL Editor or via supabase db push

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Suppliers
CREATE TABLE suppliers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  contact_person TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('Local', 'International')),
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Packing Types
CREATE TABLE packing_types (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  qty_per_packing INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations
CREATE TABLE locations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Main Location', 'Sub Location')),
  parent_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Olfactive Notes (global library)
CREATE TABLE olfactive_notes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Perfumes
CREATE TABLE perfumes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  dosage NUMERIC DEFAULT 0,
  price_usd NUMERIC DEFAULT 0,
  price_pkr NUMERIC DEFAULT 0,
  low_stock_alert NUMERIC DEFAULT 0,
  olfactive_notes JSONB DEFAULT '[]'::jsonb,
  remarks TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gate In Logs
CREATE TABLE gate_in_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date DATE NOT NULL,
  perfume_id TEXT NOT NULL REFERENCES perfumes(id) ON DELETE RESTRICT,
  import_reference TEXT NOT NULL,
  packing_type_id TEXT NOT NULL REFERENCES packing_types(id) ON DELETE RESTRICT,
  packing_qty NUMERIC NOT NULL,
  net_weight NUMERIC NOT NULL,
  main_location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  sub_location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
  supplier_invoice TEXT DEFAULT '',
  remarks TEXT DEFAULT '',
  price_usd NUMERIC,
  price_pkr NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gate Out Logs
CREATE TABLE gate_out_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date DATE NOT NULL,
  perfume_id TEXT NOT NULL REFERENCES perfumes(id) ON DELETE RESTRICT,
  packing_type_id TEXT NOT NULL REFERENCES packing_types(id) ON DELETE RESTRICT,
  packing_qty NUMERIC NOT NULL,
  net_weight NUMERIC NOT NULL,
  main_location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  sub_location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
  usage TEXT NOT NULL CHECK (usage IN ('Production', 'Sale')),
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  remarks TEXT DEFAULT '',
  batch_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transfer Logs
CREATE TABLE transfer_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date DATE NOT NULL,
  perfume_id TEXT NOT NULL REFERENCES perfumes(id) ON DELETE RESTRICT,
  packing_type_id TEXT NOT NULL REFERENCES packing_types(id) ON DELETE RESTRICT,
  packing_qty NUMERIC NOT NULL,
  net_weight NUMERIC NOT NULL,
  from_main_location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  from_sub_location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
  to_main_location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  to_sub_location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
  remarks TEXT DEFAULT '',
  batch_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (app-level, not Supabase Auth)
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Operator', 'Viewer')),
  permissions JSONB DEFAULT '{"canViewPrices": false, "allowedLocationIds": []}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- App state (current user selection, etc.)
CREATE TABLE app_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default admin user and olfactive notes
INSERT INTO users (id, name, role, permissions) VALUES
  ('admin-1', 'Super Admin', 'Admin', '{"canViewPrices": true, "allowedLocationIds": []}'::jsonb);

INSERT INTO app_state (key, value) VALUES
  ('current_user_id', '"admin-1"'::jsonb);

INSERT INTO olfactive_notes (name) VALUES
  ('Fruity'), ('Floral'), ('Oud'), ('Woody'), ('Citrus');

-- RLS: Use SUPABASE_SERVICE_ROLE_KEY in backend - it bypasses RLS for full access.
-- If using anon key, no policies = no access (safe default).
