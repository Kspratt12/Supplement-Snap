import { NextResponse } from "next/server"
import { Resend } from "resend"

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)

export async function POST(request: Request) {
  const { email, company } = (await request.json().catch(() => ({}))) as {
    email?: string
    company?: string
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  const notifyTo = process.env.WAITLIST_NOTIFY_EMAIL
  if (!process.env.RESEND_API_KEY || !notifyTo) {
    console.error("Waitlist signup (email not configured):", email, company)
    return NextResponse.json({ error: "Waitlist email not configured" }, { status: 500 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromAddress = process.env.RESEND_FROM_EMAIL || "reports@supplementsnap.io"

  const { error } = await resend.emails.send({
    from: `Supplement Snap <${fromAddress}>`,
    to: [notifyTo],
    replyTo: email,
    subject: "New Supplement Snap waitlist signup",
    html: `<p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Company:</strong> ${escapeHtml(company || "-")}</p>`,
  })

  if (error) {
    console.error("Waitlist email error:", error)
    return NextResponse.json({ error: "Failed to send" }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
