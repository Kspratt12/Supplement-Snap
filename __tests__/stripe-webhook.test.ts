// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

const calls = vi.hoisted(() => ({
  writes: [] as Array<{ table: string; op: string; row: Record<string, unknown>; where?: [string, unknown]; opts?: unknown }>,
  users: [] as Array<{ id: string; email: string }>,
  emails: [] as Array<{ to: string[]; subject: string; replyTo?: string }>,
  badSignature: false,
}))

vi.mock("stripe", () => ({
  default: class {
    webhooks = {
      constructEvent: (body: string) => {
        if (calls.badSignature) throw new Error("bad signature")
        return JSON.parse(body)
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
      upsert: async (row: Record<string, unknown>, opts: unknown) => (calls.writes.push({ table, op: "upsert", row, opts }), { error: null }),
      insert: async (row: Record<string, unknown>) => (calls.writes.push({ table, op: "insert", row }), { error: null }),
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
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x")
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_x")
  vi.stubEnv("RESEND_API_KEY", "re_x")
  vi.stubEnv("STRIPE_PRICE_MONTHLY", "price_starter")
  vi.stubEnv("STRIPE_PRICE_TEAM_MONTHLY", "price_team")
  vi.stubEnv("STRIPE_PRICE_PRO_MONTHLY", "price_pro")
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
  it("defaults to the starter plan when the checkout has no plan", async () => {
    await send(checkout({ metadata: { supabase_user_id: "u1" } }))
    expect(calls.writes[0].row.plan).toBe("starter")
  })
})

const sub = (status: string, priceId?: string, planMeta?: string) => ({
  type: "customer.subscription.updated",
  data: { object: { customer: "cus_1", status, items: { data: [{ price: { id: priceId } }] }, metadata: planMeta ? { plan: planMeta } : {} } },
})

describe("Stripe webhook: renewals, changes and cancellations (matched on the Stripe customer id)", () => {
  it("marks the plan active when an invoice is paid", async () => {
    await send({ type: "invoice.paid", data: { object: { customer: "cus_1" } } })
    expect(calls.writes[0]).toMatchObject({ table: "subscriptions", op: "update", where: ["stripe_customer_id", "cus_1"] })
    expect(calls.writes[0].row.status).toBe("active")
  })
  it("marks the plan past due when a payment fails", async () => {
    await send({ type: "invoice.payment_failed", data: { object: { customer: "cus_1" } } })
    expect(calls.writes[0].row.status).toBe("past_due")
  })
  it("marks the plan cancelled when the subscription is deleted", async () => {
    await send({ type: "customer.subscription.deleted", data: { object: { customer: "cus_1" } } })
    expect(calls.writes[0].row.status).toBe("canceled")
  })
  it("moves the plan when the customer changes price in the billing portal", async () => {
    await send(sub("active", "price_pro"))
    expect(calls.writes[0].row).toMatchObject({ status: "active", plan: "pro" })
    calls.writes = []
    await send(sub("active", "price_team"))
    expect(calls.writes[0].row.plan).toBe("team")
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
