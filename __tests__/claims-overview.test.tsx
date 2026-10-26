import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import { ClaimsOverview, ClaimStatusSelect, StartHere } from "../app/app/claims-overview"
import { clearGuideVisit, markProjectCreated } from "../lib/guide-state"

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

  it("hides for this visit only, and comes back after logging in again", () => {
    const { unmount } = render(<StartHere {...base} />)
    fireEvent.click(screen.getByRole("button", { name: "Hide the start guide" }))
    expect(screen.queryByTestId("start-here")).toBeNull()
    unmount()
    render(<StartHere {...base} />)
    expect(screen.queryByTestId("start-here")).toBeNull() // same visit
    cleanup()
    clearGuideVisit() // what logging out does
    render(<StartHere {...base} />)
    expect(screen.getByTestId("start-here")).toBeTruthy()
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
