-- Run this in Supabase Dashboard > SQL Editor
-- v4: Lock down RLS policies — replace permissive "all" policies with user_id scoping

-- ============================================================
-- 1. adjuster_contacts — user_id = auth.uid()
-- ============================================================
DROP POLICY IF EXISTS "adjuster_contacts_all" ON adjuster_contacts;

CREATE POLICY "adjuster_contacts_select" ON adjuster_contacts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "adjuster_contacts_insert" ON adjuster_contacts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "adjuster_contacts_update" ON adjuster_contacts
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "adjuster_contacts_delete" ON adjuster_contacts
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- 2. activity_log — user_id = auth.uid()
-- ============================================================
DROP POLICY IF EXISTS "activity_log_all" ON activity_log;

CREATE POLICY "activity_log_select" ON activity_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "activity_log_insert" ON activity_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 3. company_settings — user_id = auth.uid()
-- ============================================================
DROP POLICY IF EXISTS "company_settings_all" ON company_settings;

CREATE POLICY "company_settings_select" ON company_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "company_settings_insert" ON company_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "company_settings_update" ON company_settings
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 4. team_members — owner can manage, members can read their own invites
-- ============================================================
DROP POLICY IF EXISTS "team_members_all" ON team_members;

CREATE POLICY "team_members_owner" ON team_members
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "team_members_member_read" ON team_members
  FOR SELECT USING (member_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ============================================================
-- 5. email_tracking — add user_id, scope to owner
-- ============================================================
ALTER TABLE email_tracking ADD COLUMN IF NOT EXISTS user_id uuid;

-- Backfill user_id from the project owner where possible
UPDATE email_tracking et
  SET user_id = p.user_id
  FROM projects p
  WHERE et.project_id = p.id
    AND et.user_id IS NULL;

DROP POLICY IF EXISTS "email_tracking_all" ON email_tracking;

CREATE POLICY "email_tracking_select" ON email_tracking
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "email_tracking_insert" ON email_tracking
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "email_tracking_update" ON email_tracking
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
