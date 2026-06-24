# Deploying Resolute Portal to Vercel

The app is a static **Vite + React** single-page app. Vercel hosts it directly —
no server required. (The backend, when added, will be Supabase: Postgres + Auth +
Storage + Realtime, called straight from the browser with the anon key + RLS.)

## One-time setup (Vercel dashboard)

1. Go to **vercel.com → Add New → Project** and import the GitHub repo
   `Sagar-Dabasia/Resolute`.
2. Vercel auto-detects the framework from `vercel.json`:
   - **Framework Preset:** Vite
   - **Build Command:** `vite build` (default)
   - **Output Directory:** `dist` (default)
   - **Install Command:** `npm install` (default)
3. Click **Deploy**. First build takes ~1–2 min; you get a live URL.

That's it. No env vars are needed yet (the app currently runs on mock data).

## How routing works

`vercel.json` rewrites every path to `/index.html` so React Router can handle
client-side routes. Without this, refreshing or deep-linking to a route like
`/typer/order/RTS-10048` would 404. The rewrite fixes that.

## Branch behavior

- **Production:** every push/merge to `main` deploys to the production URL.
- **Previews:** every PR gets its own preview URL automatically — great for
  reviewing each role's screens before merging.

## When the Supabase backend is added (later phase)

Set these in **Vercel → Project → Settings → Environment Variables** (never commit them):

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | the **anon** public key (safe for the browser with RLS on) |

Only the `VITE_`-prefixed vars are exposed to the client build, which is exactly
what we want for the anon key. The service-role key must **never** be put here —
it stays server-side (Supabase Edge Functions / Vercel serverless functions).

## Local build sanity check

```bash
npm install
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```
