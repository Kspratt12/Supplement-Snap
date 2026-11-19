// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest"
import { PGlite } from "@electric-sql/pglite"
import fs from "node:fs"
import path from "node:path"
import { serverCaptureId } from "../lib/sync-capture"

/**
 * The save sequence the capture screen now uses, run against the project's real migration files in a throwaway Postgres:
 * the online save and its queued retry share one row id (serverCaptureId of the queue id), so a save whose answer was lost
 * is found, not saved twice, and another account can neither plant nor see it. Shows what the migrations do, not what the
 * live database holds. All data is made up.
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
const OWNER = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", email: "owner@example.test" }
const OTHER = { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", email: "other@example.test" }
const PROJECT = "11111111-1111-4111-8111-111111111111"
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

beforeAll(async () => {
  db = new PGlite()
  await db.exec(sql("__tests__/fixtures/supabase-shim.sql"))
  await db.exec("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role")
  for (const f of ORDER) await db.exec(sql(f))
  for (const u of [OWNER, OTHER]) await db.query("INSERT INTO auth.users (id, email) VALUES ($1, $2)", [u.id, u.email])
  for (const u of [OWNER, OTHER]) await db.query("INSERT INTO subscriptions (user_id, status, plan) VALUES ($1, 'active', 'starter')", [u.id])
  await db.query("INSERT INTO projects (id, user_id, project_name) VALUES ($1, $2, 'Owner job')", [PROJECT, OWNER.id])
}, 60000)

const insertRow = (who: typeof OWNER, id: string, note: string, createdAt?: string) =>
  as(who, `INSERT INTO captures (id, project_id, field_note, image_url, image_urls, photo_metadata, status, quantity${createdAt ? ", created_at" : ""})
           VALUES ($1, $2, $3, 'https://x/test-uploads/a.jpg', ARRAY['https://x/test-uploads/a.jpg'], '[{"latitude":35.1,"shot":"wide"}]', 'Captured', 1${createdAt ? ", $4" : ""}) RETURNING id`,
     createdAt ? [id, PROJECT, note, createdAt] : [id, PROJECT, note])

describe("online save and queued retry share one row id", () => {
  it("the id is a valid uuid, the same for the same queue entry, different for different entries", async () => {
    const a = await serverCaptureId("offline-1-abc")
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(await serverCaptureId("offline-1-abc")).toBe(a)
    expect(await serverCaptureId("offline-2-abc")).not.toBe(a)
  })

  it("lost answer: the row is saved, the retry is refused as a duplicate, and the lookup finds the one row with its photo and details", async () => {
    const id = await serverCaptureId("offline-lost-answer")
    expect(await insertRow(OWNER, id, "answer lost")).toHaveLength(1) // committed; pretend the reply never arrived
    expect(await errCode(insertRow(OWNER, id, "answer lost"))).toBe("23505") // the queued retry
    const found = await as(OWNER, "SELECT project_id, image_urls, photo_metadata FROM captures WHERE id = $1", [id])
    expect(found).toEqual([{ project_id: PROJECT, image_urls: ["https://x/test-uploads/a.jpg"], photo_metadata: [{ latitude: 35.1, shot: "wide" }] }])
    expect((await as(OWNER, "SELECT count(*)::int AS n FROM captures WHERE field_note = 'answer lost'"))[0].n).toBe(1)
  })

  it("a queued finding keeps the device's recorded time", async () => {
    const id = await serverCaptureId("offline-device-time")
    await insertRow(OWNER, id, "device time", "2026-11-17T09:30:00Z")
    const [row] = await as(OWNER, "SELECT created_at FROM captures WHERE id = $1", [id])
    expect(new Date(row.created_at as string).toISOString()).toBe("2026-11-17T09:30:00.000Z")
  })

  it("another account cannot save a queued finding into the owner's project, nor see one by its id", async () => {
    const id = await serverCaptureId("offline-other-account")
    expect(await errCode(insertRow(OTHER, id, "planted"))).toBe("42501")
    const ownerId = await serverCaptureId("offline-lost-answer")
    expect(await as(OTHER, "SELECT id FROM captures WHERE id = $1", [ownerId])).toEqual([]) // looks like "not saved" to them
  })

  it("the public role sees nothing", async () => {
    await db.exec("SET ROLE anon")
    try {
      const r = await db.query("SELECT id FROM captures").then((x) => x.rows.length, (e) => (e as { code?: string }).code)
      expect([0, "42501"]).toContain(r)
    } finally {
      await db.exec("RESET ROLE")
    }
  })
})
