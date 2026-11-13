// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Emailing a report is a paid feature for every recipient, including the sender's own address.
 * Runs the real route with login, plan, email delivery and the database mocked.
 * Report generation happens in the browser, so what the server must not do for a denied request is
 * send mail or write the email-tracking row.
 */

const mockGetUser = vi.fn()
const mockGetAccess = vi.fn()
const mockEmailSend = vi.fn()
const mockTrackingInsert = vi.fn()
const mockCreateClient = vi.fn()

vi.mock("../lib/auth-utils", () => ({ getAuthenticatedUser: (...a: unknown[]) => mockGetUser(...a) }))
vi.mock("../lib/plan", async () => ({
  ...(await vi.importActual<typeof import("../lib/plan")>("../lib/plan")),
  getAccess: (...a: unknown[]) => mockGetAccess(...a),
}))
vi.mock("../lib/rate-limit", () => ({ rateLimited: () => false }))
vi.mock("resend", () => ({ Resend: class { emails = { send: (...a: unknown[]) => mockEmailSend(...a) } } }))
vi.mock("@supabase/supabase-js", () => ({
  createClient: (...a: unknown[]) => {
    mockCreateClient(...a)
    return {
      from: (table: string) => ({
        insert: (row: unknown) => {
          mockTrackingInsert(table, row)
          return { select: () => ({ single: async () => ({ data: { tracking_token: "tok" }, error: null }) }) }
        },
      }),
    }
  },
}))

import { POST as sendReport } from "../app/api/send-report/route"

const SELF = "me@example.com"
const send = (body: Record<string, unknown>) =>
  sendReport(new Request("http://localhost/api/send-report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }))
const report = (to: string) => ({
  to,
  subject: "Supplement request",
  message: "Hello",
  projectName: "Smith",
  propertyAddress: "1 Main St",
  projectId: "project-1",
  pdfBase64: "JVBERi0=",
  fileName: "Smith-Report.pdf",
})
const nothingWasDone = () => {
  expect(mockEmailSend).not.toHaveBeenCalled()
  expect(mockTrackingInsert).not.toHaveBeenCalled()
  expect(mockCreateClient).not.toHaveBeenCalled()
}

const FREE = { plan: "free", status: "inactive", active: false, viaOwner: false, hasBilling: false }

beforeEach(() => {
  vi.clearAllMocks()
  process.env.RESEND_API_KEY = "re_dummy"
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service_dummy"
  mockGetUser.mockResolvedValue({ id: "u1", email: SELF })
  mockGetAccess.mockResolvedValue(FREE)
  mockEmailSend.mockResolvedValue({ error: null })
})

describe("POST /api/send-report: Free accounts", () => {
  it("cannot email a report to themselves", async () => {
    const res = await send(report(SELF))
    expect(res.status).toBe(403)
    expect((await res.json()).error).toMatch(/active plan is required/i)
    nothingWasDone()
  })

  it("cannot email themselves with a different letter case or a plus address of their own", async () => {
    expect((await send(report("ME@Example.com"))).status).toBe(403)
    expect((await send(report("me+x@example.com"))).status).toBe(403)
    nothingWasDone()
  })

  it("cannot email an adjuster", async () => {
    const res = await send(report("adjuster@insurer.example"))
    expect(res.status).toBe(403)
    nothingWasDone()
  })

  it("is refused even when the request names a project and asks for branding and follow-ups", async () => {
    const res = await send({ ...report(SELF), companyName: "Acme", followUpDays: 3, projectId: "someone-elses-project" })
    expect(res.status).toBe(403)
    nothingWasDone()
  })

  it("a lapsed or canceled subscription is treated like Free", async () => {
    mockGetAccess.mockResolvedValue({ plan: "starter", status: "canceled", active: false, viaOwner: false, hasBilling: true })
    expect((await send(report(SELF))).status).toBe(403)
    expect((await send(report("adjuster@insurer.example"))).status).toBe(403)
    nothingWasDone()
  })
})

describe("POST /api/send-report: a plan that could not be checked", () => {
  it("answers 503 for the sender's own address and for others, and sends nothing", async () => {
    mockGetAccess.mockResolvedValue({ ...FREE, unavailable: true })
    for (const to of [SELF, "adjuster@insurer.example"]) {
      const res = await send(report(to))
      expect(res.status).toBe(503)
      expect((await res.json()).code).toBe("plan-unavailable")
    }
    nothingWasDone()
  })
})

describe("POST /api/send-report: authorization that stays in place", () => {
  it("refuses a request that is not signed in, before the plan is even looked up", async () => {
    mockGetUser.mockResolvedValue(null)
    const res = await send(report("adjuster@insurer.example"))
    expect(res.status).toBe(401)
    expect(mockGetAccess).not.toHaveBeenCalled()
    nothingWasDone()
  })

  it("still refuses an invalid recipient with 400 before the plan is looked up", async () => {
    for (const to of ["not-an-email", "a@b.co, c@d.co", ""]) expect((await send(report(to))).status).toBe(400)
    expect(mockGetAccess).not.toHaveBeenCalled()
    nothingWasDone()
  })

  it("looks the plan up for the signed-in user, never for an id or email in the body", async () => {
    await send({ ...report("adjuster@insurer.example"), userId: "victim", email: "victim@example.com" })
    expect(mockGetAccess).toHaveBeenCalledWith("u1", SELF)
  })
})

describe("POST /api/send-report: accounts with access keep it", () => {
  it.each([
    ["starter", { plan: "starter", status: "active", active: true, viaOwner: false, hasBilling: true }],
    ["trialing starter", { plan: "starter", status: "trialing", active: true, viaOwner: false, hasBilling: true }],
    ["team", { plan: "team", status: "active", active: true, viaOwner: false, hasBilling: true }],
    ["a complimentary Pro account (active, no Stripe customer)", { plan: "pro", status: "active", active: true, viaOwner: false, hasBilling: false }],
    ["a team member covered by their owner's plan", { plan: "team", status: "active", active: true, viaOwner: true, hasBilling: false }],
  ])("%s can email an adjuster and their own address", async (_name, access) => {
    mockGetAccess.mockResolvedValue(access)
    for (const to of ["adjuster@insurer.example", SELF]) {
      mockEmailSend.mockClear()
      const res = await send(report(to))
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ success: true })
      expect(mockEmailSend).toHaveBeenCalledTimes(1)
      expect(mockEmailSend.mock.calls[0][0].to).toEqual([to])
    }
  })

  it("a plan without open tracking still sends (tracking is a Team and Pro feature)", async () => {
    mockGetAccess.mockResolvedValue({ plan: "starter", status: "active", active: true, viaOwner: false, hasBilling: true })
    expect((await send(report("adjuster@insurer.example"))).status).toBe(200)
    expect(mockTrackingInsert).not.toHaveBeenCalled()
  })
})
