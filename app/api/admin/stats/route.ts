import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@supplementsnap.com"

export async function POST(request: Request) {
  try {
    const { userEmail } = await request.json()

    if (!userEmail || userEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    )

    // Fetch all users
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
    const users = usersData?.users || []

    // Fetch all subscriptions
    const { data: subscriptions } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .order("updated_at", { ascending: false })

    // Fetch all projects
    const { data: projects } = await supabaseAdmin
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })

    // Fetch total captures count
    const { count: totalCaptures } = await supabaseAdmin
      .from("captures")
      .select("*", { count: "exact", head: true })

    // Fetch reports count (captures with Sent or Ready to Send status)
    const { count: totalReports } = await supabaseAdmin
      .from("captures")
      .select("*", { count: "exact", head: true })
      .in("status", ["Sent", "Ready to Send"])

    // Build subscription lookup by user_id
    const subsByUserId = new Map<string, { status: string; stripe_customer_email: string }>()
    const subsByEmail = new Map<string, { status: string }>()
    for (const sub of subscriptions || []) {
      if (sub.user_id) subsByUserId.set(sub.user_id, sub)
      if (sub.stripe_customer_email) subsByEmail.set(sub.stripe_customer_email.toLowerCase(), sub)
    }

    // Subscription counts
    const activeCount = (subscriptions || []).filter(
      (s) => s.status === "active" || s.status === "trialing"
    ).length
    const trialCount = (subscriptions || []).filter(
      (s) => s.status === "trialing"
    ).length
    const inactiveCount = users.length - activeCount

    // Recent users (last 10)
    const sortedUsers = [...users].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const recentUsers = sortedUsers.slice(0, 10).map((u) => {
      const sub = subsByUserId.get(u.id) || (u.email ? subsByEmail.get(u.email.toLowerCase()) : null)
      return {
        name: u.user_metadata?.full_name || "",
        email: u.email || "",
        created_at: u.created_at,
        subscription_status: sub?.status || "inactive",
      }
    })

    // Recent projects (last 10) with user email and capture counts
    const recentProjects = []
    for (const p of (projects || []).slice(0, 10)) {
      const owner = users.find((u) => u.id === p.user_id)
      const { count: captureCount } = await supabaseAdmin
        .from("captures")
        .select("*", { count: "exact", head: true })
        .eq("project_id", p.id)
      recentProjects.push({
        project_name: p.project_name,
        user_email: owner?.email || "Unknown",
        created_at: p.created_at,
        capture_count: captureCount || 0,
      })
    }

    return NextResponse.json({
      totals: {
        users: users.length,
        activeSubscriptions: activeCount,
        trialSubscriptions: trialCount,
        inactiveUsers: inactiveCount,
        projects: (projects || []).length,
        captures: totalCaptures || 0,
        reports: totalReports || 0,
      },
      recentUsers,
      recentProjects,
    })
  } catch (err) {
    console.error("Admin stats error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
