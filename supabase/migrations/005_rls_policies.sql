-- 005_rls_policies.sql
-- Pulls current production schema state for pre-existing tables into source control.
-- These tables were created directly in the Supabase dashboard before migrations were in use,
-- so this file uses `CREATE TABLE IF NOT EXISTS` so production is unaffected and a fresh
-- clone can rebuild the schema from migrations alone.
--
-- Captured from gtsnbzfadmhjtubhzcov on 2026-04-24 as part of security sprint 1 (C5).

-- ============================================================
-- invite_codes
-- ============================================================
create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text,
  email text,
  used boolean default false,
  used_at timestamptz,
  renders_used integer default 0,
  max_renders integer default 4,
  created_at timestamptz default now()
);

alter table public.invite_codes enable row level security;

-- No policies on invite_codes: RLS enabled with no policies means only the
-- service_role (which bypasses RLS) can read/write. Anon/authenticated are
-- fully blocked — access goes through server routes using SUPABASE_SERVICE_ROLE_KEY.

-- ============================================================
-- design_records
-- ============================================================
create table if not exists public.design_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null default gen_random_uuid(),
  email text not null,
  design_style text,
  hardiness_zone text,
  render_url text,
  pdf_url text,
  plant_list jsonb,
  full_report jsonb,
  created_at timestamptz default now(),
  reference_number text unique
);

create index if not exists design_records_reference_number_idx
  on public.design_records(reference_number);

alter table public.design_records enable row level security;

-- NOTE (Sprint 2 / H4): allow_select_design_records currently grants anon/authenticated
-- unconditional SELECT access — any user with the Supabase anon key can read every design
-- row including email and full_report. This matches current prod behaviour and is being
-- captured here as-is. Hardening to session-ownership checks is tracked under H4.
drop policy if exists allow_select_design_records on public.design_records;
create policy allow_select_design_records
  on public.design_records
  for select
  to anon, authenticated
  using (true);

drop policy if exists allow_insert_design_records on public.design_records;
create policy allow_insert_design_records
  on public.design_records
  for insert
  to anon, authenticated
  with check (true);

-- ============================================================
-- quote_requests
-- ============================================================
create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  design_record_id uuid references public.design_records(id),
  session_id uuid not null,
  email text not null,
  postcode text not null,
  quotes_requested integer not null check (quotes_requested = any (array[1, 3])),
  confirmation_sent boolean default false,
  created_at timestamptz default now(),
  actioned boolean default false,
  actioned_at timestamptz,
  latitude numeric,
  longitude numeric,
  country text,
  submitted_at timestamptz default now()
);

alter table public.quote_requests enable row level security;

drop policy if exists allow_insert_quote_requests on public.quote_requests;
create policy allow_insert_quote_requests
  on public.quote_requests
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists service_role_select_quote_requests on public.quote_requests;
create policy service_role_select_quote_requests
  on public.quote_requests
  for select
  to service_role
  using (true);

drop policy if exists service_role_update_quote_requests on public.quote_requests;
create policy service_role_update_quote_requests
  on public.quote_requests
  for update
  to service_role
  using (true);

-- ============================================================
-- error_reports
-- ============================================================
create table if not exists public.error_reports (
  id uuid primary key default gen_random_uuid(),
  reference_number text,
  email text,
  error_type text not null,
  user_description text,
  log_snippet text,
  session_id text,
  submitted_at timestamptz default now(),
  status text not null default 'new',
  reviewed_at timestamptz,
  reviewed_by text,
  resolution_note text,
  resolved_at timestamptz
);

alter table public.error_reports enable row level security;

drop policy if exists allow_insert_error_reports on public.error_reports;
create policy allow_insert_error_reports
  on public.error_reports
  for insert
  with check (true);

drop policy if exists service_role_full_access_error_reports on public.error_reports;
create policy service_role_full_access_error_reports
  on public.error_reports
  for all
  using (true)
  with check (true);
