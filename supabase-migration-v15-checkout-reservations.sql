-- supabase-migration-v15-checkout-reservations.sql
-- PROPOSED. NOT APPLIED. Do not run on production without the owner's specific approval.
--
-- DEPENDENCY AND ORDER: apply v14 (billing_customers, billing_review) FIRST, then this file, then deploy the code. The new
-- checkout code needs BOTH and fails closed (503 "checkout-unavailable") if either is missing; it never falls back to a weaker path.
-- This file does not read or change any v14 table and any existing table or row.
--
-- Purpose: a durable, account-level checkout reservation. At most ONE reservation row exists per account, and it decides which
-- single request may create (and then hand out) a Stripe Checkout Session for that account. Stripe stays the source of truth: every
-- branch in the application re-reads Stripe, and the row is only a coordinator.
--
-- The invariant that keeps two payable sessions from being handed out:
--   a session URL is returned to a customer ONLY after checkout_publish returned 1 for that request, and publish succeeds only for the
--   request that currently owns the row (state = 'creating' and request_id = that request). Ownership changes only under the row lock.
--   So a request whose lease was taken over can create a session at Stripe, but its publish returns 0, it never returns the URL, and
--   it expires its own session; an unexposed session cannot be paid.

BEGIN;

CREATE TABLE IF NOT EXISTS public.billing_checkout_reservations (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,       -- at most one reservation per account
  stripe_customer_id text NOT NULL,
  plan text NOT NULL CHECK (plan IN ('starter', 'team', 'pro')),
  state text NOT NULL CHECK (state IN ('creating', 'open', 'completed')),
  request_id uuid NOT NULL,                       -- the request that owns the row while state = 'creating'
  stripe_session_id text,                         -- the canonical session; while a plan swap is in progress it is still the OLD session
  lease_until timestamptz NOT NULL,               -- 'creating' only: when a crashed or slow owner can be replaced
  session_expires_at timestamptz,                 -- Stripe's expires_at for the canonical session (a hint; never decides anything alone)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (state = 'creating' OR stripe_session_id IS NOT NULL)
);

ALTER TABLE public.billing_checkout_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.billing_checkout_reservations FROM anon, authenticated;

-- checkout_reserve: take or inspect the account's reservation, atomically (row lock).
--   no row                                   -> 'acquired'   (this request owns it; nothing was exposed before)
--   state creating, lease live, other owner  -> 'busy'
--   state creating, same request again       -> 'acquired'   (idempotent; lease extended)
--   state creating, lease lapsed             -> 'takeover'   (this request now owns it; previous_session_id is any session that may still be payable)
--   state open, same plan                    -> 'canonical'  (the session already handed out)
--   state open, different plan               -> 'swap'       (this request owns it; previous_session_id is the old session that MUST be expired at Stripe first)
--   state completed                          -> 'completed'  (a payment completed; the application checks Stripe for a live subscription)
CREATE OR REPLACE FUNCTION public.checkout_reserve(p_user uuid, p_customer text, p_plan text, p_request uuid, p_lease_seconds integer DEFAULT 60)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.billing_checkout_reservations%ROWTYPE;
  lease timestamptz := now() + make_interval(secs => p_lease_seconds);
BEGIN
  INSERT INTO public.billing_checkout_reservations (user_id, stripe_customer_id, plan, state, request_id, lease_until)
  VALUES (p_user, p_customer, p_plan, 'creating', p_request, lease)
  ON CONFLICT (user_id) DO NOTHING;
  IF FOUND THEN
    RETURN jsonb_build_object('outcome', 'acquired');
  END IF;

  SELECT * INTO r FROM public.billing_checkout_reservations WHERE user_id = p_user FOR UPDATE;
  IF NOT FOUND THEN
    -- the row was released between the insert and the lock; the caller simply asks again
    RETURN jsonb_build_object('outcome', 'retry');
  END IF;

  IF r.state = 'completed' THEN
    RETURN jsonb_build_object('outcome', 'completed', 'session_id', r.stripe_session_id);
  ELSIF r.state = 'creating' THEN
    IF r.request_id = p_request THEN
      UPDATE public.billing_checkout_reservations SET lease_until = lease, updated_at = now() WHERE user_id = p_user;
      RETURN jsonb_build_object('outcome', 'acquired', 'previous_session_id', r.stripe_session_id);
    ELSIF r.lease_until > now() THEN
      RETURN jsonb_build_object('outcome', 'busy', 'plan', r.plan, 'seconds_left', GREATEST(0, ceil(extract(epoch FROM (r.lease_until - now())))));
    ELSE
      UPDATE public.billing_checkout_reservations
         SET request_id = p_request, plan = p_plan, stripe_customer_id = p_customer, lease_until = lease, updated_at = now()
       WHERE user_id = p_user;
      RETURN jsonb_build_object('outcome', 'takeover', 'previous_session_id', r.stripe_session_id);
    END IF;
  ELSE -- open
    IF r.plan = p_plan THEN
      RETURN jsonb_build_object('outcome', 'canonical', 'session_id', r.stripe_session_id, 'session_expires_at', r.session_expires_at);
    ELSE
      UPDATE public.billing_checkout_reservations
         SET state = 'creating', request_id = p_request, plan = p_plan, stripe_customer_id = p_customer, lease_until = lease, updated_at = now()
       WHERE user_id = p_user;
      RETURN jsonb_build_object('outcome', 'swap', 'previous_session_id', r.stripe_session_id);
    END IF;
  END IF;
END $$;

-- checkout_publish: the ONLY way a session becomes the canonical one. Returns 1 if this request still owns the row, else 0.
-- The lease time is deliberately NOT checked: ownership changes only when another request takes over under the row lock, so an
-- owner that is merely slow still publishes if nobody replaced it, and one that was replaced always gets 0.
CREATE OR REPLACE FUNCTION public.checkout_publish(p_user uuid, p_request uuid, p_session text, p_expires_at timestamptz DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  UPDATE public.billing_checkout_reservations
     SET state = 'open', stripe_session_id = p_session, session_expires_at = p_expires_at, updated_at = now()
   WHERE user_id = p_user AND request_id = p_request AND state = 'creating';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- checkout_abort: give the row back, only when this request owns it and NO session was ever recorded (nothing could have been exposed).
CREATE OR REPLACE FUNCTION public.checkout_abort(p_user uuid, p_request uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  DELETE FROM public.billing_checkout_reservations
   WHERE user_id = p_user AND request_id = p_request AND state = 'creating' AND stripe_session_id IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- checkout_complete: a Checkout finished (called by the webhook, or by a request that found a session complete at Stripe).
CREATE OR REPLACE FUNCTION public.checkout_complete(p_user uuid, p_customer text, p_session text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.billing_checkout_reservations (user_id, stripe_customer_id, plan, state, request_id, stripe_session_id, lease_until)
  VALUES (p_user, p_customer, 'starter', 'completed', gen_random_uuid(), p_session, now())
  ON CONFLICT (user_id) DO UPDATE SET state = 'completed', stripe_session_id = p_session, updated_at = now();
  RETURN 1;
END $$;

-- checkout_release: remove the reservation. Called only after Stripe CONFIRMED that the canonical session is expired, or that the
-- account has no live subscription after a completed checkout. The clock alone never calls this.
CREATE OR REPLACE FUNCTION public.checkout_release(p_user uuid, p_session text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  DELETE FROM public.billing_checkout_reservations
   WHERE user_id = p_user AND stripe_session_id = p_session AND state IN ('open', 'completed');
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

REVOKE ALL ON FUNCTION public.checkout_reserve(uuid, text, text, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.checkout_publish(uuid, uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.checkout_abort(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.checkout_complete(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.checkout_release(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.checkout_reserve(uuid, text, text, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.checkout_publish(uuid, uuid, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.checkout_abort(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.checkout_complete(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.checkout_release(uuid, text) TO service_role;

COMMIT;

-- ============================================================
-- Post-check (read-only). Expect the table with RLS on, five functions, EXECUTE only for service_role, no table privileges for anon/authenticated.
--   select relname, relrowsecurity from pg_class where relname = 'billing_checkout_reservations';
--   select p.proname, has_function_privilege('anon', p.oid, 'EXECUTE') anon_x, has_function_privilege('authenticated', p.oid, 'EXECUTE') auth_x,
--          has_function_privilege('service_role', p.oid, 'EXECUTE') svc_x
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'checkout\_%';
--   select has_table_privilege('anon', 'public.billing_checkout_reservations', 'SELECT'), has_table_privilege('authenticated', 'public.billing_checkout_reservations', 'SELECT');
--
-- ROLLBACK AND PRESERVATION. Before any row exists: begin; drop function public.checkout_reserve(uuid, text, text, uuid, integer); drop function public.checkout_publish(uuid, uuid, text, timestamptz); drop function public.checkout_abort(uuid, uuid); drop function public.checkout_complete(uuid, text, text); drop function public.checkout_release(uuid, text); drop table public.billing_checkout_reservations; commit;
-- After rows exist, do not drop the table: roll the CODE back (the previous code ignores it; the new code fails closed without it). Export first
-- (select * from public.billing_checkout_reservations) and get the owner's explicit approval before any removal.
-- A reservation never blocks anyone for long: 'creating' lapses after its lease and is taken over; 'open' and 'completed' are released
-- by the application as soon as Stripe confirms the session is expired or the account has no live subscription.
