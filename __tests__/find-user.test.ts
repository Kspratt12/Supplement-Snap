// @vitest-environment node
import { describe, it, expect } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"
import { findUserByEmail, listAllUsers } from "../lib/find-user"

// A fake admin API that, like Supabase, hands out users one page at a time
const makeAdmin = (emails: string[]) => ({
  auth: {
    admin: {
      listUsers: async ({ page = 1, perPage = 50 }: { page?: number; perPage?: number } = {}) => ({
        data: { users: emails.slice((page - 1) * perPage, page * perPage).map((email, i) => ({ id: `id-${(page - 1) * perPage + i}`, email })) },
        error: null,
      }),
    },
  },
}) as unknown as SupabaseClient

const many = Array.from({ length: 450 }, (_, i) => `user${i}@example.com`)

describe("find-user", () => {
  it("finds someone on a later page, not just the first 50 accounts", async () => {
    const hit = await findUserByEmail(makeAdmin([...many, "Crystal@Yahoo.com"]), "crystal@yahoo.com")
    expect(hit?.email).toBe("Crystal@Yahoo.com")
  })
  it("matches email regardless of upper or lower case and stray spaces", async () => {
    expect((await findUserByEmail(makeAdmin(many), "  USER3@EXAMPLE.COM "))?.id).toBe("id-3")
  })
  it("returns null when nobody has that email, including an empty database", async () => {
    expect(await findUserByEmail(makeAdmin(many), "nobody@example.com")).toBeNull()
    expect(await findUserByEmail(makeAdmin([]), "a@b.com")).toBeNull()
  })
  it("lists every account, not just one page", async () => {
    expect((await listAllUsers(makeAdmin(many))).length).toBe(450)
  })
})
