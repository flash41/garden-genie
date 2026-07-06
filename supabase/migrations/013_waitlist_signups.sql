-- Waitlist signups captured via the /design gate
create table if not exists waitlist_signups (
  id          bigserial primary key,
  email       text        not null unique,
  created_at  timestamptz not null default now(),
  source      text        not null default 'design_gate'
);

-- Allow the service-role key used by the API to insert/upsert
alter table waitlist_signups enable row level security;

create policy "service role full access"
  on waitlist_signups
  for all
  using (true)
  with check (true);
