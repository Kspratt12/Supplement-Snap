// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"
import { blockFor, existingBillingBlock } from "../lib/billing-guard"

/**
 * One account should not accidentally start two independently billing subscriptions. Everything here is a stand-in with real
 * behavior (open/expired/complete sessions, paging, one customer per account, a unique key on the customer table, injected
 * failures): no real Stripe, database, email or customer, and nothing is charged or changed. These tests show how OUR code
 * behaves against that stand-in. They do not prove how live Stripe behaves; see the Stripe test-mode request.
 */

type Sess = { id: string; url: string; created: number; status: "open" | "complete" | "expired"; expires_at: number; customer?: string; metadata: { plan?: string }; customer_email?: string }
type Sub = { id: string; status: string }

const w = vi.hoisted(() => ({
  access: { plan: "free", status: "inactive", active: false, viaOwner: false, hasBilling: false } as Record<string, unknown>,
  stored: null as null | { stripe_subscription_id?: string | null; stripe_customer_id?: string | null },
  storedError: false,
  tableMissing: false,
  insertFails: false,
  customers: new Map<string, string>(),
  review: [] as Array<Record<string, unknown>>,
  subsByCustomer: {} as Record<string, Array<{ id: string; status: string }>>,
  subs: {} as Record<string, string>,
  emailCustomers: [] as string[],
  emailHasMore: false,
  sessions: [] as Array<Record<string, unknown> & { id: string; url: string; created: number; status: string; expires_at: number; customer?: string; metadata: { plan?: string }; customer_email?: string }>,
  now: 1_800_000_000,
  tick: 0,
  sameCreated: false,
  customersCreated: [] as string[],
  customersDeleted: [] as string[],
  expired: [] as string[],
  raceWinner: null as null | string,
  customerKeys: new Map<string, string>(),
  fail: null as null | string,
  failFrom: 0,
  calls: {} as Record<string, number>,
  pageSize: 100,
  jitter: false,
  rng: 1,
  onExpire: null as null | ((s: { id: string; status: string }) => void),
  afterCreate: null as null | ((s: { id: string }) => void),
}))

const hit = (name: string) => {
  w.calls[name] = (w.calls[name] ?? 0) + 1
  if (w.fail === name && w.calls[name] > w.failFrom) throw new Error("stripe " + name + " down")
}
const pause = async () => {
  if (!w.jitter) return
  w.rng = (w.rng * 1103515245 + 12345) & 0x7fffffff
  await new Promise((r) => setTimeout(r, w.rng % 3))
}

vi.mock("../lib/auth-utils", () => ({
  getAuthenticatedUser: async (req: Request) => (req.headers.get("authorization") ? { id: "u1", email: "roofer@example.com", user_metadata: {} } : null),
  getUserId: async () => "u1",
}))
vi.mock("../lib/plan", async (orig) => ({ ...(await orig<typeof import("../lib/plan")>()), getAccess: async () => w.access }))
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: (_k: string, v: string) => ({
          maybeSingle: async () => {
            await pause()
            if (table === "subscriptions") return { data: w.stored, error: w.storedError ? { message: "db down" } : null }
            if (w.tableMissing) return { data: null, error: { code: "42P01" } }
            const id = w.customers.get(v)
            return { data: id ? { stripe_customer_id: id } : null, error: null }
          },
        }),
      }),
      insert: async (row: Record<string, unknown>) => {
        await pause()
        if (w.tableMissing) return { error: { code: "42P01" } }
        if (table === "billing_review") { w.review.push(row); return { error: null } }
        if (w.insertFails) return { error: { code: "XX000", message: "write failed" } }
        const uid = String(row.user_id)
        if (w.raceWinner) { w.customers.set(uid, w.raceWinner); w.raceWinner = null }
        if (w.customers.has(uid)) return { error: { code: "23505" } }
        w.customers.set(uid, String(row.stripe_customer_id))
        return { error: null }
      },
    }),
  }),
}))
vi.mock("stripe", () => ({
  default: class {
    customers = {
      create: async (_p: unknown, opts?: { idempotencyKey?: string }) => {
        hit("customers.create"); await pause()
        const key = opts?.idempotencyKey
        if (key && w.customerKeys.has(key)) return { id: w.customerKeys.get(key) }
        const id = `cus_${w.customersCreated.length + 1}`
        w.customersCreated.push(id)
        if (key) w.customerKeys.set(key, id)
        return { id }
      },
      del: async (id: string) => { w.customersDeleted.push(id); return { id } },
      list: async () => { hit("customers.list"); return { data: w.emailCustomers.map((id) => ({ id })), has_more: w.emailHasMore } },
    }
    subscriptions = {
      retrieve: async (id: string) => { hit("subscriptions.retrieve"); return { id, status: w.subs[id] ?? "canceled" } },
      list: async (p: { customer: string; starting_after?: string }) => {
        hit("subscriptions.list"); await pause()
        const all = w.subsByCustomer[p.customer] ?? []
        const from = p.starting_after ? all.findIndex((x) => x.id === p.starting_after) + 1 : 0
        const page = all.slice(from, from + w.pageSize)
        return { data: page, has_more: from + w.pageSize < all.length }
      },
    }
    checkout = {
      sessions: {
        create: async (p: { customer?: string; customer_email?: string; metadata: { plan: string }; expires_at: number }) => {
          hit("sessions.create"); await pause()
          const n = w.sessions.length + 1
          const s = { id: `cs_${n}`, url: `https://checkout.stripe.example/cs_${n}`, created: w.sameCreated ? w.now : w.now + ++w.tick, status: "open", expires_at: p.expires_at, customer: p.customer, customer_email: p.customer_email, metadata: { plan: p.metadata.plan } }
          w.sessions.push(s)
          w.afterCreate?.(s)
          return s
        },
        list: async (p: { customer: string; status: string; starting_after?: string }) => {
          hit("sessions.list"); await pause()
          const all = w.sessions.filter((s) => s.customer === p.customer && s.status === p.status && s.expires_at > w.now)
          const from = p.starting_after ? all.findIndex((x) => x.id === p.starting_after) + 1 : 0
          const page = all.slice(from, from + w.pageSize)
          return { data: page, has_more: from + w.pageSize < all.length }
        },
        retrieve: async (id: string) => { hit("sessions.retrieve"); return w.sessions.find((x) => x.id === id) },
        expire: async (id: string) => {
          hit("sessions.expire"); await pause()
          const s = w.sessions.find((x) => x.id === id)!
          w.onExpire?.(s)
          if (s.status !== "open") throw Object.assign(new Error("not open"), { statusCode: 400 })
          s.status = "expired"
          w.expired.push(id)
          return s
        },
      },
    }
  },
}))

import { POST } from "../app/api/create-checkout-session/route"

const post = (plan = "starter", signedIn = true) =>
  new Request("http://localhost/api/create-checkout-session", {
    method: "POST",
    headers: { origin: "https://supplementsnap.io", "content-type": "application/json", ...(signedIn ? { authorization: "Bearer t" } : {}) },
    body: JSON.stringify({ plan }),
  })
const open = () => w.sessions.filter((s) => s.status === "open" && s.expires_at > w.now)
const completed = () => w.sessions.filter((s) => s.status === "complete")

beforeEach(() => {
  Object.assign(w, {
    access: { plan: "free", status: "inactive", active: false, viaOwner: false, hasBilling: false },
    stored: null, storedError: false, tableMissing: false, insertFails: false, customers: new Map(), review: [], subsByCustomer: {}, subs: {},
    emailCustomers: [], emailHasMore: false, sessions: [], now: 1_800_000_000, tick: 0, sameCreated: false, customersCreated: [], customersDeleted: [],
    expired: [], raceWinner: null, customerKeys: new Map(), fail: null, failFrom: 0, calls: {}, pageSize: 100, jitter: false, rng: 1, onExpire: null, afterCreate: null,
  })
  vi.spyOn(Date, "now").mockImplementation(() => w.now * 1000)
  process.env.STRIPE_SECRET_KEY = "sk_test_dummy"
  process.env.STRIPE_PRICE_MONTHLY = "price_starter"
  process.env.STRIPE_PRICE_TEAM_MONTHLY = "price_team"
  process.env.STRIPE_PRICE_PRO_MONTHLY = "price_pro"
})

describe("what each Stripe subscription state allows", () => {
  it("active and trialing: already subscribed, go to billing management", () => {
    for (const s of ["active", "trialing"]) expect(blockFor(s)).toMatchObject({ code: "already_subscribed", action: "manage_billing", httpStatus: 409 })
  })
  it("past due: update the card, do not start another subscription", () => {
    expect(blockFor("past_due")).toMatchObject({ code: "payment_failing", action: "manage_billing" })
  })
  it("unpaid and paused need attention; incomplete means wait; canceled and incomplete_expired are finished", () => {
    for (const s of ["unpaid", "paused"]) expect(blockFor(s)).toMatchObject({ code: "billing_needs_attention", action: "manage_billing" })
    expect(blockFor("incomplete")).toMatchObject({ code: "payment_in_progress", action: "wait" })
    expect(blockFor("canceled")).toBeNull()
    expect(blockFor("incomplete_expired")).toBeNull()
  })
  it("no message offers plan switching in the portal", () => {
    for (const s of ["active", "past_due", "unpaid", "incomplete"]) expect(blockFor(s)?.message).not.toMatch(/switch (your )?plan|upgrade instantly/i)
  })
})

describe("existingBillingBlock reads Stripe, across every customer and every page", () => {
  const fake = (subs: Record<string, string>, byCustomer: Record<string, Sub[]> = {}, pageSize = 100) =>
    ({
      subscriptions: {
        retrieve: async (id: string) => ({ id, status: subs[id] ?? "canceled" }),
        list: async (p: { customer: string; starting_after?: string }) => {
          const all = byCustomer[p.customer] ?? []
          const from = p.starting_after ? all.findIndex((x) => x.id === p.starting_after) + 1 : 0
          return { data: all.slice(from, from + pageSize), has_more: from + pageSize < all.length }
        },
      },
    }) as never
  it("nothing stored: clear; a stored canceled subscription: clear", async () => {
    expect(await existingBillingBlock(fake({}), null)).toBeNull()
    expect(await existingBillingBlock(fake({ sub_1: "canceled" }), { stripe_subscription_id: "sub_1" })).toBeNull()
  })
  it("a live subscription on ANY of the account's customers blocks, even when the stored one is canceled", async () => {
    const b = await existingBillingBlock(fake({ sub_1: "canceled" }, { cus_b: [{ id: "sub_0", status: "past_due" }] }), { stripe_subscription_id: "sub_1", stripe_customer_id: "cus_a", extra_customer_ids: ["cus_b"] })
    expect(b?.code).toBe("payment_failing")
  })
  it("finds a live subscription on a later page", async () => {
    const many = Array.from({ length: 5 }, (_, i) => ({ id: `sub_${i}`, status: i === 4 ? "active" : "canceled" }))
    expect((await existingBillingBlock(fake({}, { cus_a: many }, 2), { stripe_customer_id: "cus_a" }))?.code).toBe("already_subscribed")
  })
  it("refuses to guess when the list never ends", async () => {
    const endless = { subscriptions: { retrieve: async () => ({ id: "s", status: "canceled" }), list: async () => ({ data: [{ id: "x", status: "canceled" }], has_more: true }) } } as never
    await expect(existingBillingBlock(endless, { stripe_customer_id: "cus_a" })).rejects.toThrow()
  })
  it("can ignore the subscription that just arrived", async () => {
    expect(await existingBillingBlock(fake({}, { cus_a: [{ id: "sub_2", status: "active" }] }), { stripe_customer_id: "cus_a" }, "sub_2")).toBeNull()
  })
})

describe("one account, one open checkout", () => {
  it("a new account gets ONE stable Stripe customer and one open checkout on it", async () => {
    const res = await POST(post("starter"))
    expect(res.status).toBe(200)
    expect(w.customersCreated).toEqual(["cus_1"])
    expect(w.customers.get("u1")).toBe("cus_1")
    expect(open()).toHaveLength(1)
    expect(open()[0].customer).toBe("cus_1")
    expect(open()[0].customer_email).toBeUndefined()
    expect(open()[0].expires_at - w.now).toBeGreaterThanOrEqual(30 * 60)
  })

  it("the same plan again reuses the open checkout, even after 11 minutes", async () => {
    const a = await (await POST(post("starter"))).json()
    w.now += 11 * 60
    const b = await (await POST(post("starter"))).json()
    expect(b.url).toBe(a.url)
    expect(w.sessions).toHaveLength(1)
  })

  it("a different plan later expires the first open checkout and offers the new one", async () => {
    await POST(post("starter"))
    const b = await (await POST(post("team"))).json()
    expect(open()).toHaveLength(1)
    expect(open()[0].metadata.plan).toBe("team")
    expect(b.url).toBe(open()[0].url)
  })

  it("an abandoned checkout expires on its own; coming back later starts a fresh one", async () => {
    await POST(post("starter"))
    w.now += 40 * 60
    expect(open()).toHaveLength(0)
    expect((await POST(post("starter"))).status).toBe(200)
    expect(open()).toHaveLength(1)
  })
})

describe("concurrency, in many different orders", () => {
  // A request that finished BEFORE a competing one was made may hold a link that expires a moment later. That is safe (an
  // expired link cannot be paid); the next click returns the open one.
  const burst = async (...plans: string[]) => {
    const res = await Promise.all(plans.map((p) => POST(post(p))))
    return Promise.all(res.map(async (r) => ({ status: r.status, body: (await r.json()) as { url?: string } })))
  }
  const payableLinks = (out: Array<{ status: number; body: { url?: string } }>) =>
    out.filter((o) => o.status === 200).map((o) => w.sessions.find((s) => s.url === o.body.url)!).filter((s) => s.status === "open")

  it("different plans at once leave exactly one open checkout", async () => {
    const out = await burst("starter", "team")
    expect(open()).toHaveLength(1)
    expect(payableLinks(out).every((s) => s.id === open()[0].id)).toBe(true)
  })

  it("equal creation timestamps: every request picks the same survivor (ties broken by id)", async () => {
    w.sameCreated = true
    const out = await burst("starter", "team", "pro", "starter")
    expect(open()).toHaveLength(1)
    expect(payableLinks(out).every((s) => s.id === open()[0].id)).toBe(true)
  })

  it("80 randomized interleavings of 2-4 requests across plans: never more than one open checkout, none completed", async () => {
    w.jitter = true
    const plans = ["starter", "team", "pro", "starter"]
    for (let i = 0; i < 80; i++) {
      w.sessions = []; w.customers = new Map(); w.customerKeys = new Map(); w.customersCreated = []; w.calls = {}
      w.rng = i + 7
      const n = 2 + (i % 3)
      const out = await burst(...plans.slice(0, n).map((_p, k) => plans[(k + i) % plans.length]))
      expect(open().length).toBeLessThanOrEqual(1)
      expect(completed()).toHaveLength(0)
      expect(payableLinks(out).every((s) => s.id === open()[0]?.id)).toBe(true)
      const again = await POST(post("team"))
      expect(again.status).toBe(200)
      expect(open()).toHaveLength(1)
    }
  }, 120000)

  it("a lost customer-creation race is recorded for review and nothing is deleted", async () => {
    w.raceWinner = "cus_winner"
    const res = await POST(post("starter"))
    expect(res.status).toBe(200)
    expect(w.customers.get("u1")).toBe("cus_winner")
    expect(open()[0].customer).toBe("cus_winner")
    expect(w.customersDeleted).toEqual([])
    expect(w.review).toHaveLength(1)
    expect(w.review[0]).toMatchObject({ kind: "unused_customer", stripe_customer_id: "cus_1", stored_customer_id: "cus_winner" })
  })
})

describe("a payment completes while checkout is being reconciled", () => {
  it("a competing session completes just as another request tries to expire it: the new session is expired and the customer is sent to manage billing", async () => {
    await POST(post("starter"))
    w.onExpire = (s) => {
      if (s.id === "cs_1") { s.status = "complete"; w.subsByCustomer["cus_1"] = [{ id: "sub_paid", status: "trialing" }] }
    }
    const res = await POST(post("team"))
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe("already_subscribed")
    expect(open()).toHaveLength(0)
    expect(completed()).toHaveLength(1)
  })

  it("a payment that completes between creation and the answer is caught by the check after creation", async () => {
    w.afterCreate = () => { w.subsByCustomer["cus_1"] = [{ id: "sub_paid", status: "active" }] }
    const res = await POST(post("starter"))
    expect(res.status).toBe(409)
    expect(open()).toHaveLength(0)
  })

  it("a subscription that is incomplete after checkout blocks another checkout until Stripe finishes it, then recovery works", async () => {
    w.stored = { stripe_subscription_id: "sub_1", stripe_customer_id: "cus_9" }
    w.subs = { sub_1: "incomplete" }
    w.subsByCustomer["cus_9"] = [{ id: "sub_1", status: "incomplete" }]
    const res = await POST(post("starter"))
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe("payment_in_progress")
    expect(w.sessions).toHaveLength(0)
    w.subs = { sub_1: "incomplete_expired" }
    w.subsByCustomer["cus_9"] = [{ id: "sub_1", status: "incomplete_expired" }]
    expect((await POST(post("starter"))).status).toBe(200)
  })
})

describe("failures: nothing is started on a guess, and no lock is left behind", () => {
  const stripeCalls = ["customers.list", "subscriptions.list", "sessions.list", "sessions.create", "sessions.expire"] as const
  for (const call of stripeCalls) {
    it(`${call} failing answers 503, leaves at most one open checkout, and the next request works`, async () => {
      await POST(post("starter"))
      w.fail = call
      const res = await POST(post("team"))
      expect(res.status).toBe(503)
      expect(JSON.stringify(await res.json())).not.toMatch(/stripe .* down|Error/)
      expect(open().length).toBeLessThanOrEqual(1)
      w.fail = null
      const next = await POST(post("team"))
      expect(next.status).toBe(200)
      expect(open()).toHaveLength(1)
    })
  }

  it("session creation succeeds but the check after it fails: 503, the unreachable session is expired, the next request works", async () => {
    w.fail = "sessions.list"
    w.failFrom = 1
    const res = await POST(post("starter"))
    expect(res.status).toBe(503)
    w.fail = null
    expect((await POST(post("starter"))).status).toBe(200)
    expect(open()).toHaveLength(1)
  })

  it("the response is lost after the session was made: the retry reuses the same open session", async () => {
    const first = await POST(post("starter"))
    expect(first.status).toBe(200) // pretend this response never reached the customer
    const again = await POST(post("starter"))
    expect((await again.json()).url).toBe(open()[0].url)
    expect(w.sessions).toHaveLength(1)
  })

  it("a customer-table write failure answers 503; the retry reuses the same Stripe customer (idempotent) and succeeds", async () => {
    w.insertFails = true
    expect((await POST(post("starter"))).status).toBe(503)
    w.insertFails = false
    expect((await POST(post("starter"))).status).toBe(200)
    expect(w.customersCreated).toHaveLength(1)
  })

  it("if our own subscription lookup fails, answers 503 and starts nothing", async () => {
    w.storedError = true
    expect((await POST(post("starter"))).status).toBe(503)
    expect(w.sessions).toHaveLength(0)
  })
})

describe("paging and partial results", () => {
  it("finds and expires open sessions beyond the first page", async () => {
    w.pageSize = 2
    for (let i = 0; i < 5; i++) {
      w.sessions.push({ id: `cs_old${i}`, url: `u${i}`, created: w.now - 100 + i, status: "open", expires_at: w.now + 1200, customer: "cus_1", metadata: { plan: "starter" } })
    }
    w.customers.set("u1", "cus_1")
    const res = await POST(post("team"))
    expect(res.status).toBe(200)
    expect(open()).toHaveLength(1)
    expect(open()[0].metadata.plan).toBe("team")
  })
})

describe("an account with more than one historical Stripe customer", () => {
  it("a live subscription on an older customer blocks checkout", async () => {
    w.emailCustomers = ["cus_old1", "cus_old2"]
    w.subsByCustomer["cus_old1"] = [{ id: "s1", status: "canceled" }]
    w.subsByCustomer["cus_old2"] = [{ id: "s2", status: "active" }]
    const res = await POST(post("pro"))
    expect(res.status).toBe(409)
    expect(w.sessions).toHaveLength(0)
  })
  it("only canceled history is fine, and the stable customer is used", async () => {
    w.emailCustomers = ["cus_old1"]
    w.subsByCustomer["cus_old1"] = [{ id: "s1", status: "canceled" }]
    expect((await POST(post("pro"))).status).toBe(200)
    expect(open()[0].customer).toBe(w.customers.get("u1"))
  })
  it("too many customers to list completely: 503, nothing started", async () => {
    w.emailHasMore = true
    expect((await POST(post("pro"))).status).toBe(503)
    expect(w.sessions).toHaveLength(0)
  })
  it("an existing subscriber keeps their own customer; resubscribing after cancelling works; a live one is refused", async () => {
    w.stored = { stripe_subscription_id: "sub_1", stripe_customer_id: "cus_9" }
    w.subs = { sub_1: "canceled" }
    expect((await POST(post("starter"))).status).toBe(200)
    expect(w.customersCreated).toHaveLength(0)
    expect(w.customers.get("u1")).toBe("cus_9")
    w.subs = { sub_1: "active" }
    w.sessions = []
    w.subsByCustomer["cus_9"] = [{ id: "sub_1", status: "active" }]
    expect((await POST(post("pro"))).status).toBe(409)
  })
})

describe("no silent downgrade", () => {
  it("when the required tables are missing, checkout for a signed-in user fails clearly and starts nothing", async () => {
    w.tableMissing = true
    const res = await POST(post("starter"))
    expect(res.status).toBe(503)
    expect((await res.json()).code).toBe("checkout-unavailable")
    expect(w.sessions).toHaveLength(0)
    expect(w.customersCreated).toHaveLength(0)
    expect(w.calls["sessions.create"]).toBeUndefined()
  })
  it("a guest (not signed in) is unaffected and still gets a checkout with their email", async () => {
    w.tableMissing = true
    const res = await POST(post("starter", false))
    expect(res.status).toBe(200)
    expect(w.customers.size).toBe(0)
  })
})
