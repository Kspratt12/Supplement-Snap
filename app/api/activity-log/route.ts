import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

// GET — list activity for a user or project
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const projectId = searchParams.get("projectId")
  const limit = parseInt(searchParams.get("limit") || "20")

  let query = supabase().from("activity_log").select("*").order("created_at", { ascending: false }).limit(limit)

  if (projectId) query = query.eq("project_id", projectId)
  else if (userId) query = query.eq("user_id", userId)
  else return NextResponse.json({ activities: [] })

  const { data } = await query
  return NextResponse.json({ activities: data || [] })
}

// POST — log an activity
export async function POST(request: Request) {
  try {
    const { userId, projectId, action, details } = await request.json()
    if (!userId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

    const { error } = await supabase()
      .from("activity_log")
      .insert({ user_id: userId, project_id: projectId || null, action, details })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
