// Server-side Supabase client (service role) for serverless functions.
// Bypasses RLS — NEVER import this into browser/src code. Requires the
// service-role key, set as a Vercel env var (SUPABASE_SERVICE_ROLE_KEY).
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

export const hasSupabaseAdmin = Boolean(url && key)

export const supabaseAdmin = hasSupabaseAdmin
  ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  : null
