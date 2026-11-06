import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup, configure } from "@testing-library/react"

// The whole dashboard renders in these tests, so give a busy machine more time before a lookup gives up.
configure({ asyncUtilTimeout: 6000 })
vi.setConfig({ testTimeout: 30000 })

// A stand-in database: every query returns the rows set for that table, and writes can be told to fail.
const db = vi.hoisted(() => ({
  rows: {} as Record<string, unknown[]>,
  failWrites: false,
  denyDeletes: false,
  denyUpdates: false,
  removeCalls: [] as string[][],
  removeResult: null as unknown,
  writes: [] as Array<{ table: string; op: string; payload: unknown }>,
}))

vi.mock("../lib/supabase", () => {
  const chain = (table: string, op = "select", payload: unknown = undefined): unknown => {
    const result = () => {
      if (op !== "select") db.writes.push({ table, op, payload })
      if (op !== "select" && db.failWrites) return { data: null, error: { message: "network down" } }
      if (op === "delete" && db.denyDeletes) return { data: [], error: null }
      if (op === "update" && db.denyUpdates) return { data: [], error: null }
      const rows = db.rows[table] ?? []
      return { data: rows, error: null, count: rows.length }
    }
    const proxy: unknown = new Proxy(
      {},
      {
        get(_t, prop: string) {
          if (prop === "then") return (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => Promise.resolve(result()).then(res, rej)
          if (prop === "single" || prop === "maybeSingle") {
            return () => {
              const r = result() // records the write, and reports a failure when the test asked for one
              const data = op === "insert" && !r.error ? { id: "new-id", ...(payload as object) } : (db.rows[table] ?? [])[0] ?? null
              return Promise.resolve({ data, error: r.error })
            }
          }
          if (prop === "insert") return (p: unknown) => chain(table, "insert", p)
          if (prop === "update") return (p: unknown) => chain(table, "update", p)
          if (prop === "delete") return () => chain(table, "delete")
          return () => proxy
        },
      },
    )
    return proxy
  }
  return {
    supabase: {
      from: (table: string) => chain(table),
      storage: { from: () => ({ remove: async (paths: string[]) => { db.removeCalls.push(paths); return db.removeResult ?? { data: [], error: null } }, upload: async () => ({ data: {}, error: null }), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) },
      auth: { getSession: async () => ({ data: { session: null } }), getUser: async () => ({ data: { user: { id: "u1", user_metadata: {} } }, error: null }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
    },
  }
})

/**
 * Draft generation on the real /app page, with the AI route and the database replaced.
 * Checks that an unusable draft never marks a finding Ready to Send, that a draft that fails to regenerate leaves the
 * saved one in place, and that the PDF shows the saved quantity and unit. These do not call any live service.
 */

const authUser = vi.hoisted(() => ({ id: "u1", email: "roofer@example.com" }))
vi.mock("../lib/auth-context", () => ({
  useAuth: () => ({ user: authUser, loading: false, signOut: async () => {}, subscriptionStatus: "active", subscriptionPlan: "pro", subscriptionLoading: false }),
  hasActiveSubscription: () => true,
}))

// Build the real PDF but record every line of text it draws, and the file name, instead of triggering a download.
const pdf = vi.hoisted(() => ({ texts: [] as string[], files: [] as string[] }))
vi.mock("jspdf", async (importOriginal) => {
  const mod = await importOriginal<typeof import("jspdf")>()
  class RecordingPdf extends mod.jsPDF {
    constructor(...args: ConstructorParameters<typeof mod.jsPDF>) {
      super(...args)
      this.save = ((name?: string) => {
        pdf.files.push(String(name))
        return this
      }) as unknown as typeof this.save
      // jsPDF attaches text() to each instance, so wrap it here rather than overriding a class method
      const drawText = this.text.bind(this) as (...a: unknown[]) => unknown
      this.text = ((...a: unknown[]) => {
        pdf.texts.push(Array.isArray(a[0]) ? (a[0] as unknown[]).join(" ") : String(a[0]))
        return drawText(...a)
      }) as unknown as typeof this.text
    }
  }
  return { ...mod, jsPDF: RecordingPdf }
})

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), useSearchParams: () => new URLSearchParams() }))
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }))
vi.mock("../lib/auth-fetch", () => ({ authFetch: vi.fn() }))
vi.mock("../app/dashboard/feedback-box", () => ({ FeedbackBox: () => null }))
vi.mock("../app/dashboard/photo-annotator", () => ({ PhotoAnnotator: () => null }))

import AppPage from "../app/app/page"
import { authFetch } from "../lib/auth-fetch"
import { PDF_FOOTER_LINES } from "../lib/report-wording"
const mockAuthFetch = vi.mocked(authFetch)
// Only the AI draft routes are scripted per test; every other call the page makes (such as the activity log) answers 200
const ai = (fn: () => Promise<Response>) => mockAuthFetch.mockImplementation(async (url) => (String(url).includes("/api/generate") ? fn() : reply(200, {})))
const aiCalls = () => mockAuthFetch.mock.calls.filter(([url]) => String(url).includes("/api/generate"))

const project = { id: "p1", user_id: "u1", project_name: "ZZ Draft Test", property_address: "", insurance_company: "", claim_number: "", adjuster_name: "", adjuster_email: "", claim_status: "In Progress", created_at: "2026-10-01T00:00:00Z" }
const capture = (over: Record<string, unknown> = {}) => ({
  id: "c1", project_id: "p1", image_url: "", image_urls: [], damage_type: "Soft decking", roof_area: "Main roof",
  field_note: "ZZ account separation fixture", status: "Captured", created_at: "2026-11-06T00:00:00Z", quantity: 1, unit: null, ...over,
})
const reply = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response

async function openProject() {
  render(<AppPage />)
  const select = (await screen.findByLabelText("Project / Job")) as HTMLSelectElement
  await waitFor(() => expect(select.querySelector('option[value="p1"]')).not.toBeNull())
  fireEvent.change(select, { target: { value: "p1" } })
}
const statusWrites = () => db.writes.filter((w) => w.table === "captures" && JSON.stringify(w.payload).includes("Ready to Send"))
const draftWrites = () => db.writes.filter((w) => w.table === "captures" && w.op === "update" && JSON.stringify(w.payload).includes('"draft"'))
const generateReport = async () => fireEvent.click(await screen.findByRole("button", { name: /Generate Project Report/ }))

beforeEach(() => {
  db.rows = { projects: [project], captures: [capture()], team_members: [] }
  db.failWrites = false
  db.denyDeletes = false
  db.denyUpdates = false
  db.writes = []
  pdf.texts = []
  pdf.files = []
  mockAuthFetch.mockReset()
  mockAuthFetch.mockImplementation(async () => reply(200, {}))
  window.localStorage.clear()
})
afterEach(cleanup)

describe("report generation: only a finished, saved draft makes a finding Ready to Send", () => {
  it("saves a complete draft and then marks the finding Ready to Send", async () => {
    ai(async () => reply(200, { draft: "Soft decking is documented on the main roof." }))
    await openProject()
    await generateReport()
    await waitFor(() => expect(statusWrites().length).toBeGreaterThan(0))
    expect(draftWrites()).toHaveLength(1)
    expect(aiCalls()).toHaveLength(1)
  })

  it("does not save a draft or mark the finding Ready to Send when the AI reply was cut off", async () => {
    ai(async () => reply(502, { error: "The AI draft was cut off before it finished, so it was not saved. Please try again.", code: "cut-off" }))
    await openProject()
    await generateReport()
    expect(await screen.findByText(/cut off before it finished/)).toBeTruthy() // a clear message, not a false success
    expect(statusWrites()).toHaveLength(0)
    expect(draftWrites()).toHaveLength(0)
    expect(screen.getByText(/not marked Ready to Send/)).toBeTruthy()
  })

  it("does not mark the finding Ready to Send when the AI request fails to complete", async () => {
    ai(async () => { throw new Error("network down") })
    await openProject()
    await generateReport()
    expect(await screen.findByText(/not marked Ready to Send/)).toBeTruthy()
    expect(statusWrites()).toHaveLength(0)
    expect(draftWrites()).toHaveLength(0)
  })

  it("does not mark the finding Ready to Send when the AI returns an empty draft", async () => {
    ai(async () => reply(200, { draft: "   " }))
    await openProject()
    await generateReport()
    expect(await screen.findByText(/not marked Ready to Send/)).toBeTruthy()
    expect(statusWrites()).toHaveLength(0)
  })

  it("does not mark the finding Ready to Send when the draft could not be saved", async () => {
    db.failWrites = true
    ai(async () => reply(200, { draft: "A complete paragraph." }))
    await openProject()
    await generateReport()
    expect(await screen.findByText(/not marked Ready to Send/)).toBeTruthy()
    expect(statusWrites()).toHaveLength(0)
  })

  it("lets a finding that already has a saved draft become Ready to Send without asking the AI again", async () => {
    db.rows.captures = [capture({ draft: "Existing complete draft." })]
    await openProject()
    await generateReport()
    await waitFor(() => expect(statusWrites().length).toBeGreaterThan(0))
    expect(aiCalls()).toHaveLength(0)
  })
})

describe("regenerating a draft that already exists", () => {
  it("keeps the saved project draft on screen and in the database, and says why, when the new one fails", async () => {
    db.rows.projects = [{ ...project, last_draft: "Existing project draft." }]
    ai(async () => reply(502, { error: "The AI draft was cut off before it finished, so it was not saved. Please try again.", code: "cut-off" }))
    await openProject()
    fireEvent.click(await screen.findByRole("button", { name: /Project Supplement Draft/ })) // the saved draft is collapsed until opened
    expect(await screen.findByText("Existing project draft.")).toBeTruthy()
    fireEvent.click(await screen.findByRole("button", { name: /^Regenerate$/ }))
    expect(await screen.findByText(/cut off before it finished/)).toBeTruthy()
    expect(screen.getByText("Existing project draft.")).toBeTruthy() // not blanked out by the failed attempt
    expect(db.writes.filter((w) => w.table === "projects" && JSON.stringify(w.payload).includes("last_draft"))).toHaveLength(0)
  })

  it("keeps a finding's saved draft when generating the report fails for the findings that have none", async () => {
    db.rows.captures = [capture({ id: "c1", draft: "Existing complete draft." }), capture({ id: "c2", field_note: "A second finding", draft: null })]
    ai(async () => reply(502, { error: "The AI draft was cut off before it finished, so it was not saved. Please try again.", code: "cut-off" }))
    await openProject()
    await generateReport()
    expect(await screen.findByText(/not marked Ready to Send/)).toBeTruthy()
    expect(draftWrites()).toHaveLength(0) // the existing draft is never overwritten
    expect(aiCalls()).toHaveLength(1) // only the finding without a draft was sent to the AI
    // the finding that already had a draft is still eligible; the one that failed is not
    const promoted = statusWrites()
    expect(promoted.length).toBeGreaterThan(0)
  })
})

describe("PDF quantity and unit", () => {
  const downloadPdf = async () => {
    await generateReport()
    fireEvent.click(await screen.findByRole("button", { name: /Download PDF/ }))
    await waitFor(() => expect(pdf.files.length).toBe(1))
  }

  it("shows the saved quantity and unit on the finding", async () => {
    db.rows.captures = [capture({ draft: "Existing complete draft.", quantity: 3, unit: "SQ" })]
    await openProject()
    await downloadPdf()
    // On failure this prints every line the PDF drew, which shows what was actually written
    expect(pdf.texts.join(" // ")).toContain("|  Quantity: 3 SQ")
  })

  it("shows the quantity alone when no unit was saved, without inventing one", async () => {
    db.rows.captures = [capture({ draft: "Existing complete draft.", quantity: 1, unit: null })]
    await openProject()
    await downloadPdf()
    expect(pdf.texts.some((t) => /\|  Quantity: 1$/.test(t))).toBe(true)
  })

  it("shows no quantity line when none was saved", async () => {
    db.rows.captures = [capture({ draft: "Existing complete draft.", quantity: null, unit: null })]
    await openProject()
    await downloadPdf()
    expect(pdf.texts.some((t) => /Quantity:/.test(t))).toBe(false)
    expect(pdf.texts.some((t) => /^Documented: /.test(t))).toBe(true)
  })

  it("prints only neutral fixed wording at the bottom, and never claims the damage was concealed or discovered at tear-off", async () => {
    // The finding says nothing about concealment or timing, so the report must not say it on the finding's behalf
    db.rows.captures = [capture({ draft: "Existing complete draft.", field_note: "Soft decking along the eave" })]
    await openProject()
    await downloadPdf()
    for (const line of PDF_FOOTER_LINES) expect(pdf.texts).toContain(line)
    const everything = pdf.texts.join("\n")
    expect(everything).not.toMatch(/concealed/i)
    expect(everything).not.toMatch(/not visible/i)
    expect(everything).not.toMatch(/discovered/i)
    // the finding's own explanation and note are still printed as written
    expect(pdf.texts).toContain("Existing complete draft.")
    expect(pdf.texts).toContain("Soft decking along the eave")
  })
})
