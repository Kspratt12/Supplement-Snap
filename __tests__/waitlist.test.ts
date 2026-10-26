// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

const sent = vi.hoisted(() => [] as string[])
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: async (m: { subject: string }) => (sent.push(m.subject), { error: null }) }
  },
}))

import { POST } from "../app/api/waitlist/route"

const post = (email: string, ip = "1.2.3.4") =>
  POST(new Request("http://localhost/api/waitlist", { method: "POST", body: JSON.stringify({ email }), headers: { "x-forwarded-for": ip } }))

beforeEach(() => {
  sent.length = 0
  vi.stubEnv("RESEND_API_KEY", "re_x")
  vi.stubEnv("WAITLIST_NOTIFY_EMAIL", "owner@example.com")
})

describe("waitlist form", () => {
  it("rejects a bad email and sends nothing", async () => {
    expect((await post("not-an-email", "9.9.9.1")).status).toBe(400)
    expect(sent).toHaveLength(0)
  })
  it("accepts a good email and notifies the owner", async () => {
    expect((await post("a@b.com", "9.9.9.2")).status).toBe(200)
    expect(sent).toHaveLength(1)
  })
  it("slows down a flood from one address so the owner's inbox is not filled", async () => {
    const statuses: number[] = []
    for (let i = 0; i < 8; i++) statuses.push((await post(`bot${i}@b.com`, "9.9.9.3")).status)
    expect(statuses.filter((s) => s === 200)).toHaveLength(5)
    expect(statuses.filter((s) => s === 429).length).toBe(3)
    expect(sent).toHaveLength(5)
  })
})
