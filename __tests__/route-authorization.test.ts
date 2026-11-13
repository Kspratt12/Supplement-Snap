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
const sessionsMade: Array<{ id: string; url: string; created: number; status: string; customer?: string; metadata: { plan?: string } }> = []
const mockCustomersCreate = vi.fn()
const mockEmailSend = vi.fn()

vi.mock("../lib/auth-utils", () => ({ getAuthenticatedUser: (...a: unknown[]) => mockGetUser(...a) }))
vi.mock("../lib/plan", async () => ({
  ...(await vi.importActual<typeof import("../lib/plan")>("../lib/plan")),
  getAccess: (...a: unknown[]) => mockGetAccess(...a),
  can: { emailTracking: () => false, customBranding: () => false },
}))
vi.mock("../lib/rate-limit", () => ({ rateLimited: () => false }))
vi.mock("stripe", () => ({
  default: class {
    // a small stand-in that remembers the sessions made, so the checkout's own re-check can see them
    checkout = {
      sessions: {
        create: async (...a: unknown[]) => {
          const made = (await mockSessionsCreate(...a)) as { id: string; url: string }
          const p = a[0] as { customer?: string; metadata?: { plan?: string } }
          sessionsMade.push({ id: made.id, url: made.url, created: sessionsMade.length + 1, status: "open", customer: p.customer, metadata: p.metadata ?? {} })
          return made
        },
        list: async (p: { customer: string }) => ({ data: sessionsMade.filter((x) => x.status === "open" && x.customer === p.customer), has_more: false }),
        retrieve: async (id: string) => sessionsMade.find((x) => x.id === id),
        expire: async (id: string) => { const x = sessionsMade.find((y) => y.id === id); if (x) x.status = "expired"; return x },
      },
    }
    customers = { create: (...a: unknown[]) => mockCustomersCreate(...a), del: async () => ({}), list: async () => ({ data: [], has_more: false }) }
    subscriptions = { retrieve: async (id: string) => ({ id, status: "canceled" }), list: async () => ({ data: [] }) }
  },
}))
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: (...a: unknown[]) => mockEmailSend(...a) }
  },
}))
vi.mock("@supabase/supabase-js", () => ({
  // no stored subscription for anyone in these tests
  createClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }), insert: async () => ({ error: null }) }),
    // the checkout reservation (v15) answers as an empty account would: acquired, and publish succeeds
    rpc: async (fn: string) => ({ data: fn === "checkout_reserve" ? { outcome: "acquired" } : 1, error: null }),
  }),
}))

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
  mockSessionsCreate.mockImplementation(async () => ({ id: `cs_test_${sessionsMade.length + 1}`, url: "https://checkout.example/session" }))
  mockCustomersCreate.mockResolvedValue({ id: "cus_test" })
  sessionsMade.length = 0
  mockEmailSend.mockResolvedValue({ error: null })
  mockGetAccess.mockResolvedValue({ active: false, viaOwner: false })
})

describe("POST /api/create-checkout-session", () => {
  it("attaches the checkout to the signed-in user, ignoring a user id and email in the body", async () => {
    mockGetUser.mockResolvedValue({ id: "real-user", email: "real@example.com", email_confirmed_at: "2026-10-01T00:00:00Z" })
    const res = await checkout(json("http://localhost/api/create-checkout-session", { plan: "starter", userId: "victim-user", email: "victim@example.com" }))
    expect(res.status).toBe(200)
    const args = mockSessionsCreate.mock.calls[0][0]
    expect(args.metadata.supabase_user_id).toBe("real-user")
    expect(args.subscription_data.metadata.supabase_user_id).toBe("real-user")
    // the Stripe customer is made from the SIGNED-IN user's own email and id, never from anything in the body
    expect(mockCustomersCreate.mock.calls[0][0]).toMatchObject({ email: "real@example.com", metadata: { supabase_user_id: "real-user" } })
    expect(JSON.stringify(mockCustomersCreate.mock.calls)).not.toContain("victim")
    expect(args.customer).toBe("cus_test")
    expect(args.customer_email).toBeUndefined()
  })

  it("a visitor who is not signed in cannot start a subscription, whatever user id or email the body names (enforced on the server)", async () => {
    mockGetUser.mockResolvedValue(null)
    const res = await checkout(json("http://localhost/api/create-checkout-session", { plan: "team", userId: "victim-user", email: "victim@example.com" }))
    expect(res.status).toBe(401)
    expect((await res.json()).code).toBe("sign-in-required")
    expect(mockSessionsCreate).not.toHaveBeenCalled()
    expect(mockCustomersCreate).not.toHaveBeenCalled()
  })

  it("an account whose email is not verified cannot start a subscription", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", email: "a@example.com", email_confirmed_at: null })
    const res = await checkout(json("http://localhost/api/create-checkout-session", { plan: "starter" }))
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe("email-not-verified")
    expect(mockSessionsCreate).not.toHaveBeenCalled()
    expect(mockCustomersCreate).not.toHaveBeenCalled()
  })

  it("an existing subscriber is still refused a second subscription and is not asked to sign in again", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", email: "a@example.com", email_confirmed_at: "2026-10-01T00:00:00Z" })
    mockGetAccess.mockResolvedValue({ active: true, viaOwner: false, plan: "starter" })
    const res = await checkout(json("http://localhost/api/create-checkout-session", { plan: "pro" }))
    expect(res.status).toBe(409)
    expect(mockSessionsCreate).not.toHaveBeenCalled()
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
    mockGetUser.mockResolvedValue({ id: "u1", email: "a@example.com", email_confirmed_at: "2026-10-01T00:00:00Z" })
    const res = await buy("enterprise")
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/not available yet/)
    expect(mockSessionsCreate).not.toHaveBeenCalled()
  })
  it("still sells starter, team and pro", async () => {
    vi.stubEnv("STRIPE_PRICE_PRO_MONTHLY", "price_pro")
    mockGetUser.mockResolvedValue({ id: "u1", email: "a@example.com", email_confirmed_at: "2026-10-01T00:00:00Z" })
    for (const p of ["starter", "team", "pro"]) expect((await buy(p)).status).toBe(200)
    expect(mockSessionsCreate.mock.calls.map((c) => c[0].line_items[0].price)).toEqual(["price_starter", "price_team", "price_pro"])
    expect(mockSessionsCreate.mock.calls.every((c) => c[0].subscription_data.trial_period_days === 14)).toBe(true)
  })
  it("does not start a second subscription for someone whose plan is already active", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", email: "a@example.com", email_confirmed_at: "2026-10-01T00:00:00Z" })
    mockGetAccess.mockResolvedValue({ active: true, viaOwner: false, plan: "starter" })
    const res = await buy("team")
    expect(res.status).toBe(409)
    const message = (await res.json()).error as string
    expect(message).toMatch(/second one can't be started/)
    expect(message).toMatch(/support@supplementsnap\.io/)
    expect(mockSessionsCreate).not.toHaveBeenCalled()
  })
  it("lets a team member who only inherits their owner's plan buy their own, and lets a cancelled customer come back", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", email: "a@example.com", email_confirmed_at: "2026-10-01T00:00:00Z" })
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
    mockGetUser.mockResolvedValue({ id: "u1", email: "me@example.com", email_confirmed_at: "2026-10-01T00:00:00Z" })
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
    mockGetUser.mockResolvedValue({ id: "u1", email: "me@example.com", email_confirmed_at: "2026-10-01T00:00:00Z" })
    mockGetAccess.mockResolvedValue({ active: false })
    const res = await sendReport(json("http://localhost/api/send-report", body))
    expect(res.status).toBe(403)
    expect(mockEmailSend).not.toHaveBeenCalled()
  })
})
