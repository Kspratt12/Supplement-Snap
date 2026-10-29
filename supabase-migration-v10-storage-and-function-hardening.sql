-- APPLIED to the LIVE database by the owner on 2026-10-29. This file is the record of what was run. Do NOT run it again
-- on the live database. It is safe to run on a brand new practice database. Undo statements are listed under each section.
-- Nothing here deletes tables, columns, buckets or customer data, and Row Level Security stays on everywhere.

-- ============================================================================
-- 1. Storage: only the person who uploaded a file can replace or delete it
-- ============================================================================
-- Today (supabase-migration-v0-baseline.sql) the update and delete rules for the public "test-uploads" bucket say
-- "any signed-in user, any file". Whether that is exploitable depends on whether the LIVE database also has a rule
-- letting signed-in users read file records. The migration files contain no such rule, but the live database may have
-- one that was added by hand in the Supabase dashboard. BEFORE running this, run the check query below to see.
--
--   select policyname, cmd, roles, qual from pg_policies where schemaname = 'storage' and tablename = 'objects';
--
-- This section is correct either way: it limits replace and delete to the person who uploaded the file, and it gives
-- each person permission to read their own file records. That second part matters: with only the old rules, the app
-- could not delete a person's own photos at all (Postgres needs read permission to find the row to delete).
--
-- Supabase records the uploader on each object. Before running, confirm the column name in your project:
--   select column_name from information_schema.columns where table_schema = 'storage' and table_name = 'objects';
-- Newer projects use owner_id (text). Older ones may only have owner (uuid); if so, replace
-- "owner_id = auth.uid()::text" with "owner = auth.uid()".
--
-- Effect on the app: a person can still delete their own photos (done when they delete a capture or project).
-- A team member deleting a capture that the OWNER uploaded will no longer remove the file from storage;
-- the app already treats file removal as best-effort, so the capture is still deleted and only the file stays.
-- Existing files keep working because their uploader is already recorded.

DROP POLICY IF EXISTS "test_uploads_update" ON storage.objects;
DROP POLICY IF EXISTS "test_uploads_delete" ON storage.objects;

-- Each person can see their own file records (needed to replace or delete them). Public photo links keep working: the
-- bucket is public, so viewing a photo by its link does not go through this rule.
CREATE POLICY "test_uploads_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'test-uploads' AND owner_id = auth.uid()::text);

CREATE POLICY "test_uploads_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'test-uploads' AND owner_id = auth.uid()::text)
  WITH CHECK (bucket_id = 'test-uploads' AND owner_id = auth.uid()::text);

CREATE POLICY "test_uploads_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'test-uploads' AND owner_id = auth.uid()::text);

-- Test: as one signed-in user upload a photo; as a second signed-in user try to delete it (should fail);
-- as the first user delete it (should work).
-- Undo:
--   DROP POLICY "test_uploads_select_own" ON storage.objects;
--   DROP POLICY "test_uploads_update_own" ON storage.objects;
--   DROP POLICY "test_uploads_delete_own" ON storage.objects;
--   CREATE POLICY "test_uploads_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'test-uploads');
--   CREATE POLICY "test_uploads_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'test-uploads');

-- ============================================================================
-- 2. Storage: limit what can be uploaded to the public bucket
-- ============================================================================
-- The bucket has no size or file-type limit, and it is public. Any free account can upload anything to it
-- (large files, or pages served from your storage address). The app only uploads photos, diagram images/PDFs and logos.
-- 15 MB is above a compressed phone photo and above a typical diagram PDF.
-- This only affects NEW uploads; existing files are untouched.
-- Check first that no real use needs another type:
--   select distinct metadata->>'mimetype' from storage.objects where bucket_id = 'test-uploads';

UPDATE storage.buckets
SET file_size_limit = 15728640,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
WHERE id = 'test-uploads';

-- Test: upload a phone photo, a logo and a diagram PDF from the app (should work); a .html or .svg file should be refused.
-- Undo: UPDATE storage.buckets SET file_size_limit = NULL, allowed_mime_types = NULL WHERE id = 'test-uploads';

-- ============================================================================
-- 3. Stop the public from calling the plan-check function directly
-- ============================================================================
-- user_has_paid_access(uuid) is SECURITY DEFINER and is currently callable by anyone through the public API.
-- Verified: with only the public key, a call returns true/false for any user id you give it. That tells a stranger whether a
-- given account has a paid plan (they would need to know the account's id). The app does not call it from the browser; the
-- database triggers use it internally and run with the function owner's rights, so they keep working.

REVOKE EXECUTE ON FUNCTION public.user_has_paid_access(uuid) FROM PUBLIC, anon, authenticated;

-- Test: in the app, create a project and a capture as a free user (the limit triggers should still work).
-- Then call it with the public key; it should now return an error.
-- Undo: GRANT EXECUTE ON FUNCTION public.user_has_paid_access(uuid) TO PUBLIC;
