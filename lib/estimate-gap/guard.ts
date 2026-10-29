import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "../auth-utils"
import { getAccess, can } from "../plan"
import { rateLimited } from "../rate-limit"

/**
 * Every Gap Detector route starts here. It runs BEFORE any document is read, so someone who is not signed in, or
 * whose plan does not include the feature, cannot make the server do any work.
 */
export async function requireGapAccess(request: Request, limitKey: string, perHour: number): Promise<{ userId: string } | NextResponse> {
  const user = await getAuthenticatedUser(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const access = await getAccess(user.id, user.email)
  if (!can.estimateGap(access)) {
    return NextResponse.json({ error: "The Insurance Estimate Gap Detector is not available on your plan." }, { status: 403, headers: { "Cache-Control": "no-store" } })
  }
  if (rateLimited(`${limitKey}:${user.id}`, perHour, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
  }
  return { userId: user.id }
}
