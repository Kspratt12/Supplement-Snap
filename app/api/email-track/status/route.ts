import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getAuthenticatedUser } from "../../../../lib/auth-utils"
import { getAccess, can, planUnavailable } from "../../../../lib/plan"

const supabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

// GET — list tracking records for a project
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")
  const authed = await getAuthenticatedUser(request)
  if (!authed || !projectId) return NextResponse.json({ records: [] })
  const access = await getAccess(authed.id, authed.email)
  if (access.unavailable) return planUnavailable()
  if (!can.emailTracking(access)) {
    return NextResponse.json({ records: [], locked: true })
  }
  const userId = authed.id

  let query = supabase()
    .from("email_tracking")
    .select("*")
    .eq("user_id", userId)
    .order("sent_at", { ascending: false })
  if (projectId !== "all") query = query.eq("project_id", projectId)
  const { data } = await query

  return NextResponse.json({ records: data || [] })
}

// POST — create a tracking record when email is sent
export async function POST(request: Request) {
  try {
    const authed = await getAuthenticatedUser(request)
    if (!authed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // Open tracking is a Team and Pro feature: a tracking record (and its pixel token) is only issued with the plan
    const access = await getAccess(authed.id, authed.email)
    if (access.unavailable) return planUnavailable()
    if (!can.emailTracking(access)) {
      return NextResponse.json({ error: "Email open tracking is available on the Team and Pro plans." }, { status: 403 })
    }
    const userId = authed.id
    const { projectId, recipientEmail, subject } = await request.json()

    const { data, error } = await supabase()
      .from("email_tracking")
      .insert({
        project_id: projectId,
        user_id: userId,
        recipient_email: recipientEmail,
        subject: subject,
      })
      .select("tracking_token")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ trackingToken: data.tracking_token })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
