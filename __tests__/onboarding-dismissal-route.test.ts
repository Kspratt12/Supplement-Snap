// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * The real /api/onboarding-dismissal handler and its helpers, with the login check and the account store replaced by
 * stand-ins. They show what the route does with the answers it is given: whose account it changes, what it refuses, what it
 * returns. They do not show how the real account service behaves. All people and data are made up.
 */

const world = vi.hoisted(() => ({
  users: {} as Record<string, { id: string; user_metadata: Record<string, unknown> }>, // login token -> verified person
  writes: [] as Array<{ id: string; attrs: { user_metadata: Record<string, unknown> } }>,
  createClientCalls: 0,
  authCalls: 0,
  adminMode: "ok" as "ok" | "error" | "throw",
}))

vi.mock("../lib/auth-utils", () => ({
  getAuthenticatedUser: async (request: Request) => {
    world.authCalls++
    const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? ""
    return world.users[token] ?? null
  },
}))
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => {
    world.createClientCalls++
    return {
      auth: {
        admin: {
          updateUserById: async (id: string, attrs: { user_metadata: Record<string, unknown> }) => {
            if (world.adminMode === "throw") throw new Error("service down: secret-detail")
            if (world.adminMode === "error") return { error: { message: "refused: secret-detail" } }
            world.writes.push({ id, attrs })
            return { error: null }
          },
        },
      },
    }
  },
}))

import { POST } from "../app/api/onboarding-dismissal/route"
import { ALLOWED_DISMISSALS, dismissalMetadata, parseDismissalRequest } from "../lib/dismissal-keys"

const A = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", user_metadata: { full_name: "Alice Example", ss_speech_lang: "es-MX" } as Record<string, unknown> }
const B = { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", user_metadata: { full_name: "Bob Example" } as Record<string, unknown> }

const call = (token: string | null, body: unknown, raw?: string) =>
  POST(
    new Request("http://localhost/api/onboarding-dismissal", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: raw ?? JSON.stringify(body),
    })
  )

beforeEach(() => {
  world.users = { "token-a": { ...A, user_metadata: { ...A.user_metadata } }, "token-b": { ...B, user_metadata: { ...B.user_metadata } } }
  world.writes = []
  world.createClientCalls = 0
  world.authCalls = 0
  world.adminMode = "ok"
})

describe("POST /api/onboarding-dismissal", () => {
  it("a valid request for A changes only A\x27s account, adds only the allowed key, and returns nothing about the account", async () => {
    const res = await call("token-a", { userId: A.id, keys: ["ss_start_here_hidden"] })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(world.writes).toEqual([{ id: A.id, attrs: { user_metadata: { full_name: "Alice Example", ss_speech_lang: "es-MX", ss_start_here_hidden: true } } }])
  })

  it("expected A but the login is B: refused before any change, and the service is not even contacted", async () => {
    const res = await call("token-b", { userId: A.id, keys: ["ss_start_here_hidden"] })
    expect(res.status).toBe(409)
    expect(world.writes).toEqual([])
    expect(world.createClientCalls).toBe(0)
    expect(await res.json()).toEqual({ error: "wrong-account" })
  })

  it("a request without a login changes nothing", async () => {
    const res = await call(null, { userId: A.id, keys: ["ss_start_here_hidden"] })
    expect(res.status).toBe(401)
    expect(world.writes).toEqual([])
    expect(world.createClientCalls).toBe(0)
    const bad = await call("token-unknown", { userId: A.id, keys: ["ss_start_here_hidden"] })
    expect(bad.status).toBe(401)
    expect(world.writes).toEqual([])
  })

  it.each([
    ["a session cookie and no bearer header", { cookie: "sb-proj-auth-token=%7B%22access_token%22%3A%22token-a%22%7D" }],
    ["a different authorization scheme", { Authorization: "Basic dG9rZW4tYQ==" }],
    ["a bearer header with no token", { Authorization: "Bearer " }],
    ["a bearer header with only spaces", { Authorization: "Bearer    " }],
  ])("refuses %s without even checking a login, and changes nothing", async (_label, headers) => {
    const res = await POST(
      new Request("http://localhost/api/onboarding-dismissal", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ userId: A.id, keys: ["ss_start_here_hidden"] }),
      })
    )
    expect(res.status).toBe(401)
    expect(world.authCalls).toBe(0)
    expect(world.writes).toEqual([])
    expect(world.createClientCalls).toBe(0)
  })

  it("the account changed is the one the login proves; a different target named in the body is ignored", async () => {
    const res = await call("token-a", { userId: A.id, keys: ["ss_onboarding_free"], targetUserId: B.id, id: B.id, user_id: B.id })
    expect(res.status).toBe(200)
    expect(world.writes.map((w) => w.id)).toEqual([A.id])
  })

  it.each([
    ["an unrelated key", ["full_name"]],
    ["an account key", ["role"]],
    ["an allowed key with a disallowed one", ["ss_start_here_hidden", "app_metadata"]],
    ["the older checklist key", ["ss_onboarding"]],
    ["an inherited property", ["__proto__"]],
    ["a non-text key", [1]],
    ["no keys", []],
  ])("refuses %s, with no change", async (_label, keys) => {
    const res = await call("token-a", { userId: A.id, keys })
    expect(res.status).toBe(400)
    expect(world.writes).toEqual([])
    expect(world.createClientCalls).toBe(0)
  })

  it.each([
    ["no body fields", {}],
    ["no user id", { keys: ["ss_start_here_hidden"] }],
    ["an empty user id", { userId: "", keys: ["ss_start_here_hidden"] }],
    ["keys not a list", { userId: A.id, keys: "ss_start_here_hidden" }],
    ["too many keys", { userId: A.id, keys: ["ss_start_here_hidden", "ss_onboarding_free", "ss_onboarding_paid", "ss_start_here_hidden"] }],
    ["a body that is not an object", "hello"],
  ])("refuses a request with %s, with no change", async (_label, body) => {
    expect((await call("token-a", body)).status).toBe(400)
    expect(world.writes).toEqual([])
  })

  it("refuses a body that is not JSON, with no change", async () => {
    expect((await call("token-a", null, "{not json")).status).toBe(400)
    expect(world.writes).toEqual([])
  })

  it("values in the request are ignored: the server stores true and \"dismissed\", never what the browser sends", async () => {
    await call("token-a", { userId: A.id, keys: ["ss_start_here_hidden", "ss_onboarding_paid"], values: { ss_start_here_hidden: false }, ss_start_here_hidden: false })
    expect(world.writes[0].attrs.user_metadata).toMatchObject({ ss_start_here_hidden: true, ss_onboarding_paid: "dismissed" })
  })

  it("keeps every other value and an existing dismissal, and writes nothing when everything asked is already recorded", async () => {
    world.users["token-a"].user_metadata = { full_name: "Alice Example", ss_onboarding_free: "dismissed", ss_start_here_hidden: true }
    const same = await call("token-a", { userId: A.id, keys: ["ss_onboarding_free", "ss_start_here_hidden"] })
    expect(same.status).toBe(200)
    expect(world.writes).toEqual([]) // nothing to change
    await call("token-a", { userId: A.id, keys: ["ss_onboarding_free", "ss_onboarding_paid"] })
    expect(world.writes[0].attrs.user_metadata).toEqual({
      full_name: "Alice Example",
      ss_onboarding_free: "dismissed",
      ss_start_here_hidden: true,
      ss_onboarding_paid: "dismissed",
    })
  })

  it("a server failure (returned or thrown) is reported as a failure without exposing details", async () => {
    for (const mode of ["error", "throw"] as const) {
      world.adminMode = mode
      const res = await call("token-a", { userId: A.id, keys: ["ss_start_here_hidden"] })
      expect(res.status).toBe(500)
      const text = JSON.stringify(await res.json())
      expect(text).toBe(JSON.stringify({ error: "Could not save" }))
      expect(text).not.toContain("secret-detail")
    }
    expect(world.writes).toEqual([])
  })

  it("slows down a flood of requests from one person", async () => {
    world.users["token-flood"] = { id: "flood-user", user_metadata: {} }
    let last = 200
    for (let i = 0; i < 61; i++) last = (await call("token-flood", { userId: "flood-user", keys: ["ss_start_here_hidden"] })).status
    expect(last).toBe(429)
  })
})

describe("the request helpers", () => {
  it("accepts only the three dismissal keys, and the server decides each value", () => {
    expect(ALLOWED_DISMISSALS).toEqual({ ss_start_here_hidden: true, ss_onboarding_free: "dismissed", ss_onboarding_paid: "dismissed" })
    expect(parseDismissalRequest({ userId: "u", keys: ["ss_onboarding_free", "ss_onboarding_free"] })).toEqual({ userId: "u", keys: ["ss_onboarding_free"] })
  })

  it("never lowers or removes anything, and does not change the object it was given", () => {
    const existing = { a: 1, ss_onboarding_paid: "dismissed" }
    const frozen = JSON.stringify(existing)
    expect(dismissalMetadata(existing, ["ss_start_here_hidden"])).toEqual({ a: 1, ss_onboarding_paid: "dismissed", ss_start_here_hidden: true })
    expect(JSON.stringify(existing)).toBe(frozen)
    expect(dismissalMetadata(existing, ["ss_onboarding_paid"])).toBeNull()
    expect(dismissalMetadata(null, ["ss_start_here_hidden"])).toEqual({ ss_start_here_hidden: true })
  })
})
