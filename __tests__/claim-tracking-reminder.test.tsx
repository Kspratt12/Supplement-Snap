import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react"
vi.mock("../lib/signed-img", () => ({ SignedImg: () => null }))
import { ClaimTracking } from "../app/app/claim-tracking"

afterEach(cleanup)

describe("follow-up reminder opt-in", () => {
  it("is not shown while reminder emails are not available, and the panel says no email is sent", () => {
    render(<ClaimTracking project={{ follow_up_on: "2026-11-20" }} readOnly={false} onSave={async () => ""} />)
    fireEvent.click(screen.getByRole("button", { name: "Edit" }))
    expect(screen.queryByText(/Email me on the follow-up date/)).toBeNull()
    expect(screen.getByTestId("claim-tracking").textContent).toMatch(/no email is sent/)
  })

  it("when available, needs a date, and saves the opt-in with the browser's time zone; clearing the date turns it off", async () => {
    const onSave = vi.fn(async (_patch: Record<string, unknown>) => "")
    render(<ClaimTracking project={{ follow_up_on: null }} readOnly={false} onSave={onSave} remindersAvailable />)
    fireEvent.click(screen.getByRole("button", { name: /Track amounts and follow-up/ }))
    const box = screen.getByRole("checkbox") as HTMLInputElement
    expect(box.disabled).toBe(true) // no date yet
    fireEvent.change(screen.getByLabelText("Next follow-up"), { target: { value: "2026-12-01" } })
    fireEvent.click(box)
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    const patch = onSave.mock.calls[0][0]
    expect(patch).toMatchObject({ follow_up_on: "2026-12-01", reminder_opt_in: true })
    expect(typeof patch.reminder_tz).toBe("string")
  })
})
