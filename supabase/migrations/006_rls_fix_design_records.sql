-- 006_rls_fix_design_records.sql
-- Sprint 2 / H4: Harden design_records SELECT policy.
--
-- Previously: allow_select_design_records granted unconditional SELECT to
-- anon and authenticated roles, meaning anyone with the Supabase anon key
-- could read every row (email, full_report, render_url, etc.).
--
-- Fix: drop the open policy. service_role bypasses RLS automatically so
-- all server-side reads (API routes using SUPABASE_SERVICE_ROLE_KEY) continue
-- to work without a policy. No client-side code should read design_records
-- directly using the anon key — all access goes through API routes.

drop policy if exists allow_select_design_records on public.design_records;
drop policy if exists allow_insert_design_records on public.design_records;
