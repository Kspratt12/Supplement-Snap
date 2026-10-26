-- SupplementSnap Migration v8: keep access during a failed-payment retry window
-- Run in Supabase Dashboard > SQL Editor AFTER v7. Safe to run more than once.
--
-- When a renewal payment fails, Stripe retries the card for several days and the subscription is marked past_due.
-- The app now keeps the customer's access during that window. This updates the database check that enforces the
-- Free plan limits (1 project, 3 captures per project) so a past-due customer is not treated as a free account.
-- If every retry fails, Stripe cancels the subscription and the status becomes canceled, which ends access.

CREATE OR REPLACE FUNCTION public.user_has_paid_access(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.user_id = p_user_id AND s.status IN ('active', 'trialing', 'past_due')
    )
    OR EXISTS (
      SELECT 1
      FROM team_members t
      JOIN subscriptions s ON s.user_id = t.owner_id AND s.status IN ('active', 'trialing', 'past_due')
      WHERE t.status = 'active'
        AND lower(t.member_email) = lower((SELECT u.email FROM auth.users u WHERE u.id = p_user_id))
    );
$$;
