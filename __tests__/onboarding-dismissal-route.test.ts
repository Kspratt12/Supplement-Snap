// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * The real /api/onboarding-dismissal handler and its helpers, with the login check and the account store replaced by
 * stand-ins. They show what the route does with the answers it is given: whose account it changes, what it refuses, what it
 * returns. The stand-in account store merges user_metadata key by key and deletes a key set to null, which is what the
 * account service's source does for this call (internal/models/user.go UpdateUserMetaData, called by the admin update). The
 * tests do not show how the real service behaves under truly concurrent requests. All people and data are made up.
 */

const world = vi.hoisted(() => ({
  users: {} as Record<string, { id: string; user_metadata: Record<string, unknown> }>, // login token -> verified person
  writes: [] as Array<{ id: string; attrs: { user_metadata: Record<string, unknown> } }>,
  createClientCalls: 0,
  authCalls: 0,
  adminMode: "ok" as "ok" | "error" | "throw",
  stored: {} as Record<string, Record<string, unknown>>, // what the account store holds per person (merged on every write)
  beforeWrite: null as null | ((id: string, patch: Record<string, unknown>) => void), // another writer acting inside the window
  dropNextWrites: 0, // this many writes are accepted but never applied (a concurrent request replaced the object)
  readBack: null as null | ((id: string) => Record<string, unknown>), // overrides what the read-back sees
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
            world.beforeWrite?.(id, attrs.user_metadata)
            world.writes.push({ id, attrs })
            if (world.dropNextWrites > 0) {
              world.dropNextWrites--
              return { error: null }
            }
            const next = { ...(world.stored[id] ?? {}) }
            for (const [k, v] of Object.entries(attrs.user_metadata)) {
              if (v === null) delete next[k]
              else next[k] = v
            }
            world.stored[id] = next
            return { error: null }
          },
          getUserById: async (id: string) => ({ data: { user: { id, user_metadata: world.readBack ? world.readBack(id) : world.stored[id] ?? {} } }, error: null }),
        },
      },
    }
  },
}))

import { POST } from "../app/api/onboarding-dismissal/route"
import { ALLOWED_DISMISSALS, checklistPatch, dismissalPatch, parseChecklistRequest, parseDismissalRequest } from "../lib/dismissal-keys"

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
  world.stored = { [A.id]: { ...A.user_metadata }, [B.id]: { ...B.user_metadata } }
  world.beforeWrite = null
  world.dropNextWrites = 0
  world.readBack = null
  world.writes = []
  world.createClientCalls = 0
  world.authCalls = 0
  world.adminMode = "ok"
})

describe("POST /api/onboarding-dismissal", () => {
  it("a valid request for A changes only A\x27s account, sends only the allowed key, and returns nothing about the account", async () => {
    const res = await call("token-a", { userId: A.id, keys: ["ss_start_here_hidden"] })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(world.writes).toEqual([{ id: A.id, attrs: { user_metadata: { ss_start_here_hidden: true } } }]) // only the changed key is sent
    expect(world.stored[A.id]).toEqual({ full_name: "Alice Example", ss_speech_lang: "es-MX", ss_start_here_hidden: true }) // and the rest is intact
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
    expect(world.writes[0].attrs.user_metadata).toEqual({ ss_start_here_hidden: true, ss_onboarding_paid: "dismissed" })
  })

  it("sends only what changed, keeps an existing dismissal, and writes nothing when everything asked is already recorded", async () => {
    world.users["token-a"].user_metadata = { full_name: "Alice Example", ss_onboarding_free: "dismissed", ss_start_here_hidden: true }
    world.stored[A.id] = { ...world.users["token-a"].user_metadata }
    const same = await call("token-a", { userId: A.id, keys: ["ss_onboarding_free", "ss_start_here_hidden"] })
    expect(same.status).toBe(200)
    expect(world.writes).toEqual([]) // nothing to change
    await call("token-a", { userId: A.id, keys: ["ss_onboarding_free", "ss_onboarding_paid"] })
    expect(world.writes[0].attrs.user_metadata).toEqual({ ss_onboarding_paid: "dismissed" })
    expect(world.stored[A.id]).toEqual({ full_name: "Alice Example", ss_onboarding_free: "dismissed", ss_start_here_hidden: true, ss_onboarding_paid: "dismissed" })
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
    expect(world.stored[A.id]).not.toHaveProperty("ss_start_here_hidden") // nothing was stored
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

  it("builds a patch of only the changed keys, never lowers or removes anything, and does not change the object it was given", () => {
    const existing = { a: 1, ss_onboarding_paid: "dismissed" }
    const frozen = JSON.stringify(existing)
    expect(dismissalPatch(existing, ["ss_start_here_hidden"])).toEqual({ ss_start_here_hidden: true })
    expect(JSON.stringify(existing)).toBe(frozen)
    expect(dismissalPatch(existing, ["ss_onboarding_paid"])).toBeNull()
    expect(dismissalPatch(null, ["ss_start_here_hidden"])).toEqual({ ss_start_here_hidden: true })
  })

  it("accepts a checklist request only for a plan mode and the states minimized or empty", () => {
    expect(parseChecklistRequest({ userId: "u", checklist: { mode: "paid", state: "minimized" } })).toEqual({ userId: "u", mode: "paid", state: "minimized" })
    expect(parseChecklistRequest({ userId: "u", checklist: { mode: "free", state: "" } })).toEqual({ userId: "u", mode: "free", state: "" })
    for (const bad of [{ mode: "admin", state: "minimized" }, { mode: "paid", state: "dismissed" }, { mode: "paid", state: "hidden" }, { mode: "paid" }, { state: "" }, null, "x"]) {
      expect(parseChecklistRequest({ userId: "u", checklist: bad }), JSON.stringify(bad)).toBeNull()
    }
    expect(parseChecklistRequest({ checklist: { mode: "paid", state: "" } })).toBeNull()
  })

  it("never lowers a dismissal with a checklist change, and drops a change that is already in place", () => {
    expect(checklistPatch({ ss_onboarding_paid: "dismissed" }, "paid", "minimized")).toBeNull()
    expect(checklistPatch({ ss_onboarding_paid: "dismissed" }, "paid", "")).toBeNull()
    expect(checklistPatch({ ss_onboarding_paid: "minimized" }, "paid", "minimized")).toBeNull()
    expect(checklistPatch({}, "paid", "")).toBeNull()
    expect(checklistPatch({ ss_onboarding_paid: "minimized" }, "paid", "")).toEqual({ ss_onboarding_paid: "" })
    expect(checklistPatch({ ss_onboarding_free: "dismissed" }, "paid", "minimized")).toEqual({ ss_onboarding_paid: "minimized" }) // the other mode does not matter
  })
})

describe("Minimize and Expand through the same route", () => {
  const chk = (mode: string, state: string, userId = A.id) => ({ userId, checklist: { mode, state } })

  it("Minimize changes only that mode's key, and Expand sets it back to empty", async () => {
    expect((await call("token-a", chk("paid", "minimized"))).status).toBe(200)
    expect(world.writes.map((w) => w.attrs.user_metadata)).toEqual([{ ss_onboarding_paid: "minimized" }])
    expect(world.stored[A.id]).toEqual({ full_name: "Alice Example", ss_speech_lang: "es-MX", ss_onboarding_paid: "minimized" })
    world.users["token-a"].user_metadata = { ...world.stored[A.id] }
    expect((await call("token-a", chk("paid", ""))).status).toBe(200)
    expect(world.writes.map((w) => w.attrs.user_metadata)).toEqual([{ ss_onboarding_paid: "minimized" }, { ss_onboarding_paid: "" }])
  })

  it("is refused, with nothing written, when the login is B's and the browser meant A", async () => {
    const res = await call("token-b", chk("paid", "minimized", A.id))
    expect(res.status).toBe(409)
    expect(world.writes).toEqual([])
    expect(world.createClientCalls).toBe(0)
    expect(world.stored[B.id]).toEqual({ full_name: "Bob Example" })
  })

  it("does not lower an existing dismissal and writes nothing for it", async () => {
    world.users["token-a"].user_metadata = { ...A.user_metadata, ss_onboarding_paid: "dismissed" }
    expect((await call("token-a", chk("paid", "minimized"))).status).toBe(200)
    expect(world.writes).toEqual([])
  })

  it.each([
    ["mode not allowed", chk("admin", "minimized")],
    ["state not allowed", chk("paid", "dismissed")],
    ["state missing", { userId: A.id, checklist: { mode: "paid" } }],
    ["no user id", { checklist: { mode: "paid", state: "" } }],
  ])("refuses %s, with nothing written", async (_label, body) => {
    expect((await call("token-a", body)).status).toBe(400)
    expect(world.writes).toEqual([])
  })

  it("a dismissal that lands first wins: the read-back shows it and the change is not applied a second time", async () => {
    world.readBack = (id) => ({ ...world.stored[id], ss_onboarding_paid: "dismissed" })
    expect((await call("token-a", chk("paid", "minimized"))).status).toBe(200)
    expect(world.writes).toHaveLength(1)
  })
})

describe("a write never carries metadata it does not own, and notices when its own change is lost", () => {
  it("another writer changes an unrelated key in the window: that change survives", async () => {
    // Between the login check (which read full_name "Alice Example") and the write, another request renames the person.
    world.beforeWrite = (id) => {
      world.stored[id] = { ...world.stored[id], full_name: "Alicia Example" }
    }
    expect((await call("token-a", { userId: A.id, keys: ["ss_start_here_hidden"] })).status).toBe(200)
    expect(world.stored[A.id]).toEqual({ full_name: "Alicia Example", ss_speech_lang: "es-MX", ss_start_here_hidden: true })
    // What was sent was only the dismissal key, so nothing stale could be put back
    expect(world.writes[0].attrs.user_metadata).toEqual({ ss_start_here_hidden: true })
  })

  it("every write names only the keys it owns, for both request shapes", async () => {
    await call("token-a", { userId: A.id, keys: ["ss_start_here_hidden", "ss_onboarding_free", "ss_onboarding_paid"] })
    world.users["token-a"].user_metadata = { full_name: "Alice Example" }
    await call("token-a", { userId: A.id, checklist: { mode: "free", state: "minimized" } })
    const allowed = new Set(["ss_start_here_hidden", "ss_onboarding_free", "ss_onboarding_paid"])
    expect(world.writes).toHaveLength(2)
    for (const w of world.writes) for (const k of Object.keys(w.attrs.user_metadata)) expect(allowed.has(k), k).toBe(true)
  })

  it("if the first write was replaced by a concurrent request, the read-back catches it and applies the change once more", async () => {
    world.dropNextWrites = 1
    const res = await call("token-a", { userId: A.id, keys: ["ss_start_here_hidden"] })
    expect(res.status).toBe(200)
    expect(world.writes).toHaveLength(2)
    expect(world.stored[A.id]).toHaveProperty("ss_start_here_hidden", true)
  })

  it("if it is lost twice, the save fails (so the browser keeps it queued) instead of reporting success", async () => {
    world.dropNextWrites = 2
    const res = await call("token-a", { userId: A.id, keys: ["ss_start_here_hidden"] })
    expect(res.status).toBe(500)
    expect(world.writes).toHaveLength(2) // bounded: no further attempts
    expect(world.stored[A.id]).not.toHaveProperty("ss_start_here_hidden")
  })
})
