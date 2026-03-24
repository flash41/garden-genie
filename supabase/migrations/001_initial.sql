create table design_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null default gen_random_uuid(),
  email text not null,
  design_style text,
  hardiness_zone text,
  render_url text,
  pdf_url text,
  plant_list jsonb,
  full_report jsonb,
  created_at timestamptz default now()
);

create table quote_requests (
  id uuid primary key default gen_random_uuid(),
  design_record_id uuid references design_records(id),
  session_id uuid not null,
  email text not null,
  postcode text not null,
  quotes_requested integer not null check (quotes_requested in (1, 3)),
  confirmation_sent boolean default false,
  created_at timestamptz default now()
);
