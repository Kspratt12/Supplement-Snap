import { supabase } from "./supabase"

/**
 * fetch() that attaches the signed-in user's Supabase access token.
 * Use for every /api route that requires a logged-in user.
 */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers = new Headers(init.headers)
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`)
  }
  return fetch(input, { ...init, headers })
}
