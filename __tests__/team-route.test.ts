// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Runs the real /api/team handlers against a small in-test stand-in for the database and the login check.
 * It checks the rules the invite screen relies on: who the owner is, what the plan allows, and what a removal can touch.
 * SIMULATED: it proves what this code does with the answers it is given, not what the live Supabase returns or whether two
 * invites sent at the same moment are handled (they are not: the seat check and the insert are separate steps).
 */

type Row = Record<string, unknown>
const store = vi.hoisted(() => ({ tables: {} as Record<string, Row[]>, userId: null as string | null, matchedUser: null as { id: string } | null }))

vi.mock("../lib/auth-utils", () => ({
  // like the real one: the verified login decides, and an id supplied by the caller is ignored
  getUserId: async () => store.userId,
}))
vi.mock("../lib/find-user", () => ({ findUserByEmail: async () => store.matchedUser }))
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => {
      let op: "select" | "insert" | "delete" = "select"
      let payload: Row = {}
      let head = false
      const filters: Array<[string, unknown]> = []
      const rows = () => (store.tables[table] || []).filter((r) => filters.every(([k, v]) => r[k] === v))
      const api = {
        select(_cols?: string, opts?: { head?: boolean }) { if (opts?.head) head = true; return api },
        insert(p: Row) { op = "insert"; payload = p; return api },
        delete() { op = "delete"; return api },
        eq(k: string, v: unknown) { filters.push([k, v]); return api },
        order() { return api },
        limit() { return api },
        maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
        single: async () => {
          if (op === "insert") {
            const row = { id: `row-${(store.tables[table] || []).length + 1}`, ...payload }
            store.tables[table] = [...(store.tables[table] || []), row]
            return { data: row, error: null }
          }
          return { data: rows()[0] ?? null, error: null }
        },
        then(res: (v: unknown) => unknown, rej: (e: unknown) => unknown) {
          if (op === "delete") {
            store.tables[table] = (store.tables[table] || []).filter((r) => !filters.every(([k, v]) => r[k] === v))
            return Promise.resolve({ error: null }).then(res, rej)
          }
          if (head) return Promise.resolve({ count: rows().length, error: null }).then(res, rej)
          return Promise.resolve({ data: rows(), error: null }).then(res, rej)
        },
      }
      return api
    },
  }),
}))

import { POST, DELETE, GET } from "../app/api/team/route"

const post = (body: unknown) => POST(new Request("http://localhost/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }))
const remove = (id: string) => DELETE(new Request(`http://localhost/api/team?id=${id}`, { method: "DELETE" }))
const team = (owner: string) => (store.tables.team_members || []).filter((r) => r.owner_id === owner)

beforeEach(() => {
  delete process.env.RESEND_API_KEY // no invite email is sent
  store.userId = "owner-1"
  store.matchedUser = null
  store.tables = { subscriptions: [{ user_id: "owner-1", plan: "team", status: "active" }], team_members: [] }
})

describe("inviting a team member (simulated database and login)", () => {
  it("refuses a visitor who is not signed in and writes nothing", async () => {
    store.userId = null
    const res = await post({ email: "new@example.test", ownerId: "owner-1" })
    expect(res.status).toBe(400)
    expect(store.tables.team_members).toHaveLength(0)
  })

  it("uses the signed-in user as the owner and ignores an owner id in the request", async () => {
    store.userId = "owner-1"
    store.tables.subscriptions.push({ user_id: "victim", plan: "pro", status: "active" })
    const res = await post({ email: "New@Example.test", ownerId: "victim" })
    expect(res.status).toBe(200)
    expect(team("victim")).toHaveLength(0)
    expect(team("owner-1")).toHaveLength(1)
    expect(team("owner-1")[0].member_email).toBe("new@example.test")
  })

  it("needs the caller's own live subscription: none, or a cancelled one, is refused", async () => {
    store.tables.subscriptions = []
    expect((await post({ email: "a@example.test" })).status).toBe(403)
    store.tables.subscriptions = [{ user_id: "owner-1", plan: "team", status: "canceled" }]
    expect((await post({ email: "a@example.test" })).status).toBe(403)
    expect(store.tables.team_members).toHaveLength(0)
  })

  it("a member who only has access through someone else's plan cannot invite anyone", async () => {
    store.userId = "member-1" // no subscription of their own
    expect((await post({ email: "a@example.test" })).status).toBe(403)
  })

  it("Starter has no extra seats", async () => {
    store.tables.subscriptions = [{ user_id: "owner-1", plan: "starter", status: "active" }]
    expect((await post({ email: "a@example.test" })).status).toBe(403)
    expect(store.tables.team_members).toHaveLength(0)
  })

  it("stops at the plan's seat limit, counting pending and active members, and allows one below it", async () => {
    store.tables.team_members = [{ id: "1", owner_id: "owner-1", member_email: "a@example.test", status: "active" }]
    expect((await post({ email: "b@example.test" })).status).toBe(200) // Team allows 2, one is used
    expect((await post({ email: "c@example.test" })).status).toBe(403) // now at the limit
    expect(team("owner-1")).toHaveLength(2)
  })

  it("does not invite the same address twice, whatever its capitals", async () => {
    expect((await post({ email: "a@example.test" })).status).toBe(200)
    expect((await post({ email: "A@Example.TEST" })).status).toBe(400)
    expect(team("owner-1")).toHaveLength(1)
  })

  it("a person who already has an account is active at once, and anyone else is pending until they sign in", async () => {
    store.matchedUser = { id: "existing-user" }
    await post({ email: "has@example.test" })
    store.matchedUser = null
    await post({ email: "new@example.test" })
    const rows = team("owner-1")
    expect(rows.find((r) => r.member_email === "has@example.test")).toMatchObject({ status: "active", member_user_id: "existing-user" })
    expect(rows.find((r) => r.member_email === "new@example.test")).toMatchObject({ status: "pending", member_user_id: null })
  })
})

describe("removing a team member and listing the team (simulated database and login)", () => {
  it("refuses a visitor who is not signed in", async () => {
    store.userId = null
    store.tables.team_members = [{ id: "5", owner_id: "owner-1", member_email: "a@example.test", status: "active" }]
    expect((await remove("5")).status).toBe(401)
    expect(store.tables.team_members).toHaveLength(1)
  })

  it("removes only a row that belongs to the signed-in owner", async () => {
    store.tables.team_members = [
      { id: "5", owner_id: "owner-2", member_email: "theirs@example.test", status: "active" },
      { id: "6", owner_id: "owner-1", member_email: "mine@example.test", status: "active" },
    ]
    expect((await remove("5")).status).toBe(200) // asking for someone else's row succeeds without effect
    expect(store.tables.team_members.map((r) => r.id)).toEqual(["5", "6"])
    expect((await remove("6")).status).toBe(200)
    expect(store.tables.team_members.map((r) => r.id)).toEqual(["5"])
  })

  it("lists only the signed-in owner's team", async () => {
    store.tables.team_members = [
      { id: "5", owner_id: "owner-2", member_email: "theirs@example.test", status: "active" },
      { id: "6", owner_id: "owner-1", member_email: "mine@example.test", status: "active" },
    ]
    const body = await (await GET(new Request("http://localhost/api/team?ownerId=owner-2"))).json()
    expect(body.members.map((m: Row) => m.id)).toEqual(["6"])
  })
})
