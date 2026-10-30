import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import { ClaimsOverview, ClaimStatusSelect, StartHere } from "../app/app/claims-overview"
import { markProjectCreated } from "../lib/guide-state"

// Saving Hide on the account is a call to Supabase. Here it is a stand-in, so nothing is sent anywhere.
const updateUser = vi.hoisted(() => vi.fn())
vi.mock("../lib/supabase", () => ({ supabase: { auth: { updateUser } } }))

afterEach(() => {
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

  it("shows three steps and starts a project", () => {
    const onCreate = vi.fn()
    render(<StartHere {...base} onCreateProject={onCreate} />)
    expect(screen.getAllByRole("listitem")).toHaveLength(3)
    fireEvent.click(screen.getByRole("button", { name: "Start my first project" }))
    expect(onCreate).toHaveBeenCalled()
  })

  it("explains the free plan only to free users", () => {
    const { rerender } = render(<StartHere {...base} isFreeUser={true} />)
    expect(screen.getByText(/free plan/)).toBeTruthy()
    rerender(<StartHere {...base} isFreeUser={false} />)
    expect(screen.queryByText(/free plan/)).toBeNull()
  })

  it("Hide closes the panel at once and keeps it closed after a refresh, a new visit and a project change", () => {
    updateUser.mockReset().mockResolvedValue({ error: null })
    const { unmount } = render(<StartHere {...base} />)
    expect(screen.getByTestId("start-here")).toBeTruthy()
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
    expect(updateUser).toHaveBeenCalledWith({ data: { ss_start_here_hidden: true } })
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

  it("one person's Hide does not hide the guide for another person on the same browser", () => {
    updateUser.mockReset().mockResolvedValue({ error: null })
    render(<StartHere {...base} userId="u1" />)
    fireEvent.click(screen.getByRole("button", { name: "Hide the start guide" }))
    expect(screen.queryByTestId("start-here")).toBeNull()
    cleanup()
    render(<StartHere {...base} userId="u2" />)
    expect(screen.getByTestId("start-here")).toBeTruthy()
    cleanup()
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

  it("still works when browser storage is blocked", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    render(<StartHere {...base} />)
    expect(screen.getByTestId("start-here")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Hide the start guide" }))
    expect(screen.queryByTestId("start-here")).toBeNull()
    spy.mockRestore()
    set.mockRestore()
  })
})
