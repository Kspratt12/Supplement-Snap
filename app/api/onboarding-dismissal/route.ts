import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getAuthenticatedUser } from "../../../lib/auth-utils"
import { rateLimited } from "../../../lib/rate-limit"
import { dismissalMetadata, parseDismissalRequest } from "../../../lib/dismissal-keys"

/**
 * Records that the signed-in person dismissed an onboarding panel.
 *
 * The account that is changed is the one the request's own access token proves (getAuthenticatedUser), never one named in
 * the body. The body's userId is only what the browser expected to be saving for: if the token belongs to someone else (for
 * example the person switched accounts after the save was queued) the request is refused before anything is written.
 * Only the keys in ALLOWED_DISMISSALS can be set, each to its fixed value, and the rest of the metadata is carried over.
 * Nothing about the account is returned.
 *
 * Login: this route accepts only an Authorization: Bearer token, which is what authFetch sends. The shared helper would also
 * accept a Supabase session cookie when there is no bearer header; that path is refused here, so a cookie that a browser
 * attaches on its own can never authorize this write. With a bearer header the helper uses that token alone and never falls
 * back to a cookie, so a bearer token and a cookie for different people cannot be mixed.
 */
export async function POST(request: Request) {
  if (!/^Bearer \S+$/.test(request.headers.get("Authorization") ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const user = await getAuthenticatedUser(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (rateLimited(`onboarding-dismissal:${user.id}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
  const parsed = parseDismissalRequest(body)
  if (!parsed) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  // The login on this request is not the account the browser meant to save for: change nothing
  if (parsed.userId !== user.id) return NextResponse.json({ error: "wrong-account" }, { status: 409 })

  const next = dismissalMetadata(user.user_metadata, parsed.keys)
  if (!next) return NextResponse.json({ ok: true }) // already recorded

  try {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")
    const { error } = await admin.auth.admin.updateUserById(user.id, { user_metadata: next })
    if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Could not save" }, { status: 500 })
  }
}
