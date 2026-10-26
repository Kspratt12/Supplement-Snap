import type { SupabaseClient, User } from "@supabase/supabase-js"

// Supabase's listUsers() returns only the first 50 accounts unless told otherwise, so anything that looked someone up
// by email would silently stop finding people once the app passed 50 accounts. These helpers read every page.

const PAGE = 200
const MAX_PAGES = 50

export async function listAllUsers(admin: SupabaseClient): Promise<User[]> {
  const all: User[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE })
    if (error) break
    const users = data?.users || []
    all.push(...users)
    if (users.length < PAGE) break
  }
  return all
}

export async function findUserByEmail(admin: SupabaseClient, email: string): Promise<User | null> {
  const wanted = email.trim().toLowerCase()
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE })
    if (error) return null
    const users = data?.users || []
    const hit = users.find((u) => (u.email || "").toLowerCase() === wanted)
    if (hit) return hit
    if (users.length < PAGE) return null
  }
  return null
}
