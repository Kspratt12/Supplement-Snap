import "fake-indexeddb/auto"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup, configure, waitFor } from "@testing-library/react"
import { openDB } from "idb"

/**
 * The real capture page, with the real offline queue (in an in-memory IndexedDB), and stand-ins for Supabase, the network
 * and the router. Checks the capture-to-report path when uploads or saves fail. All data is made up.
 */

configure({ asyncUtilTimeout: 15000 })
vi.setConfig({ testTimeout: 40000 })

const h = vi.hoisted(() => ({
  serverCaptures: [] as Record<string, unknown>[],
  inserts: [] as Record<string, unknown>[],
  insertError: null as null | { message: string },
  uploads: [] as string[],
  removed: [] as string[],
  failUploadOfPhoto: -1, // the photo position whose upload always fails
  projectExtra: {} as Record<string, unknown>, // extra project columns (for example the v16 ones)
  updates: [] as { table: string; patch: Record<string, unknown>; id?: string }[],
}))

vi.mock("../lib/supabase", () => {
  const chain = (table: string): unknown => {
    const projects = [{ id: "p1", user_id: "u1", project_name: "Test Roof", property_address: "1 Sample St", claim_status: "In Progress", created_at: "2026-10-01T00:00:00Z", ...h.projectExtra }]
    let inserted: Record<string, unknown> | null = null
    let updated = false
    const answer = () => {
      if (inserted) return h.insertError ? { data: null, error: h.insertError } : { data: { id: "srv-1", ...inserted }, error: null }
      if (updated) return { data: [{ id: "row" }], error: null }
      const rows = table === "projects" ? projects : table === "captures" ? h.serverCaptures : table === "subscriptions" ? [{ status: "active", plan: "starter" }] : []
      return { data: rows, error: null, count: rows.length }
    }
    const proxy: unknown = new Proxy({}, {
      get(_t, prop: string) {
        if (prop === "then") return (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => Promise.resolve(answer()).then(res, rej)
        if (prop === "insert") return (row: Record<string, unknown>) => { inserted = row; h.inserts.push(row); return proxy }
        if (prop === "update") return (patch: Record<string, unknown>) => { updated = true; h.updates.push({ table, patch }); return proxy }
        if (prop === "eq") return (_col: string, value: unknown) => { if (updated) h.updates[h.updates.length - 1].id = String(value); return proxy }
        if (prop === "single" || prop === "maybeSingle") return () => {
          const a = answer() as { data: unknown; error: unknown }
          return Promise.resolve({ data: Array.isArray(a.data) ? a.data[0] ?? null : a.data, error: a.error })
        }
        return () => proxy
      },
    })
    return proxy
  }
  return {
    supabase: {
      from: (table: string) => chain(table),
      storage: {
        from: () => ({
          upload: async (name: string) => {
            if (h.failUploadOfPhoto >= 0 && name.endsWith(`-photo-${h.failUploadOfPhoto}.jpg`)) return { data: null, error: { message: "upload failed" } }
            h.uploads.push(name)
            return { data: {}, error: null }
          },
          remove: async (paths: string[]) => { h.removed.push(...paths); return { data: paths.map((name) => ({ name })), error: null } },
          getPublicUrl: (name: string) => ({ data: { publicUrl: `https://abc.supabase.co/storage/v1/object/public/test-uploads/${name}` } }),
        }),
      },
      auth: {
        getSession: async () => ({ data: { session: { access_token: "fictional", user: { id: "u1", email: "roofer@example.com" } } } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
        signOut: async () => ({ error: null }),
      },
    },
  }
})

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("project=p1"),
}))
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }))
vi.mock("../lib/auth-fetch", () => ({ authFetch: vi.fn(async () => ({ ok: true, json: async () => ({}) })) }))
vi.mock("../app/dashboard/feedback-box", () => ({ FeedbackBox: () => null }))
vi.mock("../app/dashboard/photo-annotator", () => ({ PhotoAnnotator: () => null }))

import { AuthProvider } from "../lib/auth-context"
import AppPage from "../app/app/page"
import { getQueuedForProject, queueCapture } from "../lib/offline-queue"

// jsdom cannot decode pictures: a stand-in Image that "loads" every source as a small picture
class FakeImage {
  width = 100
  height = 80
  onload: null | (() => void) = null
  onerror: null | (() => void) = null
  set src(_v: string) { setTimeout(() => this.onload?.(), 0) }
}

beforeEach(async () => {
  h.serverCaptures = []
  h.inserts = []
  h.insertError = null
  h.uploads = []
  h.removed = []
  h.failUploadOfPhoto = -1
  h.projectExtra = {}
  h.updates = []
  const db = await openDB("supplement-snap-offline", 1, { upgrade(d) { d.createObjectStore("pending-captures", { keyPath: "id" }).createIndex("by-status", "status") } })
  await db.clear("pending-captures")
  db.close()
  window.localStorage.clear()
  vi.stubGlobal("Image", FakeImage)
  let n = 0
  vi.stubGlobal("URL", Object.assign(globalThis.URL, { createObjectURL: () => `blob:test-${n++}`, revokeObjectURL: () => {} }))
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ status: "active", plan: "starter", viaOwner: false, hasBilling: false, isAdmin: false }) })))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

async function openForm() {
  const view = render(<AuthProvider><AppPage /></AuthProvider>)
  await screen.findByDisplayValue("Select damage type...")
  return view
}

function fillFinding(note: string) {
  fireEvent.change(screen.getByDisplayValue("Select damage type..."), { target: { value: "Decking" } })
  fireEvent.change(screen.getByDisplayValue("Select roof area..."), { target: { value: "Front" } })
  fireEvent.change(screen.getByPlaceholderText("Describe the damage..."), { target: { value: note } })
}

describe("saving a finding when the upload or save fails", () => {
  it("one photo fails: nothing half-saved, the whole finding is kept on the device with its photo tags, and it is not in a report", async () => {
    h.failUploadOfPhoto = 1
    const { container } = await openForm()
    const input = container.querySelector("#upload-input") as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(["a"], "a.jpg", { type: "image/jpeg" }), new File(["b"], "b.jpg", { type: "image/jpeg" })] } })
    await screen.findByAltText("Photo 2")
    fireEvent.click(screen.getAllByRole("button", { name: "Wide" })[0])
    expect(screen.getByTestId("shot-hint").textContent).toContain("✓ Wide")
    fillFinding("Soft decking at the eave")
    fireEvent.click(screen.getByRole("button", { name: /Save Capture/ }))

    expect(await screen.findByText(/1 of 2 photos did not upload, so this finding is saved on this device only/, {}, { timeout: 20000 })).toBeTruthy()
    expect(h.inserts).toHaveLength(0) // no finding saved with a photo missing
    expect(h.removed).toHaveLength(1) // the photo that did upload was removed again
    const queued = await getQueuedForProject("p1")
    expect(queued).toHaveLength(1)
    expect(queued[0].photos).toHaveLength(2)
    expect((queued[0].photoMetadata[0] as { shot?: string }).shot).toBe("wide")
    expect((queued[0].photoMetadata[1] as { shot?: string }).shot).toBeNull()
    expect(await screen.findByTestId("local-only-card")).toBeTruthy()
    expect(screen.queryByRole("button", { name: /Generate Project Report/ })).toBeNull()
    expect((screen.getByPlaceholderText("Describe the damage...") as HTMLTextAreaElement).value).toBe("")
  })

  it("the connection drops while saving: the finding is kept on the device instead of being lost", async () => {
    h.insertError = { message: "TypeError: Failed to fetch" }
    await openForm()
    fillFinding("Flashing lifted at the chimney")
    fireEvent.click(screen.getByRole("button", { name: /Save Capture/ }))
    expect(await screen.findByText(/The connection dropped before the finding reached your account/)).toBeTruthy()
    const queued = await getQueuedForProject("p1")
    expect(queued.map((q) => q.fieldNote)).toEqual(["Flashing lifted at the chimney"])
  })

  it("the account refuses the save: nothing is queued and the form keeps what was typed", async () => {
    h.insertError = { message: 'new row violates row-level security policy for table "captures"' }
    await openForm()
    fillFinding("Pipe boot cracked")
    fireEvent.click(screen.getByRole("button", { name: /Save Capture/ }))
    expect(await screen.findByText(/Save failed: new row violates/)).toBeTruthy()
    expect(await getQueuedForProject("p1")).toHaveLength(0)
    expect((screen.getByPlaceholderText("Describe the damage...") as HTMLTextAreaElement).value).toBe("Pipe boot cracked")
  })

  it("a successful save says it reached the account", async () => {
    await openForm()
    fillFinding("Drip edge missing on the rake")
    fireEvent.click(screen.getByRole("button", { name: /Save Capture/ }))
    expect(await screen.findByText("Saved to your account.")).toBeTruthy()
    expect(h.inserts).toHaveLength(1)
  })
})

describe("after a reload", () => {
  it("findings still on the device are shown, marked, and left out of the report", async () => {
    h.serverCaptures = [{ id: "c1", project_id: "p1", image_url: "", image_urls: [], damage_type: "Decking", roof_area: "Front", field_note: "Saved one", status: "Captured", created_at: "2026-11-01T00:00:00Z" }]
    await queueCapture({ id: "offline-1", projectId: "p1", damageType: "Flashing", roofArea: "Chimney", fieldNote: "Waiting one", quantity: 1, unit: "", photos: [], photoNames: [], photoMetadata: [], createdAt: "2026-11-02T00:00:00Z" })
    await openForm()
    expect(await screen.findByTestId("local-only-card")).toBeTruthy()
    expect(screen.getByText("Waiting one")).toBeTruthy()
    fireEvent.click(await screen.findByRole("button", { name: "Generate Project Report (1 finding)" }))
    expect(await screen.findByTestId("report-local-only")).toBeTruthy()
    expect(screen.getByTestId("report-review-summary").textContent).toContain("1 finding in this report")
    expect(screen.getByTestId("report-review-summary").textContent).toContain("1 without a photo")
    // Without the v16 columns, the controls that need them do not appear
    expect(screen.queryByTestId("claim-tracking")).toBeNull()
    expect(screen.queryByRole("button", { name: /Move finding/ })).toBeNull()
  })
})

describe("after supabase-migration-v16 (columns present in the loaded rows)", () => {
  const row = (id: string, note: string, created_at: string) => ({
    id, project_id: "p1", image_url: "", image_urls: [], damage_type: "Decking", roof_area: "Front", field_note: note,
    status: "Captured", created_at, draft: `Explanation for ${note}`, report_order: null, diagram_pin: null,
  })

  it("amounts and follow-up are saved as typed, and a bad amount is refused before saving", async () => {
    h.projectExtra = { amount_requested: null, amount_approved: null, follow_up_on: null }
    await openForm()
    const panel = await screen.findByTestId("claim-tracking")
    expect(panel.textContent).toContain("not connected to insurers")
    fireEvent.click(screen.getByRole("button", { name: "+ Track amounts and follow-up" }))
    fireEvent.change(screen.getByLabelText("Amount requested ($)"), { target: { value: "about 3k" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByText(/Enter amounts as numbers/)).toBeTruthy()
    expect(h.updates.filter((u) => u.table === "projects")).toHaveLength(0)
    fireEvent.change(screen.getByLabelText("Amount requested ($)"), { target: { value: "$1,200.50" } })
    fireEvent.change(screen.getByLabelText("Next follow-up"), { target: { value: "2020-01-01" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByTestId("follow-up-due")).toBeTruthy()
    expect(h.updates.find((u) => u.table === "projects")?.patch).toEqual({ amount_requested: 1200.5, amount_approved: null, follow_up_on: "2020-01-01" })
    expect(screen.getByTestId("claim-tracking").textContent).toContain("$1,200.50")
  })

  it("findings can be reordered in the report and every position is saved", async () => {
    h.serverCaptures = [row("c2", "Second", "2026-11-02T00:00:00Z"), row("c1", "First", "2026-11-01T00:00:00Z")]
    await openForm()
    fireEvent.click(await screen.findByRole("button", { name: "Generate Project Report (2 findings)" }))
    // Report starts in the list's order: Second is finding 1, First is finding 2
    expect((await screen.findByRole("button", { name: "Move finding 1 up" }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole("button", { name: "Move finding 1 down" }))
    await waitFor(() => expect(h.updates.filter((u) => "report_order" in u.patch)).toHaveLength(2))
    const saved = Object.fromEntries(h.updates.filter((u) => "report_order" in u.patch).map((u) => [u.id, u.patch.report_order]))
    expect(saved).toEqual({ c1: 0, c2: 1 })
    // The report on screen follows the saved order
    const report = screen.getByTestId("report-review-summary").closest("section") as HTMLElement
    await waitFor(() => {
      const text = report.textContent || ""
      expect(text.indexOf("Explanation for First")).toBeLessThan(text.indexOf("Explanation for Second"))
    })
  })
})
