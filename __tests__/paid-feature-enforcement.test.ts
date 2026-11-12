// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Runs the real route handlers for the two paid features v13 protects (custom branding, open tracking) with the login, plan and
 * database services replaced by stand-ins, and checks that the PLAN decides, both when something is saved and when an existing row is
 * read or used. All people and data are made up.
 */

type Row = Record<string, unknown>
const w = vi.hoisted(() => ({
  user: { id: "u1", email: "u1@example.test" } as { id: string; email: string } | null,
  access: {} as Record<string, unknown>,
  db: { company_settings: [] as Row[], email_tracking: [] as Row[] } as Record<string, Row[]>,
}))

vi.mock("../lib/auth-utils", () => ({
  getAuthenticatedUser: async () => w.user,
  getUserId: async () => w.user?.id ?? null,
}))
vi.mock("../lib/plan", async (orig) => ({ ...(await orig<typeof import("../lib/plan")>()), getAccess: async () => w.access }))

// A small stand-in for the database client: filters by eq(), supports select/insert/update, single()/maybeSingle(), and is awaitable.
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => {
      const q: { op: string; payload?: Row; filters: Array<[string, unknown]>; [k: string]: unknown } = { op: "select", filters: [] }
      const rows = () => (w.db[table] || []).filter((r) => q.filters.every(([c, v]) => r[c] === v))
      const run = () => {
        if (q.op === "insert") {
          const row = { id: `row${(w.db[table] || []).length + 1}`, tracking_token: `tok${(w.db[table] || []).length + 1}`, open_count: 0, ...q.payload }
          ;(w.db[table] ||= []).push(row)
          return { data: row, error: null }
        }
        if (q.op === "update") {
          const hit = rows()
          for (const r of hit) Object.assign(r, q.payload)
          return { data: hit, error: null }
        }
        return { data: rows(), error: null }
      }
      const b: Record<string, unknown> = {
        select: () => b,
        order: () => b,
        limit: () => b,
        eq: (c: string, v: unknown) => (q.filters.push([c, v]), b),
        insert: (p: Row) => ((q.op = "insert"), (q.payload = p), b),
        update: (p: Row) => ((q.op = "update"), (q.payload = p), b),
        single: async () => { const r = run(); return { data: Array.isArray(r.data) ? r.data[0] ?? null : r.data, error: null } },
        maybeSingle: async () => { const r = run(); return { data: Array.isArray(r.data) ? r.data[0] ?? null : r.data, error: null } },
        then: (res: (v: unknown) => unknown) => res(run()),
      }
      return b
    },
  }),
}))

import { GET as brandingGet, POST as brandingPost } from "../app/api/company-settings/route"
import { GET as trackingGet, POST as trackingPost } from "../app/api/email-track/status/route"
import { GET as pixel } from "../app/api/email-track/route"

const PRO = { plan: "pro", status: "active", active: true, viaOwner: false }
const TEAM = { plan: "team", status: "active", active: true, viaOwner: false }
const STARTER = { plan: "starter", status: "active", active: true, viaOwner: false }
const LAPSED_PRO = { plan: "free", status: "canceled", active: false, viaOwner: false }
const UNAVAILABLE = { plan: "free", status: "inactive", active: false, viaOwner: false, unavailable: true }

const get = (url: string) => new Request(`http://localhost${url}`, { headers: { Authorization: "Bearer t" } })
const post = (url: string, body: unknown) => new Request(`http://localhost${url}`, { method: "POST", headers: { Authorization: "Bearer t", "content-type": "application/json" }, body: JSON.stringify(body) })

beforeEach(() => {
  w.user = { id: "u1", email: "u1@example.test" }
  w.access = PRO
  w.db = { company_settings: [{ user_id: "u1", company_name: "Mine Roofing", logo_url: "https://x.test/logo.png" }], email_tracking: [{ id: "r0", user_id: "u1", tracking_token: "tok-existing", open_count: 3 }] }
})

describe("custom branding: the plan decides when a saved row is used", () => {
  it("a Pro account gets its branding", async () => {
    const res = await brandingGet(get("/api/company-settings"))
    expect((await res.json()).settings).toMatchObject({ company_name: "Mine Roofing" })
  })

  it("an existing row written by an account without the plan is not returned, so it cannot appear on a report", async () => {
    for (const access of [STARTER, TEAM, LAPSED_PRO]) {
      w.access = access
      const body = await (await brandingGet(get("/api/company-settings"))).json()
      expect(body.settings).toBeNull()
      expect(body.locked).toBe(true)
      expect(JSON.stringify(body)).not.toContain("logo.png")
    }
  })

  it("a failed plan check is a temporary error, not branding and not 'locked'", async () => {
    w.access = UNAVAILABLE
    const res = await brandingGet(get("/api/company-settings"))
    expect(res.status).toBe(503)
    expect(JSON.stringify(await res.json())).not.toContain("logo.png")
  })

  it("a signed-out request gets nothing", async () => {
    w.user = null
    expect((await (await brandingGet(get("/api/company-settings"))).json()).settings).toBeNull()
  })

  it("saving still needs the plan (unchanged)", async () => {
    w.access = STARTER
    const res = await brandingPost(post("/api/company-settings", { companyName: "x", logoUrl: "y" }))
    expect(res.status).toBe(403)
    expect(w.db.company_settings[0].company_name).toBe("Mine Roofing")
  })

  it("Pro can still save", async () => {
    const res = await brandingPost(post("/api/company-settings", { companyName: "New Name", logoUrl: "https://x.test/new.png" }))
    expect(res.status).toBe(200)
    expect(w.db.company_settings[0].company_name).toBe("New Name")
  })
})

describe("open tracking: the plan decides when a record is created and when records are read", () => {
  it("an account without Team cannot be issued a tracking token", async () => {
    for (const access of [STARTER, LAPSED_PRO]) {
      w.access = access
      const res = await trackingPost(post("/api/email-track/status", { projectId: "p1", recipientEmail: "a@x.test", subject: "s" }))
      expect(res.status).toBe(403)
    }
    expect(w.db.email_tracking).toHaveLength(1)
  })

  it("a failed plan check is a temporary error and issues nothing", async () => {
    w.access = UNAVAILABLE
    const res = await trackingPost(post("/api/email-track/status", { projectId: "p1", recipientEmail: "a@x.test", subject: "s" }))
    expect(res.status).toBe(503)
    expect(w.db.email_tracking).toHaveLength(1)
  })

  it("a signed-out request is refused", async () => {
    w.user = null
    expect((await trackingPost(post("/api/email-track/status", { projectId: "p1" }))).status).toBe(401)
  })

  it("Team and Pro are issued a token for their own account, whatever user id the request names", async () => {
    for (const access of [TEAM, PRO]) {
      w.access = access
      const before = w.db.email_tracking.length
      const res = await trackingPost(post("/api/email-track/status", { projectId: "p1", recipientEmail: "a@x.test", subject: "s", userId: "victim" }))
      expect(res.status).toBe(200)
      expect((await res.json()).trackingToken).toMatch(/^tok/)
      expect(w.db.email_tracking).toHaveLength(before + 1)
      expect(w.db.email_tracking[before].user_id).toBe("u1")
    }
  })

  it("an existing row owned by an account without the plan is not readable: the route answers locked with no records", async () => {
    w.access = STARTER
    const body = await (await trackingGet(get("/api/email-track/status?projectId=all"))).json()
    expect(body).toEqual({ records: [], locked: true })
  })

  it("Team and Pro read only their own records", async () => {
    w.db.email_tracking.push({ id: "r9", user_id: "someone-else", tracking_token: "tok-other", open_count: 1 })
    w.access = TEAM
    const body = await (await trackingGet(get("/api/email-track/status?projectId=all"))).json()
    expect(body.records.map((r: Row) => r.tracking_token)).toEqual(["tok-existing"])
  })
})

describe("the public email-open pixel keeps working with no login", () => {
  it("records an open for a known token and returns an image", async () => {
    w.user = null
    const res = await pixel(new Request("http://localhost/api/email-track?t=tok-existing"))
    expect(res.headers.get("content-type")).toMatch(/image\/png/)
    expect(w.db.email_tracking[0].open_count).toBe(4)
  })

  it("an unknown token still returns the image and changes nothing", async () => {
    w.user = null
    const res = await pixel(new Request("http://localhost/api/email-track?t=nope"))
    expect(res.headers.get("content-type")).toMatch(/image\/png/)
    expect(w.db.email_tracking[0].open_count).toBe(3)
  })
})
