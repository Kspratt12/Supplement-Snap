-- SupplementSnap Migration v6: Fix team policies
-- Run in Supabase Dashboard > SQL Editor AFTER v0 through v5.
--
-- The earlier policies looked up the user's email with
--   (SELECT email FROM auth.users WHERE id = auth.uid())
-- but logged-in users cannot read auth.users, so every query on projects,
-- captures and team_members failed with "permission denied for table users".
-- This version reads the email from the login token instead.

DROP POLICY IF EXISTS "projects_team_read" ON projects;
DROP POLICY IF EXISTS "captures_team_read" ON captures;
DROP POLICY IF EXISTS "team_members_member_read" ON team_members;

CREATE POLICY "projects_team_read" ON projects
  FOR SELECT USING (
    user_id IN (
      SELECT owner_id FROM team_members
      WHERE status = 'active'
        AND member_email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "captures_team_read" ON captures
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      WHERE p.user_id IN (
        SELECT owner_id FROM team_members
        WHERE status = 'active'
          AND member_email = (auth.jwt() ->> 'email')
      )
    )
  );

CREATE POLICY "team_members_member_read" ON team_members
  FOR SELECT USING (member_email = (auth.jwt() ->> 'email'));
