import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

/**
 * The "password changed" security email is sent by the sign-in provider (Supabase Auth, Security notifications),
 * for every plan, after it records a real change. The reset page must not send it itself through the report-email
 * route (which is paid-only) and must not claim an email was sent.
 */

const h = vi.hoisted(() => ({
  updateUser: vi.fn(),
  push: vi.fn(),
  authFetch: vi.fn(),
}))

vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: { access_token: "t", user: { id: "u1", email: "me@example.com" } } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      getUser: async () => ({ data: { user: { id: "u1", email: "me@example.com" } } }),
      updateUser: (...a: unknown[]) => h.updateUser(...a),
    },
  },
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: h.push, replace: vi.fn() }) }))
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }))
vi.mock("../lib/auth-fetch", () => ({ authFetch: (...a: unknown[]) => h.authFetch(...a) }))

import ResetPasswordPage from "../app/reset-password/page"

const NEW_PASSWORD = "synthetic-test-pw-1"
let fetchSpy: ReturnType<typeof vi.spyOn>

async function submitNewPassword() {
  const [first, second] = await waitFor(() => {
    const boxes = document.querySelectorAll('input[type="password"]')
    expect(boxes.length).toBe(2)
    return Array.from(boxes) as HTMLInputElement[]
  })
  fireEvent.change(first, { target: { value: NEW_PASSWORD } })
  fireEvent.change(second, { target: { value: NEW_PASSWORD } })
  fireEvent.submit(first.closest("form") as HTMLFormElement)
}

beforeEach(() => {
  vi.clearAllMocks()
  h.updateUser.mockResolvedValue({ error: null })
  fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"))
})
afterEach(() => {
  cleanup()
  fetchSpy.mockRestore()
})

describe("reset-password page", () => {
  it("changes the password and says only that it was changed, sending no email request of its own", async () => {
    render(<ResetPasswordPage />)
    await submitNewPassword()
    await screen.findByText("Your password has been changed.")
    expect(h.updateUser).toHaveBeenCalledWith({ password: NEW_PASSWORD })
    expect(h.authFetch).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(screen.queryByText(/confirmation email/i)).toBeNull()
  })

  it("still redirects to the dashboard after a successful change", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      render(<ResetPasswordPage />)
      await submitNewPassword()
      await screen.findByText("Your password has been changed.")
      await vi.advanceTimersByTimeAsync(2600)
      expect(h.push).toHaveBeenCalledWith("/dashboard?reset=1")
    } finally {
      vi.useRealTimers()
    }
  })

  it("shows the provider's error and no success when the change fails", async () => {
    h.updateUser.mockResolvedValue({ error: { message: "New password should be different from the old password." } })
    render(<ResetPasswordPage />)
    await submitNewPassword()
    await screen.findByText(/should be different/i)
    expect(screen.queryByText("Your password has been changed.")).toBeNull()
    expect(h.authFetch).not.toHaveBeenCalled()
    expect(h.push).not.toHaveBeenCalled()
  })

  it("refuses a short password or a mismatch before calling the provider", async () => {
    render(<ResetPasswordPage />)
    const [first, second] = await waitFor(() => {
      const boxes = document.querySelectorAll('input[type="password"]')
      expect(boxes.length).toBe(2)
      return Array.from(boxes) as HTMLInputElement[]
    })
    fireEvent.change(first, { target: { value: "abc" } })
    fireEvent.change(second, { target: { value: "abc" } })
    fireEvent.submit(first.closest("form") as HTMLFormElement)
    await screen.findByText(/at least 6 characters/i)
    fireEvent.change(first, { target: { value: "longenough1" } })
    fireEvent.change(second, { target: { value: "different1" } })
    fireEvent.submit(first.closest("form") as HTMLFormElement)
    await screen.findByText(/do not match/i)
    expect(h.updateUser).not.toHaveBeenCalled()
  })
})

describe("no screen promises a password-change email", () => {
  it("the dashboard banner shown after a reset does not claim an email was sent", () => {
    const src = readFileSync(join(__dirname, "../app/dashboard/page.tsx"), "utf8")
    const banner = src.slice(src.indexOf("function ResetSuccessBanner"))
    expect(banner.slice(0, banner.indexOf("\n}\n"))).not.toMatch(/email/i)
  })

  it("only the report sender in app/app/page.tsx calls /api/send-report", () => {
    const hits: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name)
        if (statSync(p).isDirectory()) walk(p)
        else if (/\.(ts|tsx)$/.test(name) && readFileSync(p, "utf8").includes("/api/send-report")) hits.push(p.replace(/\\/g, "/").split("/").slice(-3).join("/"))
      }
    }
    walk(join(__dirname, "../app"))
    walk(join(__dirname, "../lib"))
    // lib/followup-gate.ts only mentions the route in a comment
    const allowed = ["app/app/page.tsx", "send-report/route.ts", "lib/followup-gate.ts"]
    expect(hits.filter((h) => !allowed.some((a) => h.endsWith(a)))).toEqual([])
  })
})
