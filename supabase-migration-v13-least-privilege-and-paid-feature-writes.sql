-- PROPOSED. NOT APPLIED. Do not run on the live database until the owner has approved this exact file.
-- SupplementSnap migration v13: least-privilege table grants, and close two direct-write paths around paid features.
--
-- Evidence (read-only catalog queries on production, 2026-11-12):
--   * anon and authenticated each hold SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES and TRIGGER on all 8 public tables
--     (projects, captures, subscriptions, team_members, email_tracking, adjuster_contacts, activity_log, company_settings).
--     There are no grants to PUBLIC. These come from Supabase's default privileges, so Row Level Security is the only guard.
--   * Row Level Security is on for all 8 tables.
--   * company_settings and email_tracking have INSERT/UPDATE policies for "user_id = auth.uid()" for any signed-in user.
--
-- What the app genuinely needs (from the code, see __tests__/database-grants.test.ts):
--   * The browser (role authenticated, using the user's login) writes only projects and captures. It only READS
--     subscriptions, team_members and email_tracking. Everything else is written by server routes with the service_role key,
--     which bypasses Row Level Security and keeps its own grants. Signed-out visitors (anon) use no table directly.
--
-- The two bypasses this closes:
--   1. Custom branding (Pro): POST /api/company-settings checks the plan, but any signed-in user could write company_settings
--      directly through the database API, and the app then shows that logo/name on their PDFs (the read is not plan-checked).
--   2. Email open tracking (Team and above): any signed-in user could insert their own email_tracking row with a token, put that
--      token's pixel in an email they send themselves, and read the opens on their dashboard.
--
-- Nothing here deletes or changes data. Existing rows stay as they are (see the pre-check below).
-- Undo (restores the previous, weaker state) is at the bottom.

BEGIN;

-- A. Signed-out visitors need no table access.
REVOKE ALL ON public.projects, public.captures, public.subscriptions, public.team_members,
              public.email_tracking, public.adjuster_contacts, public.activity_log, public.company_settings
  FROM anon;

-- B. Nobody signed in needs TRUNCATE, TRIGGER or REFERENCES on these tables.
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.projects, public.captures, public.subscriptions, public.team_members,
              public.email_tracking, public.adjuster_contacts, public.activity_log, public.company_settings
  FROM authenticated;

-- C. Signed-in users keep full access (still limited by Row Level Security) to projects and captures only.
--    Elsewhere they can read, and all writes go through the server routes.
REVOKE INSERT, UPDATE, DELETE ON public.subscriptions, public.team_members, public.email_tracking,
              public.company_settings, public.adjuster_contacts, public.activity_log
  FROM authenticated;

-- D. The two policies that allowed the paid-feature bypasses are no longer needed. (The privileges are already removed
--    above; dropping the policies means a future grant cannot silently re-open the path.)
DROP POLICY IF EXISTS "company_settings_insert" ON public.company_settings;
DROP POLICY IF EXISTS "company_settings_update" ON public.company_settings;
DROP POLICY IF EXISTS "email_tracking_insert" ON public.email_tracking;
DROP POLICY IF EXISTS "email_tracking_update" ON public.email_tracking;

COMMIT;

-- E. OPTIONAL, separate decision: stop NEW tables from being created with these broad grants.
--    Applies to tables later created by the postgres role in the SQL editor. After this, every new table needs an explicit GRANT.
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM authenticated;

-- PRE-CHECK (read-only, run first; counts only). Existing rows written by accounts without the plan are NOT removed by this file.
--   select count(*) from company_settings cs where not exists (select 1 from subscriptions s where s.user_id = cs.user_id
--     and s.status in ('active','trialing','past_due') and s.plan in ('pro','enterprise'));
--   select count(*) from email_tracking e where not exists (select 1 from subscriptions s where s.user_id = e.user_id
--     and s.status in ('active','trialing','past_due') and s.plan in ('team','pro','enterprise'));

-- CHECK AFTERWARDS (read-only). Expect anon to have no privileges, authenticated no TRUNCATE/TRIGGER/REFERENCES, and writes only on projects/captures:
--   select c.relname,
--     (select json_agg(p) from unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p where has_table_privilege('anon', c.oid, p)) as anon,
--     (select json_agg(p) from unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p where has_table_privilege('authenticated', c.oid, p)) as authenticated
--   from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r';

-- UNDO (restores the previous state, including the two bypasses). Run only if the app breaks after applying this file:
-- BEGIN;
-- GRANT ALL ON public.projects, public.captures, public.subscriptions, public.team_members, public.email_tracking,
--   public.adjuster_contacts, public.activity_log, public.company_settings TO anon;
-- GRANT ALL ON public.projects, public.captures, public.subscriptions, public.team_members, public.email_tracking,
--   public.adjuster_contacts, public.activity_log, public.company_settings TO authenticated;
-- CREATE POLICY "company_settings_insert" ON public.company_settings FOR INSERT WITH CHECK (user_id = auth.uid());
-- CREATE POLICY "company_settings_update" ON public.company_settings FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- CREATE POLICY "email_tracking_insert" ON public.email_tracking FOR INSERT WITH CHECK (user_id = auth.uid());
-- CREATE POLICY "email_tracking_update" ON public.email_tracking FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- COMMIT;
