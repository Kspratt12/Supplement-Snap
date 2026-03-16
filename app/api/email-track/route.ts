import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// GET — tracking pixel endpoint (called when email is opened)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("t")

  if (token) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    )

    // Update tracking record
    const { data } = await supabase
      .from("email_tracking")
      .select("open_count")
      .eq("tracking_token", token)
      .single()

    if (data) {
      await supabase
        .from("email_tracking")
        .update({
          opened_at: data.open_count === 0 ? new Date().toISOString() : undefined,
          open_count: (data.open_count || 0) + 1,
        })
        .eq("tracking_token", token)
    }
  }

  // Return a 1x1 transparent PNG
  const pixel = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    "base64"
  )

  return new NextResponse(pixel, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}
