import type Stripe from "stripe"

/**
 * Keeps one Supplement Snap account from starting two independently billing subscriptions, including two checkouts
 * for DIFFERENT plans at the same moment. The design uses Stripe's own state instead of a lock we could get stuck on:
 *
 *  - each signed-in account gets ONE stable Stripe customer (remembered in billing_customers), so everything about
 *    the account can be read straight from Stripe, which is strongly consistent and does not wait for our webhook;
 *  - before a checkout is made, Stripe is asked for that customer's subscriptions (a live one means "manage it") and
 *    for its OPEN Checkout Sessions (the same plan reuses the open one, a different plan expires it first);
 *  - after a session is made, the open sessions are read again; if another was made at the same moment, only the
 *    newest survives and the rest are expired;
 *  - sessions expire on their own after about half an hour, and nothing here is a lock that outlives a request,
 *    so a failed request can never leave anyone unable to subscribe.
 * Detection in the webhook (billing_review) stays as a fallback; it is not the protection.
 */

type Db = {
  from: (table: string) => {
    select: (cols: string) => { eq: (k: string, v: string) => { maybeSingle: () => PromiseLike<{ data: Record<string, string> | null; error: { code?: string; message?: string } | null }> } }
    insert: (row: Record<string, unknown>) => PromiseLike<{ error: { code?: string; message?: string } | null }>
  }
}

// "relation does not exist" from Postgres or the REST layer: the table has not been created yet
const TABLE_MISSING = new Set(["42P01", "PGRST205", "PGRST204"])
export const isTableMissing = (e: { code?: string } | null | undefined) => !!e?.code && TABLE_MISSING.has(e.code)

/** Checkout sessions live about this long (Stripe's minimum is 30 minutes) */
export const SESSION_LIFETIME_SECONDS = 31 * 60

export type StableCustomer = { id: string | null; degraded: boolean }

/**
 * The account's one Stripe customer. `adopt` is the customer an existing subscriber already has, so they keep it.
 * If the billing_customers table does not exist yet, answers {id: adopt, degraded: true} and the caller falls back to
 * the earlier behavior (the Stripe-state check without the stable customer).
 */
export async function stableCustomer(db: Db, stripe: Stripe, user: { id: string; email?: string | null }, adopt?: string | null): Promise<StableCustomer> {
  const read = () => db.from("billing_customers").select("stripe_customer_id").eq("user_id", user.id).maybeSingle()
  const first = await read()
  if (first.error) {
    if (isTableMissing(first.error)) return { id: adopt ?? null, degraded: true }
    throw new Error("customer lookup failed")
  }
  if (first.data?.stripe_customer_id) return { id: first.data.stripe_customer_id, degraded: false }

  let id = adopt || null
  let made = false
  if (!id) {
    const customer = await stripe.customers.create(
      { ...(user.email ? { email: user.email } : {}), metadata: { supabase_user_id: user.id } },
      { idempotencyKey: `customer:${user.id}:${Math.floor(Date.now() / 86_400_000)}` },
    )
    id = customer.id
    made = true
  }
  const stored = await db.from("billing_customers").insert({ user_id: user.id, stripe_customer_id: id })
  if (!stored.error) return { id, degraded: false }
  if (stored.error.code === "23505") {
    // another request stored a customer for this account first: use theirs, and discard ours if we just made it
    const winner = await read()
    if (winner.error || !winner.data?.stripe_customer_id) throw new Error("customer lookup failed")
    if (made && winner.data.stripe_customer_id !== id) {
      try { await stripe.customers.del(id) } catch { /* it is empty; a leftover customer with no subscription is harmless */ }
    }
    return { id: winner.data.stripe_customer_id, degraded: false }
  }
  if (isTableMissing(stored.error)) return { id, degraded: true }
  throw new Error("customer store failed")
}

const newestFirst = (a: Stripe.Checkout.Session, b: Stripe.Checkout.Session) => (a.created !== b.created ? b.created - a.created : a.id < b.id ? 1 : -1)

export async function openSessions(stripe: Stripe, customer: string): Promise<Stripe.Checkout.Session[]> {
  const list = await stripe.checkout.sessions.list({ customer, status: "open", limit: 20 })
  return [...list.data].sort(newestFirst)
}

/** Expiring a session that already completed or expired is not an error for our purposes. */
export async function expireQuietly(stripe: Stripe, id: string): Promise<void> {
  try {
    await stripe.checkout.sessions.expire(id)
  } catch (err) {
    const code = (err as { code?: string; statusCode?: number })?.statusCode
    if (code && code >= 500) throw err
  }
}

/** Before creating: reuse the open session for this plan, expire open sessions for other plans. */
export async function reuseOrClear(stripe: Stripe, customer: string, plan: string): Promise<string | null> {
  const open = await openSessions(stripe, customer)
  let reuse: string | null = null
  for (const session of open) {
    if (!reuse && session.metadata?.plan === plan && session.url) {
      reuse = session.url
      continue
    }
    await expireQuietly(stripe, session.id)
  }
  return reuse
}

/**
 * After creating `mine`: if another session for the account is open too (a request at the same moment), keep only the
 * newest. Returns the URL to give the customer, which is the survivor's.
 */
export async function keepNewest(stripe: Stripe, customer: string, mine: { id: string; url: string | null }): Promise<string | null> {
  const open = await openSessions(stripe, customer)
  if (open.length <= 1) return mine.url
  const [survivor, ...rest] = open
  for (const s of rest) await expireQuietly(stripe, s.id)
  return survivor.url ?? (survivor.id === mine.id ? mine.url : null)
}
