create table if not exists public.site_events (
  id            bigserial primary key,
  created_at    timestamptz not null default now(),
  event         text not null check (event in ('pageview', 'cta_build_plan')),
  path          text not null check (char_length(path) <= 200),
  referrer_host text check (char_length(referrer_host) <= 200),
  referrer_path text check (char_length(referrer_path) <= 200),
  utm_source    text check (char_length(utm_source) <= 100),
  utm_medium    text check (char_length(utm_medium) <= 100),
  utm_campaign  text check (char_length(utm_campaign) <= 100)
);
create index if not exists site_events_created_at_idx on public.site_events (created_at);
create index if not exists site_events_event_path_created_idx on public.site_events (event, path, created_at);
alter table public.site_events enable row level security;
revoke all on public.site_events from anon, authenticated;
revoke all on sequence public.site_events_id_seq from anon, authenticated;
