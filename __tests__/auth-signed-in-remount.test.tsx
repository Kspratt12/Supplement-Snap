import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup, act, configure } from "@testing-library/react"

/**
 * Reproduction for the "page jumps or resets when I come back to it" report.
 *
 * This runs the REAL AuthProvider (lib/auth-context.tsx) and the REAL dashboard page (app/app/page.tsx). Only the
 * Supabase client, the network and the router are replaced. The Supabase client stand-in lets the test fire the same
 * events the library fires: it hands the app's own onAuthStateChange callback back to the test.
 *
 * What it shows: a SIGNED_IN event for the user who is already loaded makes the real handler set subscriptionLoading,
 * and the page then renders null until the subscription request returns.
 * What it does not show: that the real Supabase library emits SIGNED_IN when a tab is shown again (see the browser
 * run for that), or anything about scroll position. jsdom has no layout.
 */

configure({ asyncUtilTimeout: 6000 })
vi.setConfig({ testTimeout: 30000 })

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
import { useAuth } from "../lib/auth-context"

const reply = (body: Record<string, unknown>) => ({ ok: true, json: async () => body })
const subscriptionReply = reply({ status: "active", plan: "starter", viaOwner: false, hasBilling: false, isAdmin: false })

function fire(event: string, as: typeof session | null = session) {
  // A fresh user object each time, like the real library, which builds one per notification
  const s = as ? { ...as, user: { ...as.user } } : null
  h.currentSession = s
  return act(async () => {
    h.listeners.forEach((l) => l(event, s))
  })
}

const userB = { access_token: "token-b", user: { id: "u2", email: "other@example.com" } }

function deferred() {
  let resolve!: (v: unknown) => void
  const promise = new Promise((r) => { resolve = r })
  return { promise, resolve }
}

/** Shows what the real AuthProvider is currently telling the rest of the app */
function Probe() {
  const a = useAuth()
  return (
    <div data-testid="probe">
      {[a.user?.id ?? "none", a.subscriptionStatus, a.subscriptionPlan, a.subscriptionLoading ? "loading" : "settled", a.isAdmin ? "admin" : "member"].join("|")}
    </div>
  )
}
const probeText = () => screen.getByTestId("probe").textContent

async function openDashboardWithTypedNote() {
  render(
    <AuthProvider>
      <AppPage />
    </AuthProvider>,
  )
  const select = (await screen.findByLabelText("Project / Job")) as HTMLSelectElement
  await waitFor(() => expect(select.querySelector('option[value="p1"]')).not.toBeNull())
  fireEvent.change(select, { target: { value: "p1" } })
  const note = (await screen.findByPlaceholderText("Describe the damage...")) as HTMLTextAreaElement
  fireEvent.change(note, { target: { value: "Soft decking along the north eave" } })
  expect(note.value).toBe("Soft decking along the north eave")
  return { select, note }
}

beforeEach(() => {
  h.listeners = []
  h.projectsReads = 0
  h.subscriptionCalls = 0
  h.holdSubscription = null
  h.hold = false
  h.respond = null
  h.failDirect = false
  h.currentSession = session
  window.localStorage.clear()
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: { headers?: Record<string, string> }) => {
      if (String(url).includes("/api/subscription")) {
        h.subscriptionCalls++
        if (h.respond) return h.respond((init?.headers?.Authorization ?? "").replace("Bearer ", ""))
        if (h.hold) return new Promise((resolve) => { h.holdSubscription = () => resolve(subscriptionReply) })
        return subscriptionReply
      }
      return { ok: true, json: async () => ({}) }
    }),
  )
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.localStorage.clear()
})

describe("page: the same user signed in again (what the library reports whenever a hidden tab is shown)", () => {
  it("keeps the dashboard mounted while the subscription refreshes in the background", async () => {
    const { select } = await openDashboardWithTypedNote()
    h.hold = true
    const callsBefore = h.subscriptionCalls
    await fire("SIGNED_IN")

    expect(h.subscriptionCalls).toBe(callsBefore + 1) // still refreshed, just not blocking
    expect(document.contains(select)).toBe(true)
    expect(screen.queryByLabelText("Project / Job")).toBe(select)

    await act(async () => { h.holdSubscription?.(null) })
    expect(document.contains(select)).toBe(true)
  })

  it("keeps the typed note and the selected project", async () => {
    const { select, note } = await openDashboardWithTypedNote()
    h.hold = true
    await fire("SIGNED_IN")
    await act(async () => { h.holdSubscription?.(null) })
    expect(select.value).toBe("p1")
    expect(note.value).toBe("Soft decking along the north eave")
    expect(document.contains(note)).toBe(true)
  })

  it("(control) a token refresh does not remove the dashboard", async () => {
    const { select } = await openDashboardWithTypedNote()
    h.hold = true
    const callsBefore = h.subscriptionCalls
    await fire("TOKEN_REFRESHED")
    expect(h.subscriptionCalls).toBe(callsBefore)
    expect(document.contains(select)).toBe(true)
  })

  it("(unchanged) still replaces the user object, which the page reloads its project list for", async () => {
    await openDashboardWithTypedNote()
    const readsBefore = h.projectsReads
    await fire("SIGNED_IN")
    await waitFor(() => expect(h.projectsReads).toBeGreaterThan(readsBefore))
  })
})

describe("AuthProvider subscription state", () => {
  const mountProbe = () => render(<AuthProvider><Probe /></AuthProvider>)

  it("initial session: loading until the first answer, then the answered plan", async () => {
    h.hold = true
    mountProbe()
    await waitFor(() => expect(probeText()).toBe("u1|inactive|none|loading|member"))
    await act(async () => { h.holdSubscription?.(null) })
    await waitFor(() => expect(probeText()).toBe("u1|active|starter|settled|member"))
  })

  it("initial session: a signed-out visitor settles with no access", async () => {
    h.currentSession = null
    mountProbe()
    await waitFor(() => expect(probeText()).toBe("none|inactive|none|settled|member"))
  })

  it("sign-out removes the user and the access, and settles loading", async () => {
    mountProbe()
    await waitFor(() => expect(probeText()).toBe("u1|active|starter|settled|member"))
    await fire("SIGNED_OUT", null)
    expect(probeText()).toBe("none|inactive|none|settled|member")
  })

  it("sign-out while a refresh is in flight: the late answer does not bring access back", async () => {
    mountProbe()
    await waitFor(() => expect(probeText()).toBe("u1|active|starter|settled|member"))
    const late = deferred()
    h.respond = () => late.promise
    await fire("SIGNED_IN") // background refresh, now waiting
    await fire("SIGNED_OUT", null)
    await act(async () => { late.resolve(reply({ status: "active", plan: "pro", isAdmin: true })) })
    expect(probeText()).toBe("none|inactive|none|settled|member")
  })

  it("a different user does not inherit the previous user's plan, even while theirs loads", async () => {
    h.respond = (token) => reply(token === "token-b" ? { status: "inactive", plan: "none" } : { status: "active", plan: "pro", viaOwner: true, hasBilling: true, isAdmin: true })
    mountProbe()
    await waitFor(() => expect(probeText()).toBe("u1|active|pro|settled|admin"))

    const b = deferred()
    h.respond = () => b.promise
    await fire("SIGNED_IN", userB)
    expect(probeText()).toBe("u2|inactive|none|loading|member") // nothing of u1's is visible
    await act(async () => { b.resolve(reply({ status: "trialing", plan: "starter" })) })
    expect(probeText()).toBe("u2|trialing|starter|settled|member")
  })

  it("a late answer for the old account cannot overwrite the new account", async () => {
    mountProbe()
    await waitFor(() => expect(probeText()).toBe("u1|active|starter|settled|member"))

    const oldAnswer = deferred()
    const newAnswer = deferred()
    h.respond = (token) => (token === "token-b" ? newAnswer.promise : oldAnswer.promise)
    await fire("SIGNED_IN") // u1 background refresh, in flight
    await fire("SIGNED_IN", userB) // account switch, in flight
    await act(async () => { newAnswer.resolve(reply({ status: "inactive", plan: "none" })) })
    expect(probeText()).toBe("u2|inactive|none|settled|member")
    await act(async () => { oldAnswer.resolve(reply({ status: "active", plan: "pro", isAdmin: true })) })
    expect(probeText()).toBe("u2|inactive|none|settled|member")
  })

  it("applies updated access from a same-user refresh without ever showing loading", async () => {
    mountProbe()
    await waitFor(() => expect(probeText()).toBe("u1|active|starter|settled|member"))
    const next = deferred()
    h.respond = () => next.promise
    await fire("SIGNED_IN")
    expect(probeText()).toBe("u1|active|starter|settled|member") // old access stays while it refreshes
    await act(async () => { next.resolve(reply({ status: "canceled", plan: "starter" })) })
    expect(probeText()).toBe("u1|canceled|starter|settled|member")
  })

  it("a background refresh that cannot reach anything keeps the applied access and settles", async () => {
    mountProbe()
    await waitFor(() => expect(probeText()).toBe("u1|active|starter|settled|member"))
    h.respond = () => { throw new Error("offline") }
    h.failDirect = true
    await fire("SIGNED_IN")
    expect(probeText()).toBe("u1|active|starter|settled|member")
  })

  it("a first load that cannot reach anything settles with no access instead of loading forever", async () => {
    h.respond = () => { throw new Error("offline") }
    h.failDirect = true
    mountProbe()
    await waitFor(() => expect(probeText()).toBe("u1|inactive|none|settled|member"))
  })
})

describe("AuthProvider: the first load overlaps another request", () => {
  const mountProbe = () => render(<AuthProvider><Probe /></AuthProvider>)
  const ACTIVE = { status: "active", plan: "starter" }
  const PRO = { status: "active", plan: "pro", viaOwner: true, hasBilling: true, isAdmin: true }

  /** Every /api/subscription call waits on its own promise, in the order the calls were made */
  function manual() {
    const calls: Array<{ ok: (b: Record<string, unknown>) => Promise<void>; fail: () => Promise<void> }> = []
    h.respond = () => {
      let resolve!: (v: unknown) => void
      let reject!: (e: unknown) => void
      const p = new Promise((res, rej) => { resolve = res; reject = rej })
      calls.push({
        ok: (b) => act(async () => { resolve(reply(b)) }),
        // a failure means the endpoint is unreachable and so is the direct lookup
        fail: async () => { h.failDirect = true; await act(async () => { reject(new Error("down")); await new Promise((r) => setTimeout(r, 150)) }); h.failDirect = false },
      })
      return p
    }
    return calls
  }
  const hide = () => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" })
    return act(async () => { document.dispatchEvent(new Event("visibilitychange")) })
  }
  async function overlap() {
    const calls = manual()
    mountProbe()
    await waitFor(() => expect(calls).toHaveLength(1)) // the initial getSession load, waiting
    await fire("SIGNED_IN") // same user, while the first load is still pending
    await waitFor(() => expect(calls).toHaveLength(2))
    return calls
  }

  it("both answers, first request answers first: stays loading until the current request answers", async () => {
    const calls = await overlap()
    await calls[0].ok(PRO)
    expect(probeText()).toBe("u1|inactive|none|loading|member") // the older answer neither settles loading nor applies
    await calls[1].ok(ACTIVE)
    expect(probeText()).toBe("u1|active|starter|settled|member")
  })

  it("both answers, current request answers first: the older answer arriving later changes nothing", async () => {
    const calls = await overlap()
    await calls[1].ok(ACTIVE)
    expect(probeText()).toBe("u1|active|starter|settled|member")
    await calls[0].ok(PRO)
    expect(probeText()).toBe("u1|active|starter|settled|member")
  })

  it("the older request fails, the current succeeds (either order): access is applied", async () => {
    let calls = await overlap()
    await calls[0].fail()
    expect(probeText()).toBe("u1|inactive|none|loading|member")
    await calls[1].ok(ACTIVE)
    expect(probeText()).toBe("u1|active|starter|settled|member")

    cleanup(); h.listeners = []; h.subscriptionCalls = 0
    calls = await overlap()
    await calls[1].ok(ACTIVE)
    await calls[0].fail()
    expect(probeText()).toBe("u1|active|starter|settled|member")
  })

  it("the current request fails, the older succeeds: the older success is kept (a failure says nothing about access)", async () => {
    const calls = await overlap()
    await calls[0].ok(PRO)
    expect(probeText()).toBe("u1|inactive|none|loading|member") // held back while the newer request is still out
    await calls[1].fail()
    expect(probeText()).toBe("u1|active|pro|settled|admin")
  })

  it("sign-out during the overlap: neither late answer brings anything back", async () => {
    const calls = await overlap()
    await fire("SIGNED_OUT", null)
    expect(probeText()).toBe("none|inactive|none|settled|member")
    await calls[0].ok(PRO)
    await calls[1].ok(PRO)
    expect(probeText()).toBe("none|inactive|none|settled|member")
  })

  it("account change during the overlap: only the new account's answer is applied, and loading holds until it arrives", async () => {
    const calls = await overlap()
    await fire("SIGNED_IN", userB)
    await waitFor(() => expect(calls).toHaveLength(3))
    expect(probeText()).toBe("u2|inactive|none|loading|member")
    await calls[0].ok(PRO)
    await calls[1].ok(PRO)
    expect(probeText()).toBe("u2|inactive|none|loading|member") // stale answers do not touch loading
    await calls[2].ok({ status: "trialing", plan: "team" })
    expect(probeText()).toBe("u2|trialing|team|settled|member")
  })

  async function initialPlusSilent() {
    const calls = manual()
    mountProbe()
    await waitFor(() => expect(calls).toHaveLength(1))
    await hide() // visibilitychange: silent refresh of the same user
    await waitFor(() => expect(calls).toHaveLength(2))
    return calls
  }

  it("initial success, then the silent refresh fails: the initial result is kept", async () => {
    const calls = await initialPlusSilent()
    await calls[1].fail()
    expect(probeText()).toBe("u1|inactive|none|loading|member") // the initial request is still out
    await calls[0].ok(ACTIVE)
    expect(probeText()).toBe("u1|active|starter|settled|member")
  })

  it("the silent refresh fails after the initial success has already answered: the initial result is kept", async () => {
    const calls = await initialPlusSilent()
    await calls[0].ok(ACTIVE)
    expect(probeText()).toBe("u1|inactive|none|loading|member") // held while the newer request is out
    await calls[1].fail()
    expect(probeText()).toBe("u1|active|starter|settled|member")
  })

  it("both requests fail (either order): loading settles with no access", async () => {
    let calls = await initialPlusSilent()
    await calls[0].fail()
    expect(probeText()).toBe("u1|inactive|none|loading|member")
    await calls[1].fail()
    expect(probeText()).toBe("u1|inactive|none|settled|member")

    cleanup(); h.listeners = []
    calls = await initialPlusSilent()
    await calls[1].fail()
    expect(probeText()).toBe("u1|inactive|none|loading|member")
    await calls[0].fail()
    expect(probeText()).toBe("u1|inactive|none|settled|member")
  })

  it("a newer completed no-access answer is not overwritten by an older active answer", async () => {
    const calls = await overlap()
    await calls[1].ok({ status: "inactive", plan: "none" })
    expect(probeText()).toBe("u1|inactive|none|settled|member")
    await calls[0].ok(PRO)
    expect(probeText()).toBe("u1|inactive|none|settled|member")
  })

  it("a newer changed plan is not overwritten by an older plan", async () => {
    const calls = await overlap()
    await calls[1].ok({ status: "active", plan: "team" })
    await calls[0].ok({ status: "active", plan: "starter" })
    expect(probeText()).toBe("u1|active|team|settled|member")
  })

  it("an older success that arrives first is replaced by the newer answer, not shown in between", async () => {
    const calls = await overlap()
    await calls[0].ok({ status: "active", plan: "starter" })
    expect(probeText()).toBe("u1|inactive|none|loading|member")
    await calls[1].ok({ status: "canceled", plan: "starter" })
    expect(probeText()).toBe("u1|canceled|starter|settled|member")
  })

  it("sign-out during each overlap leaves no access and no loading, whichever requests answer afterwards", async () => {
    for (const answers of [["ok", "ok"], ["ok", "fail"], ["fail", "ok"], ["fail", "fail"]] as const) {
      cleanup(); h.listeners = []; h.subscriptionCalls = 0; h.currentSession = session
      const calls = await overlap()
      await fire("SIGNED_OUT", null)
      for (const [i, a] of answers.entries()) {
        if (a === "ok") await calls[i].ok(PRO)
        else await calls[i].fail()
      }
      expect(probeText()).toBe("none|inactive|none|settled|member")
    }
  })

  it("an account change during each overlap: only the new account decides, and loading is not touched by the old ones", async () => {
    for (const answers of [["ok", "ok"], ["ok", "fail"], ["fail", "ok"], ["fail", "fail"]] as const) {
      cleanup(); h.listeners = []; h.subscriptionCalls = 0; h.currentSession = session
      const calls = await overlap()
      await fire("SIGNED_IN", userB)
      await waitFor(() => expect(calls).toHaveLength(3))
      for (const [i, a] of answers.entries()) {
        if (a === "ok") await calls[i].ok(PRO)
        else await calls[i].fail()
        expect(probeText()).toBe("u2|inactive|none|loading|member")
      }
      await calls[2].ok({ status: "trialing", plan: "starter" })
      expect(probeText()).toBe("u2|trialing|starter|settled|member")
    }
  })

  it("classification: a 500 from the endpoint with no readable row is a failure (loaded access kept), not a no-access answer", async () => {
    mountProbe()
    await waitFor(() => expect(probeText()).toBe("u1|active|starter|settled|member"))
    h.respond = () => ({ ok: false, status: 500, json: async () => ({}) })
    h.failDirect = true
    await fire("SIGNED_IN")
    expect(probeText()).toBe("u1|active|starter|settled|member")
  })

  it("classification: a 401 from the endpoint falls back to the direct lookup, and a row found there is used", async () => {
    h.respond = () => ({ ok: false, status: 401, json: async () => ({ error: "Unauthorized" }) })
    mountProbe()
    await waitFor(() => expect(probeText()).toBe("u1|active|starter|settled|member")) // the lookup finds the starter row
  })

  it("after a failed first load (no access shown), a failed refresh grants nothing and a later successful refresh applies the verified plan", async () => {
    h.respond = () => { throw new Error("offline") }
    h.failDirect = true
    mountProbe()
    await waitFor(() => expect(probeText()).toBe("u1|inactive|none|settled|member"))
    await fire("SIGNED_IN") // still failing
    await waitFor(() => expect(probeText()).toBe("u1|inactive|none|settled|member"))
    h.failDirect = false
    h.respond = () => reply({ status: "active", plan: "team" })
    await fire("SIGNED_IN")
    await waitFor(() => expect(probeText()).toBe("u1|active|team|settled|member"))
  })

  it("classification: a 200 saying inactive is a completed no-access answer and replaces loaded access", async () => {
    mountProbe()
    await waitFor(() => expect(probeText()).toBe("u1|active|starter|settled|member"))
    h.respond = () => reply({ status: "inactive", plan: "none" })
    await fire("SIGNED_IN")
    await waitFor(() => expect(probeText()).toBe("u1|inactive|none|settled|member"))
  })
})
