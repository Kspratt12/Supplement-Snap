-- TEST SCAFFOLDING ONLY. Not a migration. Never run this against a real Supabase project.
--
-- It builds a stand-in for the parts of Supabase that the app's migrations rely on (the login tables and helper
-- functions, the file-storage tables, and the three database roles), inside a throwaway in-memory Postgres.
-- The app's real migration files are then run on top of it, so the real Row Level Security policies, triggers and
-- functions are what gets tested. Differences from real Supabase are listed in __tests__/database-security.test.ts.

CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb
);

-- Same behaviour as Supabase: the signed-in user comes from the request's token claims
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(auth.jwt() ->> 'sub', '')::uuid
$$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT coalesce(auth.jwt() ->> 'role', current_user)
$$;

CREATE TABLE storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  public boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
CREATE TABLE storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text REFERENCES storage.buckets(id),
  name text,
  owner_id text,
  metadata jsonb
);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT string_to_array(regexp_replace(name, '/[^/]*$', ''), '/')
$$;
-- The real storage service records who uploaded each file. This trigger stands in for that.
CREATE FUNCTION storage.set_owner() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN NEW.owner_id := auth.uid()::text; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER set_owner BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.set_owner();

-- Supabase's defaults: the three roles may use the schemas, and table access is then decided by Row Level Security.
GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid(), auth.jwt(), auth.role(), storage.foldername(text) TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO anon, authenticated, service_role;
GRANT SELECT ON auth.users TO service_role;
