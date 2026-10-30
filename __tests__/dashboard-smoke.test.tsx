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
      auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
    },
  }
})

// The real auth hook keeps one user object between renders; a new object each time would reload the projects constantly.
const authUser = vi.hoisted(() => ({ id: "u1", email: "roofer@example.com" }))
const plan = vi.hoisted(() => ({ paid: true }))

vi.mock("../lib/auth-context", () => ({
  useAuth: () => ({
    user: authUser,
    loading: false,
    signOut: async () => {},
    subscriptionStatus: "active",
    subscriptionPlan: "starter",
    subscriptionLoading: false,
  }),
  hasActiveSubscription: () => plan.paid,
}))

// Build the real PDF but record the file name instead of triggering a browser download.
const saved = vi.hoisted(() => [] as string[])
vi.mock("jspdf", async (importOriginal) => {
  const mod = await importOriginal<typeof import("jspdf")>()
  class RecordingPdf extends mod.jsPDF {
    constructor(...args: ConstructorParameters<typeof mod.jsPDF>) {
      super(...args)
      this.save = ((name?: string) => {
        saved.push(String(name))
        return this
      }) as unknown as typeof this.save
    }
  }
  return { ...mod, jsPDF: RecordingPdf }
})

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }))
vi.mock("../lib/auth-fetch", () => ({ authFetch: vi.fn(async () => ({ ok: true, json: async () => ({}) })) }))
vi.mock("../app/dashboard/feedback-box", () => ({ FeedbackBox: () => null }))
vi.mock("../app/dashboard/photo-annotator", () => ({ PhotoAnnotator: () => null }))

import AppPage from "../app/app/page"
import { authFetch } from "../lib/auth-fetch"

const project = (over: Record<string, unknown>) => ({
  id: "p1",
  user_id: "u1",
  project_name: "Garcia Roof",
  property_address: "9 Pine Ct, Apex NC",
  insurance_company: "Allstate",
  claim_number: "AL-2002",
  adjuster_name: "",
  adjuster_email: "",
  claim_status: "In Progress",
  created_at: "2026-10-01T00:00:00Z",
  ...over,
})

// The project list loads after the page renders, so wait for the option to exist before choosing it
async function pickProject(id: string) {
  const select = (await screen.findByLabelText("Project / Job")) as HTMLSelectElement
  await waitFor(() => expect(select.querySelector(`option[value="${id}"]`)).not.toBeNull())
  fireEvent.change(select, { target: { value: id } })
}

describe("dashboard smoke test (stand-in database)", () => {
  beforeEach(() => {
    db.rows = { projects: [], captures: [], team_members: [] }
    db.failWrites = false
    db.denyDeletes = false
    db.denyUpdates = false
    db.removeCalls = []
    db.removeResult = null
    db.writes = []
    plan.paid = true
    window.localStorage.clear()
  })
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it("shows the start guide to an account that only has the demo project", async () => {
    db.rows.projects = [project({ id: "demo", project_name: "Demo Project — Smith Residence" })]
    render(<AppPage />)
    expect(await screen.findByTestId("start-here")).toBeTruthy()
    expect(screen.queryByTestId("claims-overview")).toBeNull() // one project: no filter bar
  })

  it("shows search and filters once there are several projects, and filters by status and text", async () => {
    db.rows.projects = [
      project({ id: "p1", project_name: "Garcia Roof", claim_status: "In Progress" }),
      project({ id: "p2", project_name: "Nguyen Duplex", claim_number: "SF-3003", claim_status: "Approved" }),
    ]
    render(<AppPage />)
    expect(await screen.findByTestId("claims-overview")).toBeTruthy()
    expect(screen.queryByTestId("start-here")).toBeNull() // real projects exist
    fireEvent.click(screen.getByRole("button", { name: /Approved 1/ }))
    const options = () => screen.getAllByRole("option").map((o) => o.textContent)
    await waitFor(() => expect(options().some((t) => /Nguyen/.test(t || ""))).toBe(true))
    expect(options().some((t) => /Garcia/.test(t || "") && !/Nguyen/.test(t || "") && /In Progress/.test(t || ""))).toBe(false)
    fireEvent.click(screen.getByRole("button", { name: "Clear" }))
    fireEvent.change(screen.getByLabelText(/Search projects/), { target: { value: "sf-3003" } })
    await waitFor(() => expect(screen.getByText("1 project shown")).toBeTruthy())
  })

  it("saves a claim status change and writes it to the projects table", async () => {
    db.rows.projects = [project({ id: "p1" }), project({ id: "p2", project_name: "Other" })]
    render(<AppPage />)
    await pickProject("p1")
    const select = (await screen.findByLabelText("Claim status")) as HTMLSelectElement
    fireEvent.change(select, { target: { value: "In Review" } })
    await waitFor(() => expect(db.writes.some((w) => w.table === "projects" && w.op === "update" && JSON.stringify(w.payload) === JSON.stringify({ claim_status: "In Review" }))).toBe(true))
    await waitFor(() => expect((screen.getByLabelText("Claim status") as HTMLSelectElement).value).toBe("In Review"))
  })

  it("puts the old status back and says so when the save fails", async () => {
    db.rows.projects = [project({ id: "p1" }), project({ id: "p2", project_name: "Other" })]
    render(<AppPage />)
    await pickProject("p1")
    const select = (await screen.findByLabelText("Claim status")) as HTMLSelectElement
    db.failWrites = true
    fireEvent.change(select, { target: { value: "Denied" } })
    expect(await screen.findByText(/Could not save the status/)).toBeTruthy()
    expect((screen.getByLabelText("Claim status") as HTMLSelectElement).value).toBe("In Progress")
  })

  it("keeps the claim details form open and shows a message when saving them fails", async () => {
    db.rows.projects = [project({ id: "p1" }), project({ id: "p2", project_name: "Other" })]
    render(<AppPage />)
    await pickProject("p1")
    fireEvent.click(await screen.findByRole("button", { name: "Edit" }))
    db.failWrites = true
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByText(/Could not save the claim details/)).toBeTruthy()
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy() // still editing, nothing lost
  })

  it("puts a capture back with a message if deleting it fails after the undo window", async () => {
    db.rows.projects = [project({ id: "p1" }), project({ id: "p2", project_name: "Other" })]
    db.rows.captures = [{ id: "c1", project_id: "p1", image_url: "", damage_type: "Decking", roof_area: "Front", field_note: "Soft decking", status: "Captured", created_at: "2026-10-02T00:00:00Z" }]
    render(<AppPage />)
    await pickProject("p1")
    const del = await screen.findByRole("button", { name: "Delete Capture" })
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      db.failWrites = true
      fireEvent.click(del)
      expect(screen.queryByRole("button", { name: "Delete Capture" })).toBeNull() // hidden right away
      await vi.advanceTimersByTimeAsync(8500)
    } finally {
      vi.useRealTimers()
    }
    expect(await screen.findByText(/could not be deleted, so it was put back/)).toBeTruthy()
    expect(await screen.findByRole("button", { name: "Delete Capture" })).toBeTruthy()
  })


  // These four tests check what the page does with the answers it gets. The database and the photo storage here are
  // stand-ins that return the answers set in each test, so they do not prove what the real Supabase returns.
  const photoUrl = (name: string) => `https://abc.supabase.co/storage/v1/object/public/test-uploads/${name}`
  const findingWithPhotos = () => ({ id: "c1", project_id: "p1", image_url: photoUrl("a-0.jpg"), image_urls: [photoUrl("a-0.jpg"), photoUrl("a-1.jpg")], damage_type: "Decking", roof_area: "Front", field_note: "Soft decking", status: "Captured", created_at: "2026-10-02T00:00:00Z" })
  async function deleteFirstFinding() {
    const del = await screen.findByRole("button", { name: "Delete Capture" })
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      fireEvent.click(del)
      await vi.advanceTimersByTimeAsync(8500)
    } finally {
      vi.useRealTimers()
    }
  }

  it("does not count a delete the database refused (no error, no rows removed) as a deletion, and leaves the photos alone", async () => {
    db.rows.projects = [project({ id: "p1" }), project({ id: "p2", project_name: "Other" })]
    db.rows.captures = [findingWithPhotos()]
    db.denyDeletes = true
    render(<AppPage />)
    await pickProject("p1")
    await deleteFirstFinding()
    expect(await screen.findByText(/was not deleted, so it was put back/)).toBeTruthy()
    expect(await screen.findByRole("button", { name: "Delete Capture" })).toBeTruthy()
    expect(db.removeCalls).toEqual([])
  })

  it("removes every photo of a deleted finding and raises no warning when all of them are confirmed", async () => {
    db.rows.projects = [project({ id: "p1" }), project({ id: "p2", project_name: "Other" })]
    db.rows.captures = [findingWithPhotos()]
    db.removeResult = { data: [{ name: "a-0.jpg" }, { name: "a-1.jpg" }], error: null }
    render(<AppPage />)
    await pickProject("p1")
    await deleteFirstFinding()
    await waitFor(() => expect(db.removeCalls).toHaveLength(1))
    expect([...db.removeCalls[0]].sort()).toEqual(["a-0.jpg", "a-1.jpg"])
    expect(screen.queryByText(/could not be confirmed removed/)).toBeNull()
    expect(screen.queryByRole("button", { name: "Delete Capture" })).toBeNull()
  })

  it("says so, and writes a record, when the storage service confirms only some of the photos", async () => {
    db.rows.projects = [project({ id: "p1" }), project({ id: "p2", project_name: "Other" })]
    db.rows.captures = [findingWithPhotos()]
    db.removeResult = { data: [{ name: "a-0.jpg" }], error: null }
    vi.mocked(authFetch).mockClear()
    render(<AppPage />)
    await pickProject("p1")
    await deleteFirstFinding()
    expect(await screen.findByText(/The finding was deleted, but 1 photo file could not be confirmed removed/)).toBeTruthy()
    const logged = vi.mocked(authFetch).mock.calls.find((c) => String(c[0]).includes("activity-log"))
    expect(String(logged?.[1]?.body)).toContain("a-1.jpg")
  })

  it("says so when the storage service returns an error for the removal", async () => {
    db.rows.projects = [project({ id: "p1" }), project({ id: "p2", project_name: "Other" })]
    db.rows.captures = [findingWithPhotos()]
    db.removeResult = { data: null, error: { message: "storage unavailable" } }
    render(<AppPage />)
    await pickProject("p1")
    await deleteFirstFinding()
    expect(await screen.findByText(/The finding was deleted, but 2 photo files could not be confirmed removed/)).toBeTruthy()
  })

  it("asks free-plan users to upgrade instead of sending a report, and does not email anything", async () => {
    plan.paid = false
    db.rows.projects = [project({ id: "p1" }), project({ id: "p2", project_name: "Other" })]
    db.rows.captures = [{ id: "c1", project_id: "p1", image_url: "", damage_type: "Decking", roof_area: "Front", field_note: "Soft decking", status: "Captured", created_at: "2026-10-02T00:00:00Z" }]
    render(<AppPage />)
    await pickProject("p1")
    fireEvent.click(await screen.findByRole("button", { name: /Generate Project Report/ }))
    fireEvent.click(await screen.findByRole("button", { name: /Send Report/ }))
    expect(await screen.findByText("Upgrade to unlock")).toBeTruthy()
    expect(screen.queryByText(/Send report to adjuster/i)).toBeNull()
  })

  it("lets a paid user open the send-report window", async () => {
    db.rows.projects = [project({ id: "p1" }), project({ id: "p2", project_name: "Other" })]
    db.rows.captures = [{ id: "c1", project_id: "p1", image_url: "", damage_type: "Decking", roof_area: "Front", field_note: "Soft decking", status: "Captured", created_at: "2026-10-02T00:00:00Z" }]
    render(<AppPage />)
    await pickProject("p1")
    fireEvent.click(await screen.findByRole("button", { name: /Generate Project Report/ }))
    fireEvent.click(await screen.findByRole("button", { name: /Send Report/ }))
    await waitFor(() => expect(screen.queryByText("Upgrade to unlock")).toBeNull())
  })

  it("builds the PDF for a paid user without errors", async () => {
    db.rows.projects = [project({ id: "p1" }), project({ id: "p2", project_name: "Other" })]
    db.rows.captures = [
      { id: "c1", project_id: "p1", image_url: "", damage_type: "Decking", roof_area: "Front", field_note: "Soft decking along the eave", status: "Captured", created_at: "2026-10-02T00:00:00Z" },
      { id: "c2", project_id: "p1", image_url: "", damage_type: "Flashing", roof_area: "Chimney", field_note: "Corroded step flashing", status: "Captured", created_at: "2026-10-02T01:00:00Z" },
    ]
    const errors = vi.spyOn(console, "error").mockImplementation(() => {})
    saved.length = 0
    render(<AppPage />)
    await pickProject("p1")
    fireEvent.click(await screen.findByRole("button", { name: /Generate Project Report/ }))
    fireEvent.click(await screen.findByRole("button", { name: /Download PDF/ }))
    await waitFor(() => expect(saved.length).toBeGreaterThan(0), { timeout: 20000 })
    expect(saved[0]).toMatch(/Report.pdf$/)
    expect(errors.mock.calls.filter((c) => String(c[0]).includes("PDF generation failed"))).toHaveLength(0)
    errors.mockRestore()
  })


  // Writes the database refuses (no error, no rows changed) and writes it accepts, for the project's owner and for a team member.
  // The database is a stand-in that returns the answers set in each test, so this shows what the page does with those answers,
  // not what the live Supabase returns.
  const finding = () => ({ id: "c1", project_id: "p1", image_url: "", damage_type: "Decking", roof_area: "Front", field_note: "Soft decking", status: "Captured", created_at: "2026-10-02T00:00:00Z" })
  const ownerProject = () => { db.rows.projects = [project({ id: "p1" }), project({ id: "p2", project_name: "Other" })]; db.rows.captures = [finding()] }
  const memberProject = () => { db.rows.projects = [project({ id: "p1", user_id: "owner-9" }), project({ id: "p2", project_name: "Mine" })]; db.rows.captures = [finding()] }
  const updates = () => db.writes.filter((w) => w.op === "update" && (w.table === "captures" || w.table === "projects"))

  it("an owner's status change is saved and stays on screen", async () => {
    ownerProject()
    render(<AppPage />)
    await pickProject("p1")
    fireEvent.change((await screen.findByDisplayValue("Captured")) as HTMLSelectElement, { target: { value: "Needs Review" } })
    expect(((await screen.findByDisplayValue("Needs Review")) as HTMLSelectElement).value).toBe("Needs Review")
    expect(updates().some((w) => w.table === "captures")).toBe(true)
    expect(screen.queryByText(/was not saved/)).toBeNull()
  })

  it("a refused status change is not shown as saved: the dropdown goes back and the person is told", async () => {
    ownerProject()
    db.denyUpdates = true
    render(<AppPage />)
    await pickProject("p1")
    const select = (await screen.findByDisplayValue("Captured")) as HTMLSelectElement
    fireEvent.change(select, { target: { value: "Needs Review" } })
    expect(await screen.findByText(/This change was not saved/)).toBeTruthy()
    expect(select.value).toBe("Captured")
  })

  it("an owner's claim status change is kept, and a refused one goes back with a clear message", async () => {
    ownerProject()
    render(<AppPage />)
    await pickProject("p1")
    const claim = (await screen.findByLabelText("Claim status")) as HTMLSelectElement
    fireEvent.change(claim, { target: { value: "Approved" } })
    await waitFor(() => expect(claim.value).toBe("Approved"))
    expect(screen.queryByText(/This change was not saved/)).toBeNull()
    db.denyUpdates = true
    fireEvent.change(claim, { target: { value: "Denied" } })
    expect(await screen.findByText(/This change was not saved/)).toBeTruthy()
    expect(claim.value).toBe("Approved") // the last status that was really saved
  })

  it("editing a finding: an owner's save closes the form, a refused save keeps it open and says nothing was saved", async () => {
    ownerProject()
    render(<AppPage />)
    await pickProject("p1")
    fireEvent.click(await screen.findByRole("button", { name: "Edit Capture" }))
    fireEvent.change(await screen.findByLabelText("Field note"), { target: { value: "Soft decking, three sheets" } })
    db.denyUpdates = true
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))
    expect(await screen.findByText(/This change was not saved/)).toBeTruthy()
    expect(screen.getByLabelText("Field note")).toBeTruthy() // the form is still open with the person's text
    db.denyUpdates = false
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))
    await waitFor(() => expect(screen.queryByLabelText("Field note")).toBeNull())
    expect(await screen.findByText("Saved.")).toBeTruthy()
  })

  it("a team member sees the owner's project as view only, with an explanation and without the edit, add or delete controls", async () => {
    memberProject()
    render(<AppPage />)
    await pickProject("p1")
    expect(await screen.findByTestId("read-only-notice")).toBeTruthy()
    expect(screen.getByText("View only")).toBeTruthy()
    expect(screen.getByText(/Projects you create yourself belong to you and are not visible to the team owner/)).toBeTruthy()
    for (const name of ["Delete Capture", "Edit Capture", "Save Capture", "Edit"]) expect(screen.queryByRole("button", { name }), name).toBeNull()
    expect(screen.queryByText("New Capture")).toBeNull()
    expect(screen.queryByDisplayValue("Captured")).toBeNull() // the finding's status is a label, not a dropdown
    expect((screen.getByLabelText("Claim status") as HTMLSelectElement).disabled).toBe(true)
    expect(screen.getByRole("button", { name: /Generate Project Report/ })).toBeTruthy() // viewing and reporting stay
  })

  it("an owner still sees every edit control and no read-only notice", async () => {
    ownerProject()
    render(<AppPage />)
    await pickProject("p1")
    expect(await screen.findByRole("button", { name: "Edit Capture" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Delete Capture" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Save Capture" })).toBeTruthy()
    expect(screen.queryByTestId("read-only-notice")).toBeNull()
    expect(screen.queryByText("View only")).toBeNull()
  })

  it("a team member can still build the PDF, and the report flow does not try to save anything to the owner's project", async () => {
    memberProject()
    const errors = vi.spyOn(console, "error").mockImplementation(() => {})
    saved.length = 0
    render(<AppPage />)
    await pickProject("p1")
    fireEvent.click(await screen.findByRole("button", { name: /Generate Project Report/ }))
    fireEvent.click(await screen.findByRole("button", { name: /Download PDF/ }))
    await waitFor(() => expect(saved.length).toBeGreaterThan(0), { timeout: 20000 })
    expect(updates()).toHaveLength(0)
    errors.mockRestore()
  })

  it("for the owner, the same report flow does save the statuses, and says so if the database refuses them", async () => {
    ownerProject()
    const errors = vi.spyOn(console, "error").mockImplementation(() => {})
    render(<AppPage />)
    await pickProject("p1")
    db.denyUpdates = true
    fireEvent.click(await screen.findByRole("button", { name: /Generate Project Report/ }))
    expect(await screen.findByText(/Some finding statuses could not be saved/, undefined, { timeout: 20000 })).toBeTruthy()
    errors.mockRestore()
  })


  // The label on the project draft. Generating a draft is not saving it. The database here is a stand-in that returns the answers
  // set in each test, so this shows what the page does with those answers, not what the live Supabase returns.
  async function withGeneratedDraft(run: () => Promise<void>) {
    const original = vi.mocked(authFetch).getMockImplementation()
    vi.mocked(authFetch).mockImplementation((async (url: string) =>
      String(url).includes("generate-project-draft")
        ? { ok: true, json: async () => ({ draft: "Fictional draft text for a sample roof." }) }
        : { ok: true, json: async () => ({}) }) as never)
    try {
      await run()
    } finally {
      if (original) vi.mocked(authFetch).mockImplementation(original)
    }
  }

  it("a generated draft says 'Draft generated', not 'Saved', while the database has not confirmed the write", async () => {
    ownerProject()
    db.denyUpdates = true // the save is refused: no error and no row changed
    await withGeneratedDraft(async () => {
      render(<AppPage />)
      await pickProject("p1")
      fireEvent.click(await screen.findByRole("button", { name: /Generate Project Draft/ }))
      expect(await screen.findByText("Draft generated")).toBeTruthy()
      await waitFor(() => expect(updates().length).toBeGreaterThan(0)) // the save was attempted
      expect(screen.queryByText("Saved")).toBeNull()
    })
  })

  it("the label becomes 'Saved' only once the database confirms the write", async () => {
    ownerProject()
    await withGeneratedDraft(async () => {
      render(<AppPage />)
      await pickProject("p1")
      fireEvent.click(await screen.findByRole("button", { name: /Generate Project Draft/ }))
      expect(await screen.findByText("Saved")).toBeTruthy()
      expect(screen.queryByText("Draft generated")).toBeNull()
    })
  })

  it("a draft that was already stored on the project is 'Saved', and a team member's own generated draft is not", async () => {
    db.rows.projects = [project({ id: "p1", last_draft: "Stored draft text." }), project({ id: "p2", project_name: "Other" })]
    db.rows.captures = [finding()]
    render(<AppPage />)
    await pickProject("p1")
    expect(await screen.findByText("Saved")).toBeTruthy()
    cleanup()
    db.rows.projects = [project({ id: "p1", user_id: "owner-9" }), project({ id: "p2", project_name: "Mine" })]
    await withGeneratedDraft(async () => {
      render(<AppPage />)
      await pickProject("p1")
      fireEvent.click(await screen.findByRole("button", { name: /Generate Project Draft/ }))
      expect(await screen.findByText("Draft generated")).toBeTruthy()
      expect(screen.queryByText("Saved")).toBeNull()
      expect(updates()).toHaveLength(0) // nothing was attempted for a project this account can only view
    })
  })

  it("tells the user when the microphone is blocked instead of failing silently", async () => {
    const instances: Array<{ onerror?: (e: unknown) => void }> = []
    class FakeRecognition {
      onerror?: (e: unknown) => void
      onend?: () => void
      start() {
        instances.push(this)
      }
      stop() {}
    }
    ;(window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition = FakeRecognition
    db.rows.projects = [project({ id: "p1" }), project({ id: "p2", project_name: "Other" })]
    render(<AppPage />)
    await pickProject("p1")
    fireEvent.click(await screen.findByRole("button", { name: /voice|speak|record|dictate/i }))
    expect(instances).toHaveLength(1)
    instances[0].onerror!({ error: "not-allowed" })
    expect(await screen.findByText(/microphone is blocked/i)).toBeTruthy()
    delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  })

  async function startProjectFromForm(name: string) {
    fireEvent.click(await screen.findByRole("button", { name: "+ New" }))
    fireEvent.change(await screen.findByPlaceholderText(/Project name/), { target: { value: name } })
    fireEvent.change(screen.getByPlaceholderText("Property address"), { target: { value: "12 Oak Lane, Cary NC" } })
    fireEvent.click(screen.getByRole("button", { name: "Create Project" }))
  }

  it("lets a free account start a project of its own next to the auto-created demo", async () => {
    plan.paid = false
    db.rows.projects = [project({ id: "demo", project_name: "Demo Project — Smith Residence" })]
    render(<AppPage />)
    await startProjectFromForm("Garcia Roof")
    await waitFor(() => expect(db.writes.some((w) => w.table === "projects" && w.op === "insert")).toBe(true))
    expect(screen.queryByText("Upgrade to unlock")).toBeNull()
  })

  it("asks a free account that already has the demo and one project to upgrade for another", async () => {
    plan.paid = false
    db.rows.projects = [project({ id: "demo", project_name: "Demo Project — Smith Residence" }), project({ id: "p1", project_name: "Garcia Roof" })]
    render(<AppPage />)
    await startProjectFromForm("Third Job")
    expect(await screen.findByText("Upgrade to unlock")).toBeTruthy()
    expect(db.writes.some((w) => w.table === "projects" && w.op === "insert")).toBe(false)
  })
})
