import Stripe from "stripe"
import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "../../../lib/auth-utils"
import { createClient } from "@supabase/supabase-js"
import { getAccess, isPlanPurchasable, planUnavailable } from "../../../lib/plan"
import { customerIdsForEmail, existingBillingBlock, type StoredSubscription } from "../../../lib/billing-guard"
import { CheckoutProtectionUnavailable, SESSION_LIFETIME_SECONDS, stableCustomer } from "../../../lib/checkout-reservation"
import { startCheckout, type RpcDb } from "../../../lib/checkout-flow"

// Used when a checkout may or may not exist (a timeout, a failed step). It must not push the customer into a second purchase:
// a checkout already started is reused or replaced on the next attempt, and one already completed is found and answered with
// "manage your billing". Starting a trial charges nothing at this stage.
const UNCERTAIN_MESSAGE =
  "We could not confirm your checkout, and nothing has been charged. If a Stripe checkout page is already open, finish it there. Otherwise wait a minute and try again: we will reuse a checkout you already started instead of creating another."

const BUSY_MESSAGE = "Your checkout is being prepared. Please wait a few seconds and try again; we will give you the same checkout."

const ALREADY_ACTIVE =
  "You already have an active plan, so a second one can't be started. Plan changes aren't available through the billing portal yet. Email support@supplementsnap.io from your account email to request a change. We'll confirm the available options and any billing impact before making changes. Use Manage billing to update your card, view invoices or cancel."

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

    let plan: string = "starter"
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

    // A new subscription needs a signed-in account with a verified email, enforced here and not only on the button. The plan chosen
    // is kept by the sign-up / log-in pages and offered again afterwards.
    const user = await getAuthenticatedUser(request)
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

    // Starting a second subscription would bill them twice and orphan the first one
    const access = await getAccess(user.id, user.email)
    // If the plan could not be checked, do not start a purchase that might double-bill an existing plan
    if (access.unavailable) return planUnavailable()
    if (access.active && !access.viaOwner) return NextResponse.json({ error: ALREADY_ACTIVE }, { status: 409 })

    // The price for the plan, resolved before anything is reserved
    const priceMonthly =
      plan === "enterprise" ? process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY
      : plan === "pro" ? process.env.STRIPE_PRICE_PRO_MONTHLY
      : plan === "team" ? process.env.STRIPE_PRICE_TEAM_MONTHLY
      : process.env.STRIPE_PRICE_MONTHLY
    if (!priceMonthly) {
      return NextResponse.json({ error: `Stripe price ID not configured for ${plan} plan.` }, { status: 500 })
    }
    // The reservation covers the three plans on sale (its table only accepts these)
    if (plan === "enterprise") return NextResponse.json({ error: "That plan is not available yet." }, { status: 400 })

    // Our own table can lag behind Stripe, so Stripe is asked directly. If it cannot be asked, or the protection's tables or functions
    // are missing, NOTHING is started: a second subscription would bill twice and this path never quietly weakens itself.
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")
    const { data: stored, error: storedError } = await db
      .from("subscriptions")
      .select("stripe_subscription_id, stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle()

    let customerId = ""
    let accountCustomers: StoredSubscription = null
    try {
      if (storedError) throw new Error("subscription lookup failed")
      // One stable Stripe customer per account. Existing subscribers keep the customer they already have.
      const customer = await stableCustomer(db as never, stripe, { id: user.id, email: user.email }, stored?.stripe_customer_id)
      customerId = customer.id
      accountCustomers = {
        stripe_subscription_id: stored?.stripe_subscription_id,
        stripe_customer_id: customer.id,
        extra_customer_ids: [...(stored?.stripe_customer_id && stored.stripe_customer_id !== customer.id ? [stored.stripe_customer_id] : []), ...(await customerIdsForEmail(stripe, user.email))],
      }
      const block = await existingBillingBlock(stripe, accountCustomers)
      if (block) return NextResponse.json({ error: block.message, code: block.code, action: block.action }, { status: block.httpStatus })
    } catch (err) {
      return unavailableOr503(err, "Checkout billing check failed:")
    }

    const requestId = crypto.randomUUID()
    try {
      const result = await startCheckout({
        stripe,
        db: db as unknown as RpcDb,
        userId: user.id,
        customerId,
        accountCustomers,
        plan,
        requestId,
        createSession: (reservationRequestId) =>
          stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            customer: customerId,
            expires_at: Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS,
            metadata: { supabase_user_id: user.id, plan, reservation_request_id: reservationRequestId },
            subscription_data: { trial_period_days: 14, metadata: { supabase_user_id: user.id, plan } },
            line_items: [{ price: priceMonthly, quantity: 1 }],
            success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/pricing?canceled=true`,
          }),
      })
      if (result.kind === "url") return NextResponse.json({ url: result.url })
      if (result.kind === "blocked") return NextResponse.json({ error: result.block.message, code: result.block.code, action: result.block.action }, { status: result.block.httpStatus })
      if (result.kind === "busy") return NextResponse.json({ error: BUSY_MESSAGE, code: "checkout-in-progress" }, { status: 409 })
      return NextResponse.json({ error: UNCERTAIN_MESSAGE, code: "checkout-uncertain" }, { status: 503 })
    } catch (err) {
      if (err instanceof CheckoutProtectionUnavailable) return unavailableOr503(err, "")
      console.error("Checkout failed:", err instanceof Error ? err.name : "unknown")
      return NextResponse.json({ error: UNCERTAIN_MESSAGE, code: "checkout-uncertain" }, { status: 503 })
    }
  } catch (err) {
    console.error("Stripe checkout error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function unavailableOr503(err: unknown, prefix: string) {
  if (err instanceof CheckoutProtectionUnavailable) {
    console.error("Checkout protection unavailable: apply supabase-migration-v14-billing-customers-and-review.sql, then supabase-migration-v15-checkout-reservations.sql, then redeploy")
    return NextResponse.json(
      { error: "Checkout is temporarily unavailable. Please try again later or email support@supplementsnap.io.", code: "checkout-unavailable" },
      { status: 503 }
    )
  }
  console.error(prefix, err instanceof Error ? err.name : "unknown")
  return NextResponse.json(
    { error: "We could not check your billing right now, so no checkout was started and nothing was charged. Please try again in a moment.", code: "checkout-not-started" },
    { status: 503 }
  )
}
