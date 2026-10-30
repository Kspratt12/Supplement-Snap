-- PROPOSED. NOT RUN on the live database. Review it, then run it once in the Supabase SQL editor. Nothing here deletes data.
-- SupplementSnap migration v11 (FORWARD): owners can read their team list, but no longer write it directly.
--
-- This file changes the database in one direction only. It contains no undo statements. The undo is a separate file,
-- supabase-migration-v11-ROLLBACK-restore-owner-writes.sql, and it does nothing unless someone runs it on purpose.
--
-- Why: since v4 the rule "team_members_owner" lets any signed-in owner insert, change or delete their own team rows straight
-- through the public API. The invite screen enforces the plan's seat limit (MAX_INVITES in lib/plan.ts) inside /api/team, but
-- the database never did, so a paying owner could add members past their plan with a hand-made request. A listed member
-- counts as paid in the database (user_has_paid_access), so this also widened who the database treats as paid.
--
-- What changes: the all-purpose owner rule is replaced by a read-only one.
--   Still works: inviting and removing members, and turning a pending invite into an active one. /api/team and lib/plan.ts do
--   those writes with the server's service key, which is not subject to these rules. The browser only reads this table.
--   Still works: a member reading their own membership row (team_members_member_read, untouched), which is what lets a
--   member see the owner's projects.
--   Stops working: an owner inserting, updating or deleting team rows with their own login from the browser or the public API.
--
-- What this does NOT do: it does not count seats in the database, so it is not a complete seat guarantee.
--   - The seat check in /api/team and the insert that follows are separate steps. Two invites sent at the same moment can
--     both pass the check, so the plan could be exceeded by a small amount. Duplicate rows for one address are possible the same way.
--   - Rows that already exist are left as they are. If an owner added extra members before this ran, they stay.
--   - A plan downgrade does not remove members.
--
-- It can be run again without harm.

BEGIN;

DROP POLICY IF EXISTS "team_members_owner" ON team_members;
DROP POLICY IF EXISTS "team_members_owner_read" ON team_members;

CREATE POLICY "team_members_owner_read" ON team_members
  FOR SELECT USING (owner_id = auth.uid());

COMMIT;

-- Check afterwards (read only). Expect exactly two rows, both SELECT: team_members_member_read and team_members_owner_read.
--   select policyname, cmd, qual, with_check from pg_policies where schemaname = 'public' and tablename = 'team_members' order by 1;
