import { createClient } from "@supabase/supabase-js"

export type AdminCheck = "ok" | "stale" | "denied"

/** Hours an admin login stays valid for admin actions. Override with ADMIN_REAUTH_HOURS. */
const maxAgeSeconds = () => (Number(process.env.ADMIN_REAUTH_HOURS) || 12) * 3600

/** Time of the original sign-in, read from the token's "amr" claim (already verified by Supabase). */
function lastSignInSeconds(token: string): number | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"))
    const stamps = (Array.isArray(payload.amr) ? payload.amr : [])
      .map((a: { timestamp?: number }) => a?.timestamp)
      .filter((t: unknown): t is number => typeof t === "number")
    return stamps.length ? Math.max(...stamps) : null
  } catch {
    return null
  }
}

/**
 * Verifies the caller's Supabase access token (Authorization: Bearer <jwt>) with Supabase
 * itself, checks the verified email against ADMIN_EMAIL, and requires a recent sign-in.
 * Never trust an email sent in the request body.
 */
export async function checkAdminRequest(request: Request): Promise<AdminCheck> {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return "denied"

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!token) return "denied"

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  )
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user?.email) return "denied"
  if (data.user.email.toLowerCase() !== adminEmail.toLowerCase()) return "denied"

  // If Supabase gives no sign-in time we do not lock the admin out
  const signedInAt = lastSignInSeconds(token)
  if (signedInAt !== null && Date.now() / 1000 - signedInAt > maxAgeSeconds()) return "stale"
  return "ok"
}

export async function isAdminRequest(request: Request): Promise<boolean> {
  return (await checkAdminRequest(request)) === "ok"
}
