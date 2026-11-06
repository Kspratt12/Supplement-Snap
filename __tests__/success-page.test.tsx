import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react"

/**
 * The real /success page inside the real AuthProvider. Only the Supabase client, the network and analytics are replaced.
 * All people and plans are made up. Nothing here shows what Stripe sends or how long the real webhook takes; it shows
 * what the page says for each answer the server's plan check can give.
 */

const h = vi.hoisted(() => ({
  listeners: [] as Array<(event: string, session: unknown) => void>,
  session: null as null | { access_token: string; user: { id: string; email: string } },
  // What /api/subscription answers: a plan, or "down" (503) / "network" (throws)
  answer: { kind: "plan", status: "active", plan: "starter" } as { kind: "plan"; status: string; plan: string } | { kind: "down" } | { kind: "network" },
  directFails: true,
  events: [] as string[],
}))

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: () => {
      if (h.directFails) throw new Error("lookup unavailable")
      return {}
    },
    auth: {
      getSession: async () => ({ data: { session: h.session } }),
      onAuthStateChange: (cb: (event: string, s: unknown) => void) => {
        h.listeners.push(cb)
        return { data: { subscription: { unsubscribe() { h.listeners = h.listeners.filter((l) => l !== cb) } } } }
      },
      signOut: async () => ({ error: null }),
    },
  },
}))
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }))
vi.mock("../lib/analytics", () => ({ trackEvent: (e: string) => h.events.push(e) }))

import { AuthProvider } from "../lib/auth-context"
import SuccessPage from "../app/success/page"

const roofer = { access_token: "tok-1", user: { id: "u1", email: "roofer@example.com" } }
const other = { access_token: "tok-2", user: { id: "u2", email: "other@example.com" } }

beforeEach(() => {
  h.listeners = []
  h.session = roofer
  h.answer = { kind: "plan", status: "active", plan: "starter" }
  h.directFails = true
  h.events = []
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      if (h.answer.kind === "network") throw new Error("offline")
      if (h.answer.kind === "down") return { ok: false, status: 503, json: async () => ({ code: "plan-unavailable" }) }
      return { ok: true, json: async () => ({ status: (h.answer as { status: string }).status, plan: (h.answer as { plan: string }).plan, viaOwner: false, hasBilling: true, isAdmin: false }) }
    }),
  )
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const open = () => render(<AuthProvider><SuccessPage /></AuthProvider>)
const page = () => document.body.textContent ?? ""

describe("/success page messaging", () => {
  it("never claims a payment was received, for any state", async () => {
    for (const a of [
      { kind: "plan", status: "active", plan: "starter" },
      { kind: "plan", status: "trialing", plan: "team" },
      { kind: "plan", status: "inactive", plan: "none" },
      { kind: "down" },
    ] as const) {
      h.answer = a
      const { unmount } = open()
      await waitFor(() => expect(page()).not.toMatch(/Checking your plan/))
      expect(page()).not.toMatch(/payment received/i)
      expect(page()).not.toMatch(/setup is in progress/i)
      unmount()
    }
  })

  it("an active plan says the plan is active and records the analytics event once", async () => {
    open()
    expect(await screen.findByText("Your plan is active.")).toBeTruthy()
    expect(h.events).toEqual(["subscription_active"])
  })

  it("a trial says the free trial is active, not that anything was paid", async () => {
    h.answer = { kind: "plan", status: "trialing", plan: "starter" }
    open()
    expect(await screen.findByText("Your free trial is active.")).toBeTruthy()
    expect(page()).not.toMatch(/payment/i)
    expect(h.events).toEqual(["subscription_active"])
  })

  it("a signed-in free account is not told a payment is confirming, and no purchase event is recorded", async () => {
    h.answer = { kind: "plan", status: "inactive", plan: "none" }
    open()
    expect(await screen.findByText("This account doesn't show an active plan.")).toBeTruthy()
    expect(page()).not.toMatch(/confirming|payment received|ready to use/i)
    expect(h.events).toEqual([])
  })

  it("a failed plan check says it could not check, not that there is no plan, and records nothing", async () => {
    h.answer = { kind: "down" }
    open()
    expect(await screen.findByText("We couldn't check your plan right now.")).toBeTruthy()
    expect(page()).not.toMatch(/doesn't show an active plan/)
    expect(h.events).toEqual([])
  })

  it("Check again re-asks the server and shows the plan once the check works", async () => {
    h.answer = { kind: "down" }
    open()
    await screen.findByText("We couldn't check your plan right now.")
    h.answer = { kind: "plan", status: "active", plan: "starter" }
    fireEvent.click(screen.getByRole("button", { name: "Check again" }))
    expect(await screen.findByText("Your plan is active.")).toBeTruthy()
    expect(page()).not.toMatch(/couldn't check/)
    expect(h.events).toEqual(["subscription_active"])
  })

  it("signed out: asks them to log in and says nothing about a payment or plan", async () => {
    h.session = null
    open()
    expect(await screen.findByText("Log in to see your plan")).toBeTruthy()
    expect(page()).not.toMatch(/payment|Your plan is active|free trial is active/i)
    expect(h.events).toEqual([])
  })
})

describe("the unverified flag does not leak between accounts", () => {
  it("another account that signs in after a failed check starts from checking, not the earlier account's state", async () => {
    h.answer = { kind: "plan", status: "active", plan: "starter" }
    open()
    await screen.findByText("Your plan is active.")
    // the next check fails; the first account keeps its last good answer but is marked unverified
    h.answer = { kind: "down" }
    h.session = roofer
    await act(async () => { h.listeners.forEach((l) => l("SIGNED_IN", roofer)) })
    await screen.findByText("We couldn't check your plan right now.")

    // a different person signs in and their check succeeds: nothing of the first account's state shows
    h.answer = { kind: "plan", status: "inactive", plan: "none" }
    h.session = other
    await act(async () => { h.listeners.forEach((l) => l("SIGNED_IN", other)) })
    expect(await screen.findByText("This account doesn't show an active plan.")).toBeTruthy()
    expect(page()).not.toMatch(/couldn't check|Your plan is active/)
  })

  it("a different account whose own check fails is shown as unverified, never as the earlier account's active plan", async () => {
    open()
    await screen.findByText("Your plan is active.")
    h.answer = { kind: "down" }
    h.session = other
    await act(async () => { h.listeners.forEach((l) => l("SIGNED_IN", other)) })
    expect(await screen.findByText("We couldn't check your plan right now.")).toBeTruthy()
    expect(page()).not.toMatch(/Your plan is active/)
  })
})
