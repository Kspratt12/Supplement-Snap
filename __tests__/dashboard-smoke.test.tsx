import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup, configure } from "@testing-library/react"

// The whole dashboard renders in these tests, so give a busy machine more time before a lookup gives up.
configure({ asyncUtilTimeout: 6000 })
vi.setConfig({ testTimeout: 20000 })

// A stand-in database: every query returns the rows set for that table, and writes can be told to fail.
const db = vi.hoisted(() => ({
  rows: {} as Record<string, unknown[]>,
  failWrites: false,
  writes: [] as Array<{ table: string; op: string; payload: unknown }>,
}))

vi.mock("../lib/supabase", () => {
  const chain = (table: string, op = "select", payload: unknown = undefined): unknown => {
    const result = () => {
      if (op !== "select") db.writes.push({ table, op, payload })
      if (op !== "select" && db.failWrites) return { data: null, error: { message: "network down" } }
      const rows = db.rows[table] ?? []
      return { data: rows, error: null }
    }
    const proxy: unknown = new Proxy(
      {},
      {
        get(_t, prop: string) {
          if (prop === "then") return (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => Promise.resolve(result()).then(res, rej)
          if (prop === "single" || prop === "maybeSingle") return () => Promise.resolve({ data: (db.rows[table] ?? [])[0] ?? null, error: null })
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
      storage: { from: () => ({ remove: async () => ({ data: [], error: null }), upload: async () => ({ data: {}, error: null }), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) },
      auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
    },
  }
})

// The real auth hook keeps one user object between renders; a new object each time would reload the projects constantly.
const authUser = vi.hoisted(() => ({ id: "u1", email: "roofer@example.com" }))

vi.mock("../lib/auth-context", () => ({
  useAuth: () => ({
    user: authUser,
    loading: false,
    signOut: async () => {},
    subscriptionStatus: "active",
    subscriptionPlan: "starter",
    subscriptionLoading: false,
  }),
  hasActiveSubscription: () => true,
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }))
vi.mock("../lib/auth-fetch", () => ({ authFetch: vi.fn(async () => ({ ok: true, json: async () => ({}) })) }))
vi.mock("../app/dashboard/feedback-box", () => ({ FeedbackBox: () => null }))
vi.mock("../app/dashboard/photo-annotator", () => ({ PhotoAnnotator: () => null }))

import AppPage from "../app/app/page"

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

describe("dashboard smoke test (stand-in database)", () => {
  beforeEach(() => {
    db.rows = { projects: [], captures: [], team_members: [] }
    db.failWrites = false
    db.writes = []
    window.localStorage.clear()
  })
  afterEach(() => cleanup())

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
    fireEvent.change(await screen.findByLabelText("Project / Job"), { target: { value: "p1" } })
    const select = (await screen.findByLabelText("Claim status")) as HTMLSelectElement
    fireEvent.change(select, { target: { value: "In Review" } })
    await waitFor(() => expect(db.writes.some((w) => w.table === "projects" && w.op === "update" && JSON.stringify(w.payload) === JSON.stringify({ claim_status: "In Review" }))).toBe(true))
    await waitFor(() => expect((screen.getByLabelText("Claim status") as HTMLSelectElement).value).toBe("In Review"))
  })

  it("puts the old status back and says so when the save fails", async () => {
    db.rows.projects = [project({ id: "p1" }), project({ id: "p2", project_name: "Other" })]
    render(<AppPage />)
    fireEvent.change(await screen.findByLabelText("Project / Job"), { target: { value: "p1" } })
    const select = (await screen.findByLabelText("Claim status")) as HTMLSelectElement
    db.failWrites = true
    fireEvent.change(select, { target: { value: "Denied" } })
    expect(await screen.findByText(/Could not save the status/)).toBeTruthy()
    expect((screen.getByLabelText("Claim status") as HTMLSelectElement).value).toBe("In Progress")
  })

  it("keeps the claim details form open and shows a message when saving them fails", async () => {
    db.rows.projects = [project({ id: "p1" }), project({ id: "p2", project_name: "Other" })]
    render(<AppPage />)
    fireEvent.change(await screen.findByLabelText("Project / Job"), { target: { value: "p1" } })
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
    fireEvent.change(await screen.findByLabelText("Project / Job"), { target: { value: "p1" } })
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
})
