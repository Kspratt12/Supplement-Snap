// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

const calls = vi.hoisted(() => ({
  writes: [] as Array<{ table: string; op: string; row: Record<string, unknown>; where?: [string, unknown]; opts?: unknown }>,
  users: [] as Array<{ id: string; email: string }>,
  emails: [] as Array<{ to: string[]; subject: string; replyTo?: string }>,
  badSignature: false,
  /** subscription ids already recorded (what the stand-in database "has") */
  known: new Set<string>(),
  /** what Stripe would report right now for each subscription id */
  subs: {} as Record<string, unknown>,
}))

vi.mock("stripe", () => ({
  default: class {
    webhooks = {
      constructEvent: (body: string) => {
        if (calls.badSignature) throw new Error("bad signature")
        return JSON.parse(body)
      },
    }
    subscriptions = {
      retrieve: async (id: string) => {
        if (!(id in calls.subs)) throw new Error("No such subscription")
        return calls.subs[id]
      },
    }
  },
}))

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: async (m: { to: string[]; subject: string; replyTo?: string }) => {
        calls.emails.push({ to: m.to, subject: m.subject, replyTo: m.replyTo })
        return { data: { id: "e1" }, error: null }
      },
    }
  },
}))

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      admin: {
        listUsers: async () => ({ data: { users: calls.users } }),
        getUserById: async (id: string) => ({ data: { user: { id, user_metadata: { full_name: "Crystal Reyes" } } } }),
      },
    },
    from: (table: string) => ({
      select: () => ({
        eq: (_k: string, v: unknown) => ({ maybeSingle: async () => ({ data: calls.known.has(String(v)) ? { id: "row" } : null }) }),
      }),
      upsert: async (row: Record<string, unknown>, opts: unknown) => (calls.writes.push({ table, op: "upsert", row, opts }), calls.known.add(String(row.stripe_subscription_id)), { error: null }),
      insert: async (row: Record<string, unknown>) => (calls.writes.push({ table, op: "insert", row }), calls.known.add(String(row.stripe_subscription_id)), { error: null }),
      update: (row: Record<string, unknown>) => ({
        eq: async (k: string, v: unknown) => (calls.writes.push({ table, op: "update", row, where: [k, v] }), { error: null }),
      }),
    }),
  }),
}))

import { POST } from "../app/api/stripe/webhook/route"

const send = (event: unknown, signature: string | null = "sig") =>
  POST(new Request("http://localhost/api/stripe/webhook", { method: "POST", body: JSON.stringify(event), headers: signature ? { "stripe-signature": signature } : {} }))

const checkout = (over: Record<string, unknown> = {}) => ({
  type: "checkout.session.completed",
  data: { object: { customer: "cus_1", subscription: "sub_1", customer_details: { email: "crystal@example.com" }, metadata: { plan: "starter", supabase_user_id: "u1" }, ...over } },
})

beforeEach(() => {
  calls.writes = []
  calls.users = []
  calls.emails = []
  calls.badSignature = false
  calls.known = new Set()
  calls.subs = {}
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x")
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_x")
  vi.stubEnv("RESEND_API_KEY", "re_x")
  vi.stubEnv("STRIPE_PRICE_MONTHLY", "price_starter")
  vi.stubEnv("STRIPE_PRICE_TEAM_MONTHLY", "price_team")
  vi.stubEnv("STRIPE_PRICE_PRO_MONTHLY", "price_pro")
  vi.stubEnv("STRIPE_PRICE_ENTERPRISE_MONTHLY", "price_enterprise")
})

describe("Stripe webhook: signing", () => {
  it("rejects a request with no signature and one with a bad signature", async () => {
    expect((await send(checkout(), null)).status).toBe(400)
    calls.badSignature = true
    expect((await send(checkout())).status).toBe(400)
    expect(calls.writes).toHaveLength(0)
  })
})

describe("Stripe webhook: a new purchase", () => {
  it("activates the plan for the user named in the checkout and emails them", async () => {
    const res = await send(checkout({ metadata: { plan: "team", supabase_user_id: "u1" } }))
    expect(res.status).toBe(200)
    const w = calls.writes[0]
    expect(w).toMatchObject({ table: "subscriptions", op: "upsert", opts: { onConflict: "user_id" } })
    expect(w.row).toMatchObject({ user_id: "u1", status: "active", plan: "team", stripe_customer_id: "cus_1", stripe_subscription_id: "sub_1" })
    expect(calls.emails.map((e) => e.subject)).toEqual(["Your Supplement Snap subscription is active"])
    expect(calls.emails[0].replyTo).toBe("support@supplementsnap.io")
  })
  it("finds the user by email when the checkout carries no user id", async () => {
    calls.users = [{ id: "u9", email: "Crystal@Example.com" }]
    await send(checkout({ metadata: { plan: "starter" } }))
    expect(calls.writes[0].row).toMatchObject({ user_id: "u9", status: "active", plan: "starter" })
  })
  it("still records the purchase, with no user yet, when nobody matches", async () => {
    await send(checkout({ metadata: { plan: "starter" } }))
    expect(calls.writes[0]).toMatchObject({ op: "insert" })
    expect(calls.writes[0].row).toMatchObject({ stripe_customer_email: "crystal@example.com", status: "active" })
    expect(calls.writes[0].row.user_id).toBeUndefined()
    // and they are told to create a login, not that their account is already active
    expect(calls.emails).toEqual([{ to: ["crystal@example.com"], subject: "Payment received: create your Supplement Snap login", replyTo: "support@supplementsnap.io" }])
  })
  it("ignores a repeated delivery of the same checkout: no second record and no second email", async () => {
    await send(checkout({ metadata: { plan: "team", supabase_user_id: "u1" } }))
    expect(calls.writes).toHaveLength(1)
    expect(calls.emails).toHaveLength(1)
    const again = await send(checkout({ metadata: { plan: "team", supabase_user_id: "u1" } }))
    expect(again.status).toBe(200)
    expect(calls.writes).toHaveLength(1)
    expect(calls.emails).toHaveLength(1)
  })
  it("does not create a second unattached record when an unattached payment is delivered twice", async () => {
    await send(checkout({ metadata: { plan: "starter" } }))
    await send(checkout({ metadata: { plan: "starter" } }))
    expect(calls.writes.filter((w) => w.op === "insert")).toHaveLength(1)
    expect(calls.emails).toHaveLength(1)
  })
  it("treats a plan name it does not recognize as starter, never as a higher plan", async () => {
    await send(checkout({ metadata: { plan: "platinum", supabase_user_id: "u1" } }))
    expect(calls.writes[0].row.plan).toBe("starter")
  })
  it("records an enterprise purchase as enterprise", async () => {
    await send(checkout({ metadata: { plan: "enterprise", supabase_user_id: "u1" } }))
    expect(calls.writes[0].row.plan).toBe("enterprise")
  })
  it("defaults to the starter plan when the checkout has no plan", async () => {
    await send(checkout({ metadata: { supabase_user_id: "u1" } }))
    expect(calls.writes[0].row.plan).toBe("starter")
  })
})

// Stripe's own current record of a subscription (what the webhook looks up before changing anything)
const stripeSub = (status: string, priceId?: string, planMeta?: string, id = "sub_1") => ({
  id, customer: "cus_1", status, items: { data: [{ price: { id: priceId } }] }, metadata: planMeta ? { plan: planMeta } : {},
})
const sub = (status: string, priceId?: string, planMeta?: string) => {
  calls.subs["sub_1"] = stripeSub(status, priceId, planMeta)
  return { type: "customer.subscription.updated", data: { object: { id: "sub_1", customer: "cus_1", status, items: { data: [{ price: { id: priceId } }] }, metadata: {} } } }
}
const invoice = (type: "invoice.paid" | "invoice.payment_failed", subscription: string | null = "sub_1") => ({
  type,
  data: { object: { customer: "cus_1", parent: subscription ? { subscription_details: { subscription } } : null } },
})

describe("Stripe webhook: renewals, changes and cancellations (matched on the Stripe customer id)", () => {
  it("marks the plan active when a subscription invoice is paid", async () => {
    calls.subs["sub_1"] = stripeSub("active", "price_team")
    await send(invoice("invoice.paid"))
    expect(calls.writes[0]).toMatchObject({ table: "subscriptions", op: "update", where: ["stripe_customer_id", "cus_1"] })
    expect(calls.writes[0].row).toMatchObject({ status: "active", plan: "team" })
  })
  it("marks the plan past due when a renewal payment fails and Stripe is still retrying", async () => {
    calls.subs["sub_1"] = stripeSub("past_due", "price_team")
    await send(invoice("invoice.payment_failed"))
    expect(calls.writes[0].row.status).toBe("past_due")
  })
  it("does not give access to a first payment that failed (the subscription never became active)", async () => {
    calls.subs["sub_1"] = stripeSub("incomplete", "price_starter")
    await send(invoice("invoice.payment_failed"))
    expect(calls.writes[0].row.status).toBe("inactive")
  })
  it("a late 'paid' event cannot switch access back on after the subscription was cancelled", async () => {
    calls.subs["sub_1"] = stripeSub("canceled", "price_team")
    await send(invoice("invoice.paid"))
    expect(calls.writes[0].row.status).toBe("canceled")
  })
  it("a late 'updated' event carrying old information cannot overwrite what Stripe says now", async () => {
    calls.subs["sub_1"] = stripeSub("canceled", "price_team")
    const stale = { type: "customer.subscription.updated", data: { object: { id: "sub_1", customer: "cus_1", status: "active", items: { data: [{ price: { id: "price_team" } }] }, metadata: {} } } }
    await send(stale)
    expect(calls.writes[0].row.status).toBe("canceled")
  })
  it("an invoice that is not for a subscription changes nobody's access", async () => {
    const res = await send(invoice("invoice.paid", null))
    expect(res.status).toBe(200)
    expect(calls.writes).toHaveLength(0)
  })
  it("answers with an error, and writes nothing, when Stripe cannot be asked, so Stripe will retry", async () => {
    const res = await send(invoice("invoice.paid", "sub_missing"))
    expect(res.status).toBe(500)
    expect(calls.writes).toHaveLength(0)
  })
  it("marks the plan cancelled when the subscription is deleted", async () => {
    await send({ type: "customer.subscription.deleted", data: { object: { customer: "cus_1" } } })
    expect(calls.writes[0].row.status).toBe("canceled")
  })
  it("keeps access to the end of the paid period when a customer cancels (Stripe still says active)", async () => {
    calls.subs["sub_1"] = { ...stripeSub("active", "price_team"), cancel_at_period_end: true }
    await send({ type: "customer.subscription.updated", data: { object: { id: "sub_1", customer: "cus_1" } } })
    expect(calls.writes[0].row.status).toBe("active")
  })
  it("moves the plan when the customer changes price in the billing portal", async () => {
    await send(sub("active", "price_pro"))
    expect(calls.writes[0].row).toMatchObject({ status: "active", plan: "pro" })
    calls.writes = []
    await send(sub("active", "price_team"))
    expect(calls.writes[0].row.plan).toBe("team")
    calls.writes = []
    await send(sub("active", "price_enterprise"))
    expect(calls.writes[0].row.plan).toBe("enterprise")
  })
  it("keeps the current plan when the price is unknown", async () => {
    await send(sub("active", "price_unknown"))
    expect(calls.writes[0].row.plan).toBeUndefined()
  })
  it("maps Stripe statuses to ours: trialing stays usable, unpaid does not", async () => {
    await send(sub("trialing", "price_starter"))
    expect(calls.writes[0].row.status).toBe("trialing")
    calls.writes = []
    await send(sub("unpaid", "price_starter"))
    expect(calls.writes[0].row.status).toBe("inactive")
  })
  it("ignores events for customers it does not know without crashing", async () => {
    const res = await send({ type: "customer.created", data: { object: {} } })
    expect(res.status).toBe(200)
    expect(calls.writes).toHaveLength(0)
  })
})
