-- 20261114000000_phase0_storage_and_function_lockdown.sql
--
-- Phase 0 security pass (14 Nov 2026).
--
-- 1. storage.objects had three INSERT policies scoped to PUBLIC that let
--    anyone holding the public (anon) key upload straight into the `pdfs`
--    and `renders` buckets. The app never uploads from the browser: every
--    upload goes through an API route using the service-role key, which
--    bypasses RLS. The policies are therefore unused and are dropped.
-- 2. Both buckets had no size or file-type limits. Added.
-- 3. public.check_invite_code (SECURITY DEFINER) was callable by anyone via
--    /rest/v1/rpc and is not used by the app. It allowed unlimited guessing
--    of invite codes. Public execute is revoked.

DROP POLICY IF EXISTS "Service role upload" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_upload_pdfs" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_upload_renders" ON storage.objects;

UPDATE storage.buckets
   SET file_size_limit = 20971520,
       allowed_mime_types = ARRAY['application/pdf']
 WHERE id = 'pdfs';

UPDATE storage.buckets
   SET file_size_limit = 20971520,
       allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp']
 WHERE id = 'renders';

REVOKE EXECUTE ON FUNCTION public.check_invite_code(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_invite_code(text) TO service_role;
