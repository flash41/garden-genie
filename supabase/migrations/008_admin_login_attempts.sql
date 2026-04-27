-- Migration: 008_admin_login_attempts
-- Sprint 3 — M2 (admin lockout)
--
-- Tracks failed admin login attempts per IP for lockout enforcement.
-- Independent of rate_limits to keep concerns separate and give us
-- an audit trail of admin auth activity.

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ip            text        NOT NULL,
  attempted_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for fast per-IP lookups within a time window
CREATE INDEX IF NOT EXISTS admin_login_attempts_ip_time_idx
  ON admin_login_attempts (ip, attempted_at DESC);

-- RLS: service_role only — this table is never touched by anon clients
ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;

-- No policies — service_role bypasses RLS. Anon/authenticated get nothing.

-- Auto-clean: delete attempts older than 1 hour so the table stays small.
-- Called from the auth route on each login attempt (best-effort).
CREATE OR REPLACE FUNCTION purge_old_admin_login_attempts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM admin_login_attempts
  WHERE attempted_at < now() - interval '1 hour';
$$;
