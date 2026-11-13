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
  /** the subscriptions table as the stand-in database holds it */
  rows: [] as Array<Record<string, unknown>>,
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
      list: async () => ({ data: [] as unknown[] }),
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
        eq: (k: string, v: unknown) => ({
          maybeSingle: async () => {
            // a lookup by user returns that user's stored row; a lookup by subscription id answers from the "known" set
            if (k === "user_id") return { data: calls.rows.find((r) => r.user_id === v) ?? null }
            return { data: calls.known.has(String(v)) ? { id: "row" } : null }
          },
        }),
      }),
      upsert: async (row: Record<string, unknown>, opts: unknown) => (calls.writes.push({ table, op: "upsert", row, opts }), calls.known.add(String(row.stripe_subscription_id)), { error: null }),
      insert: async (row: Record<string, unknown>) => (calls.writes.push({ table, op: "insert", row }), calls.known.add(String(row.stripe_subscription_id)), { error: null }),
      update: (row: Record<string, unknown>) => {
        const filters: Array<[string, unknown]> = []
        const builder = {
          eq: (k: string, v: unknown) => (filters.push([k, v]), builder),
          is: (k: string, v: unknown) => (filters.push([k, v]), builder),
          select: async () => {
            const hit = calls.rows.filter((r) => filters.every(([k, v]) => (r[k] ?? null) === v))
            calls.writes.push({ table, op: "update", row, where: filters[0] })
            hit.forEach((r) => Object.assign(r, row))
            return { data: hit.map((r) => ({ id: r.id })), error: null }
          },
        }
        return builder
      },
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
  calls.rows = [{ id: "row1", stripe_customer_id: "cus_1", stripe_subscription_id: "sub_1" }]
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
    await send(checkout({ metadata: { plan: "starter", supabase_user_id: "" } }))
    expect(calls.writes[0].row).toMatchObject({ user_id: "u9", status: "active", plan: "starter" })
  })
  it("still records the purchase, with no user yet, when nobody matches", async () => {
    await send(checkout({ metadata: { plan: "starter", supabase_user_id: "" } }))
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
    await send(checkout({ metadata: { plan: "starter", supabase_user_id: "" } }))
    await send(checkout({ metadata: { plan: "starter", supabase_user_id: "" } }))
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

describe("Stripe webhook: renewals, changes and cancellations (matched on the Stripe subscription id)", () => {
  it("marks the plan active when a subscription invoice is paid", async () => {
    calls.subs["sub_1"] = stripeSub("active", "price_team")
    await send(invoice("invoice.paid"))
    expect(calls.writes[0]).toMatchObject({ table: "subscriptions", op: "update", where: ["stripe_subscription_id", "sub_1"] })
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
    await send({ type: "customer.subscription.deleted", data: { object: { id: "sub_1", customer: "cus_1", items: { data: [{ price: { id: "price_team" } }] } } } })
    expect(calls.writes[0].row.status).toBe("canceled")
    expect(calls.rows[0].status).toBe("canceled")
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

describe("Stripe webhook: more than one subscription, other products, retries (matched on the subscription id)", () => {
  const deleted = (id: string, price = "price_starter", customer = "cus_1") => ({
    type: "customer.subscription.deleted",
    data: { object: { id, customer, items: { data: [{ price: { id: price } }] } } },
  })

  it("cancelling an OLDER subscription of the same customer leaves the current subscription active", async () => {
    calls.rows = [{ id: "row1", stripe_customer_id: "cus_1", stripe_subscription_id: "sub_current", status: "active", plan: "starter" }]
    await send(deleted("sub_old"))
    expect(calls.rows[0]).toMatchObject({ status: "active", plan: "starter", stripe_subscription_id: "sub_current" })
  })
  it("cancelling the CURRENT subscription cancels that row", async () => {
    calls.rows = [{ id: "row1", stripe_customer_id: "cus_1", stripe_subscription_id: "sub_current", status: "active" }]
    await send(deleted("sub_current"))
    expect(calls.rows[0].status).toBe("canceled")
  })
  it("an update or paid event for an older subscription cannot change the current one (out of order, retried)", async () => {
    calls.rows = [{ id: "row1", stripe_customer_id: "cus_1", stripe_subscription_id: "sub_current", status: "active", plan: "starter" }]
    calls.subs["sub_old"] = stripeSub("canceled", "price_starter", undefined, "sub_old")
    await send(invoice("invoice.paid", "sub_old"))
    await send({ type: "customer.subscription.updated", data: { object: { id: "sub_old", customer: "cus_1" } } })
    await send(invoice("invoice.payment_failed", "sub_old"))
    expect(calls.rows[0]).toMatchObject({ status: "active", plan: "starter" })
  })
  it("a subscription that belongs to another product on this Stripe account changes nothing here", async () => {
    calls.rows = [{ id: "row1", stripe_customer_id: "cus_1", stripe_subscription_id: "sub_current", status: "active", plan: "pro" }]
    calls.subs["sub_other"] = stripeSub("canceled", "price_leaseguard", undefined, "sub_other")
    await send({ type: "customer.subscription.updated", data: { object: { id: "sub_other", customer: "cus_1" } } })
    await send(deleted("sub_other", "price_leaseguard"))
    await send(invoice("invoice.paid", "sub_other"))
    expect(calls.rows[0]).toMatchObject({ status: "active", plan: "pro" })
  })
  it("a checkout from another product (not created by our checkout) neither grants access nor sends our email", async () => {
    const res = await send({
      type: "checkout.session.completed",
      data: { object: { customer: "cus_9", subscription: "sub_9", customer_details: { email: "someone@example.com" }, metadata: { plan: "pro" } } },
    })
    expect(res.status).toBe(200)
    expect(calls.writes).toHaveLength(0)
    expect(calls.emails).toHaveLength(0)
  })
  it("the same event delivered twice leaves the same final state (retries are safe)", async () => {
    calls.subs["sub_1"] = stripeSub("past_due", "price_team")
    await send(invoice("invoice.payment_failed"))
    const once = { ...calls.rows[0], updated_at: undefined }
    await send(invoice("invoice.payment_failed"))
    expect({ ...calls.rows[0], updated_at: undefined }).toEqual(once)
    expect(calls.rows).toHaveLength(1)
  })
  it("a row that never recorded a subscription id adopts it from our own price, and only from our own price", async () => {
    calls.rows = [{ id: "row1", stripe_customer_id: "cus_1", stripe_subscription_id: null, status: "active", plan: "starter" }]
    calls.subs["sub_x"] = stripeSub("active", "price_unknown", undefined, "sub_x")
    await send({ type: "customer.subscription.updated", data: { object: { id: "sub_x", customer: "cus_1" } } })
    expect(calls.rows[0].stripe_subscription_id).toBeNull()
    calls.subs["sub_y"] = stripeSub("active", "price_team", undefined, "sub_y")
    await send({ type: "customer.subscription.updated", data: { object: { id: "sub_y", customer: "cus_1" } } })
    expect(calls.rows[0]).toMatchObject({ stripe_subscription_id: "sub_y", plan: "team", status: "active" })
  })
  it("a row that already holds a different subscription is never adopted by customer id", async () => {
    calls.rows = [{ id: "row1", stripe_customer_id: "cus_1", stripe_subscription_id: "sub_current", status: "active", plan: "starter" }]
    calls.subs["sub_new"] = stripeSub("active", "price_pro", undefined, "sub_new")
    await send({ type: "customer.subscription.updated", data: { object: { id: "sub_new", customer: "cus_1" } } })
    expect(calls.rows[0]).toMatchObject({ stripe_subscription_id: "sub_current", plan: "starter" })
  })
})

describe("Stripe webhook: a second checkout for an account that already holds a subscription", () => {
  const second = () => checkout({ subscription: "sub_2", customer: "cus_2", metadata: { plan: "pro", supabase_user_id: "u1" } })
  const holdOldOne = (status: string) => {
    calls.rows = [{ id: "row1", user_id: "u1", stripe_customer_id: "cus_1", stripe_subscription_id: "sub_1", status: "active", plan: "starter" }]
    calls.subs["sub_1"] = stripeSub(status, "price_starter")
  }

  for (const status of ["active", "trialing", "past_due", "unpaid", "incomplete"]) {
    it(`keeps the stored subscription (Stripe says ${status}), records the new one unattached, and sends no activation email`, async () => {
      holdOldOne(status)
      const res = await send(second())
      expect(res.status).toBe(200)
      expect(calls.writes.filter((x) => x.op === "upsert")).toHaveLength(0)
      expect(calls.rows[0]).toMatchObject({ stripe_subscription_id: "sub_1", plan: "starter", status: "active" })
      const note = calls.writes.find((x) => x.op === "insert")
      expect(note?.row).toMatchObject({ stripe_subscription_id: "sub_2", stripe_customer_id: "cus_2", status: "inactive" })
      expect(note?.row.user_id).toBeUndefined()
      expect(calls.emails).toHaveLength(0)
    })
  }

  it("replaces the stored subscription when the old one is canceled (resubscribing works)", async () => {
    holdOldOne("canceled")
    await send(second())
    const up = calls.writes.find((x) => x.op === "upsert")
    expect(up?.row).toMatchObject({ user_id: "u1", stripe_subscription_id: "sub_2", plan: "pro", status: "active" })
    expect(calls.emails.map((e) => e.subject)).toEqual(["Your Supplement Snap subscription is active"])
  })

  it("answers 500, and writes nothing, when Stripe cannot say what the stored subscription is, so Stripe retries", async () => {
    calls.rows = [{ id: "row1", user_id: "u1", stripe_customer_id: "cus_1", stripe_subscription_id: "sub_gone", status: "active" }]
    // sub_gone is not in calls.subs, so the stand-in Stripe throws
    const res = await send(second())
    expect(res.status).toBe(500)
    expect(calls.writes).toHaveLength(0)
  })

  it("redelivery of the held-back checkout does not add a second note or email", async () => {
    holdOldOne("active")
    await send(second())
    await send(second())
    expect(calls.writes.filter((x) => x.op === "insert")).toHaveLength(1)
    expect(calls.emails).toHaveLength(0)
  })

  it("the same subscription delivered again for the same account is still a no-op", async () => {
    calls.rows = [{ id: "row1", user_id: "u1", stripe_customer_id: "cus_1", stripe_subscription_id: "sub_1", status: "active" }]
    calls.known.add("sub_1")
    await send(checkout())
    expect(calls.writes).toHaveLength(0)
  })
})
