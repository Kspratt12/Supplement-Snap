import type Stripe from "stripe"
import { existingBillingBlock, type BillingBlock, type StoredSubscription } from "./billing-guard"
import { CheckoutProtectionUnavailable, expireOrConfirm, openSessions } from "./checkout-reservation"

/**
 * One request at a time may create and hand out a Checkout Session for an account. The database row (v15) decides which request, and
 * Stripe stays the source of truth: every branch below re-reads Stripe.
 *
 * THE INVARIANT: a session URL is returned only after `checkout_publish` returned 1 for THIS request, and publish succeeds only for the
 * request that currently owns the reservation. A request that lost ownership (its lease lapsed and a successor took over) can still
 * create a session at Stripe, but its publish returns 0, it never returns that URL, and it expires its own session. An unexposed
 * session cannot be paid. Sessions are never adopted from Stripe by a successor, so an old owner can never expire the session a
 * successor handed out.
 */

type RpcResult = { data: unknown; error: { code?: string; message?: string } | null }
export type RpcDb = { rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<RpcResult> }

export type FlowResult =
  | { kind: "url"; url: string }
  | { kind: "blocked"; block: BillingBlock }
  | { kind: "busy" } // another request is preparing this account's checkout right now
  | { kind: "uncertain" } // a session may or may not exist; nothing was handed out

type Reserve = { outcome: "acquired" | "takeover" | "swap" | "busy" | "canonical" | "completed" | "retry"; session_id?: string | null; previous_session_id?: string | null }

const MISSING_FN = new Set(["42883", "PGRST202", "42P01", "PGRST205"])

async function call<T>(db: RpcDb, fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await db.rpc(fn, args)
  if (error) {
    if (error.code && MISSING_FN.has(error.code)) throw new CheckoutProtectionUnavailable(`${fn} is missing (migration v15 not applied)`)
    throw new Error(`${fn} failed`)
  }
  return data as T
}

export type FlowInput = {
  stripe: Stripe
  db: RpcDb
  userId: string
  customerId: string
  accountCustomers: StoredSubscription
  plan: string
  requestId: string
  /** creates the session at Stripe; given the reservation request id so the session can be traced to its owner */
  createSession: (requestId: string) => Promise<Stripe.Checkout.Session>
  sleep?: (ms: number) => Promise<void>
  waitMs?: number
}

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** After a session turned out to be complete: record it, then answer from Stripe's subscription state. */
async function afterCompleted(i: FlowInput, sessionId: string): Promise<FlowResult | "no-live-subscription"> {
  await call<number>(i.db, "checkout_complete", { p_user: i.userId, p_customer: i.customerId, p_session: sessionId })
  const block = await existingBillingBlock(i.stripe, i.accountCustomers)
  return block ? { kind: "blocked", block } : "no-live-subscription"
}

/**
 * Expire every session that could still be paid for this account (the previous canonical one and anything open on the customer).
 * Returns a result when one of them turned out to be COMPLETE (someone paid), else null.
 */
async function clearPayableSessions(i: FlowInput, previous: string | null | undefined): Promise<FlowResult | "no-live-subscription" | null> {
  const ids = new Set<string>()
  if (previous) ids.add(previous)
  for (const s of await openSessions(i.stripe, i.customerId)) ids.add(s.id)
  for (const id of ids) {
    const outcome = await expireOrConfirm(i.stripe, id) // throws if it is still open and could not be expired
    if (outcome === "not-open") {
      const now = await i.stripe.checkout.sessions.retrieve(id)
      if (now.status === "complete") return afterCompleted(i, id)
    }
  }
  return null
}

export async function startCheckout(i: FlowInput): Promise<FlowResult> {
  const sleep = i.sleep ?? realSleep
  const deadline = i.waitMs ?? 4000
  let waited = 0

  for (let round = 0; round < 60; round++) {
    const r = await call<Reserve>(i.db, "checkout_reserve", { p_user: i.userId, p_customer: i.customerId, p_plan: i.plan, p_request: i.requestId, p_lease_seconds: 60 })

    if (r.outcome === "retry") continue

    if (r.outcome === "busy") {
      // another request owns the reservation: wait (bounded) for it to publish, then take whatever it published
      if (waited >= deadline) return { kind: "busy" }
      await sleep(500); waited += 500
      continue
    }

    if (r.outcome === "completed") {
      const block = await existingBillingBlock(i.stripe, i.accountCustomers)
      if (block) return { kind: "blocked", block }
      // The completed checkout has no live subscription any more (it ended): nobody stays stuck behind it.
      if (r.session_id) await call<number>(i.db, "checkout_release", { p_user: i.userId, p_session: r.session_id })
      continue
    }

    if (r.outcome === "canonical") {
      const s = await i.stripe.checkout.sessions.retrieve(r.session_id as string)
      if (s.status === "open" && s.url) return { kind: "url", url: s.url } // the same session every concurrent request is given
      if (s.status === "complete") {
        const after = await afterCompleted(i, s.id)
        if (after !== "no-live-subscription") return after
        continue
      }
      // Stripe confirms it expired (never decided by the clock): give the reservation back and ask again
      await call<number>(i.db, "checkout_release", { p_user: i.userId, p_session: s.id })
      continue
    }

    // acquired, takeover or swap: this request owns the reservation
    try {
      const cleared = await clearPayableSessions(i, r.previous_session_id)
      if (cleared) return cleared === "no-live-subscription" ? { kind: "uncertain" } : cleared
    } catch (err) {
      if (err instanceof CheckoutProtectionUnavailable) throw err
      return { kind: "uncertain" } // the lease stays; a retry is 'busy' for at most the lease, then takes over and clears again
    }

    let session: Stripe.Checkout.Session
    try {
      session = await i.createSession(i.requestId)
    } catch (err) {
      const status = (err as { statusCode?: number })?.statusCode
      // A 4xx from Stripe proves nothing was created: give the reservation back (only possible when no earlier session is recorded).
      if (status && status >= 400 && status < 500) await call<number>(i.db, "checkout_abort", { p_user: i.userId, p_request: i.requestId }).catch(() => 0)
      return { kind: "uncertain" } // a timeout may have created one; it was never handed out and the next owner expires it
    }

    let published = 0
    try {
      published = await call<number>(i.db, "checkout_publish", {
        p_user: i.userId, p_request: i.requestId, p_session: session.id,
        p_expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      })
    } catch (err) {
      if (err instanceof CheckoutProtectionUnavailable) throw err
      published = 0
    }
    if (published === 1 && session.url) return { kind: "url", url: session.url }

    // Not published: the reservation was taken over (or publish could not be confirmed). Never hand out this URL. Expire this
    // request's OWN session; it can never be the canonical one because a successor never adopts sessions.
    try { await expireOrConfirm(i.stripe, session.id) } catch { /* unexposed; it expires on its own within about half an hour */ }
    return { kind: "busy" }
  }
  return { kind: "uncertain" }
}
