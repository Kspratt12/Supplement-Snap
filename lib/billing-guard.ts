import type Stripe from "stripe"

/**
 * One Supplement Snap account must not end up with two independently billing subscriptions.
 * Before a checkout starts (and again when a completed checkout is about to replace the stored subscription) this looks
 * at what STRIPE says about the subscription we already hold, because our own table can lag behind Stripe.
 *
 *   active, trialing, past_due  has a plan (past_due: a renewal payment failed and Stripe is retrying)
 *   unpaid, paused              the subscription still exists and needs attention, it is not gone
 *   incomplete                  a first payment is still being processed
 *   canceled, incomplete_expired  finished: a new checkout is allowed (resubscribe / recover from a failed checkout)
 */
export type StoredSubscription =
  | { stripe_subscription_id?: string | null; stripe_customer_id?: string | null; /** other Stripe customers known to belong to the account */ extra_customer_ids?: string[] }
  | null
  | undefined

export type BillingBlock = {
  httpStatus: 409
  code: "already_subscribed" | "payment_failing" | "billing_needs_attention" | "payment_in_progress"
  action: "manage_billing" | "wait"
  message: string
}

export const LIVE_SUBSCRIPTION_STATUSES = new Set<string>(["active", "trialing", "past_due", "unpaid", "paused", "incomplete"])

const MANAGE = "Use Manage billing to update your card, view invoices or cancel."

export function blockFor(status: string): BillingBlock | null {
  switch (status) {
    case "active":
    case "trialing":
      return {
        httpStatus: 409,
        code: "already_subscribed",
        action: "manage_billing",
        message: `You already have a plan, so a second subscription can't be started. ${MANAGE} To change plans, email support@supplementsnap.io from your account email.`,
      }
    case "past_due":
      return {
        httpStatus: 409,
        code: "payment_failing",
        action: "manage_billing",
        message: `Your last payment did not go through and your plan is still active while it is retried. Please update your card instead of starting a new subscription. ${MANAGE}`,
      }
    case "unpaid":
    case "paused":
      return {
        httpStatus: 409,
        code: "billing_needs_attention",
        action: "manage_billing",
        message: `Your existing subscription needs attention before a new one can be started. ${MANAGE} If you are stuck, email support@supplementsnap.io.`,
      }
    case "incomplete":
      return {
        httpStatus: 409,
        code: "payment_in_progress",
        action: "wait",
        message: "A payment for your plan is still being processed. Wait a few minutes and refresh. If it does not clear, email support@supplementsnap.io.",
      }
    default:
      return null // canceled, incomplete_expired, or anything finished
  }
}

/**
 * Every Stripe customer that has the account's email. An account can have several historical customers (earlier guest
 * checkouts each made a new one), so a live subscription on any of them must count. Fails if the list is incomplete.
 */
export async function customerIdsForEmail(stripe: Stripe, email?: string | null): Promise<string[]> {
  if (!email) return []
  const ids = new Set<string>()
  for (const e of new Set([email, email.toLowerCase()])) {
    const list = await stripe.customers.list({ email: e, limit: 100 })
    if (list.has_more) throw new Error("customers could not be listed completely")
    for (const c of list.data) ids.add(c.id)
  }
  return [...ids]
}

/**
 * Returns the block to show, or null when a new checkout may start. Throws if Stripe cannot be asked: the caller
 * must then NOT start a purchase (and a webhook must answer 500 so Stripe retries).
 */
export async function existingBillingBlock(stripe: Stripe, stored: StoredSubscription, ignoreSubscriptionId?: string): Promise<BillingBlock | null> {
  if (!stored) return null
  const seen = new Map<string, string>()
  if (stored.stripe_subscription_id) {
    const sub = await stripe.subscriptions.retrieve(stored.stripe_subscription_id)
    seen.set(sub.id, sub.status)
  }
  // Any other subscription on any customer that belongs to the account counts too (a stray older one is still billing)
  const customers = new Set<string>([...(stored.stripe_customer_id ? [stored.stripe_customer_id] : []), ...(stored.extra_customer_ids ?? [])])
  for (const customer of customers) {
    let startingAfter: string | undefined
    for (let page = 0; ; page++) {
      if (page >= 5) throw new Error("subscriptions could not be listed completely")
      const list = await stripe.subscriptions.list({ customer, status: "all", limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) })
      for (const sub of list.data) seen.set(sub.id, sub.status)
      if (!list.has_more) break
      startingAfter = list.data[list.data.length - 1]?.id
      if (!startingAfter) throw new Error("subscriptions could not be listed completely")
    }
  }
  // a webhook asks about the account's PREVIOUS subscription, so the one that just arrived is not counted against it
  if (ignoreSubscriptionId) seen.delete(ignoreSubscriptionId)
  // the most serious state wins: something billing beats something waiting beats something finished
  for (const order of ["active", "trialing", "past_due", "unpaid", "paused", "incomplete"]) {
    for (const status of seen.values()) if (status === order) return blockFor(status)
  }
  return null
}
