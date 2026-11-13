// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest"
import { PGlite } from "@electric-sql/pglite"
import fs from "node:fs"
import path from "node:path"

/**
 * The proposed supabase-migration-v14 (billing_customers and billing_review), run in a throwaway in-memory Postgres
 * with the project's real migration files and Supabase's default table grants. Made-up data only. It shows what the
 * migration file does, not what the live database holds.
 */
const root = path.resolve(__dirname, "..")
const sql = (f: string) => fs.readFileSync(path.join(root, f), "utf8")
const ORDER = [
  "supabase-migration-v0-baseline.sql", "supabase-migration.sql", "supabase-migration-v2.sql", "supabase-migration-v3.sql",
  "supabase-migration-v4-rls.sql", "supabase-migration-v5-exif.sql", "supabase-migration-v6-fix-team-policies.sql",
  "supabase-migration-v7-plan-limits.sql", "supabase-migration-v8-past-due-grace.sql", "supabase-migration-v9-free-project-allowance.sql",
  "supabase-migration-v10-storage-and-function-hardening.sql", "supabase-migration-v11-team-members-owner-read-only.sql",
  "supabase-migration-v13-least-privilege-and-paid-feature-writes.sql",
]
const V14 = "supabase-migration-v14-billing-customers-and-review.sql"
const U1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
let db: PGlite

async function as(role: "authenticated" | "anon" | "service_role", query: string, params: unknown[] = []) {
  await db.exec(`SET ROLE ${role}`)
  try {
    return (await db.query(query, params)).rows as Record<string, unknown>[]
  } finally {
    await db.exec("RESET ROLE")
  }
}
const code = async (p: Promise<unknown>) => {
  try { await p; return null } catch (e) { return (e as { code?: string }).code ?? "error" }
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(sql("__tests__/fixtures/supabase-shim.sql"))
  await db.exec("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role")
  for (const f of ORDER) await db.exec(sql(f))
  await db.query("INSERT INTO auth.users (id, email) VALUES ($1, 'one@example.test')", [U1])
  await db.query("INSERT INTO subscriptions (user_id, status, plan) VALUES ($1, 'active', 'starter')", [U1])
  await db.exec(sql(V14))
}, 60000)

describe("supabase-migration-v14 (proposed)", () => {
  it("creates both tables with row level security on", async () => {
    const r = await db.query("SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('billing_customers','billing_review') ORDER BY 1")
    expect(r.rows).toEqual([{ relname: "billing_customers", relrowsecurity: true }, { relname: "billing_review", relrowsecurity: true }])
  })

  it("anon and authenticated can neither read nor write them; the service role can", async () => {
    for (const t of ["billing_customers", "billing_review"]) {
      for (const role of ["anon", "authenticated"] as const) {
        expect(await code(as(role, `SELECT * FROM ${t}`))).toBe("42501")
      }
    }
    expect(await code(as("authenticated", "INSERT INTO billing_customers (user_id, stripe_customer_id) VALUES ($1, 'cus_x')", [U1]))).toBe("42501")
    await as("service_role", "INSERT INTO billing_customers (user_id, stripe_customer_id) VALUES ($1, 'cus_1')", [U1])
    expect(await as("service_role", "SELECT stripe_customer_id FROM billing_customers")).toEqual([{ stripe_customer_id: "cus_1" }])
  })

  it("one customer per account: a second insert for the same account is a unique violation (the compare-and-set the code relies on)", async () => {
    expect(await code(as("service_role", "INSERT INTO billing_customers (user_id, stripe_customer_id) VALUES ($1, 'cus_2')", [U1]))).toBe("23505")
  })

  it("a redelivered duplicate adds no second review note, and an unused-customer note is recorded once", async () => {
    const dup = () => as("service_role", "INSERT INTO billing_review (kind, user_id, stripe_customer_id, stripe_subscription_id, stored_subscription_id, reason) VALUES ('duplicate_subscription', $1, 'cus_1', 'sub_2', 'sub_1', 'r')", [U1])
    await dup()
    expect(await code(dup())).toBe("23505")
    const unused = () => as("service_role", "INSERT INTO billing_review (kind, user_id, stripe_customer_id, stored_customer_id, reason) VALUES ('unused_customer', $1, 'cus_lost', 'cus_1', 'r')", [U1])
    await unused()
    expect(await code(unused())).toBe("23505")
  })

  it("rejects an unknown kind and a note missing the id its kind needs (nothing can be recorded as an ordinary Stripe state)", async () => {
    expect(await code(as("service_role", "INSERT INTO billing_review (kind, reason) VALUES ('inactive', 'x')"))).toBe("23514")
    expect(await code(as("service_role", "INSERT INTO billing_review (kind, reason) VALUES ('duplicate_subscription', 'x')"))).toBe("23514")
  })

  it("the review table has no status column and is not part of any access query", async () => {
    const cols = (await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'billing_review'")).rows.map((r) => (r as { column_name: string }).column_name)
    expect(cols).not.toContain("status")
    expect(cols).not.toContain("plan")
  })

  it("does not touch the subscriptions table: access is exactly what it was", async () => {
    expect(await as("service_role", "SELECT status, plan FROM subscriptions WHERE user_id = $1", [U1])).toEqual([{ status: "active", plan: "starter" }])
    const live = await db.query("SELECT count(*)::int AS n FROM subscriptions WHERE status IN ('active','trialing','past_due')")
    expect(live.rows).toEqual([{ n: 1 }])
  })

  it("the pre-data rollback statement works mechanically (it must NOT be used once the tables hold rows)", async () => {
    await db.exec("DROP TABLE public.billing_review; DROP TABLE public.billing_customers;")
    const r = await db.query("SELECT count(*)::int AS n FROM pg_class WHERE relname IN ('billing_customers','billing_review')")
    expect(r.rows).toEqual([{ n: 0 }])
  })
})
