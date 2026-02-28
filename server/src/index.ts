import app from './app.js';
import { isDatabaseConfigured } from './db.js';

const PORT = process.env.PORT || 4000;

if (!isDatabaseConfigured()) {
  console.error('FATAL: Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in server/.env');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`ScentVault API running at http://localhost:${PORT}`);
});
