// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"
import { jsPDF } from "jspdf"

/**
 * Runs the real Gap Detector routes with login, plan and rate limiting stood in, and real (synthetic) PDF files.
 * Checks who is let in, what happens to bad files, and that the feature is closed while it is not ready.
 */

const mockGetUser = vi.fn()
const mockGetAccess = vi.fn()
const mockRateLimited = vi.fn()
/** false = the real rule, which is closed because the feature is not ready. true = pretends it is ready, to test the rest. */
const ready = vi.hoisted(() => ({ value: false }))

vi.mock("../lib/auth-utils", () => ({ getAuthenticatedUser: (...a: unknown[]) => mockGetUser(...a) }))
vi.mock("../lib/rate-limit", () => ({ rateLimited: (...a: unknown[]) => mockRateLimited(...a) }))
vi.mock("../lib/plan", async () => {
  const actual = await vi.importActual<typeof import("../lib/plan")>("../lib/plan")
  return {
    ...actual,
    getAccess: (...a: unknown[]) => mockGetAccess(...a),
    can: { ...actual.can, estimateGap: (a: { active: boolean; plan: string }) => (ready.value ? a.active && a.plan === "enterprise" : actual.can.estimateGap(a as never)) },
  }
})

import { POST as extract } from "../app/api/estimate-gap/extract/route"
import { POST as compare } from "../app/api/estimate-gap/compare/route"
import { GET as status } from "../app/api/estimate-gap/status/route"

// SYNTHETIC TEST DATA
function pdf(rows: string[][], opts: { encrypt?: boolean } = {}): Uint8Array {
  const d = new jsPDF(opts.encrypt ? { encryption: { userPassword: "x", ownerPassword: "y" } } : {})
  let y = 20
  for (const r of rows) { d.text(r[0], 14, y); d.text(r[1], 110, y); d.text(r[2], 130, y); d.text(r[3], 150, y); d.text(r[4], 175, y); y += 8 }
  return new Uint8Array(d.output("arraybuffer"))
}
const INS = pdf([["Drip edge", "180.00", "LF", "2.50", "450.00"], ["Pipe jack", "2.00", "EA", "85.00", "170.00"]])
const CON = pdf([["Drip edge", "200.00", "LF", "2.50", "500.00"], ["Ice and water shield", "600.00", "SF", "1.85", "1,110.00"]])

const upload = (bytes: Uint8Array, role: string | null = "insurer", name = "estimate.pdf") => {
  const form = new FormData()
  if (role) form.set("role", role)
  form.set("file", new File([bytes as BlobPart], name, { type: "application/pdf" }))
  return new Request("http://localhost/api/estimate-gap/extract", { method: "POST", body: form })
}
const json = (body: unknown) => new Request("http://localhost/api/estimate-gap/compare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
const ENTERPRISE = { active: true, plan: "enterprise", viaOwner: false }

beforeEach(() => {
  vi.clearAllMocks()
  ready.value = false
  mockGetUser.mockResolvedValue({ id: "u1", email: "a@example.test" })
  mockGetAccess.mockResolvedValue(ENTERPRISE)
  mockRateLimited.mockReturnValue(false)
})

describe("while the Gap Detector is not ready, nobody can use it", () => {
  it("refuses even an active Enterprise account on every route", async () => {
    expect((await extract(upload(INS))).status).toBe(403)
    expect((await compare(json({}))).status).toBe(403)
    const s = await status(new Request("http://localhost/api/estimate-gap/status"))
    expect(await s.json()).toEqual({ available: false })
  })
})

describe("access control (with the feature pretend-ready, to test who is allowed)", () => {
  beforeEach(() => { ready.value = true })

  it("refuses someone who is not signed in, before reading anything", async () => {
    mockGetUser.mockResolvedValue(null)
    expect((await extract(upload(INS))).status).toBe(401)
    expect((await extract(new Request("http://localhost/x", { method: "POST", body: "garbage" }))).status).toBe(401)
    expect((await compare(json({ anything: true }))).status).toBe(401)
    expect((await status(new Request("http://localhost/x"))).status).toBe(401)
  })
  it("refuses every plan except an active Enterprise plan", async () => {
    for (const plan of ["starter", "team", "pro"]) {
      mockGetAccess.mockResolvedValue({ active: true, plan, viaOwner: false })
      expect((await extract(upload(INS))).status, plan).toBe(403)
      expect((await compare(json({}))).status, plan).toBe(403)
    }
    mockGetAccess.mockResolvedValue({ active: false, plan: "enterprise", viaOwner: false })
    expect((await extract(upload(INS))).status, "enterprise but not active").toBe(403)
    mockGetAccess.mockResolvedValue({ active: false, plan: "free", viaOwner: false })
    expect((await extract(upload(INS))).status, "free").toBe(403)
  })
  it("the access answer is computed from the signed-in user, never from the request", async () => {
    await extract(upload(INS))
    expect(mockGetAccess).toHaveBeenCalledWith("u1", "a@example.test")
  })
  it("slows down someone making too many requests", async () => {
    mockRateLimited.mockReturnValue(true)
    expect((await extract(upload(INS))).status).toBe(429)
  })
  it("lets an active Enterprise plan read and compare", async () => {
    expect((await extract(upload(INS))).status).toBe(200)
    expect((await status(new Request("http://localhost/x"))).status).toBe(200)
  })
})

describe("reading a file (pretend-ready)", () => {
  beforeEach(() => { ready.value = true })

  it("returns the rows found, with page numbers, and stores nothing", async () => {
    const res = await extract(upload(INS))
    expect(res.status).toBe(200)
    expect(res.headers.get("cache-control")).toBe("no-store")
    const { document, pageCount } = await res.json()
    expect(pageCount).toBe(1)
    expect(document.role).toBe("insurer")
    expect(document.lines.map((l: { description: string; page: number }) => [l.description, l.page])).toEqual([["Drip edge", 1], ["Pipe jack", 1]])
  })
  it("refuses a file that is not a PDF, with a message a person can act on", async () => {
    const res = await extract(upload(new TextEncoder().encode("<html>not a pdf</html>"), "insurer", "estimate.pdf"))
    expect(res.status).toBe(422)
    expect((await res.json()).code).toBe("not_a_pdf")
  })
  it("refuses a password-protected PDF", async () => {
    const res = await extract(upload(pdf([["Drip edge", "1.00", "LF", "1.00", "1.00"]], { encrypt: true })))
    expect(res.status).toBe(422)
    expect((await res.json()).code).toBe("password_protected")
  })
  it("refuses a file that is too large and one with no role or no file", async () => {
    const big = new Uint8Array(4 * 1024 * 1024 + 10); big.set(new TextEncoder().encode("%PDF-1.4"))
    expect((await extract(upload(big))).status).toBe(413)
    expect((await extract(upload(INS, null))).status).toBe(400)
    expect((await extract(upload(INS, "someone-else"))).status).toBe(400)
    const noFile = new FormData(); noFile.set("role", "insurer")
    expect((await extract(new Request("http://localhost/x", { method: "POST", body: noFile }))).status).toBe(400)
  })
})

describe("comparing (pretend-ready)", () => {
  beforeEach(() => { ready.value = true })

  async function both() {
    const a = await (await extract(upload(INS, "insurer"))).json()
    const b = await (await extract(upload(CON, "contractor"))).json()
    return { insurer: a.document, contractor: b.document }
  }

  it("compares what was read and returns findings with the page each came from", async () => {
    const res = await compare(json(await both()))
    expect(res.status).toBe(200)
    const { result } = await res.json()
    expect(result.canCompare).toBe(true)
    const q = result.findings.find((f: { kind: string }) => f.kind === "quantity_difference")
    expect(q.numbers).toMatchObject({ insurerQuantity: "180", contractorQuantity: "200", unit: "LF" })
    expect(q.evidence.every((e: { page: number }) => e.page === 1)).toBe(true)
    expect(result.findings.some((f: { kind: string }) => f.kind === "line_only_on_contractor_estimate")).toBe(true)
    expect(result.disclaimers.join(" ")).toMatch(/Nothing here guarantees/)
  })
  it("refuses documents with the wrong shape, the wrong role, or an absurd size", async () => {
    const docs = await both()
    expect((await compare(json({ ...docs, insurer: { nope: true } }))).status).toBe(400)
    expect((await compare(json({ insurer: docs.contractor, contractor: docs.insurer }))).status).toBe(400) // roles swapped
    expect((await compare(json({ ...docs, insurer: { ...docs.insurer, lines: Array(3001).fill(docs.insurer.lines[0]) } }))).status).toBe(400)
    const evil = { ...docs.insurer, lines: [{ ...docs.insurer.lines[0], quantityMilli: "1; DROP TABLE" }] }
    expect((await compare(json({ ...docs, insurer: evil }))).status).toBe(400)
    expect((await compare(json({ ...docs, corrections: { confirmedPairs: "all" } }))).status).toBe(400)
  })
  it("applies the person's confirmed and rejected matches", async () => {
    const docs = await both()
    const first = await (await compare(json(docs))).json()
    const pairs = first.result.matches.map((m: { insurerLineId: string; contractorLineId: string }) => [m.insurerLineId, m.contractorLineId])
    const rejected = await (await compare(json({ ...docs, corrections: { rejectedPairs: [pairs[0]] } }))).json()
    expect(rejected.result.matches.length).toBe(first.result.matches.length - 1)
  })
  it("refuses a request that is not JSON", async () => {
    expect((await compare(new Request("http://localhost/x", { method: "POST", body: "not json" }))).status).toBe(400)
  })
})
