import { describe, it, expect, afterEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import NotFound, { metadata } from "../app/not-found"

describe("404 page", () => {
  afterEach(() => cleanup())

  it("has its own title instead of the home page title it used to inherit", () => {
    expect(metadata.title).toBe("Page not found | Supplement Snap")
    expect(metadata.title).not.toBe("Roofing Supplement Software | Capture Damage, Send Reports")
  })

  it("still shows the same message and the same two ways out", () => {
    render(<NotFound />)
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Page not found")
    expect(screen.getByRole("link", { name: "Back to Home" }).getAttribute("href")).toBe("/")
    expect(screen.getByRole("link", { name: "Go to Dashboard" }).getAttribute("href")).toBe("/dashboard")
  })
})
