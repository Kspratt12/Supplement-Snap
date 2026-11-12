-- PROPOSED. NOT APPLIED. Do not run on the live database until the owner has approved this exact file.
-- SupplementSnap migration v13: least-privilege table grants, and close the direct database paths around two paid features.
--
-- Evidence (read-only catalog queries on production, 2026-11-12):
--   * anon and authenticated each hold SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES and TRIGGER on all 8 public tables
--     (projects, captures, subscriptions, team_members, email_tracking, adjuster_contacts, activity_log, company_settings).
--     No grants to PUBLIC. They come from Supabase's default privileges, so Row Level Security was the only guard.
--   * Row Level Security is on for all 8 tables.
--   * company_settings and email_tracking accept INSERT/UPDATE (and email_tracking SELECT) from any signed-in user for their own rows.
--
-- What the app genuinely needs (from the code; see __tests__/database-grants.test.ts):
--   * The browser (role authenticated, with the user's login) writes only projects and captures. It reads subscriptions, team_members
--     and company_settings (own row, to sign a logo link). Everything else, including every read of email_tracking, goes through
--     server routes with the service_role key, which bypasses Row Level Security and keeps its own grants.
--   * Signed-out visitors (anon) use no table directly. The public email-open pixel (/api/email-track?t=...) runs with the service key.
--
-- The paid-feature paths this closes (together with the code changes in this same pull request, which must be deployed FIRST):
--   1. Custom branding (Pro): the route checked the plan on save, but any signed-in user could write company_settings directly, and
--      the app used any saved row. Code: GET /api/company-settings now returns a row only while the plan includes branding.
--   2. Email open tracking (Team and above): POST /api/email-track/status issued tracking tokens with no plan check, and any
--      signed-in user could insert/update/read their own email_tracking rows directly. Code: that POST now checks the plan, and the
--      dashboard "Emails Opened" count now comes from the plan-checked server route. SQL: no direct access to email_tracking.
--
-- Nothing here deletes or changes data. Existing rows stay as they are; the code above decides whether they are used.
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

-- C. Signed-in users keep full access (still limited by Row Level Security) to projects and captures only. Elsewhere they can read,
--    and all writes go through the server routes. email_tracking is server-only: every read goes through the plan-checked route.
REVOKE INSERT, UPDATE, DELETE ON public.subscriptions, public.team_members, public.company_settings,
              public.adjuster_contacts, public.activity_log
  FROM authenticated;
REVOKE ALL ON public.email_tracking FROM authenticated;

-- D. The policies that allowed the two paid-feature paths are no longer needed. (The privileges are already gone; dropping the
--    policies means a future grant cannot silently re-open the path.)
DROP POLICY IF EXISTS "company_settings_insert" ON public.company_settings;
DROP POLICY IF EXISTS "company_settings_update" ON public.company_settings;
DROP POLICY IF EXISTS "email_tracking_insert" ON public.email_tracking;
DROP POLICY IF EXISTS "email_tracking_update" ON public.email_tracking;
DROP POLICY IF EXISTS "email_tracking_select" ON public.email_tracking;

COMMIT;

-- PRE-CHECK (read-only; counts only; run before applying). Rows that exist for accounts without the plan are NOT removed. After
-- the code in this pull request is deployed they are not used (branding is not returned, tracking is not readable), so these
-- numbers only tell you how many such rows exist:
--   select count(*) from company_settings cs where not exists (select 1 from subscriptions s where s.user_id = cs.user_id
--     and s.status in ('active','trialing','past_due') and s.plan in ('pro','enterprise'));
--   select count(*) from email_tracking e where not exists (select 1 from subscriptions s where s.user_id = e.user_id
--     and s.status in ('active','trialing','past_due') and s.plan in ('team','pro','enterprise'));

-- CHECK AFTERWARDS (read-only). Expect: anon has no privileges; authenticated has no TRUNCATE/TRIGGER/REFERENCES, writes only on
-- projects and captures, SELECT only on subscriptions/team_members/adjuster_contacts/activity_log/company_settings, and nothing on email_tracking:
--   select c.relname,
--     (select json_agg(p) from unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p where has_table_privilege('anon', c.oid, p)) as anon,
--     (select json_agg(p) from unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p where has_table_privilege('authenticated', c.oid, p)) as authenticated,
--     (select json_agg(p) from unnest(array['SELECT','INSERT','UPDATE','DELETE']) p where has_table_privilege('service_role', c.oid, p)) as service_role
--   from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' order by 1;
--   select tablename, policyname, cmd from pg_policies where schemaname = 'public' and tablename in ('company_settings','email_tracking') order by 1, 2;
--   -- expect only company_settings_select; and: select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r';  -- all true

-- UNDO (restores the previous state, including the paid-feature paths). Run only if the app breaks after applying this file:
-- BEGIN;
-- GRANT ALL ON public.projects, public.captures, public.subscriptions, public.team_members, public.email_tracking,
--   public.adjuster_contacts, public.activity_log, public.company_settings TO anon;
-- GRANT ALL ON public.projects, public.captures, public.subscriptions, public.team_members, public.email_tracking,
--   public.adjuster_contacts, public.activity_log, public.company_settings TO authenticated;
-- CREATE POLICY "company_settings_insert" ON public.company_settings FOR INSERT WITH CHECK (user_id = auth.uid());
-- CREATE POLICY "company_settings_update" ON public.company_settings FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- CREATE POLICY "email_tracking_insert" ON public.email_tracking FOR INSERT WITH CHECK (user_id = auth.uid());
-- CREATE POLICY "email_tracking_update" ON public.email_tracking FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- CREATE POLICY "email_tracking_select" ON public.email_tracking FOR SELECT USING (user_id = auth.uid());
-- COMMIT;
