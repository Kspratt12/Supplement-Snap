-- Run this in Supabase Dashboard > SQL Editor
-- v4: Creates all missing tables + locks down RLS policies
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS)

-- ============================================================
-- STEP 1: Create tables if they don't exist yet (from v1 + v2)
-- ============================================================

-- Team Members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  member_email text NOT NULL,
  member_name text,
  member_user_id uuid,
  role text DEFAULT 'crew',
  status text DEFAULT 'pending',
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz
);

-- Email Tracking table
CREATE TABLE IF NOT EXISTS email_tracking (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid,
  recipient_email text NOT NULL,
  subject text,
  sent_at timestamptz DEFAULT now(),
  opened_at timestamptz,
  open_count integer DEFAULT 0,
  tracking_token text UNIQUE DEFAULT gen_random_uuid()::text
);

-- Adjuster Contacts table
CREATE TABLE IF NOT EXISTS adjuster_contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  company text,
  last_used_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Activity Log table
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid,
  action text NOT NULL,
  details text,
  created_at timestamptz DEFAULT now()
);

-- Company Settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid UNIQUE NOT NULL,
  company_name text,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- STEP 2: Add plan column to subscriptions (from v2)
-- ============================================================
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan text DEFAULT 'starter';

-- ============================================================
-- STEP 3: Insurance/claim fields (from v3)
-- ============================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS insurance_company text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS claim_number text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS policy_number text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS date_of_loss date;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS adjuster_name text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS adjuster_email text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS adjuster_phone text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS claim_status text DEFAULT 'In Progress';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS diagram_url text;

ALTER TABLE captures ADD COLUMN IF NOT EXISTS quantity numeric DEFAULT 1;
ALTER TABLE captures ADD COLUMN IF NOT EXISTS unit text;
ALTER TABLE captures ADD COLUMN IF NOT EXISTS draft text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_draft text;

-- ============================================================
-- STEP 4: Add user_id to email_tracking for RLS
-- ============================================================
ALTER TABLE email_tracking ADD COLUMN IF NOT EXISTS user_id uuid;

-- Backfill user_id from the project owner where possible
UPDATE email_tracking et
  SET user_id = p.user_id
  FROM projects p
  WHERE et.project_id = p.id
    AND et.user_id IS NULL;

-- ============================================================
-- STEP 5: Enable RLS on all tables
-- ============================================================
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE adjuster_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 6: Drop old permissive policies (safe if they don't exist)
-- ============================================================
DROP POLICY IF EXISTS "team_members_all" ON team_members;
DROP POLICY IF EXISTS "email_tracking_all" ON email_tracking;
DROP POLICY IF EXISTS "adjuster_contacts_all" ON adjuster_contacts;
DROP POLICY IF EXISTS "activity_log_all" ON activity_log;
DROP POLICY IF EXISTS "company_settings_all" ON company_settings;

-- Also drop new ones in case re-running this script
DROP POLICY IF EXISTS "adjuster_contacts_select" ON adjuster_contacts;
DROP POLICY IF EXISTS "adjuster_contacts_insert" ON adjuster_contacts;
DROP POLICY IF EXISTS "adjuster_contacts_update" ON adjuster_contacts;
DROP POLICY IF EXISTS "adjuster_contacts_delete" ON adjuster_contacts;
DROP POLICY IF EXISTS "activity_log_select" ON activity_log;
DROP POLICY IF EXISTS "activity_log_insert" ON activity_log;
DROP POLICY IF EXISTS "company_settings_select" ON company_settings;
DROP POLICY IF EXISTS "company_settings_insert" ON company_settings;
DROP POLICY IF EXISTS "company_settings_update" ON company_settings;
DROP POLICY IF EXISTS "team_members_owner" ON team_members;
DROP POLICY IF EXISTS "team_members_member_read" ON team_members;
DROP POLICY IF EXISTS "email_tracking_select" ON email_tracking;
DROP POLICY IF EXISTS "email_tracking_insert" ON email_tracking;
DROP POLICY IF EXISTS "email_tracking_update" ON email_tracking;

-- ============================================================
-- STEP 7: Create proper scoped policies
-- ============================================================

-- adjuster_contacts: user_id = auth.uid()
CREATE POLICY "adjuster_contacts_select" ON adjuster_contacts
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "adjuster_contacts_insert" ON adjuster_contacts
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "adjuster_contacts_update" ON adjuster_contacts
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "adjuster_contacts_delete" ON adjuster_contacts
  FOR DELETE USING (user_id = auth.uid());

-- activity_log: user_id = auth.uid()
CREATE POLICY "activity_log_select" ON activity_log
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "activity_log_insert" ON activity_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- company_settings: user_id = auth.uid()
CREATE POLICY "company_settings_select" ON company_settings
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "company_settings_insert" ON company_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "company_settings_update" ON company_settings
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- team_members: owner can manage, members can read their own invites
CREATE POLICY "team_members_owner" ON team_members
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "team_members_member_read" ON team_members
  FOR SELECT USING (member_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- email_tracking: user_id = auth.uid()
CREATE POLICY "email_tracking_select" ON email_tracking
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "email_tracking_insert" ON email_tracking
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "email_tracking_update" ON email_tracking
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
