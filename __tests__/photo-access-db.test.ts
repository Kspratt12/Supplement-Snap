// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest"
import { PGlite } from "@electric-sql/pglite"
import fs from "node:fs"
import path from "node:path"
import { decidePhotoAccess, type PhotoReader } from "../lib/photo-access-core"

/**
 * The permission check for private photos, run against the project's REAL row rules (the migration files, in order,
 * in a throwaway in-memory Postgres) with real database roles, the same way database-security.test.ts does.
 *
 * What this proves: with the same three reads the route makes (project, its findings, own company settings) run AS each
 * user, the owner and an active team member are allowed their project's files, and a stranger, a pending member and a
 * signed-out caller are denied, including when they ask for the exact file name.
 * What it does NOT prove: that the live database has the same rules (migration v10 was confirmed live on 2026-11-12 for
 * the storage rules; the table rules are assumed to match these files), the storage service's own signing, or expiry.
 * All people, files and projects here are made up.
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

const A = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", email: "alice@example.test" } // owner
const B = { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", email: "bob@example.test" } // stranger with their own project
const C = { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", email: "carol@example.test" } // active team member of A
const D = { id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", email: "dan@example.test" } // invited by A, still pending
type User = { id: string; email: string }

const PA = "11111111-1111-4111-8111-111111111111"
const PB = "22222222-2222-4222-8222-222222222222"
const BASE = "https://example-project.supabase.co/storage/v1/object/public/test-uploads"
const url = (name: string) => `${BASE}/${name}`
const A_PHOTO = url("1700000000000-aaaa-photo-0.jpg")
const A_LEGACY = url("1600000000000-aaaa-legacy.jpg")
const A_DIAGRAM = url("diagrams/1700000000000-aaaa.pdf")
const A_LOGO = url("logo-alice-1111-logo.png")
const B_PHOTO = url("1700000000000-bbbb-photo-0.jpg")
const B_LOGO = url("logo-bob-2222-logo.png")

let db: PGlite

async function as<T = Record<string, unknown>>(who: "anon" | User, query: string, params: unknown[] = []): Promise<T[]> {
  const role = who === "anon" ? "anon" : "authenticated"
  const claims = who === "anon" ? "" : JSON.stringify({ sub: who.id, email: who.email, role: "authenticated" })
  await db.exec(`SET ROLE ${role}`)
  await db.query(`SELECT set_config('request.jwt.claims', $1, false)`, [claims])
  try {
    return (await db.query<T>(query, params)).rows
  } finally {
    await db.exec(`RESET ROLE`)
  }
}

/** The same three reads app/api/photo-urls/route.ts makes, run as one user. */
function readerFor(who: "anon" | User): PhotoReader {
  return {
    projectDiagramUrl: async (id) => {
      const rows = await as<{ diagram_url: string | null }>(who, "SELECT diagram_url FROM projects WHERE id = $1", [id])
      return rows.length ? { visible: true, diagramUrl: rows[0].diagram_url } : { visible: false, diagramUrl: null }
    },
    projectPhotoUrls: async (id) => {
      const rows = await as<{ image_url: string | null; image_urls: string[] | null }>(who, "SELECT image_url, image_urls FROM captures WHERE project_id = $1", [id])
      return rows.flatMap((r) => [r.image_url, ...(r.image_urls || [])])
    },
    ownLogoUrl: async () => {
      if (who === "anon") return null
      const rows = await as<{ logo_url: string | null }>(who, "SELECT logo_url FROM company_settings WHERE user_id = $1", [who.id])
      return rows[0]?.logo_url ?? null
    },
  }
}

const allowedNames = async (who: "anon" | User, projectId: string | undefined, urls: string[]) =>
  (await decidePhotoAccess({ reader: readerFor(who), projectId, urls })).allowed.map((a) => a.url)

beforeAll(async () => {
  db = new PGlite()
  await db.exec(sql("__tests__/fixtures/supabase-shim.sql"))
  for (const f of ORDER) await db.exec(sql(f))
  for (const u of [A, B, C, D]) await db.query("INSERT INTO auth.users (id, email) VALUES ($1, $2)", [u.id, u.email])
  await db.query("INSERT INTO projects (id, user_id, project_name, diagram_url) VALUES ($1, $2, 'Alice Roof', $3)", [PA, A.id, A_DIAGRAM])
  await db.query("INSERT INTO projects (id, user_id, project_name) VALUES ($1, $2, 'Bob Roof')", [PB, B.id])
  await db.query("INSERT INTO captures (project_id, image_url, image_urls) VALUES ($1, $2, $3)", [PA, A_PHOTO, [A_PHOTO]])
  await db.query("INSERT INTO captures (project_id, image_url, image_urls) VALUES ($1, $2, NULL)", [PA, A_LEGACY]) // older finding: only image_url
  await db.query("INSERT INTO captures (project_id, image_url, image_urls) VALUES ($1, $2, $3)", [PB, B_PHOTO, [B_PHOTO]])
  await db.query("INSERT INTO company_settings (user_id, company_name, logo_url) VALUES ($1, 'Alice Roofing', $2)", [A.id, A_LOGO])
  await db.query("INSERT INTO company_settings (user_id, company_name, logo_url) VALUES ($1, 'Bob Roofing', $2)", [B.id, B_LOGO])
  await db.query("INSERT INTO team_members (owner_id, member_email, status) VALUES ($1, $2, 'active')", [A.id, C.email])
  await db.query("INSERT INTO team_members (owner_id, member_email, status) VALUES ($1, $2, 'pending')", [A.id, D.email])
}, 60000)

describe("control: the denials below come from the row rules, not from the test setup", () => {
  it("the same question asked with no row rules (as the database owner) would have been answered with the files", async () => {
    const asOwnerRole: PhotoReader = {
      projectDiagramUrl: async (id) => { const r = (await db.query<{ diagram_url: string | null }>("SELECT diagram_url FROM projects WHERE id = $1", [id])).rows; return r.length ? { visible: true, diagramUrl: r[0].diagram_url } : { visible: false, diagramUrl: null } },
      projectPhotoUrls: async (id) => (await db.query<{ image_url: string | null; image_urls: string[] | null }>("SELECT image_url, image_urls FROM captures WHERE project_id = $1", [id])).rows.flatMap((r) => [r.image_url, ...(r.image_urls || [])]),
      ownLogoUrl: async () => null,
    }
    const d = await decidePhotoAccess({ reader: asOwnerRole, projectId: PA, urls: [A_PHOTO, A_DIAGRAM] })
    expect(d.allowed).toHaveLength(2)
  })
})

describe("private photo access follows the database's own row rules", () => {
  it("the owner is allowed every file on their project, including an older finding that only has image_url, the diagram, and their logo", async () => {
    expect((await allowedNames(A, PA, [A_PHOTO, A_LEGACY, A_DIAGRAM, A_LOGO])).sort()).toEqual([A_PHOTO, A_LEGACY, A_DIAGRAM, A_LOGO].sort())
  })

  it("an active team member is allowed the owner's project files (same read access as today) but not the owner's logo", async () => {
    expect((await allowedNames(C, PA, [A_PHOTO, A_LEGACY, A_DIAGRAM])).sort()).toEqual([A_PHOTO, A_LEGACY, A_DIAGRAM].sort())
    expect(await allowedNames(C, PA, [A_LOGO])).toEqual([])
  })

  it("a stranger is denied another account's files, even asking for the exact file name and project id", async () => {
    expect(await allowedNames(B, PA, [A_PHOTO, A_LEGACY, A_DIAGRAM, A_LOGO])).toEqual([])
    expect(await allowedNames(B, undefined, [A_PHOTO, A_LOGO])).toEqual([])
  })

  it("a stranger cannot launder a file by naming their own project", async () => {
    expect(await allowedNames(B, PB, [A_PHOTO])).toEqual([])
    expect(await allowedNames(B, PB, [B_PHOTO, A_PHOTO])).toEqual([B_PHOTO])
  })

  it("the owner cannot get another account's files either", async () => {
    expect(await allowedNames(A, PB, [B_PHOTO, B_LOGO])).toEqual([])
    expect(await allowedNames(A, PA, [B_PHOTO, B_LOGO])).toEqual([])
  })

  it("a member who is only invited (pending) is denied, and a signed-out caller is denied", async () => {
    expect(await allowedNames(D, PA, [A_PHOTO, A_DIAGRAM])).toEqual([])
    expect(await allowedNames("anon", PA, [A_PHOTO, A_DIAGRAM, A_LOGO])).toEqual([])
  })

  it("access ends when the member is removed or made pending, with no change to the photo code", async () => {
    await db.query("UPDATE team_members SET status = 'pending' WHERE member_email = $1", [C.email])
    expect(await allowedNames(C, PA, [A_PHOTO])).toEqual([])
    await db.query("UPDATE team_members SET status = 'active' WHERE member_email = $1", [C.email])
    expect(await allowedNames(C, PA, [A_PHOTO])).toEqual([A_PHOTO])
    await db.query("DELETE FROM team_members WHERE member_email = $1", [C.email])
    expect(await allowedNames(C, PA, [A_PHOTO])).toEqual([])
    await db.query("INSERT INTO team_members (owner_id, member_email, status) VALUES ($1, $2, 'active')", [A.id, C.email])
  })
})
