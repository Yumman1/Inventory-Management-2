/**
 * Vercel serverless function - handles all /api/* via rewrite.
 * Rewrite sends /api/:path* to /api; Express receives original request path.
 */
// @ts-ignore - built output
import app from '../server/dist/app.js';

export default app;
