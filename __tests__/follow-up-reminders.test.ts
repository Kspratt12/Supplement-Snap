// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest"
import { PGlite } from "@electric-sql/pglite"
import fs from "node:fs"
import path from "node:path"
import { runReminders, dateInZone, isDue, reminderMessage, MAX_ATTEMPTS, type ReminderDeps, type ReminderProject } from "../lib/follow-up-reminders"

const p = (over: Partial<ReminderProject> = {}): ReminderProject => ({ id: "p1", user_id: "u1", project_name: "Synthetic <Roof>", follow_up_on: "2026-11-20", reminder_opt_in: true, reminder_tz: "America/New_York", ...over })

// A fake provider and a fake claim store with the same one-row-per-(project, date) rule as the migration
function fakes(projects: ReminderProject[], over: Partial<ReminderDeps> = {}) {
  const sends: { to: string; subject: string; text: string }[] = []
  const rows = new Map<string, { status: string; attempts: number }>()
  const deps: ReminderDeps = {
    candidates: async () => projects,
    claim: async (id, date) => {
      const k = `${id}|${date}`, r = rows.get(k)
      if (!r) { rows.set(k, { status: "claimed", attempts: 1 }); return "claimed" }
      if (r.status === "failed" && r.attempts < MAX_ATTEMPTS) { r.status = "claimed"; r.attempts++; return "claimed" }
      return "skip"
    },
    ownerEmail: async (u) => (u === "u1" ? "owner@example.com" : null),
    send: async (m) => { sends.push(m); return { id: `msg-${sends.length}` } },
    markSent: async (id, date) => { rows.get(`${id}|${date}`)!.status = "sent" },
    markFailed: async (id, date) => { rows.get(`${id}|${date}`)!.status = "failed" },
    ...over,
  }
  return { deps, sends, rows }
}
const at = (iso: string) => new Date(iso)

describe("which reminders are due", () => {
  it("uses the owner's own time zone at the date boundary", () => {
    // 03:30 UTC on the 20th is still the 19th in New York
    expect(dateInZone(at("2026-11-20T03:30:00Z"), "America/New_York")).toBe("2026-11-19")
    expect(isDue(p(), at("2026-11-20T03:30:00Z"))).toBe(false)
    expect(isDue(p(), at("2026-11-20T05:30:00Z"))).toBe(true)
    expect(dateInZone(at("2026-11-20T03:30:00Z"), "Not/AZone")).toBe("2026-11-20") // unknown zone: UTC, no guessing
  })
  it("needs opt-in and a date", () => {
    expect(isDue(p({ reminder_opt_in: false }), at("2026-11-21T12:00:00Z"))).toBe(false)
    expect(isDue(p({ follow_up_on: null }), at("2026-11-21T12:00:00Z"))).toBe(false)
  })
})

describe("running the job", () => {
  const now = at("2026-11-20T15:00:00Z")
  it("with sending off, nothing is claimed or sent; it only reports", async () => {
    const f = fakes([p()])
    expect(await runReminders(f.deps, { now, send: false, siteUrl: "https://x" })).toMatchObject({ due: 1, wouldSend: 1, sent: 0 })
    expect(f.sends).toHaveLength(0)
    expect(f.rows.size).toBe(0)
  })
  it("sends once to the owner's own address, never twice across runs", async () => {
    const f = fakes([p()])
    await runReminders(f.deps, { now, send: true, siteUrl: "https://x" })
    await runReminders(f.deps, { now, send: true, siteUrl: "https://x" })
    expect(f.sends.map((s) => s.to)).toEqual(["owner@example.com"])
  })
  it("two runs at the same time send once", async () => {
    const f = fakes([p()])
    await Promise.all([runReminders(f.deps, { now, send: true, siteUrl: "https://x" }), runReminders(f.deps, { now, send: true, siteUrl: "https://x" })])
    expect(f.sends).toHaveLength(1)
  })
  it("a changed date gets its own reminder; a cleared date or opt-out gets none", async () => {
    const list = [p()]
    const f = fakes(list)
    await runReminders(f.deps, { now, send: true, siteUrl: "https://x" })
    list[0] = p({ follow_up_on: "2026-11-25" })
    await runReminders(f.deps, { now: at("2026-11-25T15:00:00Z"), send: true, siteUrl: "https://x" })
    list[0] = p({ follow_up_on: null })
    await runReminders(f.deps, { now: at("2026-11-30T15:00:00Z"), send: true, siteUrl: "https://x" })
    list[0] = p({ follow_up_on: "2026-12-01", reminder_opt_in: false })
    await runReminders(f.deps, { now: at("2026-12-02T15:00:00Z"), send: true, siteUrl: "https://x" })
    expect(f.sends).toHaveLength(2)
  })
  it("failed sends retry on later runs up to the limit, then stop", async () => {
    const f = fakes([p()], {})
    f.deps.send = async () => { throw new Error("provider down") }
    for (let i = 0; i < 6; i++) await runReminders(f.deps, { now, send: true, siteUrl: "https://x" })
    expect(f.rows.get("p1|2026-11-20")).toEqual({ status: "failed", attempts: MAX_ATTEMPTS })
  })
  it("a deleted owner account gets nothing and is marked failed", async () => {
    const f = fakes([p({ user_id: "gone" })])
    expect(await runReminders(f.deps, { now, send: true, siteUrl: "https://x" })).toMatchObject({ failed: 1, sent: 0 })
    expect(f.sends).toHaveLength(0)
  })
  it("the email holds only the project name and a sign-in link, escaped", () => {
    const m = reminderMessage(p(), "https://supplementsnap.io/")
    expect(m.html).toContain("Synthetic &lt;Roof&gt;")
    expect(m.text).toContain("https://supplementsnap.io/app?project=p1")
    expect(m.text).not.toMatch(/claim|adjuster|\$/i)
  })
})

describe("supabase-migration-v18 (proposed)", () => {
  const root = path.resolve(__dirname, "..")
  const sql = (f: string) => fs.readFileSync(path.join(root, f), "utf8")
  let db: PGlite
  beforeAll(async () => {
    db = new PGlite()
    await db.exec(sql("__tests__/fixtures/supabase-shim.sql"))
    await db.exec("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role")
    for (const f of ["supabase-migration-v0-baseline.sql", "supabase-migration.sql", "supabase-migration-v2.sql", "supabase-migration-v3.sql", "supabase-migration-v4-rls.sql", "supabase-migration-v5-exif.sql", "supabase-migration-v6-fix-team-policies.sql", "supabase-migration-v7-plan-limits.sql", "supabase-migration-v8-past-due-grace.sql", "supabase-migration-v9-free-project-allowance.sql", "supabase-migration-v10-storage-and-function-hardening.sql", "supabase-migration-v11-team-members-owner-read-only.sql", "supabase-migration-v13-least-privilege-and-paid-feature-writes.sql", "supabase-migration-v16-claim-tracking-report-order-diagram-pins.sql", "supabase-migration-v18-follow-up-reminders.sql"]) await db.exec(sql(f))
    await db.query("INSERT INTO auth.users (id, email) VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'o@example.test')")
    await db.query("INSERT INTO projects (id, user_id, project_name) VALUES ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'j')")
  }, 60000)
  it("opt-in is off for existing projects, one send row per project and date, and signed-in users cannot touch the send log", async () => {
    expect((await db.query("SELECT reminder_opt_in FROM projects")).rows).toEqual([{ reminder_opt_in: false }])
    await db.query("INSERT INTO follow_up_reminder_sends (project_id, follow_up_on) VALUES ('11111111-1111-4111-8111-111111111111', '2026-11-20')")
    await expect(db.query("INSERT INTO follow_up_reminder_sends (project_id, follow_up_on) VALUES ('11111111-1111-4111-8111-111111111111', '2026-11-20')")).rejects.toMatchObject({ code: "23505" })
    await db.exec("SET ROLE authenticated")
    try {
      await expect(db.query("SELECT * FROM follow_up_reminder_sends")).rejects.toMatchObject({ code: "42501" })
    } finally {
      await db.exec("RESET ROLE")
    }
    await db.query("DELETE FROM projects")
    expect((await db.query("SELECT count(*)::int AS n FROM follow_up_reminder_sends")).rows[0]).toEqual({ n: 0 })
  })
})
