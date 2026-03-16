import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  if (!userId) return NextResponse.json({ settings: null })

  const { data } = await supabase()
    .from("company_settings")
    .select("*")
    .eq("user_id", userId)
    .single()

  return NextResponse.json({ settings: data || null })
}

export async function POST(request: Request) {
  try {
    const { userId, companyName, logoUrl } = await request.json()
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

    // Upsert
    const { data: existing } = await supabase()
      .from("company_settings")
      .select("id")
      .eq("user_id", userId)
      .limit(1)

    if (existing && existing.length > 0) {
      await supabase()
        .from("company_settings")
        .update({
          company_name: companyName,
          logo_url: logoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
    } else {
      await supabase()
        .from("company_settings")
        .insert({ user_id: userId, company_name: companyName, logo_url: logoUrl })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
