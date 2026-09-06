-- 20260906000000_rls_source_control_and_security_fix.sql
--
-- Goal: source-control the RLS policy state for all tables that previously
--       had policies defined only in the dashboard.
--
-- Security fixes included:
--   - error_reports: "service_role_full_access_error_reports" was scoped to
--     PUBLIC role (any anon user could SELECT/UPDATE/DELETE). Fixed to service_role.
--   - waitlist_signups: "service role full access" was scoped to PUBLIC role.
--     Fixed to service_role. All inserts go through API routes with service key.
--
-- Root cause: Supabase dashboard policy editor defaults to PUBLIC when no
-- role is explicitly selected. These policies were created without selecting
-- a role.

-- ============================================================
-- invite_codes
-- ============================================================
-- RLS is enabled. No client-facing policies needed: service_role bypasses
-- RLS automatically. Add explicit policy so intent is clear in the dashboard.
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access" ON public.invite_codes;
CREATE POLICY "service_role_full_access" ON public.invite_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- error_reports
-- ============================================================
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;

-- Public users may submit error reports (INSERT only, no read-back).
DROP POLICY IF EXISTS "allow_insert_error_reports" ON public.error_reports;
CREATE POLICY "allow_insert_error_reports" ON public.error_reports
  FOR INSERT
  TO public
  WITH CHECK (true);

-- FIX: was scoped to PUBLIC — corrected to service_role.
DROP POLICY IF EXISTS "service_role_full_access_error_reports" ON public.error_reports;
CREATE POLICY "service_role_full_access_error_reports" ON public.error_reports
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- pipeline_jobs
-- ============================================================
ALTER TABLE public.pipeline_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to pipeline_jobs" ON public.pipeline_jobs;
CREATE POLICY "Service role full access to pipeline_jobs" ON public.pipeline_jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- waitlist_signups
-- ============================================================
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- FIX: was scoped to PUBLIC — corrected to service_role.
-- All waitlist inserts go through Next.js API routes using the service key.
DROP POLICY IF EXISTS "service role full access" ON public.waitlist_signups;
DROP POLICY IF EXISTS "service_role_full_access" ON public.waitlist_signups;
CREATE POLICY "service_role_full_access" ON public.waitlist_signups
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Remaining tables: ensure RLS is recorded as enabled in migrations.
-- Policies for these tables were set in earlier migrations and are unchanged.
-- ============================================================
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
