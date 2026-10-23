import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "../../../lib/auth-utils"
import { getAccess } from "../../../lib/plan"

// The signed-in user's effective plan: their own subscription, or the one
// belonging to the team owner who invited them.
export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const access = await getAccess(user.id, user.email)
  return NextResponse.json({
    status: access.status,
    plan: access.active ? access.plan : "none",
    viaOwner: access.viaOwner,
  })
}
