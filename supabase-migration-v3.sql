-- Run this in Supabase Dashboard > SQL Editor
-- v3: Insurance claim fields, roof diagram support, free trial

-- Add insurance/claim fields to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS insurance_company text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS claim_number text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS policy_number text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS date_of_loss date;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS adjuster_name text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS adjuster_email text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS adjuster_phone text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS claim_status text DEFAULT 'In Progress';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS diagram_url text;

-- Add quantity field to captures for Xactimate accuracy
ALTER TABLE captures ADD COLUMN IF NOT EXISTS quantity numeric DEFAULT 1;
ALTER TABLE captures ADD COLUMN IF NOT EXISTS unit text;

-- Draft persistence
ALTER TABLE captures ADD COLUMN IF NOT EXISTS draft text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_draft text;
