-- Applied to production 7 Oct 2026 via Supabase MCP. Source control only.
-- Defence in depth: RLS already blocks anon/authenticated, this removes the leftover default table grants too.
revoke all on public.waitlist_signups from anon, authenticated;
