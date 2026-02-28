<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/19BO8_OI_sX3USRYVtBJEvHxp7FHl8gBt

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install` (and `cd server && npm install` for the backend)
2. **Database (required):** Set up Supabase and configure `server/.env` – see [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
3. Run the app: `npm run dev` (or `npm start` for both frontend and backend)

## Deploy on Vercel

1. Push your code to GitHub and [import the project](https://vercel.com/new) in Vercel
2. Add these **Environment Variables** in Vercel (Project Settings → Environment Variables):
   - `SUPABASE_URL` – your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` – your Supabase service role key (or `SUPABASE_ANON_KEY`)
3. Deploy – Vercel will run `npm run build` (builds server + frontend) and deploy
4. The API is served at `/api/*` on the same domain (no CORS)
