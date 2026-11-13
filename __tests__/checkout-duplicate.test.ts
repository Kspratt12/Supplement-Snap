// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"
import { blockFor, existingBillingBlock } from "../lib/billing-guard"

/**
 * One account must not end up with two independently billing subscriptions, including two checkouts for DIFFERENT plans
 * at the same moment. Everything is a stand-in with real behavior (open/expired sessions, one customer per account,
 * a unique key on the customer table): no real Stripe, database, email or customer; nothing is charged or changed.
 */

type Sess = { id: string; url: string; created: number; status: "open" | "complete" | "expired"; expires_at: number; customer?: string; metadata: { plan?: string }; customer_email?: string }

const w = vi.hoisted(() => ({
  access: { plan: "free", status: "inactive", active: false, viaOwner: false, hasBilling: false } as Record<string, unknown>,
  stored: null as null | { stripe_subscription_id?: string | null; stripe_customer_id?: string | null },
  storedError: false,
  tableMissing: false,
  /** billing_customers rows by user id */
  customers: new Map<string, string>(),
  /** what Stripe says about subscriptions, by id, and which belong to the customer */
  subs: {} as Record<string, string>,
  customerSubs: [] as Array<{ id: string; status: string }>,
  stripeDown: false,
  sessions: [] as Sess[],
  now: 1_800_000_000,
  tick: 0,
  customersCreated: [] as string[],
  customersDeleted: [] as string[],
  expired: [] as string[],
  /** when set, the next billing_customers insert loses a race to this customer id */
  raceWinner: null as null | string,
  customerKeys: new Map<string, string>(),
}))

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
            if (table === "subscriptions") return { data: w.stored, error: w.storedError ? { message: "db down" } : null }
            if (w.tableMissing) return { data: null, error: { code: "42P01" } }
            const id = w.customers.get(v)
            return { data: id ? { stripe_customer_id: id } : null, error: null }
          },
        }),
      }),
      insert: async (row: { user_id: string; stripe_customer_id: string }) => {
        if (w.tableMissing) return { error: { code: "42P01" } }
        if (w.raceWinner) { w.customers.set(row.user_id, w.raceWinner); w.raceWinner = null }
        if (w.customers.has(row.user_id)) return { error: { code: "23505" } }
        w.customers.set(row.user_id, row.stripe_customer_id)
        return { error: null }
      },
    }),
  }),
}))
vi.mock("stripe", () => ({
  default: class {
    customers = {
      create: async (_p: unknown, opts?: { idempotencyKey?: string }) => {
        const key = opts?.idempotencyKey
        if (key && w.customerKeys.has(key)) return { id: w.customerKeys.get(key) }
        const id = `cus_${w.customersCreated.length + 1}`
        w.customersCreated.push(id)
        if (key) w.customerKeys.set(key, id)
        return { id }
      },
      del: async (id: string) => { w.customersDeleted.push(id); return { id, deleted: true } },
    }
    subscriptions = {
      retrieve: async (id: string) => { if (w.stripeDown) throw new Error("stripe down"); return { id, status: w.subs[id] ?? "canceled" } },
      list: async () => { if (w.stripeDown) throw new Error("stripe down"); return { data: w.customerSubs } },
    }
    checkout = {
      sessions: {
        create: async (p: { customer?: string; customer_email?: string; metadata: { plan: string }; expires_at: number }) => {
          const n = w.sessions.length + 1
          const s: Sess = { id: `cs_${n}`, url: `https://checkout.stripe.example/cs_${n}`, created: w.now + ++w.tick, status: "open", expires_at: p.expires_at, customer: p.customer, customer_email: p.customer_email, metadata: { plan: p.metadata.plan } }
          w.sessions.push(s)
          return s
        },
        list: async (p: { customer: string; status: string }) => ({
          data: w.sessions.filter((s) => s.customer === p.customer && s.status === p.status && s.expires_at > w.now),
        }),
        expire: async (id: string) => {
          const s = w.sessions.find((x) => x.id === id)
          if (!s || s.status !== "open") throw Object.assign(new Error("not open"), { statusCode: 400 })
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

beforeEach(() => {
  w.access = { plan: "free", status: "inactive", active: false, viaOwner: false, hasBilling: false }
  w.stored = null
  w.storedError = false
  w.tableMissing = false
  w.customers = new Map()
  w.subs = {}
  w.customerSubs = []
  w.stripeDown = false
  w.sessions = []
  w.now = 1_800_000_000
  w.tick = 0
  w.customersCreated = []
  w.customersDeleted = []
  w.expired = []
  w.raceWinner = null
  w.customerKeys = new Map()
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
    expect(blockFor("past_due")?.message).toContain("update your card")
  })
  it("unpaid and paused: the old subscription still exists and needs attention", () => {
    for (const s of ["unpaid", "paused"]) expect(blockFor(s)).toMatchObject({ code: "billing_needs_attention", action: "manage_billing" })
  })
  it("incomplete: a payment is still processing, wait", () => {
    expect(blockFor("incomplete")).toMatchObject({ code: "payment_in_progress", action: "wait" })
  })
  it("canceled and incomplete_expired are finished: a new checkout is allowed", () => {
    expect(blockFor("canceled")).toBeNull()
    expect(blockFor("incomplete_expired")).toBeNull()
  })
  it("no message offers plan switching in the portal", () => {
    for (const s of ["active", "past_due", "unpaid", "incomplete"]) expect(blockFor(s)?.message).not.toMatch(/switch (your )?plan|upgrade instantly/i)
  })
})

describe("existingBillingBlock asks Stripe, not just our table", () => {
  const fake = (subs: Record<string, string>, list: Array<{ id: string; status: string }> = [], down = false) =>
    ({
      subscriptions: {
        retrieve: async (id: string) => { if (down) throw new Error("down"); return { id, status: subs[id] ?? "canceled" } },
        list: async () => { if (down) throw new Error("down"); return { data: list } },
      },
    }) as never
  it("nothing stored: clear", async () => {
    expect(await existingBillingBlock(fake({}), null)).toBeNull()
  })
  it("a stored canceled subscription is clear", async () => {
    expect(await existingBillingBlock(fake({ sub_1: "canceled" }), { stripe_subscription_id: "sub_1" })).toBeNull()
  })
  it("a stray live subscription on the same customer blocks even if the stored one is canceled", async () => {
    expect((await existingBillingBlock(fake({ sub_1: "canceled" }, [{ id: "sub_0", status: "active" }]), { stripe_subscription_id: "sub_1", stripe_customer_id: "c" }))?.code).toBe("already_subscribed")
  })
  it("can ignore the subscription that just arrived", async () => {
    expect(await existingBillingBlock(fake({ sub_1: "canceled" }, [{ id: "sub_2", status: "active" }]), { stripe_subscription_id: "sub_1", stripe_customer_id: "c" }, "sub_2")).toBeNull()
  })
  it("throws when Stripe cannot be asked", async () => {
    await expect(existingBillingBlock(fake({}, [], true), { stripe_subscription_id: "sub_1" })).rejects.toThrow()
  })
})

describe("/api/create-checkout-session: one account, one subscription", () => {
  it("a new account gets ONE stable Stripe customer and one open checkout on it", async () => {
    const res = await POST(post("starter"))
    expect(res.status).toBe(200)
    expect(w.customersCreated).toEqual(["cus_1"])
    expect(w.customers.get("u1")).toBe("cus_1")
    expect(open()).toHaveLength(1)
    expect(open()[0].customer).toBe("cus_1")
    expect(open()[0].customer_email).toBeUndefined() // a customer and an email are not both sent
  })

  it("the session expires on its own in about half an hour, so nothing stays open forever", async () => {
    await POST(post("starter"))
    expect(open()[0].expires_at - w.now).toBeGreaterThanOrEqual(30 * 60)
    expect(open()[0].expires_at - w.now).toBeLessThanOrEqual(60 * 60)
  })

  it("the same plan again reuses the open checkout instead of creating another (double click, refresh, reopened tab)", async () => {
    const a = await (await POST(post("starter"))).json()
    const b = await (await POST(post("starter"))).json()
    expect(b.url).toBe(a.url)
    expect(w.sessions).toHaveLength(1)
  })

  it("the same plan after 11 minutes still reuses it: there is no time window to cross", async () => {
    const a = await (await POST(post("starter"))).json()
    w.now += 11 * 60
    const b = await (await POST(post("starter"))).json()
    expect(b.url).toBe(a.url)
    expect(w.sessions).toHaveLength(1)
  })

  it("a different plan later expires the first open checkout and offers the new one (a legitimate change of mind)", async () => {
    await POST(post("starter"))
    const b = await (await POST(post("team"))).json()
    expect(open()).toHaveLength(1)
    expect(open()[0].metadata.plan).toBe("team")
    expect(b.url).toBe(open()[0].url)
    expect(w.expired).toEqual(["cs_1"])
  })

  // A request that finished BEFORE a competing one was made may hold a link that is expired a moment later. That is the safe
  // outcome (an expired link cannot be paid); the next click returns the one open checkout.
  const settled = async (...plans: string[]) => {
    const res = await Promise.all(plans.map((p) => POST(post(p))))
    const urls = await Promise.all(res.map((r) => r.json().then((j) => j.url as string)))
    return { res, urls }
  }
  const everyUrlIsOpenOrExpired = (urls: string[]) => {
    for (const u of urls) {
      const s = w.sessions.find((x) => x.url === u)!
      expect(s).toBeDefined()
      expect(s.status === "open" || s.status === "expired").toBe(true)
    }
  }

  it("two requests at once for DIFFERENT plans leave exactly one open checkout (never two payable ones)", async () => {
    const { res, urls } = await settled("starter", "team")
    expect(res.every((r) => r.status === 200)).toBe(true)
    expect(open()).toHaveLength(1)
    everyUrlIsOpenOrExpired(urls)
    expect(w.customersCreated).toHaveLength(1)
    // whoever holds an expired link just clicks again and is given the open one
    const again = await (await POST(post("team"))).json()
    expect(w.sessions.find((x) => x.url === again.url)!.status).toBe("open")
    expect(open()).toHaveLength(1)
  })

  it("two requests at once for the SAME plan leave exactly one open checkout", async () => {
    const { urls } = await settled("starter", "starter")
    expect(open()).toHaveLength(1)
    everyUrlIsOpenOrExpired(urls)
    expect(open()[0].metadata.plan).toBe("starter")
  })

  it("three requests at once across plans still leave exactly one open checkout", async () => {
    const { urls } = await settled("starter", "team", "pro")
    expect(open()).toHaveLength(1)
    everyUrlIsOpenOrExpired(urls)
  })

  it("repeated bursts never leave more than one open checkout", async () => {
    for (let i = 0; i < 5; i++) {
      await settled("starter", "team", "pro", "starter")
      expect(open()).toHaveLength(1)
    }
  })

  it("an abandoned checkout expires; coming back later simply starts a fresh one", async () => {
    await POST(post("starter"))
    w.now += 40 * 60
    expect(open()).toHaveLength(0)
    const b = await POST(post("starter"))
    expect(b.status).toBe(200)
    expect(open()).toHaveLength(1)
  })

  it("a checkout that was completed but whose webhook has not arrived yet blocks another one, because Stripe already lists the subscription", async () => {
    await POST(post("starter"))
    w.sessions[0].status = "complete"
    w.customerSubs = [{ id: "sub_new", status: "trialing" }] // Stripe has it; our table does not yet
    const res = await POST(post("pro"))
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe("already_subscribed")
    expect(w.sessions).toHaveLength(1)
  })

  for (const [status, code] of [["active", "already_subscribed"], ["trialing", "already_subscribed"], ["past_due", "payment_failing"], ["unpaid", "billing_needs_attention"], ["incomplete", "payment_in_progress"]] as const) {
    it(`an account whose subscription Stripe reports as ${status} gets ${code} and no new checkout`, async () => {
      w.stored = { stripe_subscription_id: "sub_1", stripe_customer_id: "cus_9" }
      w.subs = { sub_1: status }
      const res = await POST(post("pro"))
      expect(res.status).toBe(409)
      expect((await res.json()).code).toBe(code)
      expect(w.sessions).toHaveLength(0)
    })
  }

  it("a failed first payment (incomplete) blocks only until Stripe marks it incomplete_expired; then the account can subscribe again", async () => {
    w.stored = { stripe_subscription_id: "sub_1", stripe_customer_id: "cus_9" }
    w.subs = { sub_1: "incomplete" }
    expect((await POST(post("starter"))).status).toBe(409)
    w.subs = { sub_1: "incomplete_expired" }
    expect((await POST(post("starter"))).status).toBe(200)
  })

  it("a canceled subscription can be bought again, on the same stable customer", async () => {
    w.stored = { stripe_subscription_id: "sub_1", stripe_customer_id: "cus_9" }
    w.subs = { sub_1: "canceled" }
    expect((await POST(post("starter"))).status).toBe(200)
    expect(w.customersCreated).toHaveLength(0) // the customer they already have is adopted, not duplicated
    expect(w.customers.get("u1")).toBe("cus_9")
    expect(open()[0].customer).toBe("cus_9")
  })

  it("an existing subscriber keeps their own Stripe customer", async () => {
    w.stored = { stripe_subscription_id: "sub_1", stripe_customer_id: "cus_9" }
    w.subs = { sub_1: "active" }
    await POST(post("starter"))
    expect(w.customers.get("u1")).toBe("cus_9")
  })

  it("if two first requests race to store a customer, the loser uses the winner's and discards its own empty customer", async () => {
    w.raceWinner = "cus_winner"
    const res = await POST(post("starter"))
    expect(res.status).toBe(200)
    expect(w.customers.get("u1")).toBe("cus_winner")
    expect(open()[0].customer).toBe("cus_winner")
    expect(w.customersDeleted).toEqual(["cus_1"])
  })

  it("if the customer table does not exist yet, checkout still works the earlier way (Stripe-state check, no stable customer)", async () => {
    w.tableMissing = true
    const res = await POST(post("starter"))
    expect(res.status).toBe(200)
    expect(w.customersCreated).toHaveLength(0)
    expect(open()[0].customer_email).toBe("roofer@example.com")
    w.stored = { stripe_subscription_id: "sub_1", stripe_customer_id: "cus_9" }
    w.subs = { sub_1: "active" }
    expect((await POST(post("pro"))).status).toBe(409)
  })

  it("if Stripe cannot be asked, answers 503 and starts nothing; the next request works (no lock is left behind)", async () => {
    w.stripeDown = true
    w.stored = { stripe_subscription_id: "sub_1", stripe_customer_id: "cus_9" }
    const res = await POST(post("starter"))
    expect(res.status).toBe(503)
    expect(w.sessions).toHaveLength(0)
    expect(JSON.stringify(await res.json())).not.toMatch(/stripe down|Error/)
    w.stripeDown = false
    w.subs = { sub_1: "canceled" }
    expect((await POST(post("starter"))).status).toBe(200)
  })

  it("if our own subscription lookup fails, answers 503 and starts nothing", async () => {
    w.storedError = true
    expect((await POST(post("starter"))).status).toBe(503)
    expect(w.sessions).toHaveLength(0)
  })

  it("a guest (not signed in) still gets a checkout with their email and no stored customer", async () => {
    const res = await POST(post("starter", false))
    expect(res.status).toBe(200)
    expect(w.customers.size).toBe(0)
    expect(w.sessions[0].customer).toBeUndefined()
  })
})
