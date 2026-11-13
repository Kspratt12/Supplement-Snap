// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach } from "vitest"
import { PGlite } from "@electric-sql/pglite"
import fs from "node:fs"
import path from "node:path"

/**
 * The SQL of the proposed supabase-migration-v15 (checkout reservations), run in a throwaway in-memory Postgres with the test
 * scaffolding for Supabase's roles and auth.users. One connection, so these prove each function's LOGIC (every branch, ownership,
 * privileges, rollback). Real multi-connection locking is exercised separately, against a real PostgreSQL server, by
 * scripts/pg-concurrency-check (see its README); they are different evidence and neither proves the other.
 */
const root = path.resolve(__dirname, "..")
const sql = (f: string) => fs.readFileSync(path.join(root, f), "utf8")
const U = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const R1 = "11111111-1111-4111-8111-111111111111"
const R2 = "22222222-2222-4222-8222-222222222222"
const R3 = "33333333-3333-4333-8333-333333333333"
let db: PGlite

const j = async (q: string, params: unknown[] = []) => {
  await db.exec("SET ROLE service_role")
  try { return (await db.query(q, params)).rows as Array<Record<string, unknown>> } finally { await db.exec("RESET ROLE") }
}
const reserve = async (req: string, plan = "starter", customer = "cus_1") =>
  (await j("SELECT public.checkout_reserve($1, $2, $3, $4, 60) AS r", [U, customer, plan, req]))[0].r as Record<string, unknown>
const publish = async (req: string, session: string) => (await j("SELECT public.checkout_publish($1, $2, $3) AS n", [U, req, session]))[0].n as number
const row = async () => (await db.query("SELECT state, plan, request_id, stripe_session_id FROM billing_checkout_reservations WHERE user_id = $1", [U])).rows[0] as Record<string, unknown> | undefined
const lapse = async () => db.exec("UPDATE billing_checkout_reservations SET lease_until = now() - interval '1 second'")

beforeAll(async () => {
  db = new PGlite()
  await db.exec(sql("__tests__/fixtures/supabase-shim.sql"))
  await db.exec("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role")
  await db.exec("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role")
  await db.query("INSERT INTO auth.users (id, email) VALUES ($1, 'u@example.test')", [U])
  await db.exec(sql("supabase-migration-v15-checkout-reservations.sql"))
}, 60000)

beforeEach(async () => { await db.exec("DELETE FROM billing_checkout_reservations") })

describe("checkout_reserve: every branch", () => {
  it("first request acquires; a second request is told busy and nothing changes", async () => {
    expect((await reserve(R1)).outcome).toBe("acquired")
    const b = await reserve(R2, "team")
    expect(b.outcome).toBe("busy")
    expect(b.plan).toBe("starter")
    expect(await row()).toMatchObject({ state: "creating", plan: "starter", request_id: R1 })
  })

  it("the same request asking again keeps ownership (idempotent)", async () => {
    await reserve(R1)
    expect((await reserve(R1)).outcome).toBe("acquired")
    expect((await row())?.request_id).toBe(R1)
  })

  it("an owner that published makes its session canonical: same plan gets it, a different plan gets a swap", async () => {
    await reserve(R1)
    expect(await publish(R1, "cs_1")).toBe(1)
    expect(await reserve(R2, "starter")).toMatchObject({ outcome: "canonical", session_id: "cs_1" })
    const swap = await reserve(R2, "pro")
    expect(swap).toMatchObject({ outcome: "swap", previous_session_id: "cs_1" })
    expect(await row()).toMatchObject({ state: "creating", plan: "pro", request_id: R2, stripe_session_id: "cs_1" })
    // while the swap owner works, everyone else is busy
    expect((await reserve(R3, "team")).outcome).toBe("busy")
  })

  it("a lapsed lease is taken over and the previous owner can no longer publish", async () => {
    await reserve(R1)
    await lapse()
    expect((await reserve(R2, "team")).outcome).toBe("takeover")
    expect(await publish(R1, "cs_late")).toBe(0) // the slow original cannot expose its session
    expect(await publish(R2, "cs_2")).toBe(1)
    expect(await row()).toMatchObject({ state: "open", plan: "team", request_id: R2, stripe_session_id: "cs_2" })
  })

  it("a lapsed lease with no successor yet: the slow original still publishes (ownership, not the clock, decides)", async () => {
    await reserve(R1)
    await lapse()
    expect(await publish(R1, "cs_1")).toBe(1)
    expect((await reserve(R2)).outcome).toBe("canonical")
  })

  it("takeover during a crashed swap reports the old session that may still be payable", async () => {
    await reserve(R1); await publish(R1, "cs_old")
    await reserve(R2, "pro") // swap, then the owner crashes
    await lapse()
    expect(await reserve(R3, "pro")).toMatchObject({ outcome: "takeover", previous_session_id: "cs_old" })
  })

  it("a completed checkout reports completed until released", async () => {
    await reserve(R1); await publish(R1, "cs_1")
    await j("SELECT public.checkout_complete($1, 'cus_1', 'cs_1')", [U])
    expect(await reserve(R2)).toMatchObject({ outcome: "completed", session_id: "cs_1" })
  })
})

describe("publish, abort, complete, release", () => {
  it("publish succeeds only for the owner and only while creating", async () => {
    await reserve(R1)
    expect(await publish(R2, "cs_x")).toBe(0)
    expect(await publish(R1, "cs_1")).toBe(1)
    expect(await publish(R1, "cs_again")).toBe(0) // already open
    expect((await row())?.stripe_session_id).toBe("cs_1")
  })

  it("abort gives the row back only to its owner and only when no session was ever recorded", async () => {
    await reserve(R1)
    expect((await j("SELECT public.checkout_abort($1, $2) AS n", [U, R2]))[0].n).toBe(0)
    expect((await j("SELECT public.checkout_abort($1, $2) AS n", [U, R1]))[0].n).toBe(1)
    expect(await row()).toBeUndefined()
    // with an earlier session recorded (a swap), abort refuses: that session may still be payable
    await reserve(R1); await publish(R1, "cs_1"); await reserve(R2, "pro")
    expect((await j("SELECT public.checkout_abort($1, $2) AS n", [U, R2]))[0].n).toBe(0)
    expect(await row()).toBeDefined()
  })

  it("complete works with or without a prior reservation (a webhook for a checkout we never tracked)", async () => {
    await j("SELECT public.checkout_complete($1, 'cus_1', 'cs_stray')", [U])
    expect(await row()).toMatchObject({ state: "completed", stripe_session_id: "cs_stray" })
  })

  it("release removes only the named session's reservation, so a stale release cannot free a newer one", async () => {
    await reserve(R1); await publish(R1, "cs_1")
    expect((await j("SELECT public.checkout_release($1, 'cs_other') AS n", [U]))[0].n).toBe(0)
    expect(await row()).toBeDefined()
    expect((await j("SELECT public.checkout_release($1, 'cs_1') AS n", [U]))[0].n).toBe(1)
    expect((await reserve(R2)).outcome).toBe("acquired")
  })

  it("release does not remove a reservation that is being created (an owner mid-flight)", async () => {
    await reserve(R1)
    expect((await j("SELECT public.checkout_release($1, 'cs_1') AS n", [U]))[0].n).toBe(0)
    expect(await row()).toBeDefined()
  })
})

describe("constraints, privileges and rollback", () => {
  it("only the three plans on sale, and open/completed need a session id", async () => {
    await expect(db.query("INSERT INTO billing_checkout_reservations (user_id, stripe_customer_id, plan, state, request_id, lease_until) VALUES ($1,'c','enterprise','creating',$2, now())", [U, R1])).rejects.toMatchObject({ code: "23514" })
    await expect(db.query("INSERT INTO billing_checkout_reservations (user_id, stripe_customer_id, plan, state, request_id, lease_until) VALUES ($1,'c','pro','open',$2, now())", [U, R1])).rejects.toMatchObject({ code: "23514" })
  })

  it("anon and authenticated can neither read the table nor run any function; the service role can", async () => {
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`SET ROLE ${role}`)
      try {
        await expect(db.query("SELECT * FROM billing_checkout_reservations")).rejects.toMatchObject({ code: "42501" })
        await expect(db.query("SELECT public.checkout_reserve($1,'c','starter',$2,60)", [U, R1])).rejects.toMatchObject({ code: "42501" })
        await expect(db.query("SELECT public.checkout_complete($1,'c','cs')", [U])).rejects.toMatchObject({ code: "42501" })
      } finally { await db.exec("RESET ROLE") }
    }
    expect((await reserve(R1)).outcome).toBe("acquired")
  })

  it("deleting the account removes its reservation (cascade)", async () => {
    await db.query("INSERT INTO auth.users (id, email) VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b@example.test')")
    await db.exec("SELECT public.checkout_reserve('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'c', 'pro', '44444444-4444-4444-8444-444444444444', 60)")
    await db.exec("DELETE FROM auth.users WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'")
    expect((await db.query("SELECT count(*)::int AS n FROM billing_checkout_reservations WHERE user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'")).rows).toEqual([{ n: 0 }])
  })

  it("re-running the migration changes nothing and loses no row (idempotent create)", async () => {
    await reserve(R1)
    await db.exec(sql("supabase-migration-v15-checkout-reservations.sql"))
    expect(await row()).toMatchObject({ request_id: R1 })
  })
})
