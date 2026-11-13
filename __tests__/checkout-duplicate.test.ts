// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"
import { blockFor, checkoutIdempotencyKey, existingBillingBlock } from "../lib/billing-guard"

/**
 * One account must not end up with two independently billing subscriptions. Everything here is a stand-in:
 * no real Stripe, database, email or customer is involved, and nothing is charged or changed.
 */

const w = vi.hoisted(() => ({
  access: { plan: "free", status: "inactive", active: false, viaOwner: false, hasBilling: false } as Record<string, unknown>,
  stored: null as null | { stripe_subscription_id?: string | null; stripe_customer_id?: string | null },
  storedError: false,
  /** what Stripe says right now, by subscription id */
  subs: {} as Record<string, string>,
  /** subscriptions Stripe lists for a customer */
  customerSubs: [] as Array<{ id: string; status: string }>,
  stripeDown: false,
  sessions: new Map<string, { id: string; url: string }>(),
  created: [] as Array<{ key?: string; plan?: string }>,
}))

vi.mock("../lib/auth-utils", () => ({
  getAuthenticatedUser: async (req: Request) => (req.headers.get("authorization") ? { id: "u1", email: "roofer@example.com", user_metadata: {} } : null),
  getUserId: async () => "u1",
}))
vi.mock("../lib/plan", async (orig) => ({ ...(await orig<typeof import("../lib/plan")>()), getAccess: async () => w.access }))
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: w.stored, error: w.storedError ? { message: "db down" } : null }) }) }) }),
  }),
}))
vi.mock("stripe", () => ({
  default: class {
    subscriptions = {
      retrieve: async (id: string) => {
        if (w.stripeDown) throw new Error("stripe down")
        return { id, status: w.subs[id] ?? "canceled" }
      },
      list: async () => {
        if (w.stripeDown) throw new Error("stripe down")
        return { data: w.customerSubs }
      },
    }
    checkout = {
      sessions: {
        // Stripe's idempotency: the same key returns the same session instead of creating another
        create: async (params: { metadata?: { plan?: string } }, opts?: { idempotencyKey?: string }) => {
          const key = opts?.idempotencyKey
          if (key && w.sessions.has(key)) return w.sessions.get(key)
          const made = { id: `cs_${w.created.length + 1}`, url: `https://checkout.stripe.example/cs_${w.created.length + 1}` }
          w.created.push({ key, plan: params.metadata?.plan })
          if (key) w.sessions.set(key, made)
          return made
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

beforeEach(() => {
  w.access = { plan: "free", status: "inactive", active: false, viaOwner: false, hasBilling: false }
  w.stored = null
  w.storedError = false
  w.subs = {}
  w.customerSubs = []
  w.stripeDown = false
  w.sessions = new Map()
  w.created = []
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
  const fakeStripe = (subs: Record<string, string>, list: Array<{ id: string; status: string }> = [], down = false) =>
    ({
      subscriptions: {
        retrieve: async (id: string) => { if (down) throw new Error("down"); return { id, status: subs[id] ?? "canceled" } },
        list: async () => { if (down) throw new Error("down"); return { data: list } },
      },
    }) as never

  it("nothing stored: clear", async () => {
    expect(await existingBillingBlock(fakeStripe({}), null)).toBeNull()
    expect(await existingBillingBlock(fakeStripe({}), {})).toBeNull()
  })
  it("a stored canceled subscription is clear (resubscribe works)", async () => {
    expect(await existingBillingBlock(fakeStripe({ sub_1: "canceled" }), { stripe_subscription_id: "sub_1" })).toBeNull()
  })
  it("a stray older live subscription on the same customer blocks, even if the stored one is canceled", async () => {
    const b = await existingBillingBlock(fakeStripe({ sub_1: "canceled" }, [{ id: "sub_0", status: "active" }]), { stripe_subscription_id: "sub_1", stripe_customer_id: "cus_1" })
    expect(b?.code).toBe("already_subscribed")
  })
  it("the most serious state wins", async () => {
    const b = await existingBillingBlock(fakeStripe({ sub_1: "incomplete" }, [{ id: "sub_2", status: "past_due" }]), { stripe_subscription_id: "sub_1", stripe_customer_id: "cus_1" })
    expect(b?.code).toBe("payment_failing")
  })
  it("throws when Stripe cannot be asked, so no purchase starts on a guess", async () => {
    await expect(existingBillingBlock(fakeStripe({}, [], true), { stripe_subscription_id: "sub_1" })).rejects.toThrow()
  })
})

describe("/api/create-checkout-session", () => {
  it("a new account with no billing starts one checkout", async () => {
    const res = await POST(post("starter"))
    expect(res.status).toBe(200)
    expect((await res.json()).url).toMatch(/^https:\/\/checkout\.stripe\.example\//)
    expect(w.created).toHaveLength(1)
  })

  for (const [status, code] of [["active", "already_subscribed"], ["trialing", "already_subscribed"], ["past_due", "payment_failing"], ["unpaid", "billing_needs_attention"], ["incomplete", "payment_in_progress"]] as const) {
    it(`a stored subscription that Stripe reports as ${status} gets ${code}, and no second checkout is created`, async () => {
      w.stored = { stripe_subscription_id: "sub_1", stripe_customer_id: "cus_1" }
      w.subs = { sub_1: status }
      const res = await POST(post("pro"))
      expect(res.status).toBe(409)
      expect((await res.json()).code).toBe(code)
      expect(w.created).toHaveLength(0)
    })
  }

  it("our table can lag: the database row says nothing is active but Stripe says active, so no second checkout", async () => {
    w.stored = { stripe_subscription_id: "sub_1", stripe_customer_id: "cus_1" }
    w.subs = { sub_1: "active" }
    w.access = { plan: "free", status: "inactive", active: false, viaOwner: false, hasBilling: true }
    expect((await POST(post("team"))).status).toBe(409)
    expect(w.created).toHaveLength(0)
  })

  it("a canceled subscription can be bought again (recovery after cancelling)", async () => {
    w.stored = { stripe_subscription_id: "sub_1", stripe_customer_id: "cus_1" }
    w.subs = { sub_1: "canceled" }
    const res = await POST(post("starter"))
    expect(res.status).toBe(200)
    expect(w.created).toHaveLength(1)
  })

  it("an abandoned or expired earlier checkout leaves no subscription, so checkout can be retried", async () => {
    w.stored = null
    expect((await POST(post("starter"))).status).toBe(200)
  })

  it("if Stripe cannot be asked, answers 503 and starts nothing", async () => {
    w.stored = { stripe_subscription_id: "sub_1", stripe_customer_id: "cus_1" }
    w.stripeDown = true
    const res = await POST(post("starter"))
    expect(res.status).toBe(503)
    expect(w.created).toHaveLength(0)
    expect(JSON.stringify(await res.json())).not.toMatch(/stripe down|Error/)
  })

  it("if our own subscription lookup fails, answers 503 and starts nothing", async () => {
    w.storedError = true
    expect((await POST(post("starter"))).status).toBe(503)
    expect(w.created).toHaveLength(0)
  })

  it("a double click: two requests at once for the same account and plan share ONE Checkout Session", async () => {
    const [a, b] = await Promise.all([POST(post("starter")), POST(post("starter"))])
    const [ja, jb] = [await a.json(), await b.json()]
    expect(ja.url).toBe(jb.url)
    expect(w.created).toHaveLength(1)
    expect(w.created[0].key).toContain("checkout:u1:starter")
  })

  it("a different plan from the same account gets its own session key (a legitimate choice, not a repeat)", async () => {
    await POST(post("starter"))
    await POST(post("team"))
    expect(w.created.map((c) => c.plan)).toEqual(["starter", "team"])
    expect(new Set(w.created.map((c) => c.key)).size).toBe(2)
  })

  it("a guest (not signed in) still gets a checkout", async () => {
    const res = await POST(post("starter", false))
    expect(res.status).toBe(200)
    expect(w.created[0].key).toBeUndefined()
  })
})

describe("checkoutIdempotencyKey", () => {
  it("is stable within ten minutes and changes after, per account, plan and origin", () => {
    const t = 1_800_000_000_000
    expect(checkoutIdempotencyKey("u1", "starter", "https://a.example", t)).toBe(checkoutIdempotencyKey("u1", "starter", "https://a.example", t + 60_000))
    expect(checkoutIdempotencyKey("u1", "starter", "https://a.example", t)).not.toBe(checkoutIdempotencyKey("u1", "starter", "https://a.example", t + 11 * 60_000))
    expect(checkoutIdempotencyKey("u1", "starter", "https://a.example", t)).not.toBe(checkoutIdempotencyKey("u2", "starter", "https://a.example", t))
    expect(checkoutIdempotencyKey("u1", "starter", "https://a.example", t)).not.toBe(checkoutIdempotencyKey("u1", "pro", "https://a.example", t))
    expect(checkoutIdempotencyKey("u1", "starter", "https://a.example", t).length).toBeLessThanOrEqual(255)
  })
})
