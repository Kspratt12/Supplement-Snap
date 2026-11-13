import Stripe from "stripe"
import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "../../../lib/auth-utils"
import { createClient } from "@supabase/supabase-js"
import { getAccess, isPlanPurchasable, planUnavailable } from "../../../lib/plan"
import { customerIdsForEmail, existingBillingBlock, type StoredSubscription } from "../../../lib/billing-guard"
import { CheckoutProtectionUnavailable, SESSION_LIFETIME_SECONDS, expireOrConfirm, keepNewest, openSessions, reuseOrClear, stableCustomer } from "../../../lib/checkout-reservation"

// Used when a checkout may or may not exist (a timeout, a failed re-check). It must not push the customer into a second purchase:
// a checkout already started is reused or replaced on the next attempt, and one already completed is found and answered with
// "manage your billing". Starting a trial charges nothing at this stage.
const UNCERTAIN_MESSAGE =
  "We could not confirm your checkout, and nothing has been charged. If a Stripe checkout page is already open, finish it there. Otherwise wait a minute and try again: we will reuse a checkout you already started instead of creating another."

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY || ""
  return NextResponse.json({ testMode: key.startsWith("sk_test_") })
}

export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to environment variables." },
        { status: 500 }
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const origin = request.headers.get("origin") || "http://localhost:3000"

    let customerEmail: string | undefined
    let userId: string | undefined
    let plan: string = "starter"
    let stripeCustomerId: string | null = null // the account's one stable Stripe customer, when it can be used
    let reuseUrl: string | null = null
    let accountCustomers: StoredSubscription = null
    try {
      const body = await request.json()
      plan = typeof body.plan === "string" ? body.plan : "starter"
    } catch {
      // No body or invalid JSON is fine
    }
    if (!["starter", "team", "pro", "enterprise"].includes(plan)) {
      return NextResponse.json({ error: "Unknown plan." }, { status: 400 })
    }
    // A plan that is not ready to sell cannot be bought, even if a price exists in Stripe
    if (!isPlanPurchasable(plan)) {
      return NextResponse.json({ error: "That plan is not available yet." }, { status: 400 })
    }
    // Someone who is signed in is tied to their own account. A visitor who is not signed in checks out as a guest,
    // and the payment is matched to an account by the email used at checkout.
    const user = await getAuthenticatedUser(request)
    // A new subscription needs a signed-in account with a verified email, enforced here and not only on the button. Without
    // an account there is nothing for the duplicate-subscription protections to attach to, and the plan chosen is kept by the
    // sign-up / log-in pages and offered again afterwards.
    if (!user) {
      return NextResponse.json(
        { error: "Please sign up or log in to start a plan. The plan you chose will be kept.", code: "sign-in-required" },
        { status: 401 }
      )
    }
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Please confirm your email address first. Check your inbox for the confirmation link, then try again.", code: "email-not-verified" },
        { status: 403 }
      )
    }
    {
      userId = user.id
      customerEmail = user.email || undefined
      // Starting a second subscription would bill them twice and orphan the first one
      const access = await getAccess(user.id, user.email)
      // If the plan could not be checked, do not start a purchase that might double-bill an existing plan
      if (access.unavailable) return planUnavailable()
      if (access.active && !access.viaOwner) {
        return NextResponse.json(
          { error: "You already have an active plan, so a second one can't be started. Plan changes aren't available through the billing portal yet. Email support@supplementsnap.io from your account email to request a change. We'll confirm the available options and any billing impact before making changes. Use Manage billing to update your card, view invoices or cancel." },
          { status: 409 }
        )
      }
      // Our own table can lag behind Stripe, so Stripe is asked directly before another subscription is started.
      // If it cannot be asked, or the protection's tables are missing, NOTHING is started: a second subscription would bill twice
      // and this path never quietly weakens itself.
      const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")
      const { data: stored, error: storedError } = await db
        .from("subscriptions")
        .select("stripe_subscription_id, stripe_customer_id")
        .eq("user_id", user.id)
        .maybeSingle()
      let block = null
      try {
        if (storedError) throw new Error("subscription lookup failed")
        // One stable Stripe customer per account. Existing subscribers keep the customer they already have.
        const customer = await stableCustomer(db as never, stripe, { id: user.id, email: user.email }, stored?.stripe_customer_id)
        stripeCustomerId = customer.id
        accountCustomers = { stripe_subscription_id: stored?.stripe_subscription_id, stripe_customer_id: customer.id, extra_customer_ids: [...(stored?.stripe_customer_id && stored.stripe_customer_id !== customer.id ? [stored.stripe_customer_id] : []), ...(await customerIdsForEmail(stripe, user.email))] }
        block = await existingBillingBlock(stripe, accountCustomers)
        // The same plan reuses its open checkout; open checkouts for other plans are expired first
        if (!block) reuseUrl = await reuseOrClear(stripe, customer.id, plan)
      } catch (err) {
        if (err instanceof CheckoutProtectionUnavailable) {
          console.error("Checkout protection unavailable: apply supabase-migration-v14-billing-customers-and-review.sql, then redeploy")
          return NextResponse.json(
            { error: "Checkout is temporarily unavailable. Please try again later or email support@supplementsnap.io.", code: "checkout-unavailable" },
            { status: 503 }
          )
        }
        console.error("Checkout billing check failed:", err instanceof Error ? err.name : "unknown")
        return NextResponse.json(
          { error: "We could not check your billing right now, so no checkout was started and nothing was charged. Please try again in a moment.", code: "checkout-not-started" },
          { status: 503 }
        )
      }
      if (block) return NextResponse.json({ error: block.message, code: block.code, action: block.action }, { status: block.httpStatus })
      if (reuseUrl) return NextResponse.json({ url: reuseUrl })
    }

    // Determine price ID based on plan
    let priceMonthly: string | undefined

    if (plan === "enterprise") {
      priceMonthly = process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY
    } else if (plan === "pro") {
      priceMonthly = process.env.STRIPE_PRICE_PRO_MONTHLY
    } else if (plan === "team") {
      priceMonthly = process.env.STRIPE_PRICE_TEAM_MONTHLY
    } else {
      priceMonthly = process.env.STRIPE_PRICE_MONTHLY
    }

    if (!priceMonthly) {
      return NextResponse.json(
        { error: `Stripe price ID not configured for ${plan} plan.` },
        { status: 500 }
      )
    }

    let session: Stripe.Checkout.Session
    try {
      session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      ...(stripeCustomerId ? { customer: stripeCustomerId } : customerEmail ? { customer_email: customerEmail } : {}),
      expires_at: Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS,
      metadata: { supabase_user_id: userId || "", plan },
      subscription_data: {
        trial_period_days: 14,
        metadata: { supabase_user_id: userId || "", plan },
      },
      line_items: [
        {
          price: priceMonthly,
          quantity: 1,
        },
      ],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=true`,
    })
    } catch (err) {
      console.error("Checkout session creation failed:", err instanceof Error ? err.name : "unknown")
      return NextResponse.json({ error: UNCERTAIN_MESSAGE, code: "checkout-uncertain" }, { status: 503 })
    }

    if (!stripeCustomerId) return NextResponse.json({ url: session.url }) // a guest: no account to protect

    // The session now exists. Check again, in this order, before handing it out; if anything fails the session is expired
    // (best effort) and nothing is returned, so a link nobody received can never be paid.
    try {
      // 1. A payment may have completed while this request was working (so an expire call could have lost to a completion)
      const late = await existingBillingBlock(stripe, accountCustomers)
      if (late) {
        await expireOrConfirm(stripe, session.id)
        return NextResponse.json({ error: late.message, code: late.code, action: late.action }, { status: late.httpStatus })
      }
      // 2. Another checkout for this account made at the same moment: only the newest stays open
      let url = await keepNewest(stripe, stripeCustomerId, { id: session.id, url: session.url })
      if (!url) {
        // a competing request expired ours; hand out the one that is open now
        url = (await openSessions(stripe, stripeCustomerId))[0]?.url ?? null
      }
      if (!url) throw new Error("no open checkout session")
      return NextResponse.json({ url })
    } catch (err) {
      console.error("Checkout reconciliation failed:", err instanceof Error ? err.name : "unknown")
      try { await expireOrConfirm(stripe, session.id) } catch { /* it was never handed out; it expires on its own in about half an hour */ }
      return NextResponse.json({ error: UNCERTAIN_MESSAGE, code: "checkout-uncertain" }, { status: 503 })
    }
  } catch (err) {
    console.error("Stripe checkout error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
