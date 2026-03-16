import { Resend } from "resend"
import { NextResponse } from "next/server"

type EmailType = "welcome" | "subscription_active"

const DASHBOARD_URL = process.env.NEXT_PUBLIC_SITE_URL
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
  : "https://supplementsnap.com/dashboard"

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/app`
  : "https://supplementsnap.com/app"

function buildWelcomeEmail(name: string): { subject: string; html: string } {
  const greeting = name ? `Hi ${name},` : "Hi there,"

  return {
    subject: "Welcome to Supplement Snap",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #27272a;">
        <div style="background-color: #4f46e5; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700;">Supplement Snap</h1>
        </div>
        <div style="border: 1px solid #e4e4e7; border-top: none; padding: 32px 24px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">${greeting}</p>
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
            Thank you for creating your Supplement Snap account. We're glad to have you on board.
          </p>
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
            Supplement Snap helps roofing crews capture hidden damage during tear-off and generate adjuster-ready supplement documentation — all from the field.
          </p>

          <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
            <p style="font-size: 14px; font-weight: 600; color: #18181b; margin: 0 0 12px 0;">Quick Start</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #52525b; vertical-align: top; width: 28px;"><strong>1.</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #52525b;">Start your subscription</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #52525b; vertical-align: top;"><strong>2.</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #52525b;">Create your first project</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #52525b; vertical-align: top;"><strong>3.</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #52525b;">Capture roof damage photos</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #52525b; vertical-align: top;"><strong>4.</strong></td>
                <td style="padding: 6px 0; font-size: 14px; color: #52525b;">Generate your supplement report</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 0 0 24px 0;">
            <a href="${DASHBOARD_URL}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px;">
              Open Dashboard
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0 16px 0;" />
          <p style="font-size: 12px; color: #a1a1aa; margin: 0;">
            Sent by Supplement Snap
          </p>
        </div>
      </div>
    `,
  }
}

function buildSubscriptionActiveEmail(name: string): { subject: string; html: string } {
  const greeting = name ? `Hi ${name},` : "Hi there,"

  return {
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
              <tr>
                <td style="padding: 5px 0; font-size: 14px; color: #15803d; width: 24px; vertical-align: top;">&#10003;</td>
                <td style="padding: 5px 0; font-size: 14px; color: #3f3f46;">Create projects</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-size: 14px; color: #15803d; vertical-align: top;">&#10003;</td>
                <td style="padding: 5px 0; font-size: 14px; color: #3f3f46;">Capture damage findings</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-size: 14px; color: #15803d; vertical-align: top;">&#10003;</td>
                <td style="padding: 5px 0; font-size: 14px; color: #3f3f46;">Generate supplement reports</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-size: 14px; color: #15803d; vertical-align: top;">&#10003;</td>
                <td style="padding: 5px 0; font-size: 14px; color: #3f3f46;">Export PDF documentation</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 0 0 24px 0;">
            <a href="${APP_URL}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px;">
              Open Supplement Snap
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0 16px 0;" />
          <p style="font-size: 12px; color: #a1a1aa; margin: 0;">
            Sent by Supplement Snap
          </p>
        </div>
      </div>
    `,
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const { to, name, type } = (await request.json()) as {
      to: string
      name?: string
      type: EmailType
    }

    if (!to || !type) {
      return NextResponse.json(
        { error: "Recipient email and email type are required" },
        { status: 400 }
      )
    }

    const userName = name || ""
    const email =
      type === "welcome"
        ? buildWelcomeEmail(userName)
        : buildSubscriptionActiveEmail(userName)

    const fromAddress =
      process.env.RESEND_FROM_EMAIL || "reports@supplementsnap.com"

    const { error } = await resend.emails.send({
      from: `Supplement Snap <${fromAddress}>`,
      to: [to],
      subject: email.subject,
      html: email.html,
    })

    if (error) {
      console.error("Onboarding email error:", error)
      return NextResponse.json(
        { error: error.message || "Failed to send email" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Send onboarding email error:", err)
    const message =
      err instanceof Error ? err.message : "Unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
