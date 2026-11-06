import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getAuthenticatedUser } from "../../../lib/auth-utils"
import { rateLimited } from "../../../lib/rate-limit"
import { checklistPatch, dismissalPatch, parseChecklistRequest, parseDismissalRequest } from "../../../lib/dismissal-keys"

/**
 * Records an onboarding choice for the signed-in person: a dismissal (Hide / Dismiss), or a checklist Minimize / Expand.
 *
 * The account that is changed is the one the request's own access token proves (getAuthenticatedUser), never one named in
 * the body. The body's userId is only what the browser expected to be saving for: if the token belongs to someone else (for
 * example the person switched accounts after the save was queued) the request is refused before anything is written.
 * Only the keys in ALLOWED_DISMISSALS, or the checklist key for a plan mode with "minimized" / "", can be set, and a
 * dismissal is never lowered. Nothing about the account is returned.
 *
 * Login: this route accepts only an Authorization: Bearer token, which is what authFetch sends. The shared helper would also
 * accept a Supabase session cookie when there is no bearer header; that path is refused here, so a cookie that a browser
 * attaches on its own can never authorize this write. With a bearer header the helper uses that token alone and never falls
 * back to a cookie, so a bearer token and a cookie for different people cannot be mixed.
 *
 * What is written: ONLY the changed keys. The account service merges user_metadata key by key for this call (a null value
 * deletes a key), so metadata this route does not own is never sent and cannot be put back to an older value. The service
 * reads the row without locking it, so a write from another request in the same few milliseconds could still replace the
 * stored object; to catch the case where that took this route's own change, the result is read back and applied once more if
 * it is missing.
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
  const dismissal = parseDismissalRequest(body)
  const checklist = dismissal ? null : parseChecklistRequest(body)
  const claimed = dismissal?.userId ?? checklist?.userId
  if (claimed === undefined) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  // The login on this request is not the account the browser meant to save for: change nothing
  if (claimed !== user.id) return NextResponse.json({ error: "wrong-account" }, { status: 409 })

  const patch = dismissal ? dismissalPatch(user.user_metadata, dismissal.keys) : checklistPatch(user.user_metadata, checklist!.mode, checklist!.state)
  if (!patch) return NextResponse.json({ ok: true }) // already recorded, or nothing to change

  try {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")
    for (let attempt = 0; attempt < 2; attempt++) {
      const { error } = await admin.auth.admin.updateUserById(user.id, { user_metadata: patch })
      if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 })
      const { data: after, error: readError } = await admin.auth.admin.getUserById(user.id)
      // If the read-back itself fails, the write was accepted: do not fail the save over a check
      if (readError || !after?.user || holds(after.user.user_metadata, patch)) return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: "Could not save" }, { status: 500 })
  } catch {
    return NextResponse.json({ error: "Could not save" }, { status: 500 })
  }
}

/** Whether the stored metadata carries the change. A Minimize or Expand that finds the mode dismissed in the meantime counts as done: the dismissal wins. */
function holds(stored: Record<string, unknown> | null | undefined, patch: Record<string, unknown>): boolean {
  return Object.entries(patch).every(([key, wanted]) => {
    const current = stored?.[key]
    if (current === wanted) return true
    return current === "dismissed" && wanted !== "dismissed" && key.startsWith("ss_onboarding_")
  })
}
