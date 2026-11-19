-- SupplementSnap migration v16: manual claim tracking, report order and roof-diagram pins.
-- PROPOSED. NOT APPLIED ANYWHERE. Run on a practice copy first, then on live only with the owner's approval.
--
-- What it adds (all columns are nullable and optional; nothing existing is changed, moved or deleted):
--   projects.amount_requested  numeric(12,2)  what the contractor says they asked the carrier for, typed by the user
--   projects.amount_approved   numeric(12,2)  what the contractor says the carrier approved, typed by the user
--   projects.follow_up_on      date           the next follow-up date the user chose (in-app reminder only, no email)
--   captures.report_order      integer        the user's chosen position of a finding in the report (null = default order)
--   captures.diagram_pin       jsonb          {"x": 0..1, "y": 0..1}: where the user placed this finding on the project's roof diagram
--
-- Access: unchanged. Row Level Security on projects and captures already limits every row to its owner, and v11 keeps
-- team members read-only. v13 grants on projects and captures are table-wide, so the new columns follow them.
--
-- The app turns each feature on only when its column is present in the rows it loads, so the code can be deployed before
-- or after this file runs. Before it runs, the controls simply do not appear.
--
-- None of these values are confirmed by Supplement Snap or by any insurer. The app labels them as entered by the user.

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS amount_requested numeric(12,2);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS amount_approved numeric(12,2);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS follow_up_on date;
ALTER TABLE public.captures ADD COLUMN IF NOT EXISTS report_order integer;
ALTER TABLE public.captures ADD COLUMN IF NOT EXISTS diagram_pin jsonb;

-- Sensible-value checks (amounts cannot be negative or absurd; a pin is two numbers between 0 and 1)
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_amount_requested_range;
ALTER TABLE public.projects ADD CONSTRAINT projects_amount_requested_range CHECK (amount_requested IS NULL OR (amount_requested >= 0 AND amount_requested < 100000000));
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_amount_approved_range;
ALTER TABLE public.projects ADD CONSTRAINT projects_amount_approved_range CHECK (amount_approved IS NULL OR (amount_approved >= 0 AND amount_approved < 100000000));
ALTER TABLE public.captures DROP CONSTRAINT IF EXISTS captures_report_order_range;
ALTER TABLE public.captures ADD CONSTRAINT captures_report_order_range CHECK (report_order IS NULL OR (report_order >= 0 AND report_order < 10000));
ALTER TABLE public.captures DROP CONSTRAINT IF EXISTS captures_diagram_pin_shape;
ALTER TABLE public.captures ADD CONSTRAINT captures_diagram_pin_shape CHECK (
  diagram_pin IS NULL OR (
    jsonb_typeof(diagram_pin) = 'object'
    AND jsonb_typeof(diagram_pin->'x') = 'number' AND jsonb_typeof(diagram_pin->'y') = 'number'
    AND (diagram_pin->>'x')::numeric BETWEEN 0 AND 1
    AND (diagram_pin->>'y')::numeric BETWEEN 0 AND 1
  )
);

-- Check after running (expect 5 rows):
-- SELECT table_name, column_name, data_type FROM information_schema.columns
--  WHERE table_schema = 'public' AND column_name IN ('amount_requested','amount_approved','follow_up_on','report_order','diagram_pin');

-- ============================================================
-- UNDO (removes the columns and any values typed into them):
-- ALTER TABLE public.captures DROP CONSTRAINT IF EXISTS captures_diagram_pin_shape;
-- ALTER TABLE public.captures DROP CONSTRAINT IF EXISTS captures_report_order_range;
-- ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_amount_approved_range;
-- ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_amount_requested_range;
-- ALTER TABLE public.captures DROP COLUMN IF EXISTS diagram_pin;
-- ALTER TABLE public.captures DROP COLUMN IF EXISTS report_order;
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS follow_up_on;
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS amount_approved;
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS amount_requested;
-- After an undo the app hides these controls again on its own.
