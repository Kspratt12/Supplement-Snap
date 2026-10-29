// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest"
import { PGlite } from "@electric-sql/pglite"
import fs from "node:fs"
import path from "node:path"

/**
 * Tests the app's real Row Level Security policies, triggers and functions.
 *
 * How: a throwaway in-memory Postgres is created, a small stand-in for Supabase's login and storage tables is
 * added (__tests__/fixtures/supabase-shim.sql), then the project's own migration files are run in order, exactly
 * as written. Test users then act through the same database roles Supabase uses (anon and authenticated), with a
 * token claim saying who they are.
 *
 * What this proves: the database rules in the migration files block access between users.
 * What it does NOT prove: that the live database matches these files; Supabase's real login service; the storage
 * service's own checks (file size and type limits are enforced there, not in SQL); or anything about the network.
 * Nothing here touches the live Supabase project. All people and data below are made up.
 */

const root = path.resolve(__dirname, "..")
const sql = (f: string) => fs.readFileSync(path.join(root, f), "utf8")
const ORDER = [
  "supabase-migration-v0-baseline.sql",
  "supabase-migration.sql",
  "supabase-migration-v2.sql",
  "supabase-migration-v3.sql",
  "supabase-migration-v4-rls.sql",
  "supabase-migration-v5-exif.sql",
  "supabase-migration-v6-fix-team-policies.sql",
  "supabase-migration-v7-plan-limits.sql",
  "supabase-migration-v8-past-due-grace.sql",
  "supabase-migration-v9-free-project-allowance.sql",
]
const V10 = "supabase-migration-v10-storage-and-function-hardening.sql"

const A = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", email: "alice@example.test" }
const B = { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", email: "bob@example.test" }
const C = { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", email: "carol@example.test" }

let db: PGlite

/** Run SQL as a given database role and signed-in user, then go back to the owner role */
async function as<T = Record<string, unknown>>(who: "anon" | "service" | { id: string; email: string }, query: string, params: unknown[] = []): Promise<T[]> {
  const role = who === "anon" ? "anon" : who === "service" ? "service_role" : "authenticated"
  const claims = typeof who === "object" ? JSON.stringify({ sub: who.id, email: who.email, role: "authenticated" }) : ""
  await db.exec(`SET ROLE ${role}`)
  await db.query(`SELECT set_config('request.jwt.claims', $1, false)`, [claims])
  try {
    const r = await db.query<T>(query, params)
    return r.rows
  } finally {
    await db.exec(`RESET ROLE`)
  }
}
const asAll = (who: Parameters<typeof as>[0], q: string, p: unknown[] = []) => as(who, q, p)
/** Run SQL as the database owner (sees everything), to check what really happened */
const truth = async <T = Record<string, unknown>>(q: string, p: unknown[] = []) => (await db.query<T>(q, p)).rows
const fails = async (fn: () => Promise<unknown>) => { try { await fn(); return false } catch { return true } }

beforeAll(async () => {
  db = new PGlite()
  await db.exec(sql("__tests__/fixtures/supabase-shim.sql"))
  for (const f of ORDER) await db.exec(sql(f))
  for (const u of [A, B, C]) await db.query("INSERT INTO auth.users (id, email) VALUES ($1, $2)", [u.id, u.email])
}, 60000)

describe("nobody who is not signed in can read private data", () => {
  it("the public (anon) role sees no rows in any private table, even when rows exist", async () => {
    await truth("INSERT INTO projects (id, user_id, project_name) VALUES ('11111111-1111-4111-8111-111111111111', $1, 'Alice Roof')", [A.id])
    await truth("INSERT INTO captures (project_id, field_note) VALUES ('11111111-1111-4111-8111-111111111111', 'soft decking')")
    await truth("INSERT INTO adjuster_contacts (user_id, name, email) VALUES ($1, 'Adjuster Example', 'adj@example.test')", [A.id])
    await truth("INSERT INTO activity_log (user_id, action) VALUES ($1, 'x')", [A.id])
    await truth("INSERT INTO company_settings (user_id, company_name) VALUES ($1, 'Alice Roofing')", [A.id])
    await truth("INSERT INTO email_tracking (user_id, recipient_email) VALUES ($1, 'adj@example.test')", [A.id])
    await truth("INSERT INTO team_members (owner_id, member_email, status) VALUES ($1, $2, 'active')", [A.id, C.email])
    await truth("INSERT INTO subscriptions (user_id, status, plan) VALUES ($1, 'active', 'team')", [A.id])
    for (const t of ["projects", "captures", "adjuster_contacts", "activity_log", "company_settings", "email_tracking", "team_members", "subscriptions"]) {
      expect(await asAll("anon", `SELECT * FROM ${t}`), t).toHaveLength(0)
    }
  })
  it("the public role cannot write either", async () => {
    expect(await fails(() => as("anon", "INSERT INTO projects (user_id, project_name) VALUES ($1, 'x')", [A.id]))).toBe(true)
    await as("anon", "UPDATE projects SET project_name = 'hacked'")
    await as("anon", "DELETE FROM projects")
    expect(await truth("SELECT project_name FROM projects")).toEqual([{ project_name: "Alice Roof" }])
  })
})

describe("one signed-in user cannot reach another user's records", () => {
  it("the owner sees their own project and its capture", async () => {
    expect(await as(A, "SELECT project_name FROM projects")).toEqual([{ project_name: "Alice Roof" }])
    expect(await as(A, "SELECT field_note FROM captures")).toEqual([{ field_note: "soft decking" }])
  })
  it("another user sees nothing of it, even by asking for the exact id", async () => {
    expect(await as(B, "SELECT * FROM projects")).toHaveLength(0)
    expect(await as(B, "SELECT * FROM projects WHERE id = '11111111-1111-4111-8111-111111111111'")).toHaveLength(0)
    expect(await as(B, "SELECT * FROM captures")).toHaveLength(0)
    for (const t of ["adjuster_contacts", "activity_log", "company_settings", "email_tracking", "team_members", "subscriptions"]) {
      expect(await as(B, `SELECT * FROM ${t}`), t).toHaveLength(0)
    }
  })
  it("another user cannot change or delete it", async () => {
    await as(B, "UPDATE projects SET project_name = 'stolen' WHERE id = '11111111-1111-4111-8111-111111111111'")
    await as(B, "DELETE FROM projects WHERE id = '11111111-1111-4111-8111-111111111111'")
    await as(B, "UPDATE captures SET field_note = 'stolen'")
    await as(B, "DELETE FROM captures")
    expect(await truth("SELECT project_name FROM projects")).toEqual([{ project_name: "Alice Roof" }])
    expect(await truth("SELECT field_note FROM captures")).toEqual([{ field_note: "soft decking" }])
  })
  it("another user cannot create a project or capture in someone else's name or inside someone else's project", async () => {
    expect(await fails(() => as(B, "INSERT INTO projects (user_id, project_name) VALUES ($1, 'planted')", [A.id]))).toBe(true)
    expect(await fails(() => as(B, "INSERT INTO captures (project_id, field_note) VALUES ('11111111-1111-4111-8111-111111111111', 'planted')"))).toBe(true)
  })
  it("a user cannot move their own project into someone else's account", async () => {
    await truth("INSERT INTO projects (id, user_id, project_name) VALUES ('22222222-2222-4222-8222-222222222222', $1, 'Bob Roof')", [B.id])
    expect(await fails(() => as(B, "UPDATE projects SET user_id = $1 WHERE id = '22222222-2222-4222-8222-222222222222'", [A.id]))).toBe(true)
  })
  it("a user cannot give themselves a paid plan or edit their subscription", async () => {
    expect(await fails(() => as(B, "INSERT INTO subscriptions (user_id, status, plan) VALUES ($1, 'active', 'enterprise')", [B.id]))).toBe(true)
    await as(A, "UPDATE subscriptions SET plan = 'enterprise', status = 'active'")
    await as(A, "DELETE FROM subscriptions")
    expect(await truth("SELECT plan FROM subscriptions WHERE user_id = $1", [A.id])).toEqual([{ plan: "team" }])
  })
  it("a user can read only their own subscription row", async () => {
    expect(await as(A, "SELECT plan FROM subscriptions")).toEqual([{ plan: "team" }])
    expect(await as(B, "SELECT plan FROM subscriptions")).toHaveLength(0)
  })
})

describe("team members get read-only access to their owner's projects, and only when active", () => {
  it("an invited and active member can read the owner's project but not change it", async () => {
    expect(await as(C, "SELECT project_name FROM projects")).toEqual([{ project_name: "Alice Roof" }])
    expect(await as(C, "SELECT field_note FROM captures")).toEqual([{ field_note: "soft decking" }])
    await as(C, "UPDATE projects SET project_name = 'changed' WHERE id = '11111111-1111-4111-8111-111111111111'")
    await as(C, "DELETE FROM projects WHERE id = '11111111-1111-4111-8111-111111111111'")
    expect(await truth("SELECT project_name FROM projects WHERE id = '11111111-1111-4111-8111-111111111111'")).toEqual([{ project_name: "Alice Roof" }])
  })
  it("a member who is only pending sees nothing", async () => {
    await truth("UPDATE team_members SET status = 'pending'")
    expect(await as(C, "SELECT * FROM projects")).toHaveLength(0)
    expect(await as(C, "SELECT * FROM captures")).toHaveLength(0)
    await truth("UPDATE team_members SET status = 'active'")
  })
  it("a member cannot read other owners' projects", async () => {
    await truth("INSERT INTO projects (id, user_id, project_name) VALUES ('33333333-3333-4333-8333-333333333333', $1, 'Bob Other Roof')", [B.id])
    const names = (await as(C, "SELECT project_name FROM projects")).map((r) => (r as { project_name: string }).project_name)
    expect(names).toEqual(["Alice Roof"])
  })
})

describe("free plan limits are enforced by the database, not the browser", () => {
  it("a free account can have the demo plus one project, and no more", async () => {
    const D = { id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", email: "dave@example.test" }
    await truth("INSERT INTO auth.users (id, email) VALUES ($1, $2)", [D.id, D.email])
    await as(D, "INSERT INTO projects (user_id, project_name, claim_number) VALUES ($1, 'Demo Project', 'SF-2026-DEMO')", [D.id])
    await as(D, "INSERT INTO projects (user_id, project_name) VALUES ($1, 'First real job')", [D.id])
    expect(await fails(() => as(D, "INSERT INTO projects (user_id, project_name) VALUES ($1, 'Third')", [D.id]))).toBe(true)
  })
  it("a paid account (activated only by the server) can add more", async () => {
    await truth("INSERT INTO subscriptions (user_id, status, plan) VALUES ($1, 'active', 'starter')", [B.id])
    await as(B, "INSERT INTO projects (user_id, project_name) VALUES ($1, 'Second')", [B.id])
    await as(B, "INSERT INTO projects (user_id, project_name) VALUES ($1, 'Third')", [B.id])
    expect(await as(B, "SELECT count(*)::int AS n FROM projects")).toEqual([{ n: 4 }])
  })
})

describe("photo storage, with only the rules written in the migration files", () => {
  it("another user cannot see, replace or delete someone else's file", async () => {
    await as(A, "INSERT INTO storage.objects (bucket_id, name) VALUES ('test-uploads', 'alice-photo.jpg')")
    expect(await truth("SELECT owner_id FROM storage.objects WHERE name = 'alice-photo.jpg'")).toEqual([{ owner_id: A.id }])
    expect(await as(B, "SELECT * FROM storage.objects")).toHaveLength(0)
    expect(await as(B, "UPDATE storage.objects SET metadata = '{\"tampered\":true}' WHERE name = 'alice-photo.jpg' RETURNING name")).toHaveLength(0)
    expect(await as(B, "DELETE FROM storage.objects WHERE name = 'alice-photo.jpg' RETURNING name")).toHaveLength(0)
  })
  it("FINDING: but with these rules alone the owner cannot delete their own photo either (no permission to read the record)", async () => {
    // So the app's "remove the photos of a deleted project" step quietly removes nothing, if the live database matches the files.
    expect(await as(A, "DELETE FROM storage.objects WHERE name = 'alice-photo.jpg' RETURNING name")).toHaveLength(0)
  })
  it("someone who is not signed in cannot upload, replace or delete", async () => {
    expect(await fails(() => as("anon", "INSERT INTO storage.objects (bucket_id, name) VALUES ('test-uploads', 'anon.jpg')"))).toBe(true)
    expect(await as("anon", "DELETE FROM storage.objects RETURNING name")).toHaveLength(0)
    expect(await as("anon", "UPDATE storage.objects SET metadata = '{}' RETURNING name")).toHaveLength(0)
  })
})

describe("photo storage, if the live database ALSO lets signed-in users read file records (cannot be verified from here)", () => {
  beforeAll(async () => {
    // A rule like this is common in Supabase projects and may exist in the live dashboard even though no migration file has it
    await db.exec("CREATE POLICY tmp_broad_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'test-uploads')")
  })
  it("RISK: any signed-in user can then replace or delete another user's photo", async () => {
    expect(await as(B, "UPDATE storage.objects SET metadata = '{\"tampered\":true}' WHERE name = 'alice-photo.jpg' RETURNING name")).toHaveLength(1)
    expect(await as(B, "DELETE FROM storage.objects WHERE name = 'alice-photo.jpg' RETURNING name")).toHaveLength(1)
  })
})

describe("the plan-check function: the other live risk today", () => {
  it("BEFORE the fix: the public can ask whether any user id has a paid plan (the known live risk)", async () => {
    expect(await as("anon", "SELECT public.user_has_paid_access($1) AS paid", [A.id])).toEqual([{ paid: true }])
  })
})

describe("after the proposed v10 migration", () => {
  beforeAll(async () => {
    await db.exec(sql(V10))
  })

  it("a signed-in user can upload, and replace and delete their own files (even while the broad read rule exists)", async () => {
    await as(A, "INSERT INTO storage.objects (bucket_id, name) VALUES ('test-uploads', 'alice-3.jpg')")
    expect(await as(A, "UPDATE storage.objects SET metadata = '{\"ok\":true}' WHERE name = 'alice-3.jpg' RETURNING name")).toHaveLength(1)
    expect(await as(A, "DELETE FROM storage.objects WHERE name = 'alice-3.jpg' RETURNING name")).toHaveLength(1)
  })
  it("another user can no longer replace or delete someone else's file, even while the broad read rule exists", async () => {
    await as(A, "INSERT INTO storage.objects (bucket_id, name) VALUES ('test-uploads', 'alice-4.jpg')")
    expect(await as(B, "UPDATE storage.objects SET metadata = '{\"tampered\":true}' WHERE name = 'alice-4.jpg' RETURNING name")).toHaveLength(0)
    expect(await as(B, "DELETE FROM storage.objects WHERE name = 'alice-4.jpg' RETURNING name")).toHaveLength(0)
    expect(await truth("SELECT name FROM storage.objects WHERE name = 'alice-4.jpg'")).toHaveLength(1)
  })
  it("another user cannot take over a file by changing its owner", async () => {
    await as(B, "UPDATE storage.objects SET owner_id = $1 WHERE name = 'alice-4.jpg'", [B.id])
    expect(await truth("SELECT owner_id FROM storage.objects WHERE name = 'alice-4.jpg'")).toEqual([{ owner_id: A.id }])
  })
  it("without the broad read rule, owners can still replace and delete their own files, and others still see nothing", async () => {
    await db.exec("DROP POLICY tmp_broad_read ON storage.objects")
    await as(A, "INSERT INTO storage.objects (bucket_id, name) VALUES ('test-uploads', 'alice-5.jpg')")
    expect(await as(B, "SELECT * FROM storage.objects WHERE name = 'alice-5.jpg'")).toHaveLength(0)
    expect(await as(A, "SELECT name FROM storage.objects WHERE name = 'alice-5.jpg'")).toHaveLength(1)
    expect(await as(A, "UPDATE storage.objects SET metadata = '{\"ok\":true}' WHERE name = 'alice-5.jpg' RETURNING name")).toHaveLength(1)
    expect(await as(A, "DELETE FROM storage.objects WHERE name = 'alice-5.jpg' RETURNING name")).toHaveLength(1)
  })
  it("the public role still cannot upload, replace or delete", async () => {
    expect(await fails(() => as("anon", "INSERT INTO storage.objects (bucket_id, name) VALUES ('test-uploads', 'anon2.jpg')"))).toBe(true)
    expect(await as("anon", "DELETE FROM storage.objects RETURNING name")).toHaveLength(0)
  })
  it("the photo bucket now has a size limit and allows only photos and PDFs", async () => {
    const [b] = await truth<{ file_size_limit: string | number; allowed_mime_types: string[] }>("SELECT file_size_limit, allowed_mime_types FROM storage.buckets WHERE id = 'test-uploads'")
    expect(Number(b.file_size_limit)).toBe(15728640)
    expect(b.allowed_mime_types).toContain("image/jpeg")
    expect(b.allowed_mime_types).toContain("application/pdf")
    expect(b.allowed_mime_types).not.toContain("text/html")
    expect(b.allowed_mime_types).not.toContain("image/svg+xml")
  })
  it("the public and signed-in users can no longer ask whether a user id has a paid plan", async () => {
    expect(await fails(() => as("anon", "SELECT public.user_has_paid_access($1)", [A.id]))).toBe(true)
    expect(await fails(() => as(B, "SELECT public.user_has_paid_access($1)", [A.id]))).toBe(true)
  })
  it("the free-plan limits still work after the function is locked down", async () => {
    const E = { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", email: "erin@example.test" }
    await truth("INSERT INTO auth.users (id, email) VALUES ($1, $2)", [E.id, E.email])
    await as(E, "INSERT INTO projects (user_id, project_name, claim_number) VALUES ($1, 'Demo', 'SF-2026-DEMO')", [E.id])
    await as(E, "INSERT INTO projects (user_id, project_name) VALUES ($1, 'One')", [E.id])
    expect(await fails(() => as(E, "INSERT INTO projects (user_id, project_name) VALUES ($1, 'Two')", [E.id]))).toBe(true)
  })
  it("a paid user can still add more projects (the limit trigger still sees their plan)", async () => {
    const before = (await truth<{ n: number }>("SELECT count(*)::int AS n FROM projects WHERE user_id = $1", [B.id]))[0].n
    await as(B, "INSERT INTO projects (user_id, project_name) VALUES ($1, 'After fix')", [B.id])
    expect((await truth<{ n: number }>("SELECT count(*)::int AS n FROM projects WHERE user_id = $1", [B.id]))[0].n).toBe(before + 1)
  })
  it("the server (service role) can still check plans, which is how the app itself does it", async () => {
    expect(await as("service", "SELECT public.user_has_paid_access($1) AS paid", [A.id])).toEqual([{ paid: true }])
  })
  it("every private table is still locked to the public role", async () => {
    for (const t of ["projects", "captures", "subscriptions", "team_members", "email_tracking"]) expect(await as("anon", `SELECT * FROM ${t}`), t).toHaveLength(0)
  })
})
