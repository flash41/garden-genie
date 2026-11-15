-- Migration: public.plants table
-- Applied by: a human (not by Claude Code — do not auto-apply)
-- Date written: 15 Nov 2026

-- ─── Create table ─────────────────────────────────────────────────────────────

create table if not exists public.plants (
  id                  text        primary key,                       -- e.g. 'p001'
  botanical_name      text        not null,
  common_name         text        not null,
  plant_type          text        not null check (plant_type in (
                                    'Tree','Shrub','Perennial','Annual','Grass',
                                    'Groundcover','Climber','Fern','Bamboo','Bulb'
                                  )),
  rhs_hardiness       text        not null check (rhs_hardiness in (
                                    'H1a','H1b','H1c','H2','H3','H4','H5','H6','H7'
                                  )),
  usda_zone_min       smallint    not null check (usda_zone_min between 1 and 13),
  usda_zone_max       smallint    not null check (usda_zone_max between 1 and 13),
  light               text[]      not null,  -- values: 'full_sun','part_shade','shade'
  soil                text[]      not null,  -- values: 'Clay','Sandy','Loam','Chalky','Peaty','Silty'
  moisture            text        not null,
  height_m            numeric(5,2) not null,
  spread_m            numeric(5,2) not null,
  evergreen           boolean     not null default false,
  season_of_interest  text[]      not null, -- 'spring','summer','autumn','winter'
  style_tags          text[]      not null default '{}',
  description         text,
  native_regions      text[]      not null default '{}',
  source_urls         text[]      not null default '{}',
  reviewed            boolean     not null default false,
  created_at          timestamptz not null default now()
);

comment on table public.plants is
  'Curated plant database. All rows start with reviewed=false. '
  'Server-side reads use the service role; no public RLS policies.';

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists plants_rhs_hardiness_idx on public.plants (rhs_hardiness);
create index if not exists plants_light_gin_idx     on public.plants using gin (light);
create index if not exists plants_style_tags_gin_idx on public.plants using gin (style_tags);
create index if not exists plants_plant_type_idx    on public.plants (plant_type);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

alter table public.plants enable row level security;

-- No public policies: server-side code uses the service role key which bypasses RLS.
-- Add policies here if future UI needs direct client reads.
