import { createClient } from "@supabase/supabase-js"

/**
 * Verifies the caller's Supabase access token (Authorization: Bearer <jwt>)
 * with Supabase itself and checks the verified email against ADMIN_EMAIL.
 * Never trust an email sent in the request body.
 */
export async function isAdminRequest(request: Request): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return false

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!token) return false

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  )
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user?.email) return false

  return data.user.email.toLowerCase() === adminEmail.toLowerCase()
}
