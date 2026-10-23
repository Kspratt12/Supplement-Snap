import { Resend } from "resend"
import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "../../../lib/auth-utils"
import { rateLimited } from "../../../lib/rate-limit"

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

// Emails a user's feedback to the owner. Nothing is stored. Set
// FEEDBACK_TO_EMAIL in the environment to choose where it goes.
export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (rateLimited(`feedback:${user.id}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 })
  }

  const to = process.env.FEEDBACK_TO_EMAIL
  if (!process.env.RESEND_API_KEY || !to) {
    return NextResponse.json({ error: "Feedback is not available right now." }, { status: 503 })
  }

  try {
    const body = await request.json()
    const message = typeof body?.message === "string" ? body.message.trim() : ""
    if (message.length < 3) {
      return NextResponse.json({ error: "Please write a short message." }, { status: 400 })
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: "Message is too long (2000 characters max)." }, { status: 400 })
    }
    const page = typeof body?.page === "string" ? body.page.slice(0, 200) : ""

    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromAddress = process.env.RESEND_FROM_EMAIL || "reports@supplementsnap.io"
    const userEmail = user.email || "unknown"

    const { error } = await resend.emails.send({
      from: `Supplement Snap <${fromAddress}>`,
      to: [to],
      replyTo: user.email || undefined,
      subject: `Supplement Snap feedback from ${userEmail}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; color: #27272a;">
          <p style="font-size: 13px; color: #71717a;">From: ${escapeHtml(userEmail)}${page ? ` &middot; Page: ${escapeHtml(page)}` : ""}</p>
          <p style="font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</p>
        </div>
      `,
    })

    if (error) {
      console.error("Feedback email error:", error)
      return NextResponse.json({ error: "Could not send feedback. Please try again." }, { status: 502 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Could not send feedback. Please try again." }, { status: 500 })
  }
}
