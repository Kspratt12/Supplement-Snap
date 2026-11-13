// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { PGlite } from "@electric-sql/pglite"
import fs from "node:fs"
import path from "node:path"
import { startCheckout, type FlowInput, type FlowResult } from "../lib/checkout-flow"

/**
 * The checkout reservation flow (lib/checkout-flow.ts), run against the REAL v15 SQL functions in an in-memory Postgres and a Stripe
 * stand-in that models open, expired and completed sessions, slow calls and failures. A customer is "exposed" to a session only when
 * the flow RETURNS its URL; the central claim tested here is that two payable sessions are never exposed for one account.
 * Not tested here: real Stripe behavior (see the test-mode run) and real multi-connection locking (see scripts/pg-concurrency-check).
 */

type Sess = { id: string; url: string; created: number; status: "open" | "expired" | "complete"; expires_at: number; customer: string; metadata: Record<string, string> }

const w = vi.hoisted(() => ({
  now: 1_800_000_000,
  tick: 0,
  sessions: [] as Array<Record<string, unknown> & { id: string; url: string; status: string; customer: string; metadata: Record<string, string> }>,
  subs: [] as Array<{ id: string; status: string }>,
  failOn: null as null | string,
  gates: {} as Record<string, () => Promise<void>>,
  onExpire: null as null | ((s: { id: string; status: string }) => void),
  expired: [] as string[],
}))

const fakeStripe = new (class {
    subscriptions = { retrieve: async () => ({ id: "x", status: "canceled" }), list: async () => ({ data: w.subs, has_more: false }) }
    customers = { list: async () => ({ data: [], has_more: false }) }
    checkout = {
      sessions: {
        create: async (p: { customer: string; metadata: Record<string, string>; expires_at: number }) => {
          if (w.failOn === "create") throw Object.assign(new Error("stripe create down"), { statusCode: 500 })
          await w.gates["create:before"]?.()
          const n = w.sessions.length + 1
          const s = { id: `cs_${n}`, url: `https://checkout.stripe.example/cs_${n}`, created: w.now + ++w.tick, status: "open", expires_at: p.expires_at, customer: p.customer, metadata: p.metadata }
          w.sessions.push(s)
          await w.gates["create:after"]?.() // the session EXISTS at Stripe; the creator has not heard back yet
          return s
        },
        list: async (p: { customer: string; status: string }) => {
          if (w.failOn === "list") throw new Error("stripe list down")
          return { data: w.sessions.filter((s) => s.customer === p.customer && s.status === p.status && (s.expires_at as number) > w.now), has_more: false }
        },
        retrieve: async (id: string) => {
          const s = w.sessions.find((x) => x.id === id)
          // Stripe marks a session expired once its time has passed (unless a test pins it open to model Stripe disagreeing with our clock)
          if (s && s.status === "open" && (s.expires_at as number) <= w.now && !(s as { sticky?: boolean }).sticky) s.status = "expired"
          return s
        },
        expire: async (id: string) => {
          if (w.failOn === "expire") throw new Error("stripe expire down")
          const s = w.sessions.find((x) => x.id === id)!
          w.onExpire?.(s)
          if (s.status !== "open") throw Object.assign(new Error("not open"), { statusCode: 400 })
          s.status = "expired"; w.expired.push(id)
          return s
        },
      },
    }
})()

const root = path.resolve(__dirname, "..")
const sql = (f: string) => fs.readFileSync(path.join(root, f), "utf8")
const U = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
let pg: PGlite

const ARGS: Record<string, string[]> = {
  checkout_reserve: ["p_user", "p_customer", "p_plan", "p_request", "p_lease_seconds"],
  checkout_publish: ["p_user", "p_request", "p_session", "p_expires_at"],
  checkout_abort: ["p_user", "p_request"],
  checkout_complete: ["p_user", "p_customer", "p_session"],
  checkout_release: ["p_user", "p_session"],
}
const rpc: FlowInput["db"]["rpc"] = async (fn, args) => {
  const names = Object.keys(args)
  const call = names.map((n, k) => `${n} => $${k + 1}`).join(", ")
  try {
    const r = await pg.query(`SELECT public.${fn}(${call}) AS r`, names.map((n) => args[n] as never))
    return { data: (r.rows[0] as { r: unknown }).r, error: null }
  } catch (e) {
    return { data: null, error: { code: (e as { code?: string }).code, message: (e as Error).message } }
  }
}
void ARGS

const exposed = new Set<string>() // session ids whose URL was returned to a customer
const noSleep = async () => { await new Promise((r) => setImmediate(r)) }
// a real (short) pause so that a waiting request lets the owner run; the nominal 500 ms per wait still counts toward the 4 s limit
const shortSleep = async () => { await new Promise((r) => setTimeout(r, 15)) }
let seq = 0
const rid = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, "0")}`

function input(plan: string, over: Partial<FlowInput> = {}): FlowInput {
  const requestId = rid()
  return {
    stripe: fakeStripe as never,
    db: { rpc },
    userId: U, customerId: "cus_1", accountCustomers: { stripe_customer_id: "cus_1" }, plan, requestId,
    createSession: async (reservationRequestId) =>
      fakeStripe.checkout.sessions.create({ customer: "cus_1", expires_at: w.now + 31 * 60, metadata: { plan, reservation_request_id: reservationRequestId } }) as never,
    sleep: shortSleep, waitMs: 20000,
    ...over,
  }
}
async function stripeFor(): Promise<FlowInput["stripe"]> {
  return fakeStripe as never
}
async function run(plan: string, over: Partial<FlowInput> = {}): Promise<FlowResult> {
  const i = input(plan, over)
  i.stripe = await stripeFor()
  const r = await startCheckout(i)
  if (r.kind === "url") exposed.add(w.sessions.find((s) => s.url === r.url)!.id)
  return r
}
const open = () => w.sessions.filter((s) => s.status === "open" && (s.expires_at as number) > w.now)
const exposedOpen = () => open().filter((s) => exposed.has(s.id))
const row = async () => (await pg.query("SELECT state, plan, request_id, stripe_session_id FROM billing_checkout_reservations WHERE user_id = $1", [U])).rows[0] as Record<string, unknown> | undefined
const lapse = async () => pg.exec("UPDATE billing_checkout_reservations SET lease_until = now() - interval '1 second'")

beforeAll(async () => {
  pg = new PGlite()
  await pg.exec(sql("__tests__/fixtures/supabase-shim.sql"))
  await pg.query("INSERT INTO auth.users (id, email) VALUES ($1, 'u@example.test')", [U])
  await pg.exec(sql("supabase-migration-v15-checkout-reservations.sql"))
}, 60000)

beforeEach(async () => {
  await pg.exec("DELETE FROM billing_checkout_reservations")
  Object.assign(w, { now: 1_800_000_000, tick: 0, sessions: [], subs: [], failOn: null, gates: {}, onExpire: null, expired: [] })
  exposed.clear()
})

describe("concurrent requests", () => {
  it("same plan, three at once: one session is created and everyone is given that one", async () => {
    const out = await Promise.all([run("starter"), run("starter"), run("starter")])
    expect(out.every((o) => o.kind === "url")).toBe(true)
    expect(new Set(out.map((o) => (o as { url: string }).url)).size).toBe(1)
    expect(w.sessions).toHaveLength(1)
  })

  it("different plans at once: never two exposed payable sessions; the loser either waits and is swapped, or is told to retry", async () => {
    const out = await Promise.all([run("starter"), run("team"), run("pro")])
    expect(exposedOpen().length).toBeLessThanOrEqual(1)
    expect(out.some((o) => o.kind === "url")).toBe(true)
    // whoever did not get a link retries and is given the one open checkout
    const again = await run("team")
    expect(again.kind).toBe("url")
    expect(exposedOpen()).toHaveLength(1)
    expect(open().every((s) => exposed.has(s.id))).toBe(true)
  })

  it("200 randomized interleavings with random lease lapses and random slow calls: never two exposed payable sessions", async () => {
    let seed = 12345
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff)
    for (let i = 0; i < 200; i++) {
      await pg.exec("DELETE FROM billing_checkout_reservations")
      w.sessions = []; w.expired = []; exposed.clear(); w.failOn = null
      w.gates = {
        "create:before": async () => { for (let k = rnd() % 4; k > 0; k--) await noSleep(); if (rnd() % 5 === 0) await lapse() },
        "create:after": async () => { for (let k = rnd() % 4; k > 0; k--) await noSleep(); if (rnd() % 5 === 0) await lapse() },
      }
      const plans = ["starter", "team", "pro", "starter"]
      const n = 2 + (i % 3)
      const out = await Promise.all(plans.slice(0, n).map((_p, k) => run(plans[(k + i) % plans.length])))
      expect(out.every((o) => o.kind !== "blocked")).toBe(true)
      expect(exposedOpen().length).toBeLessThanOrEqual(1)
    }
  }, 120000)
})

describe("a request that continues after its lease was taken over", () => {
  it("a slow original creates its session AFTER the successor published: its publish fails, it never returns the URL, and it expires its own session", async () => {
    let release!: () => void
    const gate = new Promise<void>((r) => { release = r })
    let calls = 0
    w.gates["create:before"] = async () => { if (++calls === 1) await gate } // only the first (original) request is slow
    const original = run("starter")
    await noSleep(); await noSleep()
    await lapse() // its lease passes while it is still waiting on Stripe
    const successor = await run("starter")
    expect(successor.kind).toBe("url")
    const winner = open()[0]
    release()
    const late = await original
    expect(late.kind).toBe("busy") // it never gets a URL
    expect(exposedOpen().map((s) => s.id)).toEqual([winner.id])
    const orphan = w.sessions.find((s) => s.id !== winner.id)!
    expect(orphan.status).toBe("expired") // its own session, never exposed, now expired
    expect(exposed.has(orphan.id)).toBe(false)
  })

  it("the original's session already exists at Stripe when the successor lists open sessions: the successor expires it (never adopts it) and the original cannot expire the successor's", async () => {
    let release!: () => void
    const gate = new Promise<void>((r) => { release = r })
    let calls = 0
    w.gates["create:after"] = async () => { if (++calls === 1) await gate } // original's session exists; it has not heard back or published
    const original = run("starter")
    await noSleep(); await noSleep()
    expect(w.sessions).toHaveLength(1)
    await lapse()
    const successor = await run("starter")
    expect(successor.kind).toBe("url")
    const mine = (successor as { url: string }).url
    release()
    const late = await original
    expect(late.kind).toBe("busy")
    expect(w.sessions[0].status).toBe("expired") // the original's, expired by the successor
    expect(open().map((s) => s.url)).toEqual([mine]) // the successor's is still open and is the only exposed one
    expect(exposedOpen()).toHaveLength(1)
  })

  it("a lapsed owner with no successor yet still publishes (ownership decides, not the clock)", async () => {
    w.gates["create:before"] = async () => { await lapse() }
    const out = await run("starter")
    expect(out.kind).toBe("url")
    expect(exposedOpen()).toHaveLength(1)
  })
})

describe("lost responses and crashes", () => {
  it("response lost AFTER publish: the retry is handed the same canonical session", async () => {
    const first = await run("starter") // pretend this answer never reached the customer
    const retry = await run("starter")
    expect((retry as { url: string }).url).toBe((first as { url: string }).url)
    expect(w.sessions).toHaveLength(1)
  })

  it("response lost BEFORE publish (the owner crashed after Stripe made the session): nothing was exposed; retries are told to wait, then the next owner replaces it", async () => {
    w.gates["create:after"] = async () => { throw new Error("process died") } // after the session exists, before publish
    expect((await run("starter")).kind).toBe("uncertain") // the failure is uncertain: a session may exist
    w.gates = {}
    expect(w.sessions).toHaveLength(1)
    expect(exposed.size).toBe(0)
    expect((await run("starter", { waitMs: 0 })).kind).toBe("busy") // the dead owner's lease is still running
    await lapse()
    const next = await run("starter")
    expect(next.kind).toBe("url")
    expect(w.sessions[0].status).toBe("expired") // the unexposed leftover was expired
    expect(exposedOpen()).toHaveLength(1)
  })

  it("a creation timeout (Stripe made the session, the call failed) is uncertain: nothing exposed, and recovery works after the lease", async () => {
    w.gates["create:after"] = async () => { throw Object.assign(new Error("timeout"), { statusCode: 504 }) }
    const first = await run("starter")
    expect(first.kind).toBe("uncertain")
    w.gates = {}
    await lapse()
    expect((await run("starter")).kind).toBe("url")
    expect(exposedOpen()).toHaveLength(1)
  })

  it("an error that proves nothing was created (4xx) gives the reservation back at once", async () => {
    w.gates["create:before"] = async () => { throw Object.assign(new Error("bad request"), { statusCode: 400 }) }
    expect((await run("starter")).kind).toBe("uncertain")
    expect(await row()).toBeUndefined()
    w.gates = {}
    expect((await run("starter")).kind).toBe("url") // no waiting for a lease
  })

  it("nobody is blocked for long: a dead owner's lease lapses and the next request proceeds", async () => {
    w.failOn = "list" // the owner dies while clearing sessions
    expect((await run("starter")).kind).toBe("uncertain")
    w.failOn = null
    expect((await run("starter", { waitMs: 0 })).kind).toBe("busy")
    await lapse()
    expect((await run("starter")).kind).toBe("url")
  })
})

describe("plan changes while the previous session is still payable", () => {
  it("the old session is expired and CONFIRMED before the new one is created; only the new one is payable afterwards", async () => {
    const a = await run("starter")
    const b = await run("pro")
    expect(a.kind).toBe("url"); expect(b.kind).toBe("url")
    expect(w.sessions).toHaveLength(2)
    expect(w.sessions[0].status).toBe("expired")
    expect(open().map((s) => s.metadata.plan)).toEqual(["pro"])
    expect((await row())).toMatchObject({ state: "open", plan: "pro" })
  })

  it("if the customer pays the old session at the instant it is expired, no new session is created and the answer is 'manage billing'", async () => {
    await run("starter")
    w.onExpire = (s) => { if (s.id === "cs_1") { s.status = "complete"; w.subs = [{ id: "sub_paid", status: "trialing" }] } }
    const out = await run("team")
    expect(out.kind).toBe("blocked")
    expect(w.sessions).toHaveLength(1)
    expect(exposedOpen()).toHaveLength(0)
    expect(await row()).toMatchObject({ state: "completed" })
  })

  it("a swap whose owner crashes after expiring the old session recovers on the next request (no permanent block)", async () => {
    await run("starter")
    w.gates["create:before"] = async () => { throw Object.assign(new Error("died"), { statusCode: 500 }) }
    await run("pro") // old session expired, the new one never made
    w.gates = {}
    await lapse()
    const out = await run("pro")
    expect(out.kind).toBe("url")
    expect(open().map((s) => s.metadata.plan)).toEqual(["pro"])
  })

  it("a takeover finds the previous (still payable) session of a crashed swap and expires it", async () => {
    await run("starter")
    w.failOn = "expire" // the swap owner cannot expire the old session and gives up
    expect((await run("pro")).kind).toBe("uncertain")
    expect(open().map((s) => s.id)).toEqual(["cs_1"]) // still payable
    w.failOn = null
    await lapse()
    expect((await run("pro")).kind).toBe("url")
    expect(w.sessions[0].status).toBe("expired")
    expect(open().map((s) => s.metadata.plan)).toEqual(["pro"])
  })
})

describe("completion, webhook timing and recovery", () => {
  it("webhook BEFORE the customer's next request: the reservation says completed and the answer is 'manage billing'", async () => {
    const first = await run("starter")
    const s = w.sessions[0]; s.status = "complete"; w.subs = [{ id: "sub_1", status: "trialing" }]
    await pg.query("SELECT public.checkout_complete($1, 'cus_1', $2)", [U, s.id]) // what the webhook does
    const next = await run("pro")
    expect(first.kind).toBe("url"); expect(next.kind).toBe("blocked")
    expect(w.sessions).toHaveLength(1)
  })

  it("webhook LOST or late: the next request finds the session complete at Stripe and still answers 'manage billing'", async () => {
    await run("starter")
    w.sessions[0].status = "complete"; w.subs = [{ id: "sub_1", status: "active" }]
    const next = await run("starter")
    expect(next.kind).toBe("blocked")
    expect(w.sessions).toHaveLength(1)
    expect(await row()).toMatchObject({ state: "completed" })
  })

  it("a completed checkout whose subscription later ended does not block resubscribing", async () => {
    await run("starter")
    w.sessions[0].status = "complete"; w.subs = [{ id: "sub_1", status: "canceled" }]
    await pg.query("SELECT public.checkout_complete($1, 'cus_1', 'cs_1')", [U])
    const next = await run("starter")
    expect(next.kind).toBe("url")
    expect(exposedOpen()).toHaveLength(1)
  })

  it("an incomplete subscription after completion keeps the customer waiting, not buying again", async () => {
    await run("starter")
    w.sessions[0].status = "complete"; w.subs = [{ id: "sub_1", status: "incomplete" }]
    const next = await run("starter")
    expect(next.kind).toBe("blocked")
    expect((next as { block: { code: string } }).block.code).toBe("payment_in_progress")
  })
})

describe("expiry is decided by Stripe, not the clock", () => {
  it("the session expired at Stripe: the reservation is released and a new session is created", async () => {
    await run("starter")
    w.now += 40 * 60
    const next = await run("starter")
    expect(next.kind).toBe("url")
    expect(w.sessions).toHaveLength(2)
    expect(open()).toHaveLength(1)
  })

  it("the clock says it should have expired but Stripe still shows it open: the SAME session is returned, no second one is made", async () => {
    const first = await run("starter")
    const pinned = w.sessions[0] as unknown as { expires_at: number; sticky?: boolean }
    pinned.expires_at = w.now - 10 // our clock says it expired
    pinned.sticky = true // but Stripe still shows it open
    const next = await run("starter")
    expect((next as { url: string }).url).toBe((first as { url: string }).url)
    expect(w.sessions).toHaveLength(1)
  })
})

describe("failures", () => {
  it("Stripe cannot list sessions: uncertain, nothing exposed, nothing created", async () => {
    w.failOn = "list"
    expect((await run("starter")).kind).toBe("uncertain")
    expect(w.sessions).toHaveLength(0); expect(exposed.size).toBe(0)
  })

  it("the reservation functions are missing (v15 not applied): the flow stops with a clear error and creates nothing", async () => {
    const bad: FlowInput["db"] = { rpc: async () => ({ data: null, error: { code: "42883", message: "function does not exist" } }) }
    await expect(run("starter", { db: bad })).rejects.toMatchObject({ name: "CheckoutProtectionUnavailable" })
    expect(w.sessions).toHaveLength(0)
  })
})
