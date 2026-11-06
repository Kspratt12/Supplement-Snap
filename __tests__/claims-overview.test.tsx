import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react"
import { ClaimsOverview, ClaimStatusSelect, StartHere } from "../app/app/claims-overview"
import { markProjectCreated } from "../lib/guide-state"
import { resetDismissalSyncForTests } from "../lib/dismissal-sync"

// Saving and reading the Hide choice on the account are calls to Supabase. Here they are stand-ins, so nothing is sent anywhere.
// "signedIn" is the account the stand-in treats as logged in; "account" is the metadata it reports.
const auth = vi.hoisted(() => ({ signedIn: "u1", account: {} as Record<string, unknown>, saves: [] as Array<Record<string, unknown>> }))
vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: { id: auth.signedIn, user_metadata: auth.account } }, error: null }),
    },
  },
}))
// Saving goes through the server route; here that is a stand-in that records what it was asked to save
const updateUser = vi.hoisted(() => vi.fn())
vi.mock("../lib/auth-fetch", () => ({
  authFetch: async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body))
    updateUser({ data: Object.fromEntries(body.keys.map((k: string) => [k, true])), expectedUser: body.userId, signedIn: auth.signedIn })
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  },
}))

beforeEach(() => {
  auth.signedIn = "u1"
  auth.account = {}
  updateUser.mockReset()
})
afterEach(() => {
  resetDismissalSyncForTests()
  cleanup()
  window.localStorage.clear()
  window.sessionStorage.clear()
})

const projects = [
  { claim_status: "In Progress" },
  { claim_status: "Approved" },
  { claim_status: null },
]

describe("ClaimsOverview", () => {
  it("shows counts, only for statuses that have projects", () => {
    render(<ClaimsOverview projects={projects} query="" onQuery={() => {}} filter="All" onFilter={() => {}} matchCount={3} />)
    expect(screen.getByRole("button", { name: /All 3/ })).toBeTruthy()
    expect(screen.getByRole("button", { name: /In Progress 2/ })).toBeTruthy()
    expect(screen.getByRole("button", { name: /Approved 1/ })).toBeTruthy()
    expect(screen.queryByRole("button", { name: /Denied/ })).toBeNull()
  })

  it("reports search text and filter clicks, and a second click on the active filter clears it", () => {
    const onQuery = vi.fn()
    const onFilter = vi.fn()
    const { rerender } = render(<ClaimsOverview projects={projects} query="" onQuery={onQuery} filter="All" onFilter={onFilter} matchCount={3} />)
    fireEvent.change(screen.getByLabelText(/Search projects/), { target: { value: "smith" } })
    expect(onQuery).toHaveBeenCalledWith("smith")
    fireEvent.click(screen.getByRole("button", { name: /Approved/ }))
    expect(onFilter).toHaveBeenCalledWith("Approved")
    rerender(<ClaimsOverview projects={projects} query="" onQuery={onQuery} filter="Approved" onFilter={onFilter} matchCount={1} />)
    fireEvent.click(screen.getByRole("button", { name: /Approved/ }))
    expect(onFilter).toHaveBeenLastCalledWith("All")
  })

  it("says so when nothing matches and offers a way back", () => {
    const onQuery = vi.fn()
    const onFilter = vi.fn()
    render(<ClaimsOverview projects={projects} query="zzz" onQuery={onQuery} filter="All" onFilter={onFilter} matchCount={0} />)
    expect(screen.getByText(/No projects match/)).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Clear" }))
    expect(onQuery).toHaveBeenCalledWith("")
    expect(onFilter).toHaveBeenCalledWith("All")
  })

  it("does not break on an empty list", () => {
    render(<ClaimsOverview projects={[]} query="" onQuery={() => {}} filter="All" onFilter={() => {}} matchCount={0} />)
    expect(screen.getByRole("button", { name: /All 0/ })).toBeTruthy()
  })
})

describe("ClaimStatusSelect", () => {
  it("shows unknown or missing values as In Progress and reports a change", () => {
    const onChange = vi.fn()
    render(<ClaimStatusSelect value={null} onChange={onChange} saving={false} error="" />)
    const select = screen.getByLabelText("Claim status") as HTMLSelectElement
    expect(select.value).toBe("In Progress")
    fireEvent.change(select, { target: { value: "Denied" } })
    expect(onChange).toHaveBeenCalledWith("Denied")
  })

  it("is disabled while saving and shows an error message", () => {
    const { rerender } = render(<ClaimStatusSelect value="Approved" onChange={() => {}} saving={true} error="" />)
    expect((screen.getByLabelText("Claim status") as HTMLSelectElement).disabled).toBe(true)
    expect(screen.getByText("Saving...")).toBeTruthy()
    rerender(<ClaimStatusSelect value="Approved" onChange={() => {}} saving={false} error="Could not save the status. Please try again." />)
    expect(screen.getByRole("alert").textContent).toMatch(/Could not save/)
  })
})

describe("StartHere", () => {
  const base = { userId: "u1", onlyDemoOrNone: true, onCreateProject: () => {}, isFreeUser: false, freeCaptureLimit: 5 }

  it("shows three steps and starts a project", async () => {
    const onCreate = vi.fn()
    render(<StartHere {...base} onCreateProject={onCreate} />)
    expect(await screen.findByTestId("start-here")).toBeTruthy()
    expect(screen.getAllByRole("listitem")).toHaveLength(3)
    fireEvent.click(screen.getByRole("button", { name: "Start my first project" }))
    expect(onCreate).toHaveBeenCalled()
  })

  it("explains the free plan only to free users", async () => {
    const { rerender } = render(<StartHere {...base} isFreeUser={true} />)
    expect(await screen.findByText(/free plan/)).toBeTruthy()
    rerender(<StartHere {...base} isFreeUser={false} />)
    expect(screen.queryByText(/free plan/)).toBeNull()
  })

  it("shows nothing until the saved choice is known, so a hidden guide never flashes", async () => {
    render(<StartHere {...base} />)
    expect(screen.queryByTestId("start-here")).toBeNull() // first render: the account has not answered yet
    expect(await screen.findByTestId("start-here")).toBeTruthy()
  })

  it("Hide closes the panel at once and keeps it closed after a refresh, a new visit and a project change", async () => {
    const { unmount } = render(<StartHere {...base} />)
    expect(await screen.findByTestId("start-here")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Hide the start guide" }))
    expect(screen.queryByTestId("start-here")).toBeNull() // closed immediately
    unmount()
    render(<StartHere {...base} />) // refresh or navigation: the page mounts again
    expect(screen.queryByTestId("start-here")).toBeNull()
    cleanup()
    window.sessionStorage.clear() // a later visit starts a new browser session
    render(<StartHere {...base} />)
    expect(screen.queryByTestId("start-here")).toBeNull()
    cleanup()
    render(<StartHere {...base} onlyDemoOrNone={false} />) // moved to a project of their own...
    cleanup()
    render(<StartHere {...base} />) // ...and back
    expect(screen.queryByTestId("start-here")).toBeNull()
    await waitFor(() => expect(updateUser).toHaveBeenCalledWith({ data: { ss_start_here_hidden: true }, expectedUser: "u1", signedIn: "u1" }))
  })

  it("is already hidden on the first render when the choice was saved, so it never flashes", () => {
    window.localStorage.setItem("ss-start-here-hidden:u1", "1")
    render(<StartHere {...base} />)
    expect(screen.queryByTestId("start-here")).toBeNull() // checked straight after the first render
    cleanup()
    window.localStorage.clear()
    render(<StartHere {...base} hiddenOnAccount={true} />) // saved on the account, none in this browser
    expect(screen.queryByTestId("start-here")).toBeNull()
  })

  it("one person's Hide does not hide the guide for another person on the same browser", async () => {
    render(<StartHere {...base} userId="u1" />)
    fireEvent.click(await screen.findByRole("button", { name: "Hide the start guide" }))
    expect(screen.queryByTestId("start-here")).toBeNull()
    cleanup()
    auth.signedIn = "u2"
    render(<StartHere {...base} userId="u2" />)
    expect(await screen.findByTestId("start-here")).toBeTruthy()
    cleanup()
    auth.signedIn = "u1"
    render(<StartHere {...base} userId="u1" />)
    expect(screen.queryByTestId("start-here")).toBeNull()
  })

  it("never shows once the person has created a project, even if they delete it later", () => {
    markProjectCreated("u1")
    render(<StartHere {...base} />)
    expect(screen.queryByTestId("start-here")).toBeNull()
  })

  it("does not show when the person already has projects of their own", () => {
    render(<StartHere {...base} onlyDemoOrNone={false} />)
    expect(screen.queryByTestId("start-here")).toBeNull()
  })

  it("still works when browser storage is blocked", async () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    render(<StartHere {...base} />)
    fireEvent.click(await screen.findByRole("button", { name: "Hide the start guide" }))
    expect(screen.queryByTestId("start-here")).toBeNull()
    spy.mockRestore()
    set.mockRestore()
  })
})
