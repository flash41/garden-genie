-- Migration: public.plan_jobs table
-- Applied by: a human (not by Claude Code — do not auto-apply)
-- Date written: 15 Nov 2026

-- ─── Create table ─────────────────────────────────────────────────────────────

create table if not exists public.plan_jobs (
  id                  uuid        primary key default gen_random_uuid(),

  -- Input
  width_metres        numeric(5,2) not null,
  depth_metres        numeric(5,2) not null,
  camera_facing       text        not null default 'N'
                                  check (camera_facing in ('N','NE','E','SE','S','SW','W','NW')),
  dominant_light      text        not null
                                  check (dominant_light in ('full_sun','part_shade','shade')),
  rhs_hardiness       text        not null
                                  check (rhs_hardiness in ('H1a','H1b','H1c','H2','H3','H4','H5','H6','H7')),
  style_tags          text[]      not null default '{}',

  -- Invite owner (not a FK — invites are not stored as rows)
  invite_code         text        not null,

  -- Pipeline state
  status              text        not null default 'queued'
                                  check (status in (
                                    'queued','generating','validating','repairing',
                                    'done','failed'
                                  )),
  error_message       text,

  -- Results (populated incrementally as the pipeline runs)
  shortlist_ids       text[],                  -- plant IDs that passed shortlisting
  raw_suggestions     jsonb,                   -- raw Gemini output
  validated_suggestions jsonb,                 -- after validate + repair
  shopping_list       jsonb,                   -- final ShoppingItem[]

  -- Inngest correlation
  inngest_event_id    text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.plan_jobs is
  'One row per planting-plan generation request. Status updated by Inngest functions.';

-- ─── updated_at trigger ───────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger plan_jobs_updated_at
  before update on public.plan_jobs
  for each row execute function public.set_updated_at();

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists plan_jobs_invite_idx  on public.plan_jobs (invite_code);
create index if not exists plan_jobs_status_idx  on public.plan_jobs (status);
create index if not exists plan_jobs_created_idx on public.plan_jobs (created_at desc);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

alter table public.plan_jobs enable row level security;

-- No public policies: all access is via the service role key from API routes
-- and Inngest functions. Add policies here if a future UI needs direct client reads.
