-- ROLLBACK for supabase-migration-v11-team-members-owner-read-only.sql. NOT part of the release. Run only to undo v11.
-- Running this puts back the old all-purpose owner rule, which lets an owner add team rows past their plan's seat limit
-- with a hand-made request. Do not run it unless v11 is causing a problem.
-- Nothing here deletes data. It can be run again without harm.

BEGIN;

DROP POLICY IF EXISTS "team_members_owner_read" ON team_members;
DROP POLICY IF EXISTS "team_members_owner" ON team_members;

CREATE POLICY "team_members_owner" ON team_members
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

COMMIT;

-- Check afterwards (read only). Expect exactly two rows: team_members_member_read (SELECT) and team_members_owner (ALL).
--   select policyname, cmd, qual, with_check from pg_policies where schemaname = 'public' and tablename = 'team_members' order by 1;
