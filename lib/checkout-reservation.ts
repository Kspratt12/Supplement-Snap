import type Stripe from "stripe"

/**
 * Keeps one Supplement Snap account from accidentally starting two independently billing subscriptions.
 * This REDUCES the chance sharply; it does not make a duplicate impossible (see "What it cannot guarantee").
 *
 *  - each signed-in account has ONE stable Stripe customer, remembered in billing_customers, so everything about the account
 *    can be read straight from Stripe, which does not wait for our webhook;
 *  - before a checkout is made, Stripe is asked for the account's subscriptions (a live one means "manage it") and for its
 *    OPEN Checkout Sessions (the same plan reuses the open one, a different plan expires it first);
 *  - after a session is made, the live subscriptions and open sessions are read again: if a payment completed in the meantime
 *    the new session is expired and the customer is told to manage billing; if another session was made at the same moment,
 *    only the newest survives;
 *  - sessions expire on their own after about half an hour and nothing here is a lock that outlives a request.
 *
 * What it cannot guarantee: a request that finished just before a competing one may hold a link that expires a moment later
 * (safe: an expired link cannot be paid); a payment completed between our last read and the answer can still produce a second
 * subscription, which the webhook then keeps out of the stored row and records in billing_review for the owner.
 */

type DbError = { code?: string; message?: string } | null
type Db = {
  from: (table: string) => {
    select: (cols: string) => { eq: (k: string, v: string) => { maybeSingle: () => PromiseLike<{ data: Record<string, string> | null; error: DbError }> } }
    insert: (row: Record<string, unknown>) => PromiseLike<{ error: DbError }>
  }
}

/** Thrown when the tables this path needs are absent or unreadable. Checkout must stop; it never silently weakens itself. */
export class CheckoutProtectionUnavailable extends Error {
  constructor(public readonly reason: string) {
    super(`checkout protection unavailable: ${reason}`)
    this.name = "CheckoutProtectionUnavailable"
  }
}

// "relation does not exist" from Postgres or the REST layer: the migration has not been applied
const TABLE_MISSING = new Set(["42P01", "PGRST205", "PGRST204"])
export const isTableMissing = (e: { code?: string } | null | undefined) => !!e?.code && TABLE_MISSING.has(e.code)

/** Checkout sessions live about this long (Stripe's minimum is 30 minutes) */
export const SESSION_LIFETIME_SECONDS = 31 * 60
const MAX_PAGES = 5

export type StableCustomer = { id: string; adopted: boolean }

/**
 * The account's one Stripe customer. `adopt` is the customer an existing subscriber already has, so they keep it.
 * A lost customer-creation race is NOT cleaned up by deleting anything: the unused customer is recorded in billing_review.
 */
export async function stableCustomer(db: Db, stripe: Stripe, user: { id: string; email?: string | null }, adopt?: string | null): Promise<StableCustomer> {
  const read = () => db.from("billing_customers").select("stripe_customer_id").eq("user_id", user.id).maybeSingle()
  const first = await read()
  if (first.error) {
    if (isTableMissing(first.error)) throw new CheckoutProtectionUnavailable("billing_customers is missing (migration v14 not applied)")
    throw new Error("customer lookup failed")
  }
  if (first.data?.stripe_customer_id) return { id: first.data.stripe_customer_id, adopted: false }

  let id = adopt || null
  const made = !id
  if (!id) {
    const customer = await stripe.customers.create(
      { ...(user.email ? { email: user.email } : {}), metadata: { supabase_user_id: user.id } },
      { idempotencyKey: `customer:${user.id}:${Math.floor(Date.now() / 86_400_000)}` },
    )
    id = customer.id
  }
  const stored = await db.from("billing_customers").insert({ user_id: user.id, stripe_customer_id: id })
  if (!stored.error) return { id, adopted: !made }
  if (isTableMissing(stored.error)) throw new CheckoutProtectionUnavailable("billing_customers is missing (migration v14 not applied)")
  if (stored.error.code === "23505") {
    // another request stored a customer for this account first: use theirs
    const winner = await read()
    if (winner.error || !winner.data?.stripe_customer_id) throw new Error("customer lookup failed")
    if (made && winner.data.stripe_customer_id !== id) {
      // Never deleted: the owner can remove it in Stripe after looking. It has no session or subscription because sessions are
      // only made after this step, but that is for a person to confirm, not for an automatic delete.
      const note = await db.from("billing_review").insert({
        kind: "unused_customer",
        user_id: user.id,
        stripe_customer_id: id,
        stored_customer_id: winner.data.stripe_customer_id,
        reason: "lost a customer-creation race; this Stripe customer was created but not used and was left in place",
      })
      if (note.error && note.error.code !== "23505") console.error("Could not record an unused Stripe customer for review")
    }
    return { id: winner.data.stripe_customer_id, adopted: false }
  }
  throw new Error("customer store failed")
}

const newestFirst = (a: Stripe.Checkout.Session, b: Stripe.Checkout.Session) => (a.created !== b.created ? b.created - a.created : a.id < b.id ? 1 : -1)

/** Every open session for the customer, across pages. Fails (rather than guessing) if the list cannot be read completely. */
export async function openSessions(stripe: Stripe, customer: string): Promise<Stripe.Checkout.Session[]> {
  const all: Stripe.Checkout.Session[] = []
  let startingAfter: string | undefined
  for (let page = 0; page < MAX_PAGES; page++) {
    const list = await stripe.checkout.sessions.list({ customer, status: "open", limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) })
    all.push(...list.data)
    if (!list.has_more) return all.sort(newestFirst)
    startingAfter = list.data[list.data.length - 1]?.id
    if (!startingAfter) break
  }
  throw new Error("open sessions could not be listed completely")
}

/**
 * Expires a session. If the call fails, ask Stripe whether it is still open: a session that already completed or expired
 * is fine; one that is still open and could not be expired is an error, because it could still be paid.
 */
export async function expireOrConfirm(stripe: Stripe, id: string): Promise<"expired" | "not-open"> {
  try {
    await stripe.checkout.sessions.expire(id)
    return "expired"
  } catch (err) {
    const now = await stripe.checkout.sessions.retrieve(id) // if this also fails the error propagates (503, nothing assumed)
    if (now.status === "open") throw err
    return "not-open"
  }
}
