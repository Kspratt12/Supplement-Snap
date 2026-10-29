// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Runs the real route handlers with login, plan, email and payment services mocked, and checks that
 * - the account a checkout attaches to comes from the verified login, never from the request body, and
 * - user-typed text cannot add markup to the emails sent from our domain.
 */

const mockGetUser = vi.fn()
const mockGetAccess = vi.fn()
const mockSessionsCreate = vi.fn()
const mockEmailSend = vi.fn()

vi.mock("../lib/auth-utils", () => ({ getAuthenticatedUser: (...a: unknown[]) => mockGetUser(...a) }))
vi.mock("../lib/plan", async () => ({
  ...(await vi.importActual<typeof import("../lib/plan")>("../lib/plan")),
  getAccess: (...a: unknown[]) => mockGetAccess(...a),
  can: { emailTracking: () => false },
}))
vi.mock("../lib/rate-limit", () => ({ rateLimited: () => false }))
vi.mock("stripe", () => ({
  default: class {
    checkout = { sessions: { create: (...a: unknown[]) => mockSessionsCreate(...a) } }
  },
}))
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: (...a: unknown[]) => mockEmailSend(...a) }
  },
}))
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({}) }))

import { POST as checkout } from "../app/api/create-checkout-session/route"
import { POST as sendReport } from "../app/api/send-report/route"

const json = (url: string, body: unknown) =>
  new Request(url, { method: "POST", headers: { "Content-Type": "application/json", origin: "https://supplementsnap.io" }, body: JSON.stringify(body) })

beforeEach(() => {
  vi.clearAllMocks()
  process.env.STRIPE_SECRET_KEY = "sk_test_dummy"
  process.env.STRIPE_PRICE_MONTHLY = "price_starter"
  process.env.STRIPE_PRICE_TEAM_MONTHLY = "price_team"
  process.env.RESEND_API_KEY = "re_dummy"
  mockSessionsCreate.mockResolvedValue({ url: "https://checkout.example/session" })
  mockEmailSend.mockResolvedValue({ error: null })
  mockGetAccess.mockResolvedValue({ active: false, viaOwner: false })
})

describe("POST /api/create-checkout-session", () => {
  it("attaches the checkout to the signed-in user, ignoring a user id and email in the body", async () => {
    mockGetUser.mockResolvedValue({ id: "real-user", email: "real@example.com" })
    const res = await checkout(json("http://localhost/api/create-checkout-session", { plan: "starter", userId: "victim-user", email: "victim@example.com" }))
    expect(res.status).toBe(200)
    const args = mockSessionsCreate.mock.calls[0][0]
    expect(args.metadata.supabase_user_id).toBe("real-user")
    expect(args.subscription_data.metadata.supabase_user_id).toBe("real-user")
    expect(args.customer_email).toBe("real@example.com")
  })

  it("does not let a visitor who is not signed in name an account", async () => {
    mockGetUser.mockResolvedValue(null)
    const res = await checkout(json("http://localhost/api/create-checkout-session", { plan: "team", userId: "victim-user", email: "victim@example.com" }))
    expect(res.status).toBe(200)
    const args = mockSessionsCreate.mock.calls[0][0]
    expect(args.metadata.supabase_user_id).toBe("")
    expect(args.subscription_data.metadata.supabase_user_id).toBe("")
    expect(args.customer_email).toBeUndefined()
  })
})

describe("POST /api/create-checkout-session: plans and double billing", () => {
  const buy = (plan: unknown) => checkout(json("http://localhost/api/create-checkout-session", { plan }))

  it("refuses a plan name it does not know", async () => {
    mockGetUser.mockResolvedValue(null)
    expect((await buy("platinum")).status).toBe(400)
    expect(mockSessionsCreate).not.toHaveBeenCalled()
  })
  it("cannot sell Enterprise while the Gap Detector is not ready, even with a Stripe price configured", async () => {
    vi.stubEnv("STRIPE_PRICE_ENTERPRISE_MONTHLY", "price_enterprise")
    mockGetUser.mockResolvedValue({ id: "u1", email: "a@example.com" })
    const res = await buy("enterprise")
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/not available yet/)
    expect(mockSessionsCreate).not.toHaveBeenCalled()
  })
  it("still sells starter, team and pro", async () => {
    vi.stubEnv("STRIPE_PRICE_PRO_MONTHLY", "price_pro")
    mockGetUser.mockResolvedValue(null)
    for (const p of ["starter", "team", "pro"]) expect((await buy(p)).status).toBe(200)
    expect(mockSessionsCreate.mock.calls.map((c) => c[0].line_items[0].price)).toEqual(["price_starter", "price_team", "price_pro"])
    expect(mockSessionsCreate.mock.calls.every((c) => c[0].subscription_data.trial_period_days === 14)).toBe(true)
  })
  it("does not start a second subscription for someone whose plan is already active", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", email: "a@example.com" })
    mockGetAccess.mockResolvedValue({ active: true, viaOwner: false, plan: "starter" })
    const res = await buy("team")
    expect(res.status).toBe(409)
    expect((await res.json()).error).toMatch(/billed twice/)
    expect(mockSessionsCreate).not.toHaveBeenCalled()
  })
  it("lets a team member who only inherits their owner's plan buy their own, and lets a cancelled customer come back", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", email: "a@example.com" })
    mockGetAccess.mockResolvedValue({ active: true, viaOwner: true, plan: "team" })
    expect((await buy("starter")).status).toBe(200)
    mockGetAccess.mockResolvedValue({ active: false, viaOwner: false, plan: "free" })
    expect((await buy("starter")).status).toBe(200)
  })
})

describe("POST /api/send-report", () => {
  const body = {
    to: "adjuster@example.com",
    subject: "Supplement request",
    message: 'Hello <a href="https://evil.example">click here</a>\nThanks',
    projectName: "<img src=x onerror=alert(1)>Smith",
    propertyAddress: "1 <b>Main</b> St",
    companyName: 'Acme <script>alert(1)</script>\nBcc: x@evil.example',
  }

  it("rejects requests that are not signed in", async () => {
    mockGetUser.mockResolvedValue(null)
    const res = await sendReport(json("http://localhost/api/send-report", body))
    expect(res.status).toBe(401)
    expect(mockEmailSend).not.toHaveBeenCalled()
  })

  it("sends typed text as plain text, not markup", async () => {
    mockGetAccess.mockResolvedValue({ active: true })
    mockGetUser.mockResolvedValue({ id: "u1", email: "me@example.com" })
    const res = await sendReport(json("http://localhost/api/send-report", body))
    expect(res.status).toBe(200)
    const sent = mockEmailSend.mock.calls[0][0]
    expect(sent.html).not.toContain("<a href=")
    expect(sent.html).not.toContain("<img src=x")
    expect(sent.html).not.toContain("<script>")
    expect(sent.html).not.toContain("<b>Main</b>")
    expect(sent.html).toContain("&lt;a href=")
    expect(sent.html).toContain("Thanks")
    expect(sent.from).not.toMatch(/[\r\n<>]{2,}/)
    expect(sent.from).not.toContain("\n")
    expect(sent.replyTo).toBe("me@example.com")
  })

  it("does not email anyone else on a plan that is not active", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", email: "me@example.com" })
    mockGetAccess.mockResolvedValue({ active: false })
    const res = await sendReport(json("http://localhost/api/send-report", body))
    expect(res.status).toBe(403)
    expect(mockEmailSend).not.toHaveBeenCalled()
  })
})
