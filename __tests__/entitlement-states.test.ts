// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Custom branding (Pro and above) and open tracking (Team and above) across every subscription state the app supports, with the REAL
 * plan logic (lib/plan.ts, unchanged: active, trialing and past_due keep access; canceled and inactive do not; a failed lookup is
 * 'could not check') against a stand-in database. Covers: saving, reading an existing row, issuing a tracking token, the email header
 * company name, the follow-up cron, loss of entitlement, team members who inherit an owner's plan, and the public open pixel.
 * It does not invent a new trial or grace policy. All people and data are made up; nothing is emailed.
 */

type Row = Record<string, unknown>
const w = vi.hoisted(() => ({
  user: { id: "u1", email: "u1@example.test" } as { id: string; email: string } | null,
  db: {} as Record<string, Row[]>,
  failSubscriptions: false,
  sent: [] as Array<{ to: string; html: string }>,
  users: {} as Record<string, string>,
}))

vi.mock("../lib/auth-utils", () => ({ getAuthenticatedUser: async () => w.user, getUserId: async () => w.user?.id ?? null }))
vi.mock("../lib/rate-limit", () => ({ rateLimited: () => false }))
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: async (m: { to: string; html: string }) => (w.sent.push({ to: m.to, html: m.html }), { error: null }) }
  },
}))
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { admin: { getUserById: async (id: string) => ({ data: { user: { email: w.users[id] } } }) } },
    from: (table: string) => {
      const q: { op: string; payload?: Row; f: Array<(r: Row) => boolean> } = { op: "select", f: [] }
      const rows = () => (w.db[table] || []).filter((r) => q.f.every((fn) => fn(r)))
      const run = () => {
        if (table === "subscriptions" && w.failSubscriptions) return { data: null, error: { message: "down" } }
        if (q.op === "insert") {
          const list = (w.db[table] ||= [])
          const row = { id: `row${list.length + 1}`, tracking_token: `tok${list.length + 1}`, open_count: 0, ...q.payload }
          list.push(row)
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
        eq: (c: string, v: unknown) => (q.f.push((r) => r[c] === v), b),
        is: (c: string, v: unknown) => (q.f.push((r) => (v === null ? r[c] == null : r[c] === v)), b),
        not: (c: string, _op: string, v: unknown) => (q.f.push((r) => (v === null ? r[c] != null : r[c] !== v)), b),
        lte: (c: string, v: string) => (q.f.push((r) => r[c] != null && String(r[c]) <= v), b),
        insert: (p: Row) => ((q.op = "insert"), (q.payload = p), b),
        update: (p: Row) => ((q.op = "update"), (q.payload = p), b),
        single: async () => { const r = run(); return { data: Array.isArray(r.data) ? r.data[0] ?? null : r.data, error: r.error } },
        maybeSingle: async () => { const r = run(); return { data: Array.isArray(r.data) ? r.data[0] ?? null : r.data, error: r.error } },
        then: (res: (v: unknown) => unknown) => res(run()),
      }
      return b
    },
  }),
}))

import { GET as brandingGet, POST as brandingPost } from "../app/api/company-settings/route"
import { GET as trackingGet, POST as trackingPost } from "../app/api/email-track/status/route"
import { GET as pixel } from "../app/api/email-track/route"
import { POST as sendReport } from "../app/api/send-report/route"
import { GET as followUps } from "../app/api/email-followup/route"

const STATUSES = ["active", "trialing", "past_due", "canceled", "inactive"] as const
const PLANS = ["starter", "team", "pro", "enterprise"] as const
const LIVE = new Set(["active", "trialing", "past_due"]) // the current policy: unchanged
const BRANDING_PLANS = new Set(["pro", "enterprise"])
const TRACKING_PLANS = new Set(["team", "pro", "enterprise"])

const get = (url: string) => new Request(`http://localhost${url}`, { headers: { Authorization: "Bearer t" } })
const post = (url: string, body: unknown) => new Request(`http://localhost${url}`, { method: "POST", headers: { Authorization: "Bearer t", "content-type": "application/json" }, body: JSON.stringify(body) })
const setPlan = (status: string, plan: string, userId = "u1") => {
  w.db.subscriptions = (w.db.subscriptions || []).filter((r) => r.user_id !== userId)
  w.db.subscriptions.push({ user_id: userId, status, plan, stripe_customer_id: "cus" })
}

beforeEach(() => {
  w.user = { id: "u1", email: "u1@example.test" }
  w.failSubscriptions = false
  w.sent = []
  w.users = { u1: "u1@example.test", u2: "u2@example.test", u3: "u3@example.test" }
  w.db = {
    subscriptions: [],
    team_members: [],
    company_settings: [{ user_id: "u1", company_name: "Mine Roofing", logo_url: "https://x.test/logo.png" }],
    email_tracking: [{ id: "r0", user_id: "u1", tracking_token: "tok-existing", open_count: 2, recipient_email: "adj@x.test", subject: "S" }],
  }
  process.env.RESEND_API_KEY = "re_dummy"
  process.env.SUPABASE_SERVICE_ROLE_KEY = "svc"
  process.env.CRON_SECRET = "cron"
  delete process.env.AUTOMATIC_FOLLOWUPS_ENABLED
})

describe("every supported subscription state and plan", () => {
  for (const status of STATUSES) {
    for (const plan of PLANS) {
      const branding = LIVE.has(status) && BRANDING_PLANS.has(plan)
      const tracking = LIVE.has(status) && TRACKING_PLANS.has(plan)
      it(`${plan} / ${status}: branding ${branding ? "available" : "locked"}, tracking ${tracking ? "available" : "locked"}`, async () => {
        setPlan(status, plan)
        // reading an existing branding row
        const b = await (await brandingGet(get("/api/company-settings"))).json()
        expect(b.settings !== null).toBe(branding)
        // saving branding
        const saved = await brandingPost(post("/api/company-settings", { companyName: "New", logoUrl: "https://x.test/n.png" }))
        expect(saved.status).toBe(branding ? 200 : 403)
        // reading existing tracking records
        const t = await (await trackingGet(get("/api/email-track/status?projectId=all"))).json()
        expect(t.locked === true).toBe(!tracking)
        expect(t.records.length > 0).toBe(tracking)
        // issuing a tracking token
        const before = w.db.email_tracking.length
        const issued = await trackingPost(post("/api/email-track/status", { projectId: "p", recipientEmail: "a@x.test", subject: "s" }))
        expect(issued.status).toBe(tracking ? 200 : 403)
        expect(w.db.email_tracking.length).toBe(before + (tracking ? 1 : 0))
      })
    }
  }

  it("an account with no subscription at all (Free) has neither feature", async () => {
    expect((await (await brandingGet(get("/api/company-settings"))).json()).settings).toBeNull()
    expect((await (await trackingGet(get("/api/email-track/status?projectId=all"))).json()).locked).toBe(true)
    expect((await trackingPost(post("/api/email-track/status", { projectId: "p" }))).status).toBe(403)
  })
})

describe("loss of entitlement", () => {
  it("branding and tracking switch off when a Pro subscription is canceled, and back on if it returns, without any row being deleted", async () => {
    setPlan("active", "pro")
    expect((await (await brandingGet(get("/api/company-settings"))).json()).settings).not.toBeNull()
    expect((await (await trackingGet(get("/api/email-track/status?projectId=all"))).json()).records).toHaveLength(1)
    setPlan("canceled", "pro")
    expect((await (await brandingGet(get("/api/company-settings"))).json()).settings).toBeNull()
    expect((await (await trackingGet(get("/api/email-track/status?projectId=all"))).json()).locked).toBe(true)
    expect(w.db.company_settings).toHaveLength(1)
    expect(w.db.email_tracking).toHaveLength(1)
    setPlan("active", "pro")
    expect((await (await brandingGet(get("/api/company-settings"))).json()).settings).toMatchObject({ company_name: "Mine Roofing" })
  })

  it("a renewal that is retrying (past_due) and a free trial (trialing) keep access, exactly as the plan policy already says", async () => {
    for (const status of ["past_due", "trialing"]) {
      setPlan(status, "pro")
      expect((await (await brandingGet(get("/api/company-settings"))).json()).settings).not.toBeNull()
      expect((await trackingPost(post("/api/email-track/status", { projectId: "p" }))).status).toBe(200)
    }
  })

  it("a failed subscription lookup is a temporary error for both features, never 'locked' and never access", async () => {
    setPlan("active", "pro")
    w.failSubscriptions = true
    for (const res of [await brandingGet(get("/api/company-settings")), await trackingGet(get("/api/email-track/status?projectId=all")), await trackingPost(post("/api/email-track/status", { projectId: "p" }))]) {
      expect(res.status).toBe(503)
      expect(JSON.stringify(await res.json())).not.toContain("logo.png")
    }
  })
})

describe("team members who inherit an owner's plan", () => {
  beforeEach(() => {
    w.user = { id: "u2", email: "u2@example.test" }
    w.db.team_members = [{ id: "t1", owner_id: "u1", member_email: "u2@example.test", status: "active" }]
    w.db.company_settings.push({ user_id: "u2", company_name: "Member Co", logo_url: "https://x.test/m.png" })
  })

  it("a member of a live Pro owner has branding and tracking; if the owner's plan lapses, so does the member's", async () => {
    setPlan("active", "pro", "u1")
    expect((await (await brandingGet(get("/api/company-settings"))).json()).settings).toMatchObject({ company_name: "Member Co" })
    expect((await trackingPost(post("/api/email-track/status", { projectId: "p" }))).status).toBe(200)
    setPlan("canceled", "pro", "u1")
    expect((await (await brandingGet(get("/api/company-settings"))).json()).settings).toBeNull()
    expect((await trackingPost(post("/api/email-track/status", { projectId: "p" }))).status).toBe(403)
  })

  it("a member of a Starter owner gets neither feature", async () => {
    setPlan("active", "starter", "u1")
    expect((await (await brandingGet(get("/api/company-settings"))).json()).settings).toBeNull()
    expect((await trackingPost(post("/api/email-track/status", { projectId: "p" }))).status).toBe(403)
  })
})

describe("public legacy tracking pixels keep working, and cannot be used to create tracking", () => {
  it("records opens for existing tokens with no login, in every subscription state", async () => {
    w.user = null
    let expected = 2
    for (const status of [...STATUSES, "none"]) {
      if (status !== "none") setPlan(status, "pro")
      const res = await pixel(new Request("http://localhost/api/email-track?t=tok-existing"))
      expect(res.headers.get("content-type")).toMatch(/image\/png/)
      expected += 1
      expect(w.db.email_tracking[0].open_count).toBe(expected)
    }
  })

  it("an unknown token returns the image and creates nothing; the pixel route has no way to create a record", async () => {
    w.user = null
    const before = JSON.stringify(w.db.email_tracking)
    const res = await pixel(new Request("http://localhost/api/email-track?t=forged"))
    expect(res.headers.get("content-type")).toMatch(/image\/png/)
    expect(JSON.stringify(w.db.email_tracking)).toBe(before)
  })

  it("signed-out requests to create a token are refused", async () => {
    w.user = null
    expect((await trackingPost(post("/api/email-track/status", { projectId: "p" }))).status).toBe(401)
    expect(w.db.email_tracking).toHaveLength(1)
  })
})

describe("emailing a report: the header company name and the tracking pixel follow the plan", () => {
  const send = () => sendReport(post("/api/send-report", { to: "adjuster@x.test", subject: "Supplement", message: "m", projectName: "P", propertyAddress: "1 Main", projectId: "p1", companyName: "Acme Roofing" }))

  it("the company name appears only while the plan includes custom branding, whatever the request says", async () => {
    for (const [status, plan, shown] of [["active", "pro", true], ["trialing", "pro", true], ["past_due", "enterprise", true], ["active", "team", false], ["active", "starter", false], ["canceled", "pro", false]] as const) {
      w.sent = []
      setPlan(status, plan)
      const res = await send()
      if (status === "canceled") { expect(res.status).toBe(403); continue }
      expect(res.status).toBe(200)
      expect(w.sent[0].html.includes("Acme Roofing")).toBe(shown)
    }
  })

  it("a tracking pixel is added only on Team and above", async () => {
    for (const [plan, pixelShown] of [["starter", false], ["team", true], ["pro", true]] as const) {
      w.sent = []
      setPlan("active", plan)
      await send()
      expect(w.sent[0].html.includes("/api/email-track?t=")).toBe(pixelShown)
    }
  })
})

describe("the follow-up cron only acts for entitled accounts and leaves other rows untouched", () => {
  const due = "2020-01-01T00:00:00.000Z"
  const cron = () => followUps(new Request("http://localhost/api/email-followup", { headers: { authorization: "Bearer cron" } }))

  beforeEach(() => {
    process.env.AUTOMATIC_FOLLOWUPS_ENABLED = "true"
    w.db.email_tracking = [
      { id: "a", user_id: "u1", recipient_email: "team@x.test", subject: "S1", follow_up_at: due, opened_at: null, followed_up_at: null },
      { id: "b", user_id: "u2", recipient_email: "starter@x.test", subject: "S2", follow_up_at: due, opened_at: null, followed_up_at: null },
      { id: "c", user_id: "u3", recipient_email: "lapsed@x.test", subject: "S3", follow_up_at: due, opened_at: null, followed_up_at: null },
    ]
    setPlan("active", "team", "u1")
    setPlan("active", "starter", "u2")
    setPlan("canceled", "pro", "u3")
  })

  it("sends only for the account with the plan; the others are skipped, unchanged and not deleted", async () => {
    const res = await cron()
    expect((await res.json()).sent).toBe(1)
    expect(w.sent.map((m) => m.to)).toEqual(["team@x.test"])
    expect(w.db.email_tracking).toHaveLength(3)
    expect(w.db.email_tracking.find((r) => r.id === "a")?.followed_up_at).toBeTruthy()
    expect(w.db.email_tracking.find((r) => r.id === "b")?.followed_up_at).toBeNull()
    expect(w.db.email_tracking.find((r) => r.id === "c")?.followed_up_at).toBeNull()
  })

  it("sends nothing when the plan lookup fails", async () => {
    w.failSubscriptions = true
    await cron()
    expect(w.sent).toEqual([])
  })

  it("still needs the cron secret and the containment switch", async () => {
    expect((await followUps(new Request("http://localhost/api/email-followup"))).status).toBe(401)
    delete process.env.AUTOMATIC_FOLLOWUPS_ENABLED
    expect((await (await cron()).json()).paused).toBe(true)
    expect(w.sent).toEqual([])
  })
})
