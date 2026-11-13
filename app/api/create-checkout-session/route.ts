import Stripe from "stripe"
import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "../../../lib/auth-utils"
import { createClient } from "@supabase/supabase-js"
import { getAccess, isPlanPurchasable, planUnavailable } from "../../../lib/plan"
import { existingBillingBlock } from "../../../lib/billing-guard"
import { SESSION_LIFETIME_SECONDS, keepNewest, reuseOrClear, stableCustomer } from "../../../lib/checkout-reservation"

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
    if (user) {
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
      // Our own table can lag behind Stripe, so also ask Stripe about the subscription we hold before starting another.
      // If that cannot be checked, nothing is started: a second subscription would bill twice.
      const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")
      const { data: stored, error: storedError } = await db
        .from("subscriptions")
        .select("stripe_subscription_id, stripe_customer_id")
        .eq("user_id", user.id)
        .maybeSingle()
      let block = null
      try {
        if (storedError) throw new Error("subscription lookup failed")
        // One stable Stripe customer per account, so what Stripe holds for it (subscriptions and open checkouts) can be
        // read directly and does not wait for our webhook. Existing subscribers keep the customer they already have.
        const customer = await stableCustomer(db as never, stripe, { id: user.id, email: user.email }, stored?.stripe_customer_id)
        stripeCustomerId = customer.degraded ? null : customer.id
        block = await existingBillingBlock(stripe, {
          stripe_subscription_id: stored?.stripe_subscription_id,
          stripe_customer_id: customer.id ?? stored?.stripe_customer_id,
        })
        // The same plan reuses its open checkout; open checkouts for other plans are expired first
        if (!block && stripeCustomerId) reuseUrl = await reuseOrClear(stripe, stripeCustomerId, plan)
      } catch (err) {
        console.error("Checkout billing check failed:", err instanceof Error ? err.name : "unknown")
        return NextResponse.json(
          { error: "We could not check your billing right now, so no subscription was started. Please try again in a moment." },
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

    const session = await stripe.checkout.sessions.create({
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

    // If another checkout for this account was made at the same moment, only the newest stays open
    const url = stripeCustomerId ? await keepNewest(stripe, stripeCustomerId, { id: session.id, url: session.url }) : session.url
    return NextResponse.json({ url })
  } catch (err) {
    console.error("Stripe checkout error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
