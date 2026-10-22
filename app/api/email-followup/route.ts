import { Resend } from "resend"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// This endpoint can be called by a Vercel Cron Job (see vercel.json)
// It finds emails that haven't been opened and are past their follow_up_at date,
// then sends a polite follow-up to the adjuster.

export async function GET() {
  try {
    if (!process.env.RESEND_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Missing config" }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    )
    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.RESEND_FROM_EMAIL || "reports@updates.sprattenterprise.com"

    // Find emails due for follow-up: not opened, follow_up_at in the past, not already followed up
    const { data: pending } = await supabase
      .from("email_tracking")
      .select("id, recipient_email, subject, project_id")
      .not("follow_up_at", "is", null)
      .lte("follow_up_at", new Date().toISOString())
      .is("opened_at", null)
      .is("followed_up_at", null)
      .limit(20)

    if (!pending || pending.length === 0) {
      return NextResponse.json({ sent: 0 })
    }

    let sent = 0
    for (const record of pending) {
      try {
        await resend.emails.send({
          from: fromEmail,
          to: record.recipient_email,
          subject: `Follow-up: ${record.subject}`,
          html: `
            <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
              <p style="font-size: 15px; color: #3f3f46; line-height: 1.7;">
                Hi,<br><br>
                Just following up on the supplement documentation I sent over a few days ago regarding the subject: <strong>${record.subject}</strong>.<br><br>
                Please let me know if you need any additional documentation or photos to review the supplement request.<br><br>
                Thank you for your time.
              </p>
            </div>
          `,
        })

        await supabase
          .from("email_tracking")
          .update({ followed_up_at: new Date().toISOString() })
          .eq("id", record.id)

        sent++
      } catch {
        // Skip failed sends
      }
    }

    return NextResponse.json({ sent })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 })
  }
}
