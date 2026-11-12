-- OPTIONAL and SEPARATE from v13. NOT APPLIED. Do not run unless the owner decides to.
-- Stops NEW tables created later by the postgres role (for example in the Supabase SQL editor) from being given broad grants.
-- Existing tables are not touched. After this, every new table needs an explicit GRANT before the app can use it.
-- Tables created by the supabase_admin role (the dashboard table editor) keep the old defaults, because default privileges are per creating role.
--
-- Live default privileges (read-only catalog check, 2026-11-12): postgres and supabase_admin both grant arwdDxtm to anon, authenticated and
-- service_role on new tables in public.

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM authenticated;

-- CHECK AFTERWARDS (read-only):
--   select pg_get_userbyid(defaclrole) as creator, defaclnamespace::regnamespace::text as schema, defaclobjtype::text as obj, defaclacl::text from pg_default_acl;

-- UNDO:
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT TRUNCATE, TRIGGER, REFERENCES ON TABLES TO authenticated;
