import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@supplementsnap.com"

export async function POST(request: Request) {
  try {
    const { email, secret } = await request.json()

    // Simple secret check so this can't be called by anyone
    if (secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    )

    // Find the user
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const user = users?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate a password reset link
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://supplement-snap.vercel.app"}/reset-password`,
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Password reset link generated",
      link: data?.properties?.action_link,
    })
  } catch (err) {
    console.error("Admin reset password error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
