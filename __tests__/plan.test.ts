// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

// A tiny in-memory database standing in for Supabase, enough for the queries in lib/plan.ts.
type Row = Record<string, unknown>
const store = vi.hoisted(() => ({ tables: {} as Record<string, Row[]>, updates: [] as Array<{ table: string; patch: Row; filters: Array<[string, unknown]> }>, authUsers: {} as Record<string, { email: string; email_confirmed_at: string | null }> }))

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { admin: { getUserById: async (id: string) => ({ data: { user: store.authUsers[id] ?? null } }) } },
    from: (table: string) => {
      const filters: Array<[string, unknown]> = []
      let patch: Row | null = null
      const rows = () => (store.tables[table] ?? []).filter((r) => filters.every(([k, v]) => (v === undefined ? r[k] == null : r[k] === v)))
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: (k: string, v: unknown) => (filters.push([k, v]), builder),
        is: (k: string, v: unknown) => (filters.push([k, v ?? undefined]), builder),
        order: () => builder,
        limit: () => builder,
        update: (p: Row) => ((patch = p), builder),
        maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
        then: (res: (v: unknown) => unknown) => {
          if (patch) store.updates.push({ table, patch, filters: [...filters] })
          return Promise.resolve({ data: rows(), error: null }).then(res)
        },
      }
      return builder
    },
  }),
}))

import { getAccess, can, MAX_INVITES, planFromPriceId, type Access } from "../lib/plan"

const access = (plan: Access["plan"], active = true): Access => ({ plan, status: active ? "active" : "inactive", active, viaOwner: false, hasBilling: true })

beforeEach(() => {
  store.tables = { subscriptions: [], team_members: [] }
  store.updates = []
  store.authUsers = {}
})

describe("what each plan can do", () => {
  it("free (no active plan) can do none of the paid things", () => {
    for (const fn of Object.values(can)) expect(fn(access("free", false))).toBe(false)
  })
  it("starter can email reports but has no Xactimate export, open tracking or branding", () => {
    const a = access("starter")
    expect(can.emailReports(a)).toBe(true)
    expect(can.xactimateExport(a)).toBe(false)
    expect(can.emailTracking(a)).toBe(false)
    expect(can.customBranding(a)).toBe(false)
  })
  it("team adds Xactimate export and open tracking, but not branding", () => {
    const a = access("team")
    expect(can.emailReports(a)).toBe(true)
    expect(can.xactimateExport(a)).toBe(true)
    expect(can.emailTracking(a)).toBe(true)
    expect(can.customBranding(a)).toBe(false)
  })
  it("pro can do everything", () => {
    const a = access("pro")
    for (const fn of Object.values(can)) expect(fn(a)).toBe(true)
  })
  it("a paid plan that is not active unlocks nothing", () => {
    for (const p of ["starter", "team", "pro"] as const) for (const fn of Object.values(can)) expect(fn(access(p, false))).toBe(false)
  })
  it("seats match the pricing page: starter 1 user, team 3, pro 5 (owner plus invites)", () => {
    expect(MAX_INVITES.starter + 1).toBe(1)
    expect(MAX_INVITES.team + 1).toBe(3)
    expect(MAX_INVITES.pro + 1).toBe(5)
  })
})

describe("planFromPriceId", () => {
  it("maps each configured Stripe price to its plan and ignores unknown prices", () => {
    vi.stubEnv("STRIPE_PRICE_MONTHLY", "price_starter")
    vi.stubEnv("STRIPE_PRICE_TEAM_MONTHLY", "price_team")
    vi.stubEnv("STRIPE_PRICE_PRO_MONTHLY", "price_pro")
    expect(planFromPriceId("price_starter")).toBe("starter")
    expect(planFromPriceId("price_team")).toBe("team")
    expect(planFromPriceId("price_pro")).toBe("pro")
    expect(planFromPriceId("price_other")).toBeNull()
    expect(planFromPriceId(null)).toBeNull()
    vi.unstubAllEnvs()
  })
})

describe("getAccess", () => {
  it("gives a user with an active starter subscription starter access and a billing portal", async () => {
    store.tables.subscriptions = [{ user_id: "u1", status: "active", plan: "starter", stripe_customer_id: "cus_1" }]
    const a = await getAccess("u1", "a@b.com")
    expect(a).toMatchObject({ plan: "starter", active: true, viaOwner: false, hasBilling: true })
  })
  it("treats a trial like an active plan", async () => {
    store.tables.subscriptions = [{ user_id: "u1", status: "trialing", plan: "team", stripe_customer_id: "cus_1" }]
    expect(await getAccess("u1", "a@b.com")).toMatchObject({ plan: "team", active: true })
  })
  it("a subscription row without Stripe ids still works, but has no billing portal yet", async () => {
    store.tables.subscriptions = [{ user_id: "u1", status: "active", plan: "starter", stripe_customer_id: null }]
    expect(await getAccess("u1", "a@b.com")).toMatchObject({ plan: "starter", active: true, hasBilling: false })
  })
  it("falls back to free for cancelled, past due or missing subscriptions", async () => {
    for (const status of ["canceled", "past_due", "inactive"]) {
      store.tables.subscriptions = [{ user_id: "u1", status, plan: "pro", stripe_customer_id: "cus_1" }]
      expect(await getAccess("u1", "a@b.com")).toMatchObject({ plan: "free", active: false })
    }
    store.tables.subscriptions = []
    expect(await getAccess("u1", "a@b.com")).toMatchObject({ plan: "free", active: false })
  })
  it("treats an unknown plan name on an active subscription as starter, never as a higher plan", async () => {
    store.tables.subscriptions = [{ user_id: "u1", status: "active", plan: "enterprise", stripe_customer_id: "cus_1" }]
    expect((await getAccess("u1", "a@b.com")).plan).toBe("starter")
  })
  it("lets an invited team member use the owner's plan, without a billing portal of their own", async () => {
    store.tables.subscriptions = [{ user_id: "owner", status: "active", plan: "team", stripe_customer_id: "cus_o" }]
    store.tables.team_members = [{ owner_id: "owner", member_email: "m@b.com", status: "active" }]
    expect(await getAccess("m1", "M@B.com")).toMatchObject({ plan: "team", active: true, viaOwner: true, hasBilling: false, ownerId: "owner" })
  })
  it("turns a pending invite into an active one when the invited person signs in", async () => {
    store.tables.subscriptions = [{ user_id: "owner", status: "active", plan: "pro", stripe_customer_id: "cus_o" }]
    store.tables.team_members = [{ owner_id: "owner", member_email: "m@b.com", status: "pending" }]
    await getAccess("m1", "m@b.com")
    expect(store.updates.some((u) => u.table === "team_members" && u.patch.status === "active")).toBe(true)
  })
  it("gives a team member nothing once the owner's plan is no longer active", async () => {
    store.tables.subscriptions = [{ user_id: "owner", status: "canceled", plan: "team", stripe_customer_id: "cus_o" }]
    store.tables.team_members = [{ owner_id: "owner", member_email: "m@b.com", status: "active" }]
    expect(await getAccess("m1", "m@b.com")).toMatchObject({ plan: "free", active: false })
  })
  it("prefers the user's own active plan over an owner's", async () => {
    store.tables.subscriptions = [
      { user_id: "u1", status: "active", plan: "starter", stripe_customer_id: "cus_1" },
      { user_id: "owner", status: "active", plan: "pro", stripe_customer_id: "cus_o" },
    ]
    store.tables.team_members = [{ owner_id: "owner", member_email: "a@b.com", status: "active" }]
    expect(await getAccess("u1", "a@b.com")).toMatchObject({ plan: "starter", viaOwner: false })
  })

  it("attaches a payment made before the account existed to the person who signs in with that confirmed email", async () => {
    store.tables.subscriptions = [{ id: "s1", user_id: null, status: "active", plan: "starter", stripe_customer_id: "cus_1", stripe_customer_email: "Crystal@Example.com" }]
    store.authUsers.u1 = { email: "crystal@example.com", email_confirmed_at: "2026-10-25T00:00:00Z" }
    const a = await getAccess("u1", "crystal@example.com")
    expect(a).toMatchObject({ plan: "starter", active: true, hasBilling: true })
    expect(store.updates.some((u) => u.table === "subscriptions" && u.patch.user_id === "u1")).toBe(true)
  })
  it("does not hand a payment to someone whose email is not confirmed", async () => {
    store.tables.subscriptions = [{ id: "s1", user_id: null, status: "active", plan: "starter", stripe_customer_id: "cus_1", stripe_customer_email: "crystal@example.com" }]
    store.authUsers.u1 = { email: "crystal@example.com", email_confirmed_at: null }
    expect(await getAccess("u1", "crystal@example.com")).toMatchObject({ plan: "free", active: false })
    expect(store.updates.filter((u) => u.table === "subscriptions")).toHaveLength(0)
  })
  it("does not hand a payment to a different email, even a similar one", async () => {
    store.tables.subscriptions = [{ id: "s1", user_id: null, status: "active", plan: "pro", stripe_customer_id: "cus_1", stripe_customer_email: "a_b@example.com" }]
    store.authUsers.u1 = { email: "axb@example.com", email_confirmed_at: "2026-10-25T00:00:00Z" }
    expect(await getAccess("u1", "axb@example.com")).toMatchObject({ plan: "free", active: false })
  })
  it("does not attach a cancelled payment", async () => {
    store.tables.subscriptions = [{ id: "s1", user_id: null, status: "canceled", plan: "starter", stripe_customer_id: "cus_1", stripe_customer_email: "crystal@example.com" }]
    store.authUsers.u1 = { email: "crystal@example.com", email_confirmed_at: "2026-10-25T00:00:00Z" }
    expect(await getAccess("u1", "crystal@example.com")).toMatchObject({ active: false })
  })
})
