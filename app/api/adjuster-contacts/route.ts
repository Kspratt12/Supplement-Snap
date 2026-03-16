import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  if (!userId) return NextResponse.json({ contacts: [] })

  const { data } = await supabase()
    .from("adjuster_contacts")
    .select("*")
    .eq("user_id", userId)
    .order("last_used_at", { ascending: false })

  return NextResponse.json({ contacts: data || [] })
}

export async function POST(request: Request) {
  try {
    const { userId, name, email, company } = await request.json()
    if (!userId || !email) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

    // Upsert — update last_used if exists, create if not
    const { data: existing } = await supabase()
      .from("adjuster_contacts")
      .select("id")
      .eq("user_id", userId)
      .eq("email", email.toLowerCase())
      .limit(1)

    if (existing && existing.length > 0) {
      await supabase()
        .from("adjuster_contacts")
        .update({ name, company, last_used_at: new Date().toISOString() })
        .eq("id", existing[0].id)
      return NextResponse.json({ success: true, updated: true })
    }

    const { error } = await supabase()
      .from("adjuster_contacts")
      .insert({ user_id: userId, name, email: email.toLowerCase(), company })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  await supabase().from("adjuster_contacts").delete().eq("id", id)
  return NextResponse.json({ success: true })
}
