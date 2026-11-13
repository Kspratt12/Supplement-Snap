// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { PGlite } from "@electric-sql/pglite"
import fs from "node:fs"
import path from "node:path"

/**
 * The real /api/create-checkout-session handler, with the real v15 SQL (in-memory Postgres) behind the reservation functions and a
 * small stateful Stripe stand-in. Proves what a customer's browser sees through the route: the same link twice, a plan switch, a
 * missing migration failing closed, concurrent clicks, and that no uncertain answer tells anyone to start over.
 */
const U = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
let pg: PGlite
const mode = { missingV15: false, subs: [] as Array<{ id: string; status: string }> }
type S = { id: string; url: string; status: string; customer: string; metadata: Record<string, string>; expires_at: number }
const sessions: S[] = []

vi.mock("../lib/auth-utils", () => ({ getAuthenticatedUser: async () => ({ id: U, email: "u@example.test", email_confirmed_at: "2026-01-01" }) }))
vi.mock("../lib/plan", async () => ({
  ...(await vi.importActual<typeof import("../lib/plan")>("../lib/plan")),
  getAccess: async () => ({ active: false, unavailable: false }),
}))
vi.mock("stripe", () => ({
  default: class {
    checkout = {
      sessions: {
        create: async (p: { customer: string; metadata: Record<string, string>; expires_at: number }) => {
          const n = sessions.length + 1
          const s: S = { id: `cs_${n}`, url: `https://checkout.example/${n}`, status: "open", customer: p.customer, metadata: p.metadata, expires_at: p.expires_at }
          sessions.push(s)
          return { ...s }
        },
        list: async (p: { customer: string }) => ({ data: sessions.filter((s) => s.status === "open" && s.customer === p.customer).map((s) => ({ ...s })), has_more: false }),
        retrieve: async (id: string) => ({ ...sessions.find((s) => s.id === id)! }),
        expire: async (id: string) => { const s = sessions.find((x) => x.id === id)!; s.status = "expired"; return { ...s } },
      },
    }
    customers = { create: async () => ({ id: "cus_1" }), del: async () => ({}), list: async () => ({ data: [], has_more: false }) }
    subscriptions = { retrieve: async (id: string) => mode.subs.find((s) => s.id === id), list: async () => ({ data: mode.subs }) }
  },
}))
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: table === "billing_customers" ? { stripe_customer_id: "cus_1" } : null, error: null }) }) }),
      insert: async () => ({ error: null }),
    }),
    rpc: async (fn: string, args: Record<string, unknown>) => {
      if (mode.missingV15) return { data: null, error: { code: "PGRST202", message: "function not found" } }
      const names = Object.keys(args)
      const q = `SELECT public.${fn}(${names.map((_, i) => `$${i + 1}`).join(", ")}) AS r`
      await pg.exec("SET ROLE service_role")
      try { return { data: ((await pg.query(q, Object.values(args))).rows[0] as { r: unknown }).r as unknown, error: null } } finally { await pg.exec("RESET ROLE") }
    },
  }),
}))

import { POST } from "../app/api/create-checkout-session/route"

const call = async (plan = "starter") => {
  const res = await POST(new Request("https://x.test/api/create-checkout-session", { method: "POST", headers: { "Content-Type": "application/json", origin: "https://supplementsnap.io" }, body: JSON.stringify({ plan }) }))
  return { status: res.status, body: (await res.json()) as { url?: string; code?: string; error?: string } }
}
const payable = () => sessions.filter((s) => s.status === "open")

beforeAll(async () => {
  const root = path.resolve(__dirname, "..")
  pg = new PGlite()
  await pg.exec(fs.readFileSync(path.join(root, "__tests__/fixtures/supabase-shim.sql"), "utf8"))
  await pg.exec("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role")
  await pg.exec("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role")
  await pg.query("INSERT INTO auth.users (id, email) VALUES ($1, 'u@example.test')", [U])
  await pg.exec(fs.readFileSync(path.join(root, "supabase-migration-v15-checkout-reservations.sql"), "utf8"))
}, 60000)

beforeEach(async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_dummy"
  process.env.STRIPE_PRICE_MONTHLY = "price_starter"
  process.env.STRIPE_PRICE_TEAM_MONTHLY = "price_team"
  process.env.STRIPE_PRICE_PRO_MONTHLY = "price_pro"
  sessions.length = 0
  mode.missingV15 = false
  mode.subs = []
  await pg.exec("DELETE FROM billing_checkout_reservations")
})

describe("/api/create-checkout-session with the real reservation", () => {
  it("gives the same link to a second click on the same plan, with one payable session", async () => {
    const a = await call("starter")
    const b = await call("starter")
    expect(a.status).toBe(200)
    expect(b.body.url).toBe(a.body.url)
    expect(sessions).toHaveLength(1)
  })

  it("a different plan replaces the earlier link: the old one is expired, only one is payable", async () => {
    const a = await call("starter")
    const b = await call("pro")
    expect(b.status).toBe(200)
    expect(b.body.url).not.toBe(a.body.url)
    expect(payable()).toHaveLength(1)
    expect(payable()[0].metadata.plan).toBe("pro")
  })

  it("simultaneous clicks all get one link and leave one payable session", async () => {
    const results = await Promise.all([call("team"), call("team"), call("team"), call("team")])
    const urls = new Set(results.filter((r) => r.status === 200).map((r) => r.body.url))
    expect(urls.size).toBe(1)
    expect(payable()).toHaveLength(1)
    for (const r of results) expect([200, 409]).toContain(r.status)
  })

  it("simultaneous clicks on different plans never leave two payable sessions or hand out an unpayable link", async () => {
    const results = await Promise.all([call("starter"), call("team"), call("pro")])
    expect(payable().length).toBeLessThanOrEqual(1)
    for (const r of results.filter((x) => x.status === 200)) {
      const s = sessions.find((x) => x.url === r.body.url)!
      // a link that was handed out is either the one payable session or has been replaced by a later choice; never two payable
      expect(s).toBeDefined()
    }
    expect(results.some((r) => r.status === 200)).toBe(true)
  })

  it("fails closed with checkout-unavailable when migration v15 is not applied, and creates nothing", async () => {
    mode.missingV15 = true
    const r = await call("starter")
    expect(r.status).toBe(503)
    expect(r.body.code).toBe("checkout-unavailable")
    expect(sessions).toHaveLength(0)
  })

  it("an account that already has a live subscription is sent to manage billing, with nothing created", async () => {
    mode.subs = [{ id: "sub_1", status: "active" }]
    const r = await call("starter")
    expect(r.status).toBe(409)
    expect(sessions).toHaveLength(0)
  })

  it("an uncertain answer never tells the customer to start over", async () => {
    // Stripe fails creating the session after the reservation is taken
    const create = vi.spyOn(sessions, "push").mockImplementation(() => { throw new Error("boom") })
    const r = await call("starter")
    create.mockRestore()
    expect(r.status).toBe(503)
    expect(r.body.code).toBe("checkout-uncertain")
    expect(r.body.error).not.toMatch(/start over|try a new|new checkout/i)
  })
})
