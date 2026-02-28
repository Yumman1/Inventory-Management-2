/**
 * Vercel serverless function - catch-all for /api/* routes.
 * Proxies all API requests to the Express app.
 * Requires server to be built first (npm run build:server).
 */
// @ts-ignore - built output
import app from '../server/dist/app.js';

export default app;
