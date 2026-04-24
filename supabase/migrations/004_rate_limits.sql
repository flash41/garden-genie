-- Per-key rate-limiting counters. `key` is a composite of bucket + identifier,
-- e.g. 'analyse:ip:93.184.216.34'. `window_start` rounds down to the bucket
-- boundary so concurrent increments land on the same row.
--
-- Apply via: supabase db push  (or paste into Supabase dashboard SQL editor)

create table if not exists rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (key, window_start)
);

create index if not exists rate_limits_window_idx on rate_limits (window_start);

alter table rate_limits enable row level security;

-- No policies = server-side / service-role access only.

-- Housekeeping: anything older than 24h is irrelevant. A cron or Supabase
-- Scheduled Function can run this nightly; for now, the app purges opportunistically.
--   delete from rate_limits where window_start < now() - interval '24 hours';
