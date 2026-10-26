import { Resend } from "resend"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { needsSetupReminder } from "../../../lib/setup-reminders"

// Runs once a day from Vercel Cron (see vercel.json).
// Paying customers who have never signed in get a fresh set-password link, at most twice.

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!process.env.RESEND_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Missing config" }, { status: 500 })
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")
  const resend = new Resend(process.env.RESEND_API_KEY)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://supplementsnap.io"
  const fromEmail = process.env.RESEND_FROM_EMAIL || "reports@supplementsnap.io"

  try {
    const { data: subs } = await admin.from("subscriptions").select("user_id, status").in("status", ["active", "trialing"]).not("user_id", "is", null)
    const paidIds = new Set((subs || []).map((s) => s.user_id as string))
    if (paidIds.size === 0) return NextResponse.json({ sent: 0 })

    let sent = 0
    for (let page = 1; page <= 10 && sent < 20; page++) {
      const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 })
      const users = data?.users || []
      for (const u of users) {
        if (sent >= 20) break
        if (!u.email || !paidIds.has(u.id)) continue
        const meta = (u.user_metadata || {}) as { setup_reminders_sent?: number; setup_reminder_last?: string; full_name?: string }
        const due = needsSetupReminder({
          createdAt: u.created_at,
          lastSignInAt: u.last_sign_in_at,
          remindersSent: meta.setup_reminders_sent,
          lastReminderAt: meta.setup_reminder_last,
          paid: true,
        })
        if (!due) continue

        const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
          type: "recovery",
          email: u.email,
          options: { redirectTo: `${siteUrl}/reset-password` },
        })
        const actionLink = link?.properties?.action_link
        if (linkErr || !actionLink) {
          console.error("Setup reminder link failed:", linkErr?.message)
          continue
        }

        const first = (meta.full_name || "").split(" ")[0]
        const result = await resend.emails.send({
          from: `Supplement Snap <${fromEmail}>`,
          to: [u.email],
          replyTo: "support@supplementsnap.io",
          subject: "Your Supplement Snap plan is ready: choose your password",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #27272a;">
              <div style="background-color: #4f46e5; padding: 20px 24px; border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700;">Supplement Snap</h1>
              </div>
              <div style="border: 1px solid #e4e4e7; border-top: none; padding: 32px 24px; border-radius: 0 0 8px 8px;">
                <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hi${first ? " " + first : ""},</p>
                <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Your Supplement Snap plan is paid for and ready, but we have not seen you log in yet. Choose a password to get started. It takes about a minute.</p>
                <div style="text-align: center; margin: 0 0 20px 0;">
                  <a href="${actionLink}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 28px; border-radius: 8px;">Choose my password</a>
                </div>
                <p style="font-size: 13px; line-height: 1.6; color: #52525b; margin: 0 0 12px 0;">This link works for a limited time. Your login email is ${u.email}. If it stops working, reply to this email and we will send a new one, or we can set things up with you over a quick call.</p>
                <p style="font-size: 13px; line-height: 1.6; color: #52525b; margin: 0;">If you would rather not use Supplement Snap, reply and we will cancel your plan and sort out the billing.</p>
              </div>
            </div>`,
        })
        if (result.error) {
          console.error("Setup reminder email failed:", result.error.message)
          continue
        }

        await admin.auth.admin.updateUserById(u.id, {
          user_metadata: { ...(u.user_metadata || {}), setup_reminders_sent: (meta.setup_reminders_sent ?? 0) + 1, setup_reminder_last: new Date().toISOString() },
        })
        sent++
      }
      if (users.length < 200) break
    }
    return NextResponse.json({ sent })
  } catch (err) {
    console.error("Setup reminders error:", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
