import { describe, it, expect } from "vitest"
import { blockFor, existingBillingBlock } from "../lib/billing-guard"

type Sub = { id: string; status: string }

/** The decision about an existing subscription, from what Stripe reports. Stand-ins only; nothing real is touched. */
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

