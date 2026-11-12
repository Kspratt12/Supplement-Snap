import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react"

const h = vi.hoisted(() => ({
  auth: { user: null as null | { id: string }, loading: false, signOut: vi.fn() },
  push: vi.fn(),
}))

vi.mock("../lib/auth-context", () => ({ useAuth: () => h.auth }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: h.push }) }))

import { NavLinks } from "../lib/nav-links"

describe("NavLinks mobile menu", () => {
  beforeEach(() => {
    h.auth.user = null
    h.auth.loading = false
  })
  afterEach(() => cleanup())

  it("gives signed-out visitors a collapsed menu button that is only shown below the sm breakpoint", () => {
    render(<NavLinks />)
    const btn = screen.getByRole("button", { name: "Open menu" })
    expect(btn.getAttribute("aria-expanded")).toBe("false")
    expect(btn.getAttribute("aria-controls")).toBe("site-mobile-menu")
    expect(btn.parentElement?.className).toContain("sm:hidden")
    // closed: the panel exists for aria-controls but is hidden, so its links are not reachable
    expect(document.getElementById("site-mobile-menu")?.hasAttribute("hidden")).toBe(true)
  })

  it("opens to How It Works, Blog and Pricing with the same destinations the desktop header uses", () => {
    render(<NavLinks />)
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
    const btn = screen.getByRole("button", { name: "Close menu" })
    expect(btn.getAttribute("aria-expanded")).toBe("true")
    const panel = document.getElementById("site-mobile-menu")!
    expect(panel.hasAttribute("hidden")).toBe(false)
    const hrefs = Array.from(panel.querySelectorAll("a")).map((a) => [a.textContent, a.getAttribute("href")])
    expect(hrefs).toEqual([
      ["How It Works", "/roofing-supplement-software"],
      ["Blog", "/blog"],
      ["Pricing", "/pricing"],
    ])
    // every menu link is a full-height row (44px), so the menu is easy to hit even though the standard asks for less
    for (const a of Array.from(panel.querySelectorAll("a"))) expect(a.className).toContain("min-h-[44px]")
  })

  it("closes on Escape, on an outside click, on choosing a link, and when the button is pressed again", () => {
    render(<NavLinks />)
    const open = () => fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
    const isOpen = () => !document.getElementById("site-mobile-menu")!.hasAttribute("hidden")

    open(); expect(isOpen()).toBe(true)
    fireEvent.keyDown(document, { key: "Escape" }); expect(isOpen()).toBe(false)

    open(); expect(isOpen()).toBe(true)
    fireEvent.mouseDown(document.body); expect(isOpen()).toBe(false)

    open(); expect(isOpen()).toBe(true)
    // jsdom applies no CSS, so the header's own inline Blog link is also in the document: pick the one in the menu
    fireEvent.click(within(document.getElementById("site-mobile-menu")!).getByRole("link", { name: "Blog" })); expect(isOpen()).toBe(false)

    open(); expect(isOpen()).toBe(true)
    fireEvent.click(screen.getByRole("button", { name: "Close menu" })); expect(isOpen()).toBe(false)
  })

  it("does not close when the press is inside the menu itself", () => {
    render(<NavLinks />)
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }))
    fireEvent.mouseDown(document.getElementById("site-mobile-menu")!)
    expect(document.getElementById("site-mobile-menu")!.hasAttribute("hidden")).toBe(false)
  })

  it("keeps Log In and Start Free as they were", () => {
    render(<NavLinks />)
    expect(screen.getByRole("link", { name: "Log In" }).getAttribute("href")).toBe("/login")
    expect(screen.getByRole("link", { name: "Start Free" }).getAttribute("href")).toBe("/signup")
  })

  it("adds no menu for signed-in users, whose three links are already all shown", () => {
    h.auth.user = { id: "u1" }
    render(<NavLinks />)
    expect(screen.queryByRole("button", { name: /menu/i })).toBeNull()
    expect(document.getElementById("site-mobile-menu")).toBeNull()
    expect(screen.getByRole("link", { name: "Dashboard" }).getAttribute("href")).toBe("/dashboard")
    expect(screen.getByRole("link", { name: "Open App" }).getAttribute("href")).toBe("/app")
    expect(screen.getByRole("button", { name: "Log Out" })).toBeTruthy()
  })

  it("shows no menu while the session is still loading, so it cannot flash for a signed-in user", () => {
    h.auth.loading = true
    render(<NavLinks />)
    expect(screen.queryByRole("button")).toBeNull()
    expect(document.getElementById("site-mobile-menu")).toBeNull()
  })
})
