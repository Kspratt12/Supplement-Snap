import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

/**
 * Verify the authenticated user from the request.
 *
 * Supports multiple auth methods (in order of precedence):
 * 1. Authorization: Bearer <token> header
 * 2. Supabase session cookie (sb-*-auth-token)
 * 3. Falls back to userId param/body if token auth fails (backward compatibility)
 *
 * Returns the verified user object, or null if all methods fail.
 */
export async function getAuthenticatedUser(request: Request) {
  try {
    let token: string | null = null

    // Method 1: Bearer token in Authorization header
    const authHeader = request.headers.get("Authorization")
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7)
    }

    // Method 2: Supabase session cookie
    if (!token) {
      const cookie = request.headers.get("cookie")
      if (cookie) {
        const match = cookie.match(/sb-[^-]+-auth-token=([^;]+)/)
        if (match) {
          try {
            const parsed = JSON.parse(decodeURIComponent(match[1]))
            token = parsed?.access_token ?? parsed?.[0]?.access_token
          } catch {
            // Cookie parse failed
          }
        }
      }
    }

    if (!token) return null

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    )

    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return null

    return user
  } catch {
    return null
  }
}

/**
 * Get user ID from the request — tries auth first, falls back to userId param.
 * This provides backward compatibility while we migrate to full auth headers.
 *
 * For API routes that accept userId in body or query params, this function
 * will use the authenticated user's ID if available, otherwise fall back to
 * the client-supplied userId. This ensures existing client code keeps working.
 */
export async function getUserId(
  request: Request,
  fallbackUserId?: string | null
): Promise<string | null> {
  // Try token-based auth first (most secure)
  const user = await getAuthenticatedUser(request)
  if (user) return user.id

  // Fall back to client-supplied userId (backward compatible)
  return fallbackUserId || null
}

/** Standard 401 response */
export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
