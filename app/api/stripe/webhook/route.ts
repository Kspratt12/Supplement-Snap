import Stripe from "stripe"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  )

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const customerEmail = session.customer_details?.email
        // Prefer user ID from metadata, fall back to email lookup
        const metadataUserId = session.metadata?.supabase_user_id

        let userId = metadataUserId || null

        if (!userId && customerEmail) {
          const { data: users } = await supabaseAdmin.auth.admin.listUsers()
          const matched = users?.users?.find(
            (u) => u.email?.toLowerCase() === customerEmail.toLowerCase()
          )
          userId = matched?.id || null
        }

        if (userId) {
          await supabaseAdmin.from("subscriptions").upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              stripe_customer_email: customerEmail || "",
              status: "active",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          )
        } else if (customerEmail) {
          await supabaseAdmin.from("subscriptions").insert({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_customer_email: customerEmail,
            status: "active",
          })
        }
        break
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const statusMap: Record<string, string> = {
          active: "active",
          trialing: "trialing",
          past_due: "past_due",
          canceled: "canceled",
          unpaid: "inactive",
          incomplete: "inactive",
          incomplete_expired: "inactive",
          paused: "inactive",
        }
        const mappedStatus = statusMap[sub.status] || "inactive"
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: mappedStatus, updated_at: new Date().toISOString() })
          .eq("stripe_customer_id", customerId)
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("stripe_customer_id", customerId)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_customer_id", customerId)
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("stripe_customer_id", customerId)
        break
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
