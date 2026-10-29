import { Resend } from "resend"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getAuthenticatedUser } from "../../../lib/auth-utils"
import { rateLimited } from "../../../lib/rate-limit"
import { getAccess, can } from "../../../lib/plan"

// User-typed text is placed in the email as plain text, so it cannot add markup or links of its own
function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email service not configured. Add RESEND_API_KEY to .env.local" },
        { status: 500 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (rateLimited(`send-report:${user.id}`, 30, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many emails sent. Please try again later." }, { status: 429 })
    }

    const { to, subject, message, pdfBase64, fileName, projectName, propertyAddress, projectId, companyName, followUpDays } = await request.json()
    // Never trust a client-supplied user id
    const userId = user.id

    if (typeof to !== "string" || !/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(to)) {
      return NextResponse.json({ error: "A single valid recipient email is required" }, { status: 400 })
    }
    const access = await getAccess(user.id, user.email)
    const emailingSelf = to.toLowerCase() === (user.email || "").toLowerCase()
    if (!access.active && !emailingSelf) {
      return NextResponse.json({ error: "An active plan is required to email reports to adjusters." }, { status: 403 })
    }
    if (typeof pdfBase64 === "string" && pdfBase64.length > 14_000_000) {
      return NextResponse.json({ error: "Attachment too large" }, { status: 413 })
    }

    if (!to || !subject) {
      return NextResponse.json(
        { error: "Recipient email and subject are required" },
        { status: 400 }
      )
    }

    // Create email tracking record
    let trackingPixelHtml = ""
    try {
      if (!can.emailTracking(access)) throw new Error("Open tracking is not on this plan")
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
      )
      const { data: trackData } = await supabase
        .from("email_tracking")
        .insert({
          project_id: projectId || null,
          user_id: userId || null,
          recipient_email: to,
          subject: subject,
          follow_up_at: followUpDays ? new Date(Date.now() + followUpDays * 86400000).toISOString() : null,
        })
        .select("tracking_token")
        .single()

      if (trackData?.tracking_token) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://supplement-snap.vercel.app"
        trackingPixelHtml = `<img src="${siteUrl}/api/email-track?t=${trackData.tracking_token}" width="1" height="1" style="display:none" alt="" />`
      }
    } catch {
      // Tracking failed silently — email still sends
    }

    // Use company branding if available
    const safeCompany = typeof companyName === "string" ? companyName.replace(/[\r\n<>"]/g, " ").trim().slice(0, 120) : ""
    const brandName = escapeHtml(safeCompany || "Supplement Snap")
    const headerTitle = safeCompany ? `${escapeHtml(safeCompany)} – Supplement Report` : "Supplement Snap – Project Report"
    const footerText = safeCompany ? `Sent by ${escapeHtml(safeCompany)} via Supplement Snap` : "Sent via Supplement Snap"

    // Build HTML email body
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #27272a;">
        <div style="background-color: #4f46e5; padding: 18px 24px; border-radius: 10px 10px 0 0;">
          <h2 style="color: #ffffff; margin: 0; font-size: 16px; font-weight: 600;">${headerTitle}</h2>
        </div>
        <div style="border: 1px solid #e4e4e7; border-top: none; padding: 28px 24px; border-radius: 0 0 10px 10px;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 0 0 4px 0;">
                <span style="font-size: 12px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px;">Project</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 0 16px 0;">
                <span style="font-size: 17px; font-weight: 700; color: #18181b;">${escapeHtml(projectName)}</span>
              </td>
            </tr>
            ${propertyAddress ? `
            <tr>
              <td style="padding: 0 0 4px 0;">
                <span style="font-size: 12px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px;">Property Address</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 0 16px 0;">
                <span style="font-size: 15px; color: #3f3f46;">${escapeHtml(propertyAddress)}</span>
              </td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding: 0 0 4px 0;">
                <span style="font-size: 12px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px;">From</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 0 8px 0;">
                <span style="font-size: 15px; color: #3f3f46;">${brandName}</span>
              </td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 16px 0;" />
          <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: #3f3f46;">
${escapeHtml(message)}
          </div>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0 12px 0;" />
          <p style="font-size: 11px; color: #a1a1aa; margin: 0;">
            ${footerText}
          </p>
        </div>
        ${trackingPixelHtml}
      </div>
    `

    const fromAddress = process.env.RESEND_FROM_EMAIL || "reports@supplementsnap.io"
    const fromName = safeCompany ? `${safeCompany} via Supplement Snap` : "Supplement Snap"

    const { error } = await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: [to],
      replyTo: user.email || undefined,
      subject,
      html: htmlBody,
      attachments: pdfBase64
        ? [
            {
              filename: fileName || "Project-Report.pdf",
              content: pdfBase64,
            },
          ]
        : [],
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json(
        { error: error.message || "Failed to send email" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Send report error:", err)
    const message =
      err instanceof Error ? err.message : "Unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
