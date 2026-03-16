import Stripe from "stripe"
import { NextResponse } from "next/server"

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

    const priceSetup = process.env.STRIPE_PRICE_SETUP
    const priceMonthly = process.env.STRIPE_PRICE_MONTHLY

    if (!priceSetup || !priceMonthly) {
      return NextResponse.json(
        { error: "Stripe price IDs not configured. Add STRIPE_PRICE_SETUP and STRIPE_PRICE_MONTHLY." },
        { status: 500 }
      )
    }

    const origin = request.headers.get("origin") || "http://localhost:3000"

    // Accept optional email and userId to pre-fill checkout and link user
    let customerEmail: string | undefined
    let userId: string | undefined
    try {
      const body = await request.json()
      customerEmail = body.email
      userId = body.userId
    } catch {
      // No body or invalid JSON is fine
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      metadata: { supabase_user_id: userId || "" },
      subscription_data: {
        metadata: { supabase_user_id: userId || "" },
      },
      line_items: [
        {
          price: priceSetup,
          quantity: 1,
        },
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
