import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "../../../../lib/auth-utils"
import { getAccess, can } from "../../../../lib/plan"

// Tells the page whether this account may use the Gap Detector. The answer comes from the server.
export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const access = await getAccess(user.id, user.email)
  return NextResponse.json({ available: can.estimateGap(access) }, { headers: { "Cache-Control": "no-store" } })
}
