-- Optional feature-request / feedback text captured alongside a waitlist signup
alter table waitlist_signups
  add column if not exists feedback text;
