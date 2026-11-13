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
export type StoredSubscription = { stripe_subscription_id?: string | null; stripe_customer_id?: string | null } | null | undefined

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
  if (stored.stripe_customer_id) {
    // Any other subscription on the same Stripe customer counts too (a stray older one is still billing)
    const list = await stripe.subscriptions.list({ customer: stored.stripe_customer_id, status: "all", limit: 20 })
    for (const sub of list.data) seen.set(sub.id, sub.status)
  }
  // a webhook asks about the account's PREVIOUS subscription, so the one that just arrived is not counted against it
  if (ignoreSubscriptionId) seen.delete(ignoreSubscriptionId)
  // the most serious state wins: something billing beats something waiting beats something finished
  for (const order of ["active", "trialing", "past_due", "unpaid", "paused", "incomplete"]) {
    for (const status of seen.values()) if (status === order) return blockFor(status)
  }
  return null
}
