import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"

/**
 * After signup, when the email still has to be confirmed, the page shows a neutral/positive notice, not red error styling.
 * A real failure (such as the provider refusing the signup, or an automatic login failing for another reason) stays red.
 */

const h = vi.hoisted(() => ({ signUp: vi.fn(), signIn: vi.fn() }))

vi.mock("../lib/supabase", () => ({
  supabase: { auth: { signUp: (...a: unknown[]) => h.signUp(...a), signInWithPassword: (...a: unknown[]) => h.signIn(...a) } },
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), useSearchParams: () => new URLSearchParams() }))
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }))
vi.mock("../lib/auth-fetch", () => ({ authFetch: vi.fn(async () => ({ ok: true, json: async () => ({}) })) }))
vi.mock("../lib/auth-context", () => ({ useAuth: () => ({ user: null, loading: false }) }))
vi.mock("../lib/analytics", () => ({ trackEvent: vi.fn() }))

import SignupPage from "../app/signup/page"

async function submit() {
  fireEvent.change(document.getElementById("name") as HTMLInputElement, { target: { value: "Test User" } })
  fireEvent.change(document.getElementById("email") as HTMLInputElement, { target: { value: "test@example.com" } })
  fireEvent.change(document.getElementById("password") as HTMLInputElement, { target: { value: "synthetic-pw-1" } })
  fireEvent.change(document.getElementById("confirm-password") as HTMLInputElement, { target: { value: "synthetic-pw-1" } })
  fireEvent.submit((document.getElementById("email") as HTMLInputElement).closest("form") as HTMLFormElement)
}

beforeEach(() => {
  vi.clearAllMocks()
  h.signUp.mockResolvedValue({ data: { session: null }, error: null })
})
afterEach(cleanup)

describe("signup confirmation notice", () => {
  it("shows the 'confirm your email' message as a green status, not a red error", async () => {
    h.signIn.mockResolvedValue({ data: {}, error: { message: "Email not confirmed" } })
    render(<SignupPage />)
    await submit()
    const note = await screen.findByText("Account created. Please confirm your email, then log in.")
    expect(note.getAttribute("role")).toBe("status")
    expect(note.className).toMatch(/green/)
    expect(note.className).not.toMatch(/red/)
  })

  it("keeps a failed automatic login red", async () => {
    h.signIn.mockResolvedValue({ data: {}, error: { message: "Invalid login credentials" } })
    render(<SignupPage />)
    await submit()
    const err = await screen.findByText("Account created, but automatic login failed. Please log in.")
    expect(err.className).toMatch(/red/)
  })

  it("keeps a refused signup red", async () => {
    h.signUp.mockResolvedValue({ data: { session: null }, error: { message: "User already registered" } })
    render(<SignupPage />)
    await submit()
    const err = await screen.findByText("User already registered")
    expect(err.className).toMatch(/red/)
    expect(h.signIn).not.toHaveBeenCalled()
  })

  it("keeps a password mismatch red and does not call the provider", async () => {
    render(<SignupPage />)
    fireEvent.change(document.getElementById("password") as HTMLInputElement, { target: { value: "aaaaaaaa" } })
    fireEvent.change(document.getElementById("confirm-password") as HTMLInputElement, { target: { value: "bbbbbbbb" } })
    fireEvent.submit((document.getElementById("email") as HTMLInputElement).closest("form") as HTMLFormElement)
    const err = await screen.findByText("Passwords do not match.")
    expect(err.className).toMatch(/red/)
    expect(h.signUp).not.toHaveBeenCalled()
  })
})
