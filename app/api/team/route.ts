import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getUserId } from "../../../lib/auth-utils"

const supabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

// GET — list team members for an owner
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const paramOwnerId = searchParams.get("ownerId")

  const ownerId = await getUserId(request, paramOwnerId)
  if (!ownerId) return NextResponse.json({ error: "Missing ownerId" }, { status: 400 })

  const { data, error } = await supabase()
    .from("team_members")
    .select("*")
    .eq("owner_id", ownerId)
    .order("invited_at", { ascending: false })

  if (error) return NextResponse.json({ members: [] })
  return NextResponse.json({ members: data })
}

// POST — invite a team member
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, role } = body

    const ownerId = await getUserId(request, body.ownerId)
    if (!ownerId || !email) {
      return NextResponse.json({ error: "Owner ID and email required" }, { status: 400 })
    }

    // Check plan limits
    const { data: sub } = await supabase()
      .from("subscriptions")
      .select("plan")
      .eq("user_id", ownerId)
      .single()

    const plan = sub?.plan || "starter"
    const maxMembers: Record<string, number> = { starter: 0, team: 2, pro: 4 }
    const limit = maxMembers[plan] ?? 0

    const { count } = await supabase()
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", ownerId)

    if ((count ?? 0) >= limit) {
      const planName = plan === "starter" ? "Starter (1 user only)" : plan === "team" ? "Team (up to 3 users)" : "Pro (up to 5 users)"
      return NextResponse.json({ error: `Team member limit reached for your ${planName} plan. Upgrade to add more members.` }, { status: 403 })
    }

    // Check if already invited
    const { data: existing } = await supabase()
      .from("team_members")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("member_email", email.toLowerCase())
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "This person has already been invited" }, { status: 400 })
    }

    // Check if this email has an account
    const { data: users } = await supabase().auth.admin.listUsers()
    const matchedUser = users?.users?.find(u => u.email === email.toLowerCase())

    const { data, error } = await supabase()
      .from("team_members")
      .insert({
        owner_id: ownerId,
        member_email: email.toLowerCase(),
        member_name: name || null,
        member_user_id: matchedUser?.id || null,
        role: role || "crew",
        status: matchedUser ? "active" : "pending",
        accepted_at: matchedUser ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Send invite email via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend")
        const resend = new Resend(process.env.RESEND_API_KEY)
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://supplement-snap.vercel.app"
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "reports@supplementsnap.com",
          to: email.toLowerCase(),
          subject: "You've been invited to Supplement Snap",
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:480px;margin:0 auto;">
              <div style="background:#4f46e5;padding:16px 24px;border-radius:12px 12px 0 0;">
                <p style="color:#fff;font-weight:600;font-size:14px;margin:0;">Supplement Snap</p>
              </div>
              <div style="padding:24px;background:#fff;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 12px 12px;">
                <p style="font-size:15px;color:#18181b;">You've been invited to join a roofing team on Supplement Snap.</p>
                <p style="font-size:14px;color:#71717a;">Capture hidden roof damage during tear-off, generate supplement reports, and send documentation to adjusters.</p>
                <a href="${siteUrl}/signup" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
                  Create Your Account
                </a>
              </div>
            </div>
          `,
        })
      } catch {
        // Email failed but invite was created
      }
    }

    return NextResponse.json({ member: data })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

// DELETE — remove a team member
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { error } = await supabase().from("team_members").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
