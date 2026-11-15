-- Migration: add pdf_url to public.plan_jobs
-- Applied by: a human (not by Claude Code — do not auto-apply)
-- Date written: 15 Nov 2026

alter table public.plan_jobs
  add column if not exists pdf_url text;

comment on column public.plan_jobs.pdf_url is
  'Public URL of the generated PDF in Supabase Storage pdfs bucket. '
  'Null until the render/start Inngest function completes.';
