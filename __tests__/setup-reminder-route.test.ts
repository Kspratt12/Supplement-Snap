// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * The real setup-reminder cron route with the account service and the email service replaced by stand-ins. The account
 * store merges user_metadata key by key (what the service's source does for this call). Nothing is sent anywhere and all
 * people and data are made up. These tests show what the route writes; they do not show how the real service behaves under
 * truly concurrent requests.
 */

const world = vi.hoisted(() => ({
  stored: {} as Record<string, Record<string, unknown>>,
  listed: [] as Array<Record<string, unknown>>, // what listUsers returns: a snapshot taken at the start of the run
  writes: [] as Array<{ id: string; user_metadata: Record<string, unknown> }>,
  sent: [] as Array<Record<string, unknown>>,
  emailFails: false,
  duringEmail: null as null | (() => void), // another writer acting after the list was read and before the write
}))

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({ select: () => ({ in: () => ({ not: async () => ({ data: [{ user_id: "u-1" }], error: null }) }) }) }),
    auth: {
      admin: {
        listUsers: async () => ({ data: { users: world.listed }, error: null }),
        generateLink: async () => ({ data: { properties: { action_link: "https://fixtures.example/reset" } }, error: null }),
        updateUserById: async (id: string, attrs: { user_metadata: Record<string, unknown> }) => {
          world.writes.push({ id, user_metadata: attrs.user_metadata })
          const next = { ...(world.stored[id] ?? {}) }
          for (const [k, v] of Object.entries(attrs.user_metadata)) {
            if (v === null) delete next[k]
            else next[k] = v
          }
          world.stored[id] = next
          return { error: null }
        },
      },
    },
  }),
}))
vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: async (msg: Record<string, unknown>) => {
        world.duringEmail?.()
        if (world.emailFails) return { error: { message: "refused" } }
        world.sent.push(msg)
        return { error: null }
      },
    }
  },
}))

import { GET } from "../app/api/account-setup-reminders/route"

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()
const call = (auth: string | null = "Bearer cron-secret") => GET(new Request("http://localhost/api/account-setup-reminders", { headers: auth ? { authorization: auth } : {} }))

beforeEach(() => {
  process.env.CRON_SECRET = "cron-secret"
  process.env.RESEND_API_KEY = "re_dummy"
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service_dummy"
  const meta = { full_name: "Pat Roofer", ss_onboarding_free: "", ss_speech_lang: "es-MX" }
  world.stored = { "u-1": { ...meta } }
  world.listed = [{ id: "u-1", email: "pat.roofer@example.com", created_at: daysAgo(10), last_sign_in_at: null, user_metadata: { ...meta } }]
  world.writes = []
  world.sent = []
  world.emailFails = false
  world.duringEmail = null
})

describe("GET /api/account-setup-reminders", () => {
  it("is refused without the cron secret, and sends and writes nothing", async () => {
    expect((await call(null)).status).toBe(401)
    expect((await call("Bearer wrong")).status).toBe(401)
    expect(world.sent).toEqual([])
    expect(world.writes).toEqual([])
  })

  it("records the reminder by sending only the two keys it owns", async () => {
    const res = await call()
    expect(await res.json()).toEqual({ sent: 1 })
    expect(world.sent).toHaveLength(1)
    expect(world.writes).toHaveLength(1)
    expect(Object.keys(world.writes[0].user_metadata).sort()).toEqual(["setup_reminder_last", "setup_reminders_sent"])
    expect(world.writes[0].user_metadata.setup_reminders_sent).toBe(1)
    expect(world.stored["u-1"]).toMatchObject({ full_name: "Pat Roofer", ss_onboarding_free: "", ss_speech_lang: "es-MX", setup_reminders_sent: 1 })
  })

  it("another writer changes a key while the email is being sent: that change survives the reminder record", async () => {
    // The list was read before the email went out; meanwhile the person finishes a Minimize and renames themselves.
    world.duringEmail = () => {
      world.stored["u-1"] = { ...world.stored["u-1"], ss_onboarding_free: "minimized", full_name: "Patricia Roofer" }
    }
    await call()
    expect(world.stored["u-1"]).toMatchObject({ ss_onboarding_free: "minimized", full_name: "Patricia Roofer", setup_reminders_sent: 1 })
    // nothing from the stale list was written back
    expect(world.writes[0].user_metadata).not.toHaveProperty("ss_onboarding_free")
    expect(world.writes[0].user_metadata).not.toHaveProperty("full_name")
  })

  it("counts from what the list showed for its own keys only", async () => {
    world.listed[0].user_metadata = { full_name: "Pat Roofer", setup_reminders_sent: 1, setup_reminder_last: daysAgo(9) }
    world.stored["u-1"] = { ...(world.listed[0].user_metadata as Record<string, unknown>) }
    await call()
    expect(world.writes[0].user_metadata.setup_reminders_sent).toBe(2)
  })

  it("writes nothing for a person whose email did not go out", async () => {
    world.emailFails = true
    expect(await (await call()).json()).toEqual({ sent: 0 })
    expect(world.writes).toEqual([])
  })

  it("skips someone who has signed in", async () => {
    world.listed[0].last_sign_in_at = daysAgo(1)
    await call()
    expect(world.sent).toEqual([])
    expect(world.writes).toEqual([])
  })
})
