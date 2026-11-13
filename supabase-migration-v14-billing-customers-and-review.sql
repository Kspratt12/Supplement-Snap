-- supabase-migration-v14-billing-customers-and-review.sql
-- PROPOSED. NOT APPLIED. Do not run on production without the owner's specific approval.
--
-- Purpose: stop one Supplement Snap account from starting two independently billing subscriptions.
--   billing_customers  one stable Stripe customer per account, so Stripe's own state (subscriptions and open checkouts)
--                      can be read for the account at any moment instead of waiting for our webhook.
--   billing_review     a record for the owner when a second LIVE subscription is paid for by an account that already
--                      holds one. It is a review note, NOT a subscription row: no access query reads it.
-- Both tables are server-only (service role). anon and authenticated get no privileges (the same posture as v13).
-- Nothing here changes, deletes or reads any existing table or row.
--
-- Order: apply this SQL first, then deploy the code. The code also works before this is applied (it falls back to the
-- earlier Stripe-state check without the stable customer) so a slip in ordering cannot block checkout.

BEGIN;

CREATE TABLE IF NOT EXISTS public.billing_customers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.billing_review (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_customer_id text,
  stripe_subscription_id text NOT NULL UNIQUE,   -- the additional subscription; unique so a redelivered event adds nothing
  stored_subscription_id text,                   -- the subscription the account already held
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,                       -- the owner sets this once handled in Stripe
  resolution_note text
);

ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_review ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.billing_customers, public.billing_review FROM anon, authenticated;
-- service_role bypasses RLS and keeps the default grants it already has on new public tables.

COMMIT;

-- ============================================================
-- Post-check (read-only). Expect: both tables exist, RLS on, anon and authenticated have no privileges.
--   select c.relname, c.relrowsecurity,
--          has_table_privilege('anon', c.oid, 'SELECT') anon_select,
--          has_table_privilege('authenticated', c.oid, 'SELECT') auth_select,
--          has_table_privilege('service_role', c.oid, 'SELECT') svc_select
--   from pg_class c join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname = 'public' and c.relname in ('billing_customers', 'billing_review');
--
-- Owner review (read-only): second subscriptions that may still be billing and have not been handled:
--   select created_at, user_id, stored_subscription_id, stripe_subscription_id, reason
--   from public.billing_review where resolved_at is null order by created_at;
-- After handling one in Stripe: update public.billing_review set resolved_at = now(), resolution_note = '...' where id = '...';
--
-- ROLLBACK (the tables hold no data the app cannot rebuild: a customer is recreated or re-adopted at the next checkout,
-- and a review note is only a reminder; export billing_review first if any rows exist):
--   begin;
--   drop table if exists public.billing_review;
--   drop table if exists public.billing_customers;
--   commit;
-- The code keeps working after a rollback (it falls back to the Stripe-state check without the stable customer).
-- Cleanup: rows in billing_customers go away with the account (ON DELETE CASCADE); Stripe customers are not deleted by this.
