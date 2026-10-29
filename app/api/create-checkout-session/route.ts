import Stripe from "stripe"
import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "../../../lib/auth-utils"
import { getAccess, isPlanPurchasable } from "../../../lib/plan"

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
      if (access.active && !access.viaOwner) {
        return NextResponse.json(
          { error: "You already have an active plan. Use Manage billing on your account page to change or cancel it, so you are not billed twice." },
          { status: 409 }
        )
      }
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
      ...(customerEmail ? { customer_email: customerEmail } : {}),
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

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("Stripe checkout error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
