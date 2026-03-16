-- Run this in Supabase Dashboard > SQL Editor

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

-- RLS policies (permissive for now)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_members_all" ON team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "email_tracking_all" ON email_tracking FOR ALL USING (true) WITH CHECK (true);
