# Supabase Database Setup (ScentVault)

This guide explains how to connect ScentVault to a Supabase PostgreSQL database.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose your organization, name the project, set a database password, and pick a region
4. Wait for the project to be provisioned

## 2. Run the Database Migrations

1. In the Supabase Dashboard, open **SQL Editor**
2. Run `supabase/migrations/001_initial_schema.sql` first
3. Then run `supabase/migrations/002_schema_upgrades.sql`

This creates all tables including:
- Core: suppliers, customers, packing_types, locations, perfumes, olfactive_notes, perfume_olfactive_notes (junction), gate_in_logs, gate_out_logs, transfer_logs, users, app_state
- Batch stock validation trigger
- RLS policies for Admin, Operator, Viewer roles

## 3. Get Your API Keys

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy:
   - **Project URL**
   - **service_role** key (recommended for backend – bypasses Row Level Security)
   - Or **anon** key if you prefer a less privileged key

## 4. Configure the Backend

1. Copy `server/.env.example` to `server/.env`
2. Fill in your values:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

PORT=4000
```

3. Run the app: `npm start` (or `npm run dev` in the server folder)

## 5. Default Login

After running the migrations, use:
- **Email:** admin@scentvault.local
- **Password:** admin123

Change the password in production via the Users management (Admin only).

## Required

The backend **requires** Supabase. If credentials are missing, the server will exit with an error.
