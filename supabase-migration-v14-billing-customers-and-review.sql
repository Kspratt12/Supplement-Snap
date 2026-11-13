-- supabase-migration-v14-billing-customers-and-review.sql
-- PROPOSED. NOT APPLIED. Do not run on production without the owner's specific approval.
--
-- Purpose: stop one Supplement Snap account from accidentally starting two independently billing subscriptions.
--   billing_customers  one stable Stripe customer per account. The new checkout path REQUIRES this table.
--   billing_review     notes for the owner: (a) a second live subscription paid for by an account that already holds one,
--                      (b) a Stripe customer that was created but not used after losing a creation race. It is a review
--                      record, NOT a subscription row: no access query reads it and Stripe events never rewrite it.
-- Both tables are server-only (service role). anon and authenticated get no privileges (the same posture as v13).
-- Nothing here changes, deletes or reads any existing table or row.
--
-- ORDER (important):
--   1. Apply this SQL (it is additive, so the OLD code keeps working while it is in place).
--   2. Run the post-check below.
--   3. Deploy the new code.
--   If the SQL succeeds but the deploy fails: nothing is harmed. The old code ignores the new tables.
--   If the code is deployed BEFORE the SQL: signed-in checkout answers 503 "checkout-unavailable" (it refuses to start without
--   its protection; it never quietly weakens itself) and logs which migration to apply. Guests and existing subscribers' plans
--   are unaffected. Applying the SQL then fixes it at once.

BEGIN;

CREATE TABLE IF NOT EXISTS public.billing_customers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.billing_review (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'duplicate_subscription' CHECK (kind IN ('duplicate_subscription', 'unused_customer')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_customer_id text,
  stripe_subscription_id text,                   -- the additional subscription (duplicate_subscription)
  stored_subscription_id text,                   -- the subscription the account already held
  stored_customer_id text,                       -- the customer that was kept (unused_customer)
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,                       -- the owner sets this once handled in Stripe
  resolution_note text,
  CHECK ((kind = 'duplicate_subscription' AND stripe_subscription_id IS NOT NULL) OR (kind = 'unused_customer' AND stripe_customer_id IS NOT NULL))
);
-- a redelivered event or a repeated race adds nothing
CREATE UNIQUE INDEX IF NOT EXISTS billing_review_subscription_uq ON public.billing_review (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS billing_review_unused_customer_uq ON public.billing_review (stripe_customer_id) WHERE kind = 'unused_customer';

ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_review ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.billing_customers, public.billing_review FROM anon, authenticated;
-- service_role bypasses RLS and keeps the default grants it already has on new public tables.

COMMIT;

-- ============================================================
-- Post-check (read-only). Expect: both tables exist, RLS on, anon and authenticated have no privileges, service_role can read.
--   select c.relname, c.relrowsecurity,
--          has_table_privilege('anon', c.oid, 'SELECT') anon_select,
--          has_table_privilege('authenticated', c.oid, 'SELECT') auth_select,
--          has_table_privilege('service_role', c.oid, 'SELECT') svc_select
--   from pg_class c join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname = 'public' and c.relname in ('billing_customers', 'billing_review');
--
-- Owner review (read-only): unresolved notes.
--   select created_at, kind, user_id, stored_subscription_id, stripe_subscription_id, stripe_customer_id, stored_customer_id, reason
--   from public.billing_review where resolved_at is null order by created_at;
-- After handling one in Stripe: update public.billing_review set resolved_at = now(), resolution_note = '...' where id = '...';
--
-- ROLLBACK AND PRESERVATION.
--   Before any row exists in either table, removal is safe:   begin; drop table public.billing_review; drop table public.billing_customers; commit;
--   AFTER the tables hold rows, DO NOT drop them: billing_customers holds the account-to-Stripe-customer mapping the new
--   checkout depends on, and billing_review may hold unresolved evidence of a possible double charge.
--   To go back to the old behavior after that, roll back the CODE (redeploy the previous revision). The old code ignores both
--   tables and they stay in place. If the tables must ever be removed, first export them
--   (select * from public.billing_customers; select * from public.billing_review;) and get the owner's explicit approval.
--   If only the SQL must be undone while the new code is live, the new code refuses signed-in checkout (503) until the tables are back:
--   roll the code back first.
-- Cleanup: billing_customers rows go away with the account (ON DELETE CASCADE); Stripe customers are never deleted by this.
