-- =====================================================================
-- Resolute — consolidated migration: "Operator" feature → latest
-- Baseline assumed: state BEFORE the Operator changes (base schema already run).
-- Safe / idempotent. Run ONCE in the Supabase SQL editor.
--
-- Postgres rule: a new enum value cannot be USED in the same transaction that
-- ADDs it. This script therefore adds the enum values first and COMMITs before
-- any statement that uses them. If your client errors on COMMIT (or reports
-- "unsafe use of new value"), run PART 1 by itself first, then run the rest.
-- =====================================================================

-- ── PART 1 — Enum additions ─────────────────────────────────────────────────
-- Operator role (all-in-one portal) + "Out for Delivery" order status.
alter type user_role    add value if not exists 'operator';
alter type order_status add value if not exists 'delivery';

commit;  -- close the implicit transaction so the new values become usable below

-- ── PART 2 — Schema (prerequisite column; pre-Operator, guarded for safety) ──
-- Per-role workflow data: search assignment, screener/examiner docs,
-- delivery method + invoice flag, commitment document, email intake, etc.
alter table public.orders
  add column if not exists workflow jsonb not null default '{}'::jsonb;

-- ── PART 3 — Data: align existing order statuses with their owning role ──────
-- Status is now DERIVED from assigned_to (one stage at a time, fixed order);
-- this clears the legacy 6-step "searching" drift. Idempotent (re-runnable).
update public.orders
set status = (case
  when assigned_to = 'screener' then 'screening'
  when assigned_to = 'examiner' then 'examining'
  when assigned_to = 'typer'    then 'typing'
  when assigned_to = 'delivery' then 'delivery'
  when assigned_to is null      then 'delivered'
  else status::text
end)::order_status;

-- =====================================================================
-- OPTIONAL SEED / DEMO DATA (safe to skip; all idempotent)
-- =====================================================================

-- ── 4a — Operator login (all-in-one portal) ─────────────────────────────────
-- Creates operator@resolute.com / operator123. Skip this block if you prefer
-- to add the user via Authentication → Users, then just set the role (bottom).
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
  'authenticated', 'authenticated', 'operator@resolute.com',
  crypt('operator123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Jordan Blake","role":"operator"}', now(), now()
where not exists (select 1 from auth.users where email = 'operator@resolute.com');

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', now(), now(), now()
from auth.users u
where u.email = 'operator@resolute.com'
  and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');

-- Ensure the profile role (works whether the user was created above or via dashboard).
insert into public.profiles (id, email, name, role)
select id, 'operator@resolute.com', 'Jordan Blake', 'operator'
from auth.users where email = 'operator@resolute.com'
on conflict (id) do update set role = 'operator', name = 'Jordan Blake';

-- ── 4b — Demo: attach screener/examiner docs to RTS-10044 (Files section) ────
update public.orders
set workflow = coalesce(workflow, '{}'::jsonb) || jsonb_build_object(
  'screenerDoc', jsonb_build_object('id','sd44','name','Kings County Chain of Title.pdf','type','pdf'),
  'examinerDoc', jsonb_build_object('id','ed44','name','Examiner Findings - Lien Search.docx','type','word')
)
where id = 'RTS-10044';

-- =====================================================================
-- VERIFY — resulting schema matches the current application codebase
-- =====================================================================
-- Expect user_role to include 'operator'; order_status to include 'delivery'.
select 'user_role'   as enum, array_agg(v order by v) as values
from unnest(enum_range(null::user_role)::text[])   v
union all
select 'order_status', array_agg(v order by v)
from unnest(enum_range(null::order_status)::text[]) v;

-- Expect one row: orders.workflow, jsonb.
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'orders' and column_name = 'workflow';

-- Sanity: current status distribution after realignment.
select assigned_to, status, count(*)
from public.orders group by assigned_to, status order by assigned_to;
