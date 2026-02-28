/**
 * One-time script to set admin@scentvault.local / admin123
 * Run: npx tsx scripts/seed-admin.ts
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or key. Use SUPABASE_SERVICE_ROLE_KEY for best results.');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  const { data, error } = await supabase
    .from('users')
    .update({ email: 'admin@scentvault.local', password_hash: hash })
    .eq('id', 'admin-1')
    .select('id, name, email')
    .single();

  if (error) {
    console.error('Error:', error.message);
    if (error.code === 'PGRST116') {
      console.error('No user with id admin-1 found. Run migration 001 first.');
    }
    process.exit(1);
  }
  console.log('Admin credentials set:', data);
  console.log('Login: admin@scentvault.local / admin123');
}

main();
