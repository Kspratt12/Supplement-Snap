// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest"
import { PGlite } from "@electric-sql/pglite"
import fs from "node:fs"
import path from "node:path"

/**
 * Tests the proposed supabase-migration-v13 (least-privilege grants and the two paid-feature direct paths) in a throwaway in-memory
 * Postgres, with the project's real migration files and Supabase's default table grants added (the live database gives anon,
 * authenticated and service_role all privileges on new public tables). All people and data are made up. It shows what the migration
 * files do, not what the live database holds. The route-level plan checks that go with it are in paid-feature-enforcement.test.ts.
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
  "supabase-migration-v10-storage-and-function-hardening.sql",
  "supabase-migration-v11-team-members-owner-read-only.sql",
]
const V13 = "supabase-migration-v13-least-privilege-and-paid-feature-writes.sql"
const V13B = "supabase-migration-v13b-OPTIONAL-default-privileges.sql"
const TABLES = ["projects", "captures", "subscriptions", "team_members", "email_tracking", "adjuster_contacts", "activity_log", "company_settings"]
const PRIVS = ["SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"]

const PRO = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", email: "pro@example.test" } // Pro plan, owns a team
const STARTER = { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", email: "starter@example.test" } // Starter plan
const MEMBER = { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", email: "member@example.test" } // invited to PRO's team
const FREE = { id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", email: "free@example.test" } // no subscription
const PROJECT = "11111111-1111-4111-8111-111111111111"

let db: PGlite

async function as(role: "authenticated" | "anon" | "service_role", who: { id: string; email: string } | null, query: string, params: unknown[] = []) {
  await db.exec(`SET ROLE ${role}`)
  await db.query("SELECT set_config('request.jwt.claims', $1, false)", [JSON.stringify(who ? { sub: who.id, email: who.email, role } : { role })])
  try {
    return (await db.query(query, params)).rows as Record<string, unknown>[]
  } finally {
    await db.exec("RESET ROLE")
  }
}
const denied = async (p: Promise<unknown>) => {
  try {
    await p
    return null
  } catch (e) {
    return (e as { code?: string }).code ?? "error"
  }
}
const privileges = async (role: string, table: string) =>
  (await db.query(`SELECT p FROM unnest($1::text[]) p WHERE has_table_privilege($2, $3::regclass, p)`, [PRIVS, role, `public.${table}`])).rows.map((r) => (r as { p: string }).p)

beforeAll(async () => {
  db = new PGlite()
  await db.exec(sql("__tests__/fixtures/supabase-shim.sql"))
  // What Supabase does for every new table in public (matches the live default ACL: arwdDxtm to the three roles)
  await db.exec("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role")
  for (const f of ORDER) await db.exec(sql(f))
  for (const u of [PRO, STARTER, MEMBER, FREE]) await db.query("INSERT INTO auth.users (id, email) VALUES ($1, $2)", [u.id, u.email])
  await db.query("INSERT INTO subscriptions (user_id, status, plan) VALUES ($1, 'active', 'pro'), ($2, 'active', 'starter')", [PRO.id, STARTER.id])
  await db.query("INSERT INTO team_members (owner_id, member_email, status) VALUES ($1, $2, 'active')", [PRO.id, MEMBER.email])
  await db.query("INSERT INTO projects (id, user_id, project_name) VALUES ($1, $2, 'Pro Roof')", [PROJECT, PRO.id])
  await db.query("INSERT INTO captures (project_id, field_note, image_urls) VALUES ($1, 'note', ARRAY[]::text[])", [PROJECT])
}, 60000)

describe("BEFORE v13: the current state allows the paid-feature direct paths", () => {
  it("every table grants anon and authenticated all seven privileges (this is the live state)", async () => {
    for (const t of TABLES) {
      expect(await privileges("anon", t)).toEqual(PRIVS)
      expect(await privileges("authenticated", t)).toEqual(PRIVS)
    }
  })

  it("a Starter user can write their own company_settings row directly (Pro branding without Pro)", async () => {
    const rows = await as("authenticated", STARTER, "INSERT INTO company_settings (user_id, company_name, logo_url) VALUES ($1, 'Mine Roofing', 'https://x.test/logo.png') RETURNING user_id", [STARTER.id])
    expect(rows).toHaveLength(1)
    const upd = await as("authenticated", STARTER, "UPDATE company_settings SET company_name = 'Changed' WHERE user_id = $1 RETURNING company_name", [STARTER.id])
    expect(upd).toEqual([{ company_name: "Changed" }])
  })

  it("a Starter user can create, edit and read their own email_tracking rows (open tracking without Team)", async () => {
    const ins = await as("authenticated", STARTER, "INSERT INTO email_tracking (user_id, recipient_email, subject, tracking_token) VALUES ($1, 'a@x.test', 's', 'tok-starter') RETURNING tracking_token", [STARTER.id])
    expect(ins).toEqual([{ tracking_token: "tok-starter" }])
    const upd = await as("authenticated", STARTER, "UPDATE email_tracking SET open_count = 5 WHERE tracking_token = 'tok-starter' RETURNING open_count")
    expect(upd).toEqual([{ open_count: 5 }])
    expect(await as("authenticated", STARTER, "SELECT open_count FROM email_tracking")).toEqual([{ open_count: 5 }])
  })
})

describe("AFTER v13", () => {
  beforeAll(async () => {
    await db.exec(sql(V13))
  })

  it("anon has no privilege on any of the 8 tables, and a query is refused", async () => {
    for (const t of TABLES) expect(await privileges("anon", t)).toEqual([])
    expect(await denied(as("anon", null, "SELECT * FROM projects"))).toBe("42501")
    expect(await denied(as("anon", null, "INSERT INTO projects (user_id, project_name) VALUES ($1, 'x')", [FREE.id]))).toBe("42501")
  })

  it("authenticated has no TRUNCATE, TRIGGER or REFERENCES anywhere", async () => {
    for (const t of TABLES) {
      const p = await privileges("authenticated", t)
      expect(p).not.toContain("TRUNCATE")
      expect(p).not.toContain("TRIGGER")
      expect(p).not.toContain("REFERENCES")
    }
    expect(await denied(as("authenticated", PRO, "TRUNCATE captures"))).toBe("42501")
  })

  it("authenticated keeps write access on projects and captures only, reads the rest, and has nothing on email_tracking", async () => {
    expect(await privileges("authenticated", "projects")).toEqual(["SELECT", "INSERT", "UPDATE", "DELETE"])
    expect(await privileges("authenticated", "captures")).toEqual(["SELECT", "INSERT", "UPDATE", "DELETE"])
    for (const t of ["subscriptions", "team_members", "company_settings", "adjuster_contacts", "activity_log"]) {
      expect(await privileges("authenticated", t)).toEqual(["SELECT"])
    }
    expect(await privileges("authenticated", "email_tracking")).toEqual([])
  })

  it("the Starter user can no longer write company_settings, touch email_tracking, or grant themselves a plan or team", async () => {
    expect(await denied(as("authenticated", STARTER, "INSERT INTO company_settings (user_id, company_name) VALUES ($1, 'x')", [STARTER.id]))).toBe("42501")
    expect(await denied(as("authenticated", STARTER, "UPDATE company_settings SET company_name = 'y' WHERE user_id = $1", [STARTER.id]))).toBe("42501")
    expect(await denied(as("authenticated", STARTER, "INSERT INTO email_tracking (user_id, recipient_email, subject) VALUES ($1, 'a@x.test', 's')", [STARTER.id]))).toBe("42501")
    expect(await denied(as("authenticated", STARTER, "UPDATE email_tracking SET open_count = 9 WHERE user_id = $1", [STARTER.id]))).toBe("42501")
    expect(await denied(as("authenticated", STARTER, "SELECT open_count FROM email_tracking"))).toBe("42501")
    expect(await denied(as("authenticated", STARTER, "UPDATE subscriptions SET plan = 'pro' WHERE user_id = $1", [STARTER.id]))).toBe("42501")
    expect(await denied(as("authenticated", STARTER, "INSERT INTO team_members (owner_id, member_email, status) VALUES ($1, 'x@x.test', 'active')", [STARTER.id]))).toBe("42501")
    expect((await db.query("SELECT plan FROM subscriptions WHERE user_id = $1", [STARTER.id])).rows).toEqual([{ plan: "starter" }])
  })

  it("only company_settings_select remains among the two tables' policies, and Row Level Security is still on for all 8 tables", async () => {
    const pol = (await db.query("SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename IN ('company_settings','email_tracking') ORDER BY 1")).rows
    expect(pol).toEqual([{ policyname: "company_settings_select" }])
    const rls = (await db.query("SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity")).rows
    expect(rls).toEqual([])
  })

  it("owners still use projects and captures normally (insert, read, update, delete their own)", async () => {
    const p = await as("authenticated", PRO, "INSERT INTO projects (user_id, project_name) VALUES ($1, 'Second') RETURNING id", [PRO.id])
    expect(p).toHaveLength(1)
    const c = await as("authenticated", PRO, "INSERT INTO captures (project_id, field_note, image_urls) VALUES ($1, 'n2', ARRAY[]::text[]) RETURNING id", [PROJECT])
    expect(c).toHaveLength(1)
    expect(await as("authenticated", PRO, "UPDATE captures SET field_note = 'edited' WHERE id = $1 RETURNING field_note", [c[0].id])).toEqual([{ field_note: "edited" }])
    expect(await as("authenticated", PRO, "DELETE FROM captures WHERE id = $1 RETURNING id", [c[0].id])).toHaveLength(1)
    expect(await as("authenticated", PRO, "DELETE FROM projects WHERE id = $1 RETURNING id", [p[0].id])).toHaveLength(1)
  })

  it("the Free-plan limits still apply (the triggers do not depend on the revoked grants)", async () => {
    await as("authenticated", FREE, "INSERT INTO projects (user_id, project_name) VALUES ($1, 'Demo')", [FREE.id])
    await as("authenticated", FREE, "INSERT INTO projects (user_id, project_name) VALUES ($1, 'Mine')", [FREE.id])
    expect(await denied(as("authenticated", FREE, "INSERT INTO projects (user_id, project_name) VALUES ($1, 'Third')", [FREE.id]))).toBe("P0001")
  })

  it("an invited team member can still read the owner's projects, captures and their own membership, and still cannot write", async () => {
    expect(await as("authenticated", MEMBER, "SELECT id FROM projects")).toEqual([{ id: PROJECT }])
    expect((await as("authenticated", MEMBER, "SELECT id FROM captures")).length).toBeGreaterThan(0)
    expect(await as("authenticated", MEMBER, "SELECT member_email FROM team_members")).toEqual([{ member_email: MEMBER.email }])
    expect(await as("authenticated", MEMBER, "UPDATE projects SET project_name = 'hijack' WHERE id = $1 RETURNING id", [PROJECT])).toEqual([])
    expect(await denied(as("authenticated", MEMBER, "INSERT INTO captures (project_id, image_urls) VALUES ($1, ARRAY[]::text[])", [PROJECT]))).toBe("42501")
  })

  it("users still read their own subscription, team list and company_settings row; existing rows are untouched", async () => {
    expect(await as("authenticated", PRO, "SELECT plan FROM subscriptions")).toEqual([{ plan: "pro" }])
    expect(await as("authenticated", PRO, "SELECT member_email FROM team_members")).toEqual([{ member_email: MEMBER.email }])
    expect(await as("authenticated", STARTER, "SELECT company_name FROM company_settings")).toEqual([{ company_name: "Changed" }])
    // the row the Starter user wrote before v13 still exists (it is the server's plan check that decides whether it is used)
    expect((await db.query("SELECT count(*)::int AS n FROM email_tracking WHERE tracking_token = 'tok-starter'")).rows).toEqual([{ n: 1 }])
  })

  it("the server (service_role) keeps every path: webhook, branding route, tracking route and pixel, team and contacts", async () => {
    for (const t of TABLES) {
      const p = (await db.query(`SELECT p FROM unnest($1::text[]) p WHERE has_table_privilege('service_role', $2::regclass, p)`, [["SELECT", "INSERT", "UPDATE", "DELETE"], `public.${t}`])).rows
      expect(p).toHaveLength(4)
    }
    expect(await as("service_role", null, "INSERT INTO company_settings (user_id, company_name) VALUES ($1, 'Pro Co') RETURNING company_name", [PRO.id])).toEqual([{ company_name: "Pro Co" }])
    expect(await as("service_role", null, "SELECT company_name FROM company_settings WHERE user_id = $1", [STARTER.id])).toEqual([{ company_name: "Changed" }])
    expect(await as("service_role", null, "INSERT INTO email_tracking (user_id, recipient_email, subject, tracking_token) VALUES ($1, 'a@x.test', 's', 'tok-pro') RETURNING tracking_token", [PRO.id])).toEqual([{ tracking_token: "tok-pro" }])
    // the public pixel: no login, the server looks the row up by token and records the open
    expect(await as("service_role", null, "SELECT open_count FROM email_tracking WHERE tracking_token = 'tok-pro'")).toEqual([{ open_count: 0 }])
    expect(await as("service_role", null, "UPDATE email_tracking SET open_count = open_count + 1 WHERE tracking_token = 'tok-pro' RETURNING open_count")).toEqual([{ open_count: 1 }])
    expect(await as("service_role", null, "SELECT count(*)::int AS n FROM email_tracking WHERE user_id = $1 AND open_count > 0", [PRO.id])).toEqual([{ n: 1 }])
    expect(await as("service_role", null, "UPDATE subscriptions SET plan = 'team' WHERE user_id = $1 RETURNING plan", [STARTER.id])).toEqual([{ plan: "team" }])
    expect(await as("service_role", null, "INSERT INTO team_members (owner_id, member_email, status) VALUES ($1, 'new@x.test', 'pending') RETURNING status", [PRO.id])).toEqual([{ status: "pending" }])
  })

  it("applying v13 twice is harmless", async () => {
    await db.exec(sql(V13))
    expect(await privileges("anon", "projects")).toEqual([])
  })
})

describe("v13b (optional, separate): default privileges for future tables", () => {
  it("before it, a new table gets the broad grants; after it, anon gets nothing and authenticated loses TRUNCATE/TRIGGER/REFERENCES, service_role is unchanged", async () => {
    await db.exec("CREATE TABLE public.zz_before (id int)")
    expect(await privileges("anon", "zz_before")).toEqual(PRIVS)
    await db.exec(sql(V13B))
    await db.exec("CREATE TABLE public.zz_after (id int)")
    expect(await privileges("anon", "zz_after")).toEqual([])
    expect(await privileges("authenticated", "zz_after")).toEqual(["SELECT", "INSERT", "UPDATE", "DELETE"])
    const svc = (await db.query(`SELECT p FROM unnest($1::text[]) p WHERE has_table_privilege('service_role', 'public.zz_after'::regclass, p)`, [["SELECT", "INSERT", "UPDATE", "DELETE"]])).rows
    expect(svc).toHaveLength(4)
    // existing tables are not touched by v13b
    expect(await privileges("authenticated", "projects")).toEqual(["SELECT", "INSERT", "UPDATE", "DELETE"])
  })

  it("v13b is not part of v13", () => {
    expect(sql(V13)).not.toMatch(/ALTER DEFAULT PRIVILEGES/)
  })
})

describe("the app's browser code never reads or writes what v13 closes", () => {
  const files = (dir: string): string[] =>
    fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => {
      const rel = path.join(dir, e.name)
      if (e.isDirectory()) return e.name === "api" || e.name === "node_modules" ? [] : files(rel)
      return /\.(ts|tsx)$/.test(e.name) ? [rel] : []
    })
  // Server-side helpers that use the service key; everything under app/api is also server-side and excluded above
  const SERVER = new Set(["lib/plan.ts", "lib/auth-utils.ts", "lib/admin-auth.ts"])
  const client = () => [...files("app"), ...files("lib")].filter((f) => !SERVER.has(f.replace(/\\/g, "/")))

  it("no client file inserts, updates, upserts or deletes on subscriptions, team_members, email_tracking, company_settings, adjuster_contacts or activity_log", () => {
    const re = /\.from\("(subscriptions|team_members|email_tracking|company_settings|adjuster_contacts|activity_log)"\)[\s\S]{0,300}?\.(insert|update|upsert|delete)\(/
    expect(client().filter((f) => re.test(fs.readFileSync(path.join(root, f), "utf8")))).toEqual([])
  })

  it("no client file touches email_tracking at all (every read goes through the plan-checked server route)", () => {
    expect(client().filter((f) => /\.from\("email_tracking"\)/.test(fs.readFileSync(path.join(root, f), "utf8")))).toEqual([])
  })

  it("the supabase client used in the browser is the anon-key client", () => {
    expect(sql("lib/supabase.ts")).toMatch(/NEXT_PUBLIC_SUPABASE_ANON_KEY/)
    expect(sql("lib/supabase.ts")).not.toMatch(/SERVICE_ROLE/)
  })
})
