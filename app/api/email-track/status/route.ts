import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

// GET — list tracking records for a project
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")
  if (!projectId) return NextResponse.json({ records: [] })

  const { data } = await supabase()
    .from("email_tracking")
    .select("*")
    .eq("project_id", projectId)
    .order("sent_at", { ascending: false })

  return NextResponse.json({ records: data || [] })
}

// POST — create a tracking record when email is sent
export async function POST(request: Request) {
  try {
    const { projectId, recipientEmail, subject } = await request.json()

    const { data, error } = await supabase()
      .from("email_tracking")
      .insert({
        project_id: projectId,
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
