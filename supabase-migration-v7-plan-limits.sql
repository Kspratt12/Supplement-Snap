-- SupplementSnap Migration v7: enforce Free plan limits in the database
-- Run in Supabase Dashboard > SQL Editor AFTER v0 through v6.
--
-- The app already blocks free accounts in the browser (1 project, 3 captures per
-- project). This makes the database enforce the same rule, so it still holds if
-- someone calls the Supabase API directly with their own login.
--
-- A user counts as paid when they have an active or trialing subscription, or when
-- they are an active team member of an owner who does.

CREATE OR REPLACE FUNCTION public.user_has_paid_access(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.user_id = p_user_id AND s.status IN ('active', 'trialing')
    )
    OR EXISTS (
      SELECT 1
      FROM team_members t
      JOIN subscriptions s ON s.user_id = t.owner_id AND s.status IN ('active', 'trialing')
      WHERE t.status = 'active'
        AND lower(t.member_email) = lower((SELECT u.email FROM auth.users u WHERE u.id = p_user_id))
    );
$$;

-- Free accounts: 1 project
CREATE OR REPLACE FUNCTION public.enforce_free_project_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.user_has_paid_access(NEW.user_id)
     AND (SELECT count(*) FROM projects WHERE user_id = NEW.user_id) >= 1 THEN
    RAISE EXCEPTION 'Free plan allows 1 project. Upgrade to add more.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_free_project_limit ON projects;
CREATE TRIGGER trg_free_project_limit
  BEFORE INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION public.enforce_free_project_limit();

-- Free accounts: 3 captures per project
CREATE OR REPLACE FUNCTION public.enforce_free_capture_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM projects WHERE id = NEW.project_id;
  IF v_owner IS NOT NULL
     AND NOT public.user_has_paid_access(v_owner)
     AND (SELECT count(*) FROM captures WHERE project_id = NEW.project_id) >= 3 THEN
    RAISE EXCEPTION 'Free plan allows 3 captures per project. Upgrade to add more.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_free_capture_limit ON captures;
CREATE TRIGGER trg_free_capture_limit
  BEFORE INSERT ON captures
  FOR EACH ROW EXECUTE FUNCTION public.enforce_free_capture_limit();
