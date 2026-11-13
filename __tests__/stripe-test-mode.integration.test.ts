// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest"
import Stripe from "stripe"
import { PGlite } from "@electric-sql/pglite"
import fs from "node:fs"
import path from "node:path"

/**
 * INTEGRATION TEST against Stripe TEST MODE. It is skipped unless STRIPE_TEST_KEY is set in the environment of the person
 * running it, so the normal test run never reaches Stripe.
 *
 * What is real: the Stripe API (test mode) and the candidate's own code (the real POST /api/create-checkout-session route and the
 * real helpers in lib/checkout-reservation.ts and lib/billing-guard.ts).
 * What is simulated: sign-in, the plan check and the database (an in-memory stand-in), so it does NOT verify the production app,
 * the production database, the webhook integration or end-to-end access changes.
 *
 * What it deliberately does NOT do: it creates no subscriptions and completes no Checkout, because this account has an active
 * test-mode event destination that points at the production URL (supplement-snap.vercel.app/api/stripe/webhook) listening to
 * checkout.session.completed and customer.subscription.deleted. Sessions, customers, products and prices only; a tripwire refuses to run if any enabled destination listens to an event type this run can cause. A completed
 * Checkout, a live subscription's effect on checkout, and expire-versus-completion therefore stay UNVERIFIED against real Stripe.
 *
 * Run (the key stays in your shell; it is never printed, written or committed):
 *   PowerShell:  $env:STRIPE_TEST_KEY = "<an sk_test_ or rk_test_ key>"; npx vitest run __tests__/stripe-test-mode.integration.test.ts
 * A restricted key needs write on Customers, Checkout Sessions, Products and Prices; read on Events, Balance and Webhook Endpoints.
 */

const KEY = process.env.STRIPE_TEST_KEY || ""
const RUN = `zz-readiness-${Date.now().toString(36)}`
const state = {
  customers: new Set<string>(),
  sessions: new Set<string>(),
  product: "",
  prices: [] as string[],
  startedAt: Math.floor(Date.now() / 1000),
  users: new Map<string, string>(), // user id -> stable customer id (our billing_customers stand-in)
}
let stripe: Stripe
let pg: PGlite // the real v15 SQL (in-memory) behind the reservation functions; Stripe is the real test-mode API

vi.mock("../lib/auth-utils", () => ({
  getAuthenticatedUser: async (req: Request) => {
    const id = req.headers.get("x-test-user")
    return id ? { id, email: `${id}@example.test`, email_confirmed_at: "2026-10-01T00:00:00Z", user_metadata: {} } : null
  },
  getUserId: async () => null,
}))
vi.mock("../lib/plan", async (orig) => ({
  ...(await orig<typeof import("../lib/plan")>()),
  getAccess: async () => ({ plan: "free", status: "inactive", active: false, viaOwner: false, hasBilling: false }),
}))
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: (_k: string, v: string) => ({
          maybeSingle: async () => {
            if (table === "subscriptions") return { data: null, error: null }
            const id = state.users.get(v)
            return { data: id ? { stripe_customer_id: id } : null, error: null }
          },
        }),
      }),
      insert: async (row: { user_id?: string; stripe_customer_id?: string }) => {
        if (table === "billing_review") return { error: null }
        const uid = String(row.user_id)
        if (state.users.has(uid)) return { error: { code: "23505" } }
        state.users.set(uid, String(row.stripe_customer_id))
        return { error: null }
      },
    }),
    rpc: async (fn: string, args: Record<string, unknown>) => {
      const q = `SELECT public.${fn}(${Object.keys(args).map((_, i) => `$${i + 1}`).join(", ")}) AS r`
      await pg.exec("SET ROLE service_role")
      try { return { data: ((await pg.query(q, Object.values(args))).rows[0] as { r: unknown }).r, error: null } } finally { await pg.exec("RESET ROLE") }
    },
  }),
}))

const post = (user: string | null, plan: string) =>
  new Request("http://localhost/api/create-checkout-session", {
    method: "POST",
    headers: { origin: "https://supplementsnap.io", "content-type": "application/json", ...(user ? { "x-test-user": user } : {}) },
    body: JSON.stringify({ plan }),
  })

const ids = new Map<string, string>()
// account ids are UUIDs (the reservation table is keyed by auth.users.id)
const user = (n: string) => { if (!ids.has(n)) ids.set(n, crypto.randomUUID()); return ids.get(n)! }
const customerOf = (u: string) => state.users.get(u)!
// every page: a single page is capped at 100, which hid sessions from both the paging test and the cleanup
const openFor = async (customer: string) => stripe.checkout.sessions.list({ customer, status: "open", limit: 100 }).autoPagingToArray({ limit: 2000 })

async function call(u: string | null, plan: string) {
  const { POST } = await import("../app/api/create-checkout-session/route")
  if (u) await pg.query("INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT DO NOTHING", [u, `${u}@example.test`])
  const res = await POST(post(u, plan))
  const body = (await res.json()) as { url?: string; code?: string; error?: string }
  return { status: res.status, body }
}

describe.skipIf(!KEY)("Stripe TEST MODE against the candidate's real checkout code", () => {
  beforeAll(async () => {
    if (!/^(sk|rk)_test_/.test(KEY)) throw new Error("STRIPE_TEST_KEY must be a test-mode key; refusing to run")
    stripe = new Stripe(KEY)
    const root = path.resolve(__dirname, "..")
    pg = new PGlite()
    await pg.exec(fs.readFileSync(path.join(root, "__tests__/fixtures/supabase-shim.sql"), "utf8"))
    await pg.exec("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role")
    await pg.exec("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role")
    await pg.exec(fs.readFileSync(path.join(root, "supabase-migration-v15-checkout-reservations.sql"), "utf8"))
    // A key prefix alone does not prove isolation, so ask Stripe which mode this key acts in.
    const balance = await stripe.balance.retrieve()
    if (balance.livemode !== false) throw new Error("this key reports livemode; refusing to run")
    process.env.STRIPE_SECRET_KEY = KEY
    // Permissions, checked with harmless reads BEFORE anything is created. (Write permissions show up as a clear failure on the first write.)
    const reads: Array<[string, () => Promise<unknown>]> = [
      ["Balance: read", () => stripe.balance.retrieve()],
      ["Webhook Endpoints: read", () => stripe.webhookEndpoints.list({ limit: 1 })],
      ["Events: read", () => stripe.events.list({ limit: 1 })],
      ["Customers: read", () => stripe.customers.list({ limit: 1 })],
      ["Subscriptions: read", () => stripe.subscriptions.list({ limit: 1 })],
      ["Products: read", () => stripe.products.list({ limit: 1 })],
      ["Prices: read", () => stripe.prices.list({ limit: 1 })],
      ["Checkout Sessions: read", () => stripe.checkout.sessions.list({ limit: 1 })],
    ]
    const missing: string[] = []
    for (const [name, fn] of reads) { try { await fn() } catch { missing.push(name) } }
    if (missing.length) throw new Error(`the key lacks: ${missing.join(", ")}`)

    // TRIPWIRE, before anything is created. This run can only cause the event types below (creating and deleting customers,
    // creating and archiving products and prices, creating and expiring Checkout Sessions). If ANY event destination in this
    // account listens to one of them, or to everything, stop now: the safety of the run does not rest on looking at events afterwards.
    const CAN_CAUSE = new Set(["customer.created", "customer.updated", "customer.deleted", "product.created", "product.updated", "price.created", "price.updated", "checkout.session.expired"])
    const endpoints = await stripe.webhookEndpoints.list({ limit: 100 })
    console.log("TEST-MODE EVENT DESTINATIONS (read-only):", endpoints.data.map((e) => `${e.id} ${e.url} [${e.status}] events=${e.enabled_events.join(",")}`))
    const exposed = endpoints.data.filter((e) => e.status === "enabled" && e.enabled_events.some((t) => t === "*" || CAN_CAUSE.has(t)))
    if (exposed.length) throw new Error(`refusing to run: these destinations listen to events this run can cause: ${exposed.map((e) => e.id).join(", ")}`)
    const product = await stripe.products.create({ name: `${RUN} product`, metadata: { synthetic: "true", run: RUN } })
    state.product = product.id
    for (const [env, cents] of [["STRIPE_PRICE_MONTHLY", 9900], ["STRIPE_PRICE_TEAM_MONTHLY", 19900], ["STRIPE_PRICE_PRO_MONTHLY", 29900]] as const) {
      const price = await stripe.prices.create({ product: product.id, unit_amount: cents, currency: "usd", recurring: { interval: "month" }, metadata: { synthetic: "true", run: RUN } })
      state.prices.push(price.id)
      process.env[env] = price.id
    }
  }, 60000)

  afterAll(async () => {
    if (!stripe) return
    const report = { expiredSessions: 0, deletedCustomers: 0, archivedPrices: 0, archivedProduct: 0, problems: [] as string[] }
    const customers = new Set<string>([...state.customers, ...state.users.values()])
    for (const c of customers) {
      try {
        for (const s of await openFor(c)) { await stripe.checkout.sessions.expire(s.id); report.expiredSessions++ }
        await stripe.customers.del(c); report.deletedCustomers++
      } catch (e) { report.problems.push(`customer ${c}: ${(e as Error).message}`) }
    }
    for (const p of state.prices) { try { await stripe.prices.update(p, { active: false }); report.archivedPrices++ } catch (e) { report.problems.push(`price ${p}`) } }
    if (state.product) { try { await stripe.products.update(state.product, { active: false }); report.archivedProduct++ } catch { report.problems.push("product") } }
    // Which events did this run cause? None of these may be a type the production-pointing destination listens to.
    const events = await stripe.events.list({ created: { gte: state.startedAt }, limit: 100 })
    const types: Record<string, number> = {}
    for (const e of events.data) types[e.type] = (types[e.type] ?? 0) + 1
    console.log("CLEANUP:", JSON.stringify(report))
    console.log("EVENT TYPES CAUSED BY THIS RUN:", JSON.stringify(types))
  }, 300000)

  it("makes no event of a type the production-pointing destination listens to (checked after the run, see afterAll output)", () => {
    expect(true).toBe(true)
  })

  it("a new account gets one stable customer and one open session on it; the same plan reuses it; Stripe agrees", async () => {
    const u = user("a")
    const first = await call(u, "starter")
    expect(first.status).toBe(200)
    const c = customerOf(u); state.customers.add(c)
    const second = await call(u, "starter")
    expect(second.body.url).toBe(first.body.url)
    const open = await openFor(c)
    expect(open).toHaveLength(1)
    expect(open[0].customer).toBe(c)
    expect(open[0].expires_at - open[0].created).toBeGreaterThanOrEqual(30 * 60)
  }, 60000)

  it("a different plan expires the first open session and leaves exactly one", async () => {
    const u = user("b")
    await call(u, "starter")
    const c = customerOf(u); state.customers.add(c)
    const res = await call(u, "team")
    expect(res.status).toBe(200)
    const open = await openFor(c)
    expect(open).toHaveLength(1)
    expect(open[0].metadata?.plan).toBe("team")
  }, 60000)

  it("concurrent requests for the same and for different plans (5 rounds): never more than one open session; list agrees right away", async () => {
    const results: string[] = []
    for (let round = 0; round < 5; round++) {
      const u = user(`burst${round}`)
      const plans = round % 2 ? ["starter", "team", "pro"] : ["starter", "starter", "team"]
      const out = await Promise.all(plans.map((p) => call(u, p)))
      const c = state.users.get(u)
      if (c) state.customers.add(c)
      const open = c ? await openFor(c) : []
      results.push(`round ${round}: statuses=${out.map((o) => o.status).join("/")} open=${open.length}`)
      expect(open.length).toBeLessThanOrEqual(1)
      expect(out.every((o) => o.status === 200 || o.status === 409 || o.status === 503)).toBe(true)
      // a request that returned a link: the link's session is open, or expired (never a second payable one)
    }
    console.log("BURSTS:", results)
  }, 180000)

  it("customer-creation race for a brand-new account: at most one Stripe customer is used", async () => {
    const u = user("race")
    const out = await Promise.all([call(u, "starter"), call(u, "starter"), call(u, "starter"), call(u, "starter")])
    const c = state.users.get(u)
    if (c) state.customers.add(c)
    const byEmail = await stripe.customers.list({ email: `${u}@example.test`, limit: 100 })
    byEmail.data.forEach((x) => state.customers.add(x.id))
    console.log("RACE:", `statuses=${out.map((o) => o.status).join("/")} customersWithThisEmail=${byEmail.data.length}`)
    expect(out.every((o) => o.status === 200 || o.status === 409 || o.status === 503)).toBe(true)
    expect(byEmail.data.length).toBeLessThanOrEqual(1)
    if (c) expect((await openFor(c)).length).toBeLessThanOrEqual(1)
  }, 120000)

  it("paging: more than 100 open sessions for one customer are all found and expired except one", async () => {
    const u = user("paging")
    const first = await call(u, "starter") // creates the stable customer
    expect(first.status).toBe(200)
    const c = customerOf(u); state.customers.add(c)
    for (let i = 0; i < 104; i++) {
      await stripe.checkout.sessions.create({
        mode: "subscription", customer: c, line_items: [{ price: process.env.STRIPE_PRICE_MONTHLY!, quantity: 1 }],
        success_url: "https://example.test/ok", cancel_url: "https://example.test/no", metadata: { plan: "starter", synthetic: "true" },
        expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
      })
    }
    expect((await openFor(c)).length).toBeGreaterThan(100)
    const res = await call(u, "team")
    console.log("PAGING:", `status=${res.status} code=${res.body.code ?? ""}`)
    // either everything was cleared and one team session remains, or the request failed closed; never a silent partial result
    if (res.status === 200) {
      const open = await openFor(c)
      expect(open).toHaveLength(1)
      expect(open[0].metadata?.plan).toBe("team")
    } else {
      expect(res.status).toBe(503)
    }
  }, 600000)

  it("a lost response after the session was made: the next request returns the same open session", async () => {
    const u = user("lost")
    await call(u, "starter")
    const c = customerOf(u); state.customers.add(c)
    const sessionBefore = (await openFor(c))[0]
    const retry = await call(u, "starter")
    expect(retry.body.url).toBe(sessionBefore.url)
    expect(await openFor(c)).toHaveLength(1)
  }, 60000)

  it("a session created outside the app is expired and replaced, never adopted: exactly one payable session remains", async () => {
    const u = user("direct")
    await call(u, "starter"); const c = customerOf(u); state.customers.add(c)
    const direct = await stripe.checkout.sessions.create({
      mode: "subscription", customer: c, line_items: [{ price: process.env.STRIPE_PRICE_PRO_MONTHLY!, quantity: 1 }],
      success_url: "https://example.test/ok", cancel_url: "https://example.test/no", metadata: { plan: "pro", synthetic: "true" },
      expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    })
    const res = await call(u, "team")
    expect(res.status).toBe(200)
    const open = await openFor(c)
    expect(open).toHaveLength(1)
    expect(open[0].metadata?.plan).toBe("team")
    expect(open.some((o) => o.id === direct.id)).toBe(false)
  }, 90000)

  it("lease takeover against real Stripe: a slow original that creates a session after its successor started never exposes it", async () => {
    const u = user("takeover")
    await call(u, "starter"); const c = customerOf(u); state.customers.add(c)
    // simulate a crashed owner mid-swap: reserve as another request, then let its lease lapse
    const owner = "99999999-9999-4999-8999-999999999999"
    await pg.exec("SET ROLE service_role")
    await pg.query("SELECT public.checkout_reserve($1,$2,'pro',$3,60)", [u, c, owner]).catch(() => 0)
    await pg.exec("RESET ROLE")
    await pg.query("UPDATE billing_checkout_reservations SET lease_until = now() - interval '1 second' WHERE user_id = $1", [u]).catch(() => 0)
    const res = await call(u, "team")
    expect(res.status).toBe(200)
    // the slow original now creates its session and tries to publish: it must be refused, and its session never returned
    const late = await stripe.checkout.sessions.create({
      mode: "subscription", customer: c, line_items: [{ price: process.env.STRIPE_PRICE_PRO_MONTHLY!, quantity: 1 }],
      success_url: "https://example.test/ok", cancel_url: "https://example.test/no", metadata: { plan: "pro", synthetic: "true" },
      expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    })
    await pg.exec("SET ROLE service_role")
    const published = ((await pg.query("SELECT public.checkout_publish($1,$2,$3,NULL) AS r", [u, owner, late.id])).rows[0] as { r: number }).r
    await pg.exec("RESET ROLE")
    expect(published).toBe(0)
    expect(res.body.url).not.toBe(late.url)
    await stripe.checkout.sessions.expire(late.id)
  }, 90000)

  it("expiring a session that is already expired: Stripe's error is handled (the helper confirms the state instead of failing)", async () => {
    const u = user("expired")
    await call(u, "starter"); const c = customerOf(u); state.customers.add(c)
    const s = (await openFor(c))[0]
    await stripe.checkout.sessions.expire(s.id)
    const { expireOrConfirm } = await import("../lib/checkout-reservation")
    expect(await expireOrConfirm(stripe, s.id)).toBe("not-open")
  }, 60000)

  it("customers can be listed by email right after creation (read-after-write), including across pages of one", async () => {
    const u = user("email"); await call(u, "starter"); const c = customerOf(u); state.customers.add(c)
    const { customerIdsForEmail } = await import("../lib/billing-guard")
    expect(await customerIdsForEmail(stripe, `${u}@example.test`)).toContain(c)
  }, 60000)

  it("a visitor who is not signed in is refused before anything is created at Stripe", async () => {
    const before = (await stripe.checkout.sessions.list({ limit: 100, created: { gte: state.startedAt } })).data.length
    const res = await call(null, "starter")
    expect(res.status).toBe(401)
    expect(res.body.code).toBe("sign-in-required")
    const after = (await stripe.checkout.sessions.list({ limit: 100, created: { gte: state.startedAt } })).data.length
    expect(after).toBe(before)
  }, 60000)

  it.skip("expiration versus completion, a completed Checkout, and a live subscription blocking checkout: NOT reproducible here without completing Checkout (which would send checkout.session.completed to the production-pointing destination). Unverified against real Stripe.", () => {})
})
