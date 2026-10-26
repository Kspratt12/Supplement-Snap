-- SupplementSnap Migration v9: let a free account start one real project
-- Run in Supabase Dashboard > SQL Editor AFTER v8. Safe to run more than once.
--
-- Every new account is given a Demo Project automatically. The v7 rule allowed a free account only one project in
-- total, so the demo used it up and a free user could not start a real job, even though the site says the first
-- project is free. Free accounts may now hold two projects: the demo and one of their own.

CREATE OR REPLACE FUNCTION public.enforce_free_project_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.user_has_paid_access(NEW.user_id)
     AND (SELECT count(*) FROM projects WHERE user_id = NEW.user_id) >= 2 THEN
    RAISE EXCEPTION 'Free plan allows the demo project plus 1 project of your own. Upgrade to add more.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;
