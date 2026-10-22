-- Run this in Supabase Dashboard > SQL Editor
-- v2: Pro features - adjuster contacts, activity log, company settings

-- Plan column on subscriptions
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan text DEFAULT 'starter';
UPDATE subscriptions SET plan = 'pro' WHERE user_id = 'baa558f7-573c-4359-a03b-f82640c00512';

-- Saved adjuster contacts
CREATE TABLE IF NOT EXISTS adjuster_contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  company text,
  last_used_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid,
  action text NOT NULL,
  details text,
  created_at timestamptz DEFAULT now()
);

-- Company settings (for white-label)
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid UNIQUE NOT NULL,
  company_name text,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE adjuster_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "adjuster_contacts_all" ON adjuster_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "activity_log_all" ON activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "company_settings_all" ON company_settings FOR ALL USING (true) WITH CHECK (true);
