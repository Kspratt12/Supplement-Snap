import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup, act, configure } from "@testing-library/react"

/**
 * The real dashboard page wired to the offline queue. The queue module is replaced by a recorder so the test can see which
 * kind of sync each trigger asks for: coming back online is automatic (capped captures stay put), Sync Now is manual.
 * Supabase, the network and the router are stand-ins; all data is made up.
 */

configure({ asyncUtilTimeout: 6000 })
vi.setConfig({ testTimeout: 30000 })

const q = vi.hoisted(() => ({ syncCalls: [] as Array<{ includeCapped: boolean }>, waiting: 3, capped: 2 }))
vi.mock("../lib/offline-queue", async (orig) => ({
  ...(await orig<typeof import("../lib/offline-queue")>()),
  getPendingCount: async () => q.waiting,
  getCappedCount: async () => q.capped,
  syncPendingCaptures: async (_fn: unknown, options: { includeCapped?: boolean } = {}) => {
    q.syncCalls.push({ includeCapped: !!options.includeCapped })
    return 0
  },
}))

const h = vi.hoisted(() => ({
  listeners: [] as Array<(event: string, session: unknown) => void>,
  projectsReads: 0,
  subscriptionCalls: 0,
  holdSubscription: null as null | ((v: unknown) => void),
  hold: false,
  // The session the fake client reports, and an optional per-request answer keyed by the bearer token
  currentSession: null as null | { access_token: string; user: { id: string; email: string } },
  respond: null as null | ((token: string) => unknown),
  failDirect: false,
}))

const session = {
  access_token: "fictional-token",
  user: { id: "u1", email: "roofer@example.com" },
}

vi.mock("../lib/supabase", () => {
  const rows: Record<string, unknown[]> = {
    projects: [
      {
        id: "p1", user_id: "u1", project_name: "Garcia Roof", property_address: "9 Pine Ct, Apex NC", insurance_company: "", claim_number: "",
        adjuster_name: "", adjuster_email: "", claim_status: "In Progress", created_at: "2026-10-01T00:00:00Z",
      },
    ],
    captures: [],
    team_members: [],
    subscriptions: [{ status: "active", plan: "starter", stripe_customer_id: null }],
  }
  const chain = (table: string): unknown => {
    if (table === "projects") h.projectsReads++
    const result = { data: rows[table] ?? [], error: null, count: (rows[table] ?? []).length }
    const proxy: unknown = new Proxy(
      {},
      {
        get(_t, prop: string) {
          if (prop === "then") return (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => Promise.resolve(result).then(res, rej)
          if (prop === "single" || prop === "maybeSingle") return () => Promise.resolve({ data: (rows[table] ?? [])[0] ?? null, error: null })
          return () => proxy
        },
      },
    )
    return proxy
  }
  return {
    supabase: {
      from: (table: string) => {
        if (table === "subscriptions" && h.failDirect) throw new Error("lookup unavailable")
        return chain(table)
      },
      storage: { from: () => ({ remove: async () => ({ data: [], error: null }), upload: async () => ({ data: {}, error: null }), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) },
      auth: {
        getSession: async () => ({ data: { session: h.currentSession } }),
        onAuthStateChange: (cb: (event: string, s: unknown) => void) => {
          h.listeners.push(cb)
          return { data: { subscription: { unsubscribe() { h.listeners = h.listeners.filter((l) => l !== cb) } } } }
        },
        signOut: async () => ({ error: null }),
      },
    },
  }
})

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }))
vi.mock("../lib/auth-fetch", () => ({ authFetch: vi.fn(async () => ({ ok: true, json: async () => ({}) })) }))
vi.mock("../app/dashboard/feedback-box", () => ({ FeedbackBox: () => null }))
vi.mock("../app/dashboard/photo-annotator", () => ({ PhotoAnnotator: () => null }))

import { AuthProvider } from "../lib/auth-context"
import AppPage from "../app/app/page"

const reply = (body: Record<string, unknown>) => ({ ok: true, json: async () => body })

beforeEach(() => {
  h.listeners = []
  h.currentSession = session
  q.syncCalls = []
  q.waiting = 3
  q.capped = 2
  window.localStorage.clear()
  vi.stubGlobal("fetch", vi.fn(async () => reply({ status: "active", plan: "starter", viaOwner: false, hasBilling: false, isAdmin: false })))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.localStorage.clear()
})

describe("dashboard offline sync wiring", () => {
  it("coming back online syncs automatically WITHOUT the capped captures", async () => {
    render(<AuthProvider><AppPage /></AuthProvider>)
    await screen.findByText(/3 captures waiting to sync/)
    await act(async () => { window.dispatchEvent(new Event("online")) })
    await waitFor(() => expect(q.syncCalls.length).toBe(1))
    expect(q.syncCalls[0]).toEqual({ includeCapped: false })
  })

  it("shows how many are stuck, and Sync Now syncs WITH the capped captures", async () => {
    render(<AuthProvider><AppPage /></AuthProvider>)
    expect(await screen.findByText(/2 could not be saved after several tries/)).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Sync Now" }))
    await waitFor(() => expect(q.syncCalls.length).toBe(1))
    expect(q.syncCalls[0]).toEqual({ includeCapped: true })
  })
})
