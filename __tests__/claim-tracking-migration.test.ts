// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest"
import { PGlite } from "@electric-sql/pglite"
import fs from "node:fs"
import path from "node:path"

/**
 * The proposed supabase-migration-v16, run in a throwaway in-memory Postgres after the project's real migration files.
 * Made-up data only. Shows what the file does, not what the live database holds.
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
const V16 = "supabase-migration-v16-claim-tracking-report-order-diagram-pins.sql"
const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
const T = "cccccccc-cccc-4ccc-8ccc-cccccccccccc"
const PA = "11111111-1111-4111-8111-111111111111"
const CA = "22222222-2222-4222-8222-222222222222"
let db: PGlite

const EMAIL: Record<string, string> = {}
async function asUser(uid: string, query: string, params: unknown[] = []) {
  await db.exec(`SET ROLE authenticated; SELECT set_config('request.jwt.claims', '${JSON.stringify({ sub: uid, role: "authenticated", email: EMAIL[uid] })}', false)`)
  try {
    return (await db.query(query, params)).rows as Record<string, unknown>[]
  } finally {
    await db.exec("RESET ROLE; SELECT set_config('request.jwt.claims', '', false)")
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
  EMAIL[A] = "a@example.test"
  EMAIL[B] = "b@example.test"
  EMAIL[T] = "crew@example.test"
  await db.query("INSERT INTO auth.users (id, email) VALUES ($1, 'a@example.test'), ($2, 'b@example.test'), ($3, 'crew@example.test')", [A, B, T])
  // T is an active team member of A (team members can view A's projects but not change them)
  await db.query("INSERT INTO team_members (owner_id, member_email, member_user_id, status) VALUES ($1, 'crew@example.test', $2, 'active')", [A, T])
  await db.query("INSERT INTO subscriptions (user_id, status, plan) VALUES ($1, 'active', 'starter'), ($2, 'active', 'starter')", [A, B])
  await db.query("INSERT INTO projects (id, user_id, project_name) VALUES ($1, $2, 'A job')", [PA, A])
  await db.query("INSERT INTO captures (id, project_id, damage_type, roof_area) VALUES ($1, $2, 'Decking', 'Front')", [CA, PA])
  await db.exec(sql(V16))
}, 60000)

describe("supabase-migration-v16 (proposed)", () => {
  it("adds the five optional columns and leaves existing rows empty in them", async () => {
    const p = (await db.query("SELECT amount_requested, amount_approved, follow_up_on FROM projects WHERE id = $1", [PA])).rows[0]
    expect(p).toEqual({ amount_requested: null, amount_approved: null, follow_up_on: null })
    const c = (await db.query("SELECT report_order, diagram_pin FROM captures WHERE id = $1", [CA])).rows[0]
    expect(c).toEqual({ report_order: null, diagram_pin: null })
  })

  it("the owner can set them; another account cannot change them", async () => {
    const own = await asUser(A, "UPDATE projects SET amount_requested = 1200.50, follow_up_on = '2026-12-01' WHERE id = $1 RETURNING id", [PA])
    expect(own).toHaveLength(1)
    expect(await asUser(A, "UPDATE captures SET report_order = 0, diagram_pin = '{\"x\":0.5,\"y\":0.2}' WHERE id = $1 RETURNING id", [CA])).toHaveLength(1)
    // Row security: B's update matches no rows
    expect(await asUser(B, "UPDATE projects SET amount_approved = 99999 WHERE id = $1 RETURNING id", [PA])).toHaveLength(0)
    expect(await asUser(B, "UPDATE captures SET report_order = 5 WHERE id = $1 RETURNING id", [CA])).toHaveLength(0)
    expect((await db.query("SELECT amount_approved FROM projects WHERE id = $1", [PA])).rows[0]).toEqual({ amount_approved: null })
  })

  it("a team member can read the new values but not change them; another account cannot even read them", async () => {
    const seen = await asUser(T, "SELECT amount_requested, follow_up_on FROM projects WHERE id = $1", [PA])
    expect(seen).toHaveLength(1)
    expect(await asUser(T, "UPDATE projects SET amount_approved = 1 WHERE id = $1 RETURNING id", [PA])).toHaveLength(0)
    expect(await asUser(T, "UPDATE captures SET diagram_pin = '{\"x\":0.1,\"y\":0.1}' WHERE id = $1 RETURNING id", [CA])).toHaveLength(0)
    expect(await asUser(B, "SELECT amount_requested FROM projects WHERE id = $1", [PA])).toHaveLength(0)
  })

  it("the public (anon) role can neither read nor write them", async () => {
    await db.exec("SET ROLE anon")
    try {
      const read = await db.query("SELECT amount_requested FROM projects").then((r) => r.rows.length, (e) => (e as { code?: string }).code)
      expect([0, "42501"]).toContain(read)
      const write = await db.query("UPDATE captures SET report_order = 1 RETURNING id").then((r) => r.rows.length, (e) => (e as { code?: string }).code)
      expect([0, "42501"]).toContain(write)
    } finally {
      await db.exec("RESET ROLE")
    }
  })

  it("the current app's inserts (which never send the new columns) still work after the migration", async () => {
    const rows = await asUser(A, "INSERT INTO captures (project_id, damage_type, roof_area, field_note, image_url, image_urls, status, quantity, photo_metadata) VALUES ($1, 'Flashing', 'Chimney', 'old code', '', '{}', 'Captured', 1, '[]') RETURNING report_order, diagram_pin", [PA])
    expect(rows).toEqual([{ report_order: null, diagram_pin: null }])
    const p = await asUser(A, "INSERT INTO projects (user_id, project_name) VALUES ($1, 'Second job') RETURNING amount_requested, amount_approved, follow_up_on", [A])
    expect(p).toEqual([{ amount_requested: null, amount_approved: null, follow_up_on: null }])
  })

  it("zero is a valid amount", async () => {
    expect(await asUser(A, "UPDATE projects SET amount_approved = 0 WHERE id = $1 RETURNING amount_approved", [PA])).toEqual([{ amount_approved: "0.00" }])
  })

  it("refuses values that make no sense", async () => {
    expect(await code(db.query("UPDATE projects SET amount_requested = -1 WHERE id = $1", [PA]))).toBe("23514")
    expect(await code(db.query("UPDATE captures SET report_order = -1 WHERE id = $1", [CA]))).toBe("23514")
    expect(await code(db.query("UPDATE captures SET diagram_pin = '{\"x\":2,\"y\":0.5}' WHERE id = $1", [CA]))).toBe("23514")
    expect(await code(db.query("UPDATE captures SET diagram_pin = '{\"x\":\"a\",\"y\":0.5}' WHERE id = $1", [CA]))).toBe("23514")
    expect(await code(db.query("UPDATE captures SET diagram_pin = '[1,2]' WHERE id = $1", [CA]))).toBe("23514")
  })

  it("can be run twice", async () => {
    await db.exec(sql(V16))
  })

  it("the undo section removes everything it added", async () => {
    const undo = sql(V16).split("-- UNDO")[1].split("\n").filter((l) => l.startsWith("-- ALTER")).map((l) => l.slice(3)).join("\n")
    await db.exec(undo)
    const cols = await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND column_name IN ('amount_requested','amount_approved','follow_up_on','report_order','diagram_pin')")
    expect(cols.rows).toHaveLength(0)
    await db.exec(sql(V16)) // and it can be applied again afterwards
  })
})
