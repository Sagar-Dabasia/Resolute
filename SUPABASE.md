# Supabase backend

The app still runs entirely on **mock data** today. This document is the plan
and setup for moving it onto Supabase incrementally, without breaking the
deployed app at any step.

> Architecture: **Vercel** hosts the static SPA; **Supabase** is the backend
> (Postgres + Auth + Storage + Realtime), called directly from the browser with
> the **anon key + Row-Level Security**. No separate server is needed.

## What's in place now (foundation)

| File | Purpose |
|---|---|
| `src/lib/supabase.js` | Single client. Exports `isSupabaseConfigured`; the app falls back to mock when env vars are absent. |
| `supabase/schema.sql` | Tables (`profiles`, `clients`, `orders`, `fulfillments`), enums, triggers, RLS policies, a private `documents` storage bucket, and seed data mirroring the mock. |
| `.env.example` | Template for the two `VITE_` env vars. |

Nothing imports the client yet, so the live app is unchanged.

## One-time setup

1. **Create a project** at [supabase.com](https://supabase.com).
2. **Run the schema:** SQL Editor → paste `supabase/schema.sql` → Run. This
   creates all tables, RLS policies, the storage bucket, and seeds clients/orders.
3. **Create users:** Authentication → Users → add the staff/client accounts (or
   enable email sign-up). A `profiles` row is auto-created per user. Then set
   each one's role:
   ```sql
   update public.profiles set role='admin',  super_admin=true where email='rajni@resolute.com';
   update public.profiles set role='typer'               where email='typer@resolute.com';
   update public.profiles set role='client', client_code='CL01' where email='client@lakewoodtitle.com';
   ```
4. **Set env vars** in both places (values from Project Settings → API):
   - Local: copy `.env.example` → `.env.local`, fill in `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
   - Vercel: Project → Settings → Environment Variables → add the same two.

## Migration roadmap (incremental, one slice at a time)

1. **Auth** — replace the mock `LoginPage`/role-redirect with real Supabase
   Auth; read role/super_admin from `profiles`. (Biggest unlock; secures everything.)
2. **Data-access layer** — route `OrderContext` / `FulfillmentContext` through a
   repository module that reads `isSupabaseConfigured`: mock when off, Supabase
   queries when on. Components keep calling the same hooks.
3. **Storage** — switch the file-upload sections from mock object URLs to
   `documents` bucket uploads (path `orders/<order_id>/<filename>`).
4. **Realtime** — subscribe the client portal to `orders` changes for live
   progress.

Each step is shippable on its own and guarded by `isSupabaseConfigured`, so the
mock app keeps working until every slice is migrated.

## Security notes

- Only the **anon** key goes in the browser (`VITE_*`). The **service_role** key
  must never be committed or exposed client-side.
- RLS is **on** for every table (default-deny). Policies live in `schema.sql`.
- Member-admin "client code only" is currently enforced in the app layer
  (`displayClient`); a column-masked view can harden this at the DB level later.
