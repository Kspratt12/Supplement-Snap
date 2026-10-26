// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"
import { needsSetupReminder } from "../lib/setup-reminders"

const NOW = new Date("2026-10-29T15:00:00Z")
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString()

describe("needsSetupReminder", () => {
  it("waits three days before the first reminder", () => {
    expect(needsSetupReminder({ createdAt: hoursAgo(71), paid: true }, NOW)).toBe(false)
    expect(needsSetupReminder({ createdAt: hoursAgo(73), paid: true }, NOW)).toBe(true)
  })
  it("never reminds someone who has signed in, or who has not paid", () => {
    expect(needsSetupReminder({ createdAt: hoursAgo(200), lastSignInAt: hoursAgo(5), paid: true }, NOW)).toBe(false)
    expect(needsSetupReminder({ createdAt: hoursAgo(200), paid: false }, NOW)).toBe(false)
  })
  it("sends a second reminder a week after the first, and then stops", () => {
    expect(needsSetupReminder({ createdAt: hoursAgo(500), remindersSent: 1, lastReminderAt: hoursAgo(24 * 3), paid: true }, NOW)).toBe(false)
    expect(needsSetupReminder({ createdAt: hoursAgo(500), remindersSent: 1, lastReminderAt: hoursAgo(24 * 8), paid: true }, NOW)).toBe(true)
    expect(needsSetupReminder({ createdAt: hoursAgo(900), remindersSent: 2, lastReminderAt: hoursAgo(24 * 30), paid: true }, NOW)).toBe(false)
  })
  it("does nothing for a bad date instead of sending by mistake", () => {
    expect(needsSetupReminder({ createdAt: "not a date", paid: true }, NOW)).toBe(false)
    expect(needsSetupReminder({ createdAt: hoursAgo(500), remindersSent: 1, paid: true }, NOW)).toBe(false)
  })
})

// The route itself, with the database and the email service replaced
const world = vi.hoisted(() => ({
  users: [] as Array<{ id: string; email: string; created_at: string; last_sign_in_at?: string | null; user_metadata?: Record<string, unknown> }>,
  paid: [] as string[],
  sent: [] as Array<{ to: string[]; subject: string; replyTo?: string }>,
  metaUpdates: [] as Array<{ id: string; meta: Record<string, unknown> }>,
  emailFails: false,
}))

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({ select: () => ({ in: () => ({ not: async () => ({ data: world.paid.map((id) => ({ user_id: id, status: "active" })) }) }) }) }),
    auth: {
      admin: {
        listUsers: async () => ({ data: { users: world.users } }),
        generateLink: async () => ({ data: { properties: { action_link: "https://example.test/link" } }, error: null }),
        updateUserById: async (id: string, p: { user_metadata: Record<string, unknown> }) => (world.metaUpdates.push({ id, meta: p.user_metadata }), { error: null }),
      },
    },
  }),
}))
vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: async (m: { to: string[]; subject: string; replyTo?: string }) => {
        if (world.emailFails) return { data: null, error: { message: "boom" } }
        world.sent.push({ to: m.to, subject: m.subject, replyTo: m.replyTo })
        return { data: { id: "e1" }, error: null }
      },
    }
  },
}))

import { GET } from "../app/api/account-setup-reminders/route"

const call = (auth = "Bearer secret") => GET(new Request("http://localhost/api/account-setup-reminders", { headers: auth ? { authorization: auth } : {} }))
const old = new Date(Date.now() - 5 * 86_400_000).toISOString()

beforeEach(() => {
  world.users = []
  world.paid = []
  world.sent = []
  world.metaUpdates = []
  world.emailFails = false
  vi.stubEnv("CRON_SECRET", "secret")
  vi.stubEnv("RESEND_API_KEY", "re_x")
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "svc")
})

describe("account setup reminder route", () => {
  it("refuses requests without the cron secret", async () => {
    expect((await call("")).status).toBe(401)
    expect((await call("Bearer wrong")).status).toBe(401)
  })
  it("reminds a paying customer who never signed in, and records that it did", async () => {
    world.users = [{ id: "u1", email: "crystal@example.com", created_at: old, last_sign_in_at: null, user_metadata: { full_name: "Crystal Reyes" } }]
    world.paid = ["u1"]
    const res = await call()
    expect(await res.json()).toEqual({ sent: 1 })
    expect(world.sent).toEqual([{ to: ["crystal@example.com"], subject: "Your Supplement Snap plan is ready: choose your password", replyTo: "support@supplementsnap.io" }])
    expect(world.metaUpdates[0].meta).toMatchObject({ setup_reminders_sent: 1, full_name: "Crystal Reyes" })
  })
  it("leaves alone people who have signed in, people who have not paid, and brand new accounts", async () => {
    world.users = [
      { id: "u1", email: "a@example.com", created_at: old, last_sign_in_at: new Date().toISOString() },
      { id: "u2", email: "b@example.com", created_at: old, last_sign_in_at: null },
      { id: "u3", email: "c@example.com", created_at: new Date().toISOString(), last_sign_in_at: null },
    ]
    world.paid = ["u1", "u3"]
    expect(await (await call()).json()).toEqual({ sent: 0 })
    expect(world.sent).toHaveLength(0)
  })
  it("does not count a reminder that failed to send, so it is tried again tomorrow", async () => {
    world.users = [{ id: "u1", email: "a@example.com", created_at: old, last_sign_in_at: null }]
    world.paid = ["u1"]
    world.emailFails = true
    expect(await (await call()).json()).toEqual({ sent: 0 })
    expect(world.metaUpdates).toHaveLength(0)
  })
})
