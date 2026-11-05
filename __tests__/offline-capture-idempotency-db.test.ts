// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest"
import { PGlite } from "@electric-sql/pglite"
import fs from "node:fs"
import path from "node:path"

/**
 * The offline sync saves a finding under an id it works out itself, so a retry cannot create a second copy. This checks
 * that against the project's real migration files (a throwaway in-memory Postgres, same method as
 * database-security.test.ts): a signed-in owner may insert with an explicit id, a second insert with that id is refused
 * with the unique-violation code the app relies on, and nobody else can plant a finding in the owner's project.
 * It shows what the migration files say, not what the live database holds. All people and data are made up.
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

const OWNER = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", email: "alice@example.test" }
const OTHER = { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", email: "bob@example.test" }
const PROJECT = "11111111-1111-4111-8111-111111111111"
const FINDING = "5e5e5e5e-5e5e-5e5e-8e5e-5e5e5e5e5e5e"

let db: PGlite

async function as(who: { id: string; email: string }, query: string, params: unknown[] = []) {
  await db.exec("SET ROLE authenticated")
  await db.query("SELECT set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: who.id, email: who.email, role: "authenticated" })])
  try {
    return (await db.query(query, params)).rows
  } finally {
    await db.exec("RESET ROLE")
  }
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(sql("__tests__/fixtures/supabase-shim.sql"))
  for (const f of ORDER) await db.exec(sql(f))
  for (const u of [OWNER, OTHER]) await db.query("INSERT INTO auth.users (id, email) VALUES ($1, $2)", [u.id, u.email])
  await db.query("INSERT INTO projects (id, user_id, project_name) VALUES ($1, $2, 'Alice Roof')", [PROJECT, OWNER.id])
}, 60000)

const insert = (who: { id: string; email: string }, id: string) =>
  as(who, "INSERT INTO captures (id, project_id, field_note, image_urls) VALUES ($1, $2, 'soft decking', ARRAY[]::text[]) RETURNING id", [id, PROJECT])

describe("saving an offline finding under a fixed id", () => {
  it("the owner can insert with an explicit id", async () => {
    expect(await insert(OWNER, FINDING)).toEqual([{ id: FINDING }])
  })

  it("a second insert with the same id is refused with the unique-violation code, and the owner still sees exactly one", async () => {
    let code: string | undefined
    try {
      await insert(OWNER, FINDING)
    } catch (e) {
      code = (e as { code?: string }).code
    }
    expect(code).toBe("23505")
    expect(await as(OWNER, "SELECT id FROM captures WHERE id = $1", [FINDING])).toHaveLength(1)
  })

  it("the owner can look the finding up by id and sees its project", async () => {
    expect(await as(OWNER, "SELECT id, project_id FROM captures WHERE id = $1", [FINDING])).toEqual([{ id: FINDING, project_id: PROJECT }])
  })

  it("someone else cannot insert into the owner's project or see the finding", async () => {
    let refused = false
    try {
      await insert(OTHER, "6f6f6f6f-6f6f-5f6f-8f6f-6f6f6f6f6f6f")
    } catch {
      refused = true
    }
    expect(refused).toBe(true)
    expect(await as(OTHER, "SELECT id FROM captures WHERE id = $1", [FINDING])).toHaveLength(0)
  })
})
