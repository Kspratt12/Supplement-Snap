// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest"
import { PGlite } from "@electric-sql/pglite"
import fs from "node:fs"
import path from "node:path"
import { serverCaptureId } from "../lib/sync-capture"

/**
 * supabase-migration-v17 (per-project shared capture) in a throwaway Postgres after the project's real migrations,
 * including v16. Made-up people and data. Shows what the SQL does, not the live database.
 */
const root = path.resolve(__dirname, "..")
const sql = (f: string) => fs.readFileSync(path.join(root, f), "utf8")
const ORDER = [
  "supabase-migration-v0-baseline.sql", "supabase-migration.sql", "supabase-migration-v2.sql", "supabase-migration-v3.sql",
  "supabase-migration-v4-rls.sql", "supabase-migration-v5-exif.sql", "supabase-migration-v6-fix-team-policies.sql",
  "supabase-migration-v7-plan-limits.sql", "supabase-migration-v8-past-due-grace.sql", "supabase-migration-v9-free-project-allowance.sql",
  "supabase-migration-v10-storage-and-function-hardening.sql", "supabase-migration-v11-team-members-owner-read-only.sql",
  "supabase-migration-v13-least-privilege-and-paid-feature-writes.sql",
  "supabase-migration-v16-claim-tracking-report-order-diagram-pins.sql",
]
const V17 = "supabase-migration-v17-team-capture.sql"
const U = {
  owner: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", email: "owner@example.test" },
  crew: { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", email: "crew@example.test" },
  pending: { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", email: "pending@example.test" },
  removed: { id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", email: "removed@example.test" },
  stranger: { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", email: "stranger@example.test" },
  unconfirmed: { id: "ffffffff-ffff-4fff-8fff-ffffffffffff", email: "unconfirmed@example.test" },
}
const SHARED = "11111111-1111-4111-8111-111111111111"
const PRIVATE = "22222222-2222-4222-8222-222222222222"
let db: PGlite

async function as(who: { id: string; email: string }, query: string, params: unknown[] = []) {
  await db.exec("SET ROLE authenticated")
  await db.query("SELECT set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: who.id, email: who.email, role: "authenticated" })])
  try {
    return (await db.query(query, params)).rows as Record<string, unknown>[]
  } finally {
    await db.exec("RESET ROLE")
  }
}
const errCode = async (p: Promise<unknown>) => { try { await p; return null } catch (e) { return (e as { code?: string }).code ?? "error" } }
const add = (who: { id: string; email: string }, project: string, note: string, extra = "") =>
  as(who, `INSERT INTO captures (project_id, field_note, image_url, image_urls, status, quantity${extra ? ", created_by" : ""}) VALUES ($1, $2, '', '{}', 'Captured', 1${extra ? ", $3" : ""}) RETURNING id, created_by`, extra ? [project, note, extra] : [project, note])

beforeAll(async () => {
  db = new PGlite()
  await db.exec(sql("__tests__/fixtures/supabase-shim.sql"))
  await db.exec("ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email_confirmed_at timestamptz")
  await db.exec("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role")
  for (const f of ORDER) await db.exec(sql(f))
  for (const u of Object.values(U)) {
    await db.query("INSERT INTO auth.users (id, email, email_confirmed_at) VALUES ($1, $2, $3)", [u.id, u.email, u === U.unconfirmed ? null : "2026-11-01T00:00:00Z"])
  }
  await db.query("INSERT INTO subscriptions (user_id, status, plan) VALUES ($1, 'active', 'team')", [U.owner.id])
  await db.query("INSERT INTO projects (id, user_id, project_name) VALUES ($1, $3, 'Shared job'), ($2, $3, 'Private job')", [SHARED, PRIVATE, U.owner.id])
  // Team rows are written by the server (service role) in the app; here as the table owner
  await db.query(`INSERT INTO team_members (owner_id, member_email, member_user_id, status, role) VALUES
    ($1, 'crew@example.test', $2, 'active', 'crew'),
    ($1, 'pending@example.test', NULL, 'pending', 'crew'),
    ($1, 'removed@example.test', $3, 'active', 'crew'),
    ($1, 'unconfirmed@example.test', $4, 'active', 'crew')`, [U.owner.id, U.crew.id, U.removed.id, U.unconfirmed.id])
  await db.exec(sql(V17))
}, 60000)

describe("supabase-migration-v17 (per-project shared capture)", () => {
  it("adds the columns with safe defaults: no project is shared, existing findings have no author", async () => {
    const p = await db.query("SELECT team_capture FROM projects ORDER BY project_name")
    expect(p.rows).toEqual([{ team_capture: false }, { team_capture: false }])
  })

  it("before the owner switches it on, nobody on the team can add findings", async () => {
    expect(await errCode(add(U.crew, SHARED, "too early"))).toBe("42501")
  })

  it("only the owner can switch shared capture on; a member cannot", async () => {
    expect(await as(U.crew, "UPDATE projects SET team_capture = true WHERE id = $1 RETURNING id", [SHARED])).toHaveLength(0)
    expect(await as(U.owner, "UPDATE projects SET team_capture = true WHERE id = $1 RETURNING id", [SHARED])).toHaveLength(1)
  })

  it("an active, confirmed member adds a finding to the shared project, recorded as theirs", async () => {
    const [row] = await add(U.crew, SHARED, "crew finding")
    expect(row.created_by).toBe(U.crew.id)
    // the owner sees it and who added it
    const seen = await as(U.owner, "SELECT field_note, created_by FROM captures WHERE project_id = $1", [SHARED])
    expect(seen).toEqual([{ field_note: "crew finding", created_by: U.crew.id }])
  })

  it("a member cannot claim someone else as the author", async () => {
    expect(await errCode(add(U.crew, SHARED, "forged", U.owner.id))).toBe("42501")
  })

  it("the owner's own findings are recorded as the owner's", async () => {
    const [row] = await add(U.owner, SHARED, "owner finding")
    expect(row.created_by).toBe(U.owner.id)
  })

  it("a member cannot edit or delete any finding, including their own", async () => {
    expect(await as(U.crew, "UPDATE captures SET field_note = 'changed' WHERE project_id = $1 RETURNING id", [SHARED])).toHaveLength(0)
    expect(await as(U.crew, "DELETE FROM captures WHERE project_id = $1 RETURNING id", [SHARED])).toHaveLength(0)
  })

  it("a member cannot add to a project that is not shared", async () => {
    expect(await errCode(add(U.crew, PRIVATE, "private"))).toBe("42501")
  })

  it("a pending invite, an unconfirmed email and another account cannot add", async () => {
    expect(await errCode(add(U.pending, SHARED, "pending"))).toBe("42501")
    expect(await errCode(add(U.unconfirmed, SHARED, "unconfirmed"))).toBe("42501")
    expect(await errCode(add(U.stranger, SHARED, "stranger"))).toBe("42501")
    expect(await as(U.stranger, "SELECT id FROM captures WHERE project_id = $1", [SHARED])).toEqual([])
  })

  it("a removed member's offline finding is refused when it syncs later, and the owner sees nothing", async () => {
    await db.query("DELETE FROM team_members WHERE member_email = 'removed@example.test'")
    const id = await serverCaptureId("offline-removed-member")
    expect(await errCode(as(U.removed, "INSERT INTO captures (id, project_id, field_note, image_urls) VALUES ($1, $2, 'queued', '{}')", [id, SHARED]))).toBe("42501")
    expect(await as(U.owner, "SELECT id FROM captures WHERE id = $1", [id])).toEqual([])
  })

  it("when the owner's plan lapses, members can no longer add (seats come from the plan)", async () => {
    await db.query("UPDATE subscriptions SET status = 'canceled' WHERE user_id = $1", [U.owner.id])
    expect(await errCode(add(U.crew, SHARED, "after lapse"))).toBe("42501")
    await db.query("UPDATE subscriptions SET status = 'active' WHERE user_id = $1", [U.owner.id])
    expect(await add(U.crew, SHARED, "back on plan")).toHaveLength(1)
    // a Starter plan has no team seats
    await db.query("UPDATE subscriptions SET plan = 'starter' WHERE user_id = $1", [U.owner.id])
    expect(await errCode(add(U.crew, SHARED, "starter"))).toBe("42501")
    await db.query("UPDATE subscriptions SET plan = 'team' WHERE user_id = $1", [U.owner.id])
  })

  it("the public role can neither call the check nor add findings", async () => {
    await db.exec("SET ROLE anon")
    try {
      expect(await errCode(db.query("SELECT public.can_contribute_to_project($1)", [SHARED]))).toBe("42501")
      expect(await errCode(db.query("INSERT INTO captures (project_id, field_note) VALUES ($1, 'anon')", [SHARED]))).not.toBeNull()
    } finally {
      await db.exec("RESET ROLE")
    }
  })

  it("a member's financial fields stay unchangeable, and the check reveals nothing about other projects", async () => {
    expect(await as(U.crew, "UPDATE projects SET amount_approved = 1 WHERE id = $1 RETURNING id", [SHARED])).toHaveLength(0)
    const [r] = await as(U.stranger, "SELECT public.can_contribute_to_project($1) AS ok", [SHARED])
    expect(r.ok).toBe(false)
  })

  it("deleting a member's account keeps their findings for the owner, with the author cleared", async () => {
    await db.query("DELETE FROM auth.users WHERE id = $1", [U.crew.id])
    const rows = await as(U.owner, "SELECT field_note, created_by FROM captures WHERE project_id = $1 AND field_note = 'crew finding'", [SHARED])
    expect(rows).toEqual([{ field_note: "crew finding", created_by: null }])
  })

  it("deleting the project removes its findings (as before)", async () => {
    await as(U.owner, "DELETE FROM projects WHERE id = $1", [SHARED])
    expect((await db.query("SELECT count(*)::int AS n FROM captures WHERE project_id = $1", [SHARED])).rows[0]).toEqual({ n: 0 })
  })

  it("can be run twice, and the undo section removes everything it added", async () => {
    await db.exec(sql(V17))
    const undo = sql(V17).split("-- UNDO")[1].split("\n").filter((l) => /^-- (DROP|ALTER)/.test(l)).map((l) => l.slice(3)).join("\n")
    await db.exec(undo)
    const left = await db.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema='public' AND column_name IN ('team_capture','created_by')")
    expect(left.rows[0]).toEqual({ n: 0 })
  })
})
