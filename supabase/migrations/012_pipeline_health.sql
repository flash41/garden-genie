-- 012_pipeline_health.sql
--
-- Heartbeat table for the pipeline-health canary. A singleton row written
-- every minute by a scheduled Inngest function. An external Vercel cron
-- checks the freshness every 5 minutes and emails Steen if the heartbeat
-- has gone stale, catching silent Inngest/Cloudflare outages.

CREATE TABLE IF NOT EXISTS pipeline_health (
  id                    TEXT PRIMARY KEY,
  last_seen_at          TIMESTAMPTZ NOT NULL,
  last_alert_at         TIMESTAMPTZ,
  consecutive_failures  INTEGER NOT NULL DEFAULT 0,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the singleton row so the very first health-check has something to compare.
INSERT INTO pipeline_health (id, last_seen_at)
VALUES ('singleton', NOW())
ON CONFLICT (id) DO NOTHING;
