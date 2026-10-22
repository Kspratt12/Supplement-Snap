-- SupplementSnap Migration v0: Baseline schema
-- Run this FIRST in Supabase Dashboard > SQL Editor on a fresh project.
--
-- The original projects, captures and subscriptions tables were created by hand
-- and never written down. This file is a reconstruction based on how the app
-- code reads and writes them. Later migrations (v2, v3, v4-rls, v5-exif) only
-- ALTER these tables, so they fail without this file.
--
-- Run order: v0-baseline, supabase-migration, v2, v3, v4-rls, v5-exif.
-- Columns added by later migrations are listed here too so the tables are
-- complete; the later "ADD COLUMN IF NOT EXISTS" statements are harmless.

-- ============================================================
-- projects
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name text NOT NULL,
  property_address text,
  created_at timestamptz DEFAULT now(),
  insurance_company text,
  claim_number text,
  policy_number text,
  date_of_loss date,
  adjuster_name text,
  adjuster_email text,
  adjuster_phone text,
  claim_status text DEFAULT 'In Progress',
  diagram_url text,
  last_draft text
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects (user_id);

-- ============================================================
-- captures
-- ============================================================
CREATE TABLE IF NOT EXISTS captures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_url text DEFAULT '',
  image_urls text[],
  damage_type text,
  roof_area text,
  field_note text,
  status text DEFAULT 'Captured',
  quantity numeric DEFAULT 1,
  unit text,
  draft text,
  photo_metadata jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_captures_project_id ON captures (project_id);

-- ============================================================
-- subscriptions
-- Written only by the Stripe webhook (service role). user_id is nullable
-- because the webhook inserts a row by customer email when no user id is known.
-- UNIQUE(user_id) is required for the webhook's upsert(onConflict: "user_id").
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_customer_email text,
  status text DEFAULT 'inactive',
  plan text DEFAULT 'starter',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions (stripe_customer_id);

-- ============================================================
-- team_members (same definition as supabase-migration.sql, which is
-- idempotent). Created here because the team read policies below reference it.
-- ============================================================
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

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_owner" ON projects;
DROP POLICY IF EXISTS "projects_team_read" ON projects;
DROP POLICY IF EXISTS "captures_owner" ON captures;
DROP POLICY IF EXISTS "captures_team_read" ON captures;
DROP POLICY IF EXISTS "subscriptions_select" ON subscriptions;

-- Owners have full access to their own projects
CREATE POLICY "projects_owner" ON projects
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Active team members can read their owner's projects (the app loads these)
CREATE POLICY "projects_team_read" ON projects
  FOR SELECT USING (
    user_id IN (
      SELECT owner_id FROM team_members
      WHERE status = 'active'
        AND member_email = (auth.jwt() ->> 'email')
    )
  );

-- Captures follow the project they belong to
CREATE POLICY "captures_owner" ON captures
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  ) WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
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

-- Users can read their own subscription; only the service role writes
CREATE POLICY "subscriptions_select" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- Storage bucket used by the photo upload code
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('test-uploads', 'test-uploads', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "test_uploads_insert" ON storage.objects;
DROP POLICY IF EXISTS "test_uploads_update" ON storage.objects;
DROP POLICY IF EXISTS "test_uploads_delete" ON storage.objects;

CREATE POLICY "test_uploads_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'test-uploads');
CREATE POLICY "test_uploads_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'test-uploads');
CREATE POLICY "test_uploads_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'test-uploads');
