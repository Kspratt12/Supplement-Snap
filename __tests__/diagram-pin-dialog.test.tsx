import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react"

// eslint-disable-next-line @next/next/no-img-element
vi.mock("../lib/signed-img", () => ({ SignedImg: (p: { alt: string }) => <img alt={p.alt} /> }))
import { DiagramPinDialog } from "../app/app/claim-tracking"

afterEach(cleanup)

describe("placing a finding on the roof diagram", () => {
  it("a tap sets the pin as a share of the diagram size and Save stores it", async () => {
    const onSave = vi.fn(async () => "")
    const onClose = vi.fn()
    render(<DiagramPinDialog diagramUrl="https://example.test/d.png" projectId="p1" number={2} current={null} others={[{ n: 1, pin: { x: 0.1, y: 0.1 } }]} onSave={onSave} onClose={onClose} />)
    const target = screen.getByTestId("pin-target")
    target.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 200, right: 400, bottom: 200, x: 0, y: 0, toJSON: () => ({}) })
    expect((screen.getByRole("button", { name: "Save pin" }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(target, { clientX: 100, clientY: 150 })
    fireEvent.click(screen.getByRole("button", { name: "Save pin" }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ x: 0.25, y: 0.75 }))
    expect(onClose).toHaveBeenCalled()
    expect(screen.queryByRole("button", { name: "Remove pin" })).toBeNull() // nothing to remove yet
  })

  it("an existing pin can be removed, and a failed save stays open with the reason", async () => {
    const onSave = vi.fn(async () => "The pin was not saved. Check your connection and try again.")
    const onClose = vi.fn()
    render(<DiagramPinDialog diagramUrl="https://example.test/d.png" projectId="p1" number={1} current={{ x: 0.5, y: 0.5 }} others={[]} onSave={onSave} onClose={onClose} />)
    fireEvent.click(screen.getByRole("button", { name: "Remove pin" }))
    expect(await screen.findByRole("alert")).toBeTruthy()
    expect(onSave).toHaveBeenCalledWith(null)
    expect(onClose).not.toHaveBeenCalled()
  })
})
