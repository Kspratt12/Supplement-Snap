// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Read-only investigation, synthetic data only: what does a caller-supplied projectId do in /api/send-report
 * and in the tracking list that shows its rows?
 */

type Op = { table: string; chain: Array<[string, unknown[]]> }
const ops: Op[] = []
const sent: Array<Record<string, unknown>> = []
const mockGetUser = vi.fn()
const mockGetAccess = vi.fn()

vi.mock("../lib/auth-utils", () => ({ getAuthenticatedUser: (...a: unknown[]) => mockGetUser(...a) }))
vi.mock("../lib/plan", async () => ({
  ...(await vi.importActual<typeof import("../lib/plan")>("../lib/plan")),
  getAccess: (...a: unknown[]) => mockGetAccess(...a),
}))
vi.mock("../lib/rate-limit", () => ({ rateLimited: () => false }))
vi.mock("resend", () => ({ Resend: class { emails = { send: async (p: Record<string, unknown>) => (sent.push(p), { error: null }) } } }))
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => {
      const op: Op = { table, chain: [] }
      ops.push(op)
      const proxy: unknown = new Proxy(() => {}, {
        get: (_t, name: string) => {
          if (name === "then") return (res: (v: unknown) => void) => res({ data: [], error: null })
          return (...args: unknown[]) => {
            op.chain.push([name, args])
            if (name === "single") return Promise.resolve({ data: { tracking_token: "tok" }, error: null })
            return proxy
          }
        },
      })
      return proxy
    },
  }),
}))

import { POST as sendReport } from "../app/api/send-report/route"
import { GET as trackingList } from "../app/api/email-track/status/route"

const ATTACKER = { id: "user-A", email: "a@example.com" }
const VICTIM_PROJECT = "11111111-1111-4111-8111-111111111111" // belongs to some other account (synthetic)
const TEAM = { plan: "team", status: "active", active: true, viaOwner: false, hasBilling: true }

beforeEach(() => {
  vi.clearAllMocks()
  ops.length = 0
  sent.length = 0
  process.env.RESEND_API_KEY = "re_dummy"
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service_dummy"
  mockGetUser.mockResolvedValue(ATTACKER)
  mockGetAccess.mockResolvedValue(TEAM)
})

describe("/api/send-report: what projectId does", () => {
  const post = (extra: Record<string, unknown> = {}) =>
    sendReport(new Request("http://localhost/api/send-report", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "adjuster@insurer.example", subject: "S", message: "M", projectName: "Name typed by caller", projectId: VICTIM_PROJECT, ...extra }),
    }))

  it("reads no project data: the only table touched is email_tracking, and only to insert", async () => {
    expect((await post()).status).toBe(200)
    expect(ops.map((o) => o.table)).toEqual(["email_tracking"])
    expect(ops[0].chain.map(([n]) => n)).toEqual(["insert", "select", "single"])
  })

  it("stores the caller's own user id with the supplied project id, never the project owner's", async () => {
    await post()
    const row = ops[0].chain[0][1][0] as Record<string, unknown>
    expect(row.user_id).toBe("user-A")
    expect(row.project_id).toBe(VICTIM_PROJECT)
  })

  it("builds the email only from what the caller typed; nothing is looked up by project id", async () => {
    await post({ message: "caller text", pdfBase64: "JVBERi0=" })
    expect(sent).toHaveLength(1)
    const html = String(sent[0].html)
    expect(html).toContain("Name typed by caller")
    expect(html).toContain("caller text")
    expect(html).not.toContain(VICTIM_PROJECT)
    expect((sent[0].attachments as Array<{ content: string }>)[0].content).toBe("JVBERi0=")
  })

  it("a project id that is not a UUID does not stop the email (the tracking insert just fails quietly in the database)", async () => {
    expect((await post({ projectId: "not-a-uuid" })).status).toBe(200)
    expect(sent).toHaveLength(1)
  })
})

describe("the tracking list for a project id", () => {
  it("is always limited to the caller's own rows, whatever project id is asked for", async () => {
    const res = await trackingList(new Request(`http://localhost/api/email-track/status?projectId=${VICTIM_PROJECT}`))
    expect(res.status).toBe(200)
    const chain = ops[0].chain
    expect(chain.some(([n, a]) => n === "eq" && a[0] === "user_id" && a[1] === "user-A")).toBe(true)
    expect(chain.some(([n, a]) => n === "eq" && a[0] === "project_id" && a[1] === VICTIM_PROJECT)).toBe(true)
  })

  it("'all' is also limited to the caller's own rows", async () => {
    await trackingList(new Request("http://localhost/api/email-track/status?projectId=all"))
    expect(ops[0].chain.some(([n, a]) => n === "eq" && a[0] === "user_id" && a[1] === "user-A")).toBe(true)
  })
})
