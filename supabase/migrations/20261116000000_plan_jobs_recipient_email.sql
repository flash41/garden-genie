-- 20261116000000_plan_jobs_recipient_email.sql
-- The garden-render job reads plan_jobs.recipient_email to send the plan-ready
-- email, but no earlier migration created the column. NOT applied to production.
alter table public.plan_jobs
  add column if not exists recipient_email text;

comment on column public.plan_jobs.recipient_email is
  'Optional address for the plan-ready email. Collected on the plan form.';
