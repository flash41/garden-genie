-- Migration: add staged statuses, render/pdf paths, photo_path, location, and
-- site model columns to public.plan_jobs
-- Applied by: a human (not by Claude Code -- do not auto-apply)
-- Date written: 15 Nov 2026

-- Separate status columns for each pipeline stage
alter table public.plan_jobs
  add column if not exists planting_status text not null default 'queued'
    check (planting_status in ('queued','running','complete','failed')),
  add column if not exists render_status text not null default 'queued'
    check (render_status in ('queued','running','complete','failed')),
  add column if not exists pdf_status text not null default 'queued'
    check (pdf_status in ('queued','running','complete','failed'));

-- Per-stage error columns
alter table public.plan_jobs
  add column if not exists planting_error text,
  add column if not exists render_error text,
  add column if not exists pdf_error text;

-- Storage paths (not public URLs -- signed links are generated at read time)
alter table public.plan_jobs
  add column if not exists photo_path text,
  add column if not exists render_path text,
  add column if not exists pdf_path text;

-- Site model columns (server-recomputed, not browser-sent)
alter table public.plan_jobs
  add column if not exists hemisphere text not null default 'north'
    check (hemisphere in ('north','south')),
  add column if not exists boundary_heights jsonb,
  add column if not exists location text;

-- Corner points (normalised 0-1 image coordinates)
alter table public.plan_jobs
  add column if not exists corners jsonb;

comment on column public.plan_jobs.planting_status is
  'Status of the planting pipeline step. queued|running|complete|failed.';
comment on column public.plan_jobs.render_status is
  'Status of the garden render (image) step. queued|running|complete|failed.';
comment on column public.plan_jobs.pdf_status is
  'Status of the PDF generation step. queued|running|complete|failed.';
comment on column public.plan_jobs.photo_path is
  'Storage path of the uploaded garden photo in the pipeline-assets bucket.';
comment on column public.plan_jobs.render_path is
  'Storage path of the rendered garden image in the pipeline-assets bucket.';
comment on column public.plan_jobs.pdf_path is
  'Storage path of the generated PDF in the pipeline-assets bucket.';
