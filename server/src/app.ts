import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api', routes);

app.get('/health', (_, res) => res.json({ ok: true, service: 'scentvault-api' }));

export default app;
