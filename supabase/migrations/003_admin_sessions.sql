-- Admin session tokens — replaces the previous pattern of storing the admin
-- password directly in the `admin_auth` cookie. Session token is random, cookie
-- stores plaintext, database stores SHA-256 hash.
--
-- Apply via: supabase db push  (or paste into Supabase dashboard SQL editor)

create table if not exists admin_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,      -- hex-encoded SHA-256 of the cookie value
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  user_agent text,
  ip text
);

create index if not exists admin_sessions_expires_at_idx on admin_sessions (expires_at);

alter table admin_sessions enable row level security;

-- No policies = no anon/auth-role access. Service role bypasses RLS.
-- This table is server-side-only by design.
