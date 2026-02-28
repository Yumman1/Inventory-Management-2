import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import { isDatabaseConfigured } from './db.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api', routes);

app.get('/health', (_, res) => res.json({ ok: true, service: 'scentvault-api' }));

if (!isDatabaseConfigured()) {
  console.error('FATAL: Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in server/.env');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`ScentVault API running at http://localhost:${PORT}`);
});
