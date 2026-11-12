// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Containment for automatic follow-up emails, with the database, login, plan and email service replaced by fakes.
 * Nothing here contacts a real service. These tests show what the code does with those fakes; they do not show live
 * delivery, and they do not show what is configured in production.
 */

const world = vi.hoisted(() => ({
  ops: [] as Array<{ table: string; chain: string[]; args: unknown[][] }>,
  createClientCalls: 0,
  pending: [] as Array<{ id: string; recipient_email: string; subject: string; project_id: string | null; user_id: string | null }>,
  sent: [] as Array<Record<string, unknown>>,
  sendFails: false,
}))

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => {
    world.createClientCalls++
    const from = (table: string) => {
      const op = { table, chain: [] as string[], args: [] as unknown[][] }
      world.ops.push(op)
      const proxy: unknown = new Proxy(
        {},
        {
          get(_t, prop: string) {
            if (prop === "then") {
              const result = op.chain.includes("single")
                ? { data: { tracking_token: "tok-1" }, error: null }
                : { data: op.chain[0] === "select" ? world.pending : null, error: null }
              return (resolve: (v: unknown) => void) => resolve(result)
            }
            return (...args: unknown[]) => {
              op.chain.push(prop)
              op.args.push(args)
              return proxy
            }
          },
        }
      )
      return proxy
    }
    return { from, auth: { admin: { getUserById: async () => ({ data: { user: { email: "sender@example.com" } } }) } } }
  },
}))
vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: async (msg: Record<string, unknown>) => {
        if (world.sendFails) throw new Error("send failed")
        world.sent.push(msg)
        return { error: null }
      },
    }
  },
}))

const mockGetUser = vi.fn()
const mockGetAccess = vi.fn()
vi.mock("../lib/auth-utils", () => ({ getAuthenticatedUser: (...a: unknown[]) => mockGetUser(...a) }))
vi.mock("../lib/plan", () => ({
  getAccess: (...a: unknown[]) => mockGetAccess(...a),
  can: { emailTracking: () => true, customBranding: () => true },
}))
vi.mock("../lib/rate-limit", () => ({ rateLimited: () => false }))

import { GET as followUpCron } from "../app/api/email-followup/route"
import { POST as sendReport } from "../app/api/send-report/route"
import { automaticFollowUpsEnabled } from "../lib/followup-gate"

const GATE = "AUTOMATIC_FOLLOWUPS_ENABLED"
const cron = (auth: string | null = "Bearer cron-secret") =>
  followUpCron(new Request("http://localhost/api/email-followup", { headers: auth ? { authorization: auth } : {} }))

const reportBody = {
  to: "adjuster@example.com",
  subject: "Supplement request",
  message: "Hello",
  projectName: "Smith",
  propertyAddress: "1 Main St",
  projectId: "project-1",
  pdfBase64: "JVBERi0=",
  fileName: "Smith-Report.pdf",
  followUpDays: 3,
}
const send = (body: Record<string, unknown> = reportBody) =>
  sendReport(new Request("http://localhost/api/send-report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }))
const trackingInsert = () => world.ops.find((o) => o.table === "email_tracking" && o.chain[0] === "insert")

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env[GATE]
  process.env.CRON_SECRET = "cron-secret"
  process.env.RESEND_API_KEY = "re_dummy"
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service_dummy"
  world.ops = []
  world.createClientCalls = 0
  world.sent = []
  world.sendFails = false
  world.pending = [{ id: "row-1", recipient_email: "adjuster@example.com", subject: "Supplement request", project_id: "p1", user_id: "u1" }]
  mockGetUser.mockResolvedValue({ id: "u1", email: "me@example.com" })
  mockGetAccess.mockResolvedValue({ active: true, plan: "team" })
})

describe("the gate", () => {
  it.each([
    ["true", true],
    [undefined, false],
    ["", false],
    ["false", false],
    ["TRUE", false],
    ["True", false],
    ["1", false],
    ["yes", false],
    [" true", false],
    ["true ", false],
  ])("value %j enables follow-ups: %s", (value, enabled) => {
    if (value === undefined) delete process.env[GATE]
    else process.env[GATE] = value
    expect(automaticFollowUpsEnabled()).toBe(enabled)
  })
})

describe("GET /api/email-followup while paused", () => {
  it.each([undefined, "", "false", "TRUE", "1", "yes", "true "])("with the flag %j it selects nothing and sends nothing", async (value) => {
    if (value !== undefined) process.env[GATE] = value
    const res = await cron()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ sent: 0, paused: true })
    expect(world.createClientCalls).toBe(0) // the database is never even opened
    expect(world.ops).toEqual([])
    expect(world.sent).toEqual([])
  })

  it("modifies no database rows on the paused path", async () => {
    await cron()
    expect(world.ops.filter((o) => ["insert", "update", "upsert", "delete"].includes(o.chain[0]))).toEqual([])
  })

  it("still refuses a request without the cron secret, paused or not", async () => {
    for (const flag of [undefined, "true"]) {
      if (flag) process.env[GATE] = flag
      else delete process.env[GATE]
      expect((await cron(null)).status).toBe(401)
      expect((await cron("Bearer wrong")).status).toBe(401)
    }
    delete process.env.CRON_SECRET
    expect((await cron("Bearer undefined")).status).toBe(401)
    expect(world.createClientCalls).toBe(0)
    expect(world.sent).toEqual([])
  })
})

describe("GET /api/email-followup when the gate is exactly true (mocked services)", () => {
  beforeEach(() => {
    process.env[GATE] = "true"
  })

  it("escapes the subject in the follow-up HTML", async () => {
    world.pending = [{ id: "row-1", recipient_email: "adjuster@example.com", subject: '<img src=x onerror=alert(1)> & "q"', project_id: "p1", user_id: "u1" }]
    const res = await cron()
    expect((await res.json()).sent).toBe(1)
    const html = world.sent[0].html as string
    expect(html).not.toContain("<img src=x")
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt; &amp; &quot;q&quot;")
  })

  it("does not mark a row as followed up when the send fails (unchanged behavior)", async () => {
    world.sendFails = true
    const res = await cron()
    expect((await res.json()).sent).toBe(0)
    const marked = world.ops.filter((o) => o.table === "email_tracking" && o.chain[0] === "update")
    expect(marked).toEqual([])
  })
})

describe("POST /api/send-report scheduling", () => {
  it("sends the report normally and keeps the tracking row, but schedules no follow-up while paused", async () => {
    const res = await send()
    expect(res.status).toBe(200)
    expect(world.sent).toHaveLength(1)
    expect(world.sent[0].to).toEqual(["adjuster@example.com"])
    expect(world.sent[0].subject).toBe("Supplement request")
    expect((world.sent[0].attachments as unknown[]).length).toBe(1)
    expect(world.sent[0].html as string).toContain("/api/email-track?t=tok-1")
    const row = trackingInsert()!.args[0][0] as Record<string, unknown>
    expect(row).toMatchObject({ project_id: "project-1", user_id: "u1", recipient_email: "adjuster@example.com", subject: "Supplement request" })
    expect(row.follow_up_at).toBeNull()
  })

  it.each([3, 1, 365, "3", true, 0.001, -5])("a stale client sending followUpDays %j still schedules nothing while paused", async (days) => {
    for (const flag of [undefined, "", "false", "TRUE", "1"]) {
      if (flag === undefined) delete process.env[GATE]
      else process.env[GATE] = flag
      world.ops = []
      const res = await send({ ...reportBody, followUpDays: days })
      expect(res.status).toBe(200)
      expect((trackingInsert()!.args[0][0] as Record<string, unknown>).follow_up_at).toBeNull()
    }
  })

  it("still schedules when the gate is exactly true (gate wiring only; this batch does not re-enable it)", async () => {
    process.env[GATE] = "true"
    await send()
    expect(typeof (trackingInsert()!.args[0][0] as Record<string, unknown>).follow_up_at).toBe("string")
  })

  it("does not change who may email adjusters", async () => {
    mockGetAccess.mockResolvedValue({ active: false })
    const res = await send()
    expect(res.status).toBe(403)
    expect(world.sent).toEqual([])
  })
})
