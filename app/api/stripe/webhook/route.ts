import Stripe from "stripe"
import { Resend } from "resend"
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

        // Send subscription activation email
        if (customerEmail && process.env.RESEND_API_KEY) {
          try {
            // Look up user name if we have a userId
            let userName = ""
            if (userId) {
              const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId)
              userName = userData?.user?.user_metadata?.full_name || ""
            }

            const appUrl = process.env.NEXT_PUBLIC_SITE_URL
              ? `${process.env.NEXT_PUBLIC_SITE_URL}/app`
              : "https://supplementsnap.io/app"
            const fromAddress = process.env.RESEND_FROM_EMAIL || "reports@supplementsnap.com"
            const greeting = userName ? `Hi ${userName},` : "Hi there,"

            const resend = new Resend(process.env.RESEND_API_KEY)
            await resend.emails.send({
              from: `Supplement Snap <${fromAddress}>`,
              to: [customerEmail],
              subject: "Your Supplement Snap subscription is active",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #27272a;">
                  <div style="background-color: #4f46e5; padding: 20px 24px; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700;">Supplement Snap</h1>
                  </div>
                  <div style="border: 1px solid #e4e4e7; border-top: none; padding: 32px 24px; border-radius: 0 0 8px 8px;">
                    <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">${greeting}</p>
                    <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                      Your account is now fully activated. You're all set to start using Supplement Snap with your team.
                    </p>
                    <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
                      <p style="font-size: 14px; font-weight: 600; color: #166534; margin: 0 0 12px 0;">You can now:</p>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 5px 0; font-size: 14px; color: #15803d; width: 24px; vertical-align: top;">&#10003;</td><td style="padding: 5px 0; font-size: 14px; color: #3f3f46;">Create projects</td></tr>
                        <tr><td style="padding: 5px 0; font-size: 14px; color: #15803d; vertical-align: top;">&#10003;</td><td style="padding: 5px 0; font-size: 14px; color: #3f3f46;">Capture damage findings</td></tr>
                        <tr><td style="padding: 5px 0; font-size: 14px; color: #15803d; vertical-align: top;">&#10003;</td><td style="padding: 5px 0; font-size: 14px; color: #3f3f46;">Generate supplement reports</td></tr>
                        <tr><td style="padding: 5px 0; font-size: 14px; color: #15803d; vertical-align: top;">&#10003;</td><td style="padding: 5px 0; font-size: 14px; color: #3f3f46;">Export PDF documentation</td></tr>
                      </table>
                    </div>
                    <div style="text-align: center; margin: 0 0 24px 0;">
                      <a href="${appUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px;">Open Supplement Snap</a>
                    </div>
                    <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0 16px 0;" />
                    <p style="font-size: 12px; color: #a1a1aa; margin: 0;">Sent by Supplement Snap</p>
                  </div>
                </div>
              `,
            })
          } catch (emailErr) {
            console.error("Subscription activation email failed:", emailErr)
          }
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
