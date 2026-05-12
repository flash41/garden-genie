-- 011_pipeline_jobs_recipient_email.sql
--
-- Adds recipient_email + session_id + delivery columns to pipeline_jobs so the
-- Inngest pipeline can email the customer when their plan is ready, even if
-- they close the browser tab mid-render. This is the safety net that prevents
-- a paid customer ever being abandoned by a slow render.

ALTER TABLE pipeline_jobs
  ADD COLUMN IF NOT EXISTS recipient_email   TEXT,
  ADD COLUMN IF NOT EXISTS session_id        TEXT,
  ADD COLUMN IF NOT EXISTS design_style      TEXT,
  ADD COLUMN IF NOT EXISTS hardiness_zone    TEXT,
  ADD COLUMN IF NOT EXISTS reference_number  TEXT,
  ADD COLUMN IF NOT EXISTS email_sent_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_send_error  TEXT;

CREATE INDEX IF NOT EXISTS pipeline_jobs_session_id_idx ON pipeline_jobs (session_id);
