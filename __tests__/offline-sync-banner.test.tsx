import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import { OfflineSyncBanner } from "../app/app/offline-sync-banner"

afterEach(cleanup)

describe("offline sync banner", () => {
  it("shows nothing when nothing is waiting", () => {
    const { container } = render(<OfflineSyncBanner waiting={0} stuck={0} onSyncNow={() => {}} />)
    expect(container.textContent).toBe("")
  })

  it("explains that stuck captures are kept and only retried when Sync Now is pressed", () => {
    const onSyncNow = vi.fn()
    render(<OfflineSyncBanner waiting={3} stuck={2} onSyncNow={onSyncNow} />)
    expect(document.body.textContent).toMatch(/3 captures waiting to sync/)
    expect(document.body.textContent).toMatch(/2 could not be saved after several tries and are kept on this device until you press Sync Now/)
    fireEvent.click(screen.getByRole("button", { name: "Sync Now" }))
    expect(onSyncNow).toHaveBeenCalledTimes(1)
  })

  it("has no stuck wording when none are stuck", () => {
    render(<OfflineSyncBanner waiting={1} stuck={0} onSyncNow={() => {}} />)
    expect(document.body.textContent).toMatch(/1 capture waiting to sync/)
    expect(document.body.textContent).not.toMatch(/could not be saved/)
  })
})
