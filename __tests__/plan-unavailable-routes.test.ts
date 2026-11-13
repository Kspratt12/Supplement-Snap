// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Every route that checks the plan, run for real with the plan check answering "could not check". Each must answer 503
 * (temporary), must not say "inactive" or ask for an upgrade, and must not reach Stripe, the email service or the AI
 * service. All services are stand-ins; no one is charged, emailed or sent to a model.
 */

const w = vi.hoisted(() => ({
  access: { plan: "free", status: "inactive", active: false, viaOwner: false, hasBilling: false, unavailable: true } as Record<string, unknown>,
  calls: [] as string[],
}))

vi.mock("../lib/auth-utils", () => ({ getAuthenticatedUser: async () => ({ id: "u1", email: "roofer@example.com", email_confirmed_at: "2026-10-01T00:00:00Z", user_metadata: {} }), getUserId: async () => "u1" }))
vi.mock("../lib/rate-limit", () => ({ rateLimited: () => false }))
vi.mock("../lib/plan", async (orig) => ({ ...(await orig<typeof import("../lib/plan")>()), getAccess: async () => w.access }))
vi.mock("stripe", () => ({ default: class { checkout = { sessions: { create: async () => (w.calls.push("stripe-checkout"), { url: "https://stripe.example/x" }) } } } }))
vi.mock("resend", () => ({ Resend: class { constructor() { w.calls.push("resend") } emails = { send: async () => (w.calls.push("resend-send"), { error: null }) } } }))
vi.mock("@anthropic-ai/sdk", () => ({ default: class { constructor() { w.calls.push("anthropic") } } }))
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => {
    const proxy: unknown = new Proxy({}, { get: (_t, p) => (p === "then" ? undefined : () => proxy) })
    return proxy
  },
}))

const post = (url: string, body: unknown = {}) =>
  new Request(`http://localhost${url}`, { method: "POST", headers: { Authorization: "Bearer t", "content-type": "application/json" }, body: JSON.stringify(body) })
const get = (url: string) => new Request(`http://localhost${url}`, { headers: { Authorization: "Bearer t" } })

async function expect503(res: Response) {
  expect(res.status).toBe(503)
  const body = await res.json()
  expect(body.code).toBe("plan-unavailable")
  expect(JSON.stringify(body)).not.toMatch(/inactive|upgrade|active plan is required|available on the/i)
}

beforeEach(() => {
  w.calls = []
  w.access = { plan: "free", status: "inactive", active: false, viaOwner: false, hasBilling: false, unavailable: true }
  process.env.RESEND_API_KEY = "re_dummy"
  process.env.STRIPE_SECRET_KEY = "sk_test_dummy"
  process.env.STRIPE_PRICE_STARTER_MONTHLY = "price_dummy"
})

describe("a failed plan check is a temporary error, not 'inactive'", () => {
  it("/api/subscription", async () => {
    const { GET } = await import("../app/api/subscription/route")
    await expect503(await GET(get("/api/subscription")))
  })

  it("/api/export-xactimate", async () => {
    const { POST } = await import("../app/api/export-xactimate/route")
    await expect503(await POST(post("/api/export-xactimate", { projectName: "x", captures: [] })))
  })

  it("/api/company-settings POST", async () => {
    const { POST } = await import("../app/api/company-settings/route")
    await expect503(await POST(post("/api/company-settings", { companyName: "Acme Roofing" })))
  })

  it("/api/email-track/status answers 503, not the locked (upgrade) answer", async () => {
    const { GET } = await import("../app/api/email-track/status/route")
    await expect503(await GET(get("/api/email-track/status?projectId=p1")))
  })

  it("/api/estimate-gap/status", async () => {
    const { GET } = await import("../app/api/estimate-gap/status/route")
    await expect503(await GET(get("/api/estimate-gap/status")))
  })

  it("/api/send-report to an adjuster sends nothing", async () => {
    const { POST } = await import("../app/api/send-report/route")
    const res = await POST(post("/api/send-report", { to: "adjuster@insurer.example", subject: "Report", html: "<p>x</p>" }))
    await expect503(res)
    expect(w.calls).not.toContain("resend-send")
  })

  it("/api/send-report to the person's own address is not refused as 503 or 403 (that never needed a plan)", async () => {
    const { POST } = await import("../app/api/send-report/route")
    const res = await POST(post("/api/send-report", { to: "roofer@example.com", subject: "Report", html: "<p>x</p>" }))
    expect(res.status).not.toBe(503)
    expect(res.status).not.toBe(403)
  })

  it("/api/create-checkout-session does not start a purchase it cannot rule out double-billing", async () => {
    const { POST } = await import("../app/api/create-checkout-session/route")
    const res = await POST(post("/api/create-checkout-session", { plan: "starter" }))
    await expect503(res)
    expect(w.calls).not.toContain("stripe-checkout")
  })
})

describe("a verified inactive plan is still the ordinary 'no plan' answer", () => {
  beforeEach(() => {
    w.access = { plan: "free", status: "inactive", active: false, viaOwner: false, hasBilling: false }
  })

  it("/api/subscription answers 200 with plan none", async () => {
    const { GET } = await import("../app/api/subscription/route")
    const res = await GET(get("/api/subscription"))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ status: "inactive", plan: "none" })
  })

  it("/api/export-xactimate stays 403 for a verified free account", async () => {
    const { POST } = await import("../app/api/export-xactimate/route")
    expect((await POST(post("/api/export-xactimate", { projectName: "x", captures: [] }))).status).toBe(403)
  })
})
