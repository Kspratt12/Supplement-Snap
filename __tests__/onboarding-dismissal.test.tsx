import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react"

/**
 * The two onboarding panels ("Start here" on /app, "Getting Started" on /dashboard) with the account replaced by a
 * stand-in. They show what the panels do with the answers they are given, not how the real account service behaves.
 * All people and data are made up.
 */

type Deferred<T> = { promise: Promise<T>; resolve: (v: T) => void }
function deferred<T>(): Deferred<T> {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => { resolve = r })
  return { promise, resolve }
}

const auth = vi.hoisted(() => {
  const o = {
    signedIn: "u1" as string | null, // whose login the browser holds right now
    accounts: {} as Record<string, Record<string, unknown>>, // what the server stores for each person
    requests: 0, // dismissal saves that reached the server route
    getUserCalls: 0,
    getUser: null as null | (() => Promise<unknown>),
    adminWrites: [] as Array<{ id: string; metadata: Record<string, unknown> }>,
    adminMode: "ok" as "ok" | "error" | "throw",
    directUpdates: [] as Array<Record<string, unknown>>, // Minimize and Expand still save directly, as before
    get account(): Record<string, unknown> {
      return (o.accounts[o.signedIn ?? ""] ??= {})
    },
    set account(v: Record<string, unknown>) {
      o.accounts[o.signedIn ?? ""] = v
    },
  }
  return o
})

vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: async () => {
        auth.getUserCalls++
        if (auth.getUser) return auth.getUser()
        const id = auth.signedIn
        return { data: { user: id ? { id, user_metadata: auth.accounts[id] ?? {} } : null }, error: null }
      },
      updateUser: async (arg: { data: Record<string, unknown> }) => {
        auth.directUpdates.push(arg.data)
        return { data: { user: { id: auth.signedIn } }, error: null }
      },
    },
  },
}))
vi.mock("../lib/auth-utils", () => ({
  getAuthenticatedUser: async (request: Request) => {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? ""
    const id = token.startsWith("token-") ? token.slice(6) : null
    return id ? { id, user_metadata: { ...(auth.accounts[id] ?? {}) } } : null
  },
}))
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      admin: {
        updateUserById: async (id: string, attrs: { user_metadata: Record<string, unknown> }) => {
          if (auth.adminMode === "throw") throw new Error("service down")
          if (auth.adminMode === "error") return { error: { message: "refused" } }
          auth.adminWrites.push({ id, metadata: attrs.user_metadata })
          auth.accounts[id] = { ...(auth.accounts[id] ?? {}), ...attrs.user_metadata } // merged key by key, as the service does
          return { error: null }
        },
        getUserById: async (id: string) => ({ data: { user: { id, user_metadata: auth.accounts[id] ?? {} } }, error: null }),
      },
    },
  }),
}))
vi.mock("../lib/rate-limit", () => ({ rateLimited: () => false }))
vi.mock("../lib/auth-fetch", () => ({
  authFetch: async (url: string, init: RequestInit) => {
    auth.requests++
    const headers = new Headers(init.headers)
    if (auth.signedIn) headers.set("Authorization", `Bearer token-${auth.signedIn}`)
    const { POST } = await import("../app/api/onboarding-dismissal/route")
    return POST(new Request("http://localhost" + url, { ...init, headers }))
  },
}))
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }))

import "../app/api/onboarding-dismissal/route" // loaded up front so saves finish within the test's clock
import { StartHere } from "../app/app/claims-overview"
import { OnboardingChecklist } from "../app/dashboard/onboarding-checklist"
import { hasUnsynced, resetDismissalSyncForTests } from "../lib/dismissal-sync"

const startBase = { userId: "u1", onlyDemoOrNone: true, onCreateProject: () => {}, isFreeUser: false, freeCaptureLimit: 5 }
const startHere = () => screen.queryByTestId("start-here")
const hideButton = () => screen.getByRole("button", { name: "Hide the start guide" })
const checklistTitle = () => screen.queryByText("Getting Started")
const notAllDone = [true, false, false, false]

/** Let pending promises and zero-length timers finish, without moving the clock further */
const flush = () => act(async () => { await vi.advanceTimersByTimeAsync(0) })

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] })
  auth.signedIn = "u1"
  auth.accounts = { u1: { full_name: "Roofer One" }, u2: { full_name: "Roofer Two" } }
  auth.requests = 0
  auth.getUserCalls = 0
  auth.getUser = null
  auth.adminWrites = []
  auth.adminMode = "ok"
  auth.directUpdates = []
})
afterEach(() => {
  cleanup()
  resetDismissalSyncForTests()
  window.localStorage.clear()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe("Start here", () => {
  it("Hide closes it at once, saves it in the browser and on the account, and a remount stays hidden", async () => {
    const { unmount } = render(<StartHere {...startBase} />)
    await flush()
    expect(startHere()).not.toBeNull()
    fireEvent.click(hideButton())
    expect(startHere()).toBeNull()
    await flush()
    expect(window.localStorage.getItem("ss-start-here-hidden:u1")).toBe("1")
    expect(auth.adminWrites).toEqual([{ id: "u1", metadata: { ss_start_here_hidden: true } }])
    unmount()
    render(<StartHere {...startBase} />)
    expect(startHere()).toBeNull()
    await flush()
    expect(startHere()).toBeNull()
    expect(auth.account).toMatchObject({ full_name: "Roofer One", ss_start_here_hidden: true }) // unrelated metadata kept
  })

  it("a save error that the server returns keeps it hidden here, is remembered, and succeeds on a later retry", async () => {
    auth.adminMode = "error"
    render(<StartHere {...startBase} />)
    await flush()
    fireEvent.click(hideButton())
    await flush()
    expect(startHere()).toBeNull() // hidden despite the failed save
    expect(window.localStorage.getItem("ss-start-here-hidden:u1")).toBe("1")
    expect(hasUnsynced("u1")).toBe(true)

    auth.adminMode = "ok" // the service is back
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000) })
    expect(auth.account).toMatchObject({ ss_start_here_hidden: true })
    expect(hasUnsynced("u1")).toBe(false)
    expect(startHere()).toBeNull()
  })

  it("a save error that is thrown behaves the same way", async () => {
    auth.adminMode = "throw"
    render(<StartHere {...startBase} />)
    await flush()
    fireEvent.click(hideButton())
    await flush()
    expect(startHere()).toBeNull()
    expect(hasUnsynced("u1")).toBe(true)
    auth.adminMode = "ok"
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000) })
    expect(hasUnsynced("u1")).toBe(false)
    expect(auth.account).toMatchObject({ ss_start_here_hidden: true })
  })

  it("a fresh browser with the account already dismissed shows nothing, asks the server once, and does not write anything back", async () => {
    auth.account = { ss_start_here_hidden: true }
    render(<StartHere {...startBase} />)
    expect(startHere()).toBeNull()
    await flush()
    expect(startHere()).toBeNull()
    expect(auth.getUserCalls).toBe(1)
    expect(auth.requests).toBe(0)
    expect(window.localStorage.getItem("ss-start-here-hidden:u1")).toBe("1") // the account choice is copied to this browser
  })

  it("a stale cached session followed by fresh account metadata never shows the panel", async () => {
    auth.account = { ss_start_here_hidden: true } // the server knows; the cached session (hiddenOnAccount) does not
    const seen: boolean[] = []
    const { container } = render(<StartHere {...startBase} hiddenOnAccount={false} />)
    const watcher = new MutationObserver(() => seen.push(!!container.querySelector("[data-testid=start-here]")))
    watcher.observe(container, { childList: true, subtree: true })
    await flush()
    watcher.disconnect()
    expect(startHere()).toBeNull()
    expect(seen.some(Boolean)).toBe(false)
  })

  it("while the account has not answered, nothing shows; when it says not dismissed, the panel appears", async () => {
    const answer = deferred<unknown>()
    auth.getUser = () => answer.promise
    render(<StartHere {...startBase} />)
    await flush()
    expect(startHere()).toBeNull()
    await act(async () => { answer.resolve({ data: { user: { id: "u1", user_metadata: {} } }, error: null }) })
    expect(startHere()).not.toBeNull()
  })

  it("a failed read is not taken as a first visit: no panel, a way to try again, and nothing is written", async () => {
    auth.getUser = async () => ({ data: { user: null }, error: { message: "offline" } })
    render(<StartHere {...startBase} />)
    await flush()
    expect(startHere()).toBeNull()
    expect(screen.getByTestId("preference-unavailable")).toBeTruthy()
    expect(auth.requests).toBe(0)

    auth.getUser = null
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Try again" })) })
    await flush()
    expect(screen.queryByTestId("preference-unavailable")).toBeNull()
    expect(startHere()).not.toBeNull()
    expect(auth.getUserCalls).toBe(2)
  })

  it("a read that throws is treated the same way", async () => {
    auth.getUser = async () => {
      throw new Error("offline")
    }
    render(<StartHere {...startBase} />)
    await flush()
    expect(startHere()).toBeNull()
    expect(screen.getByTestId("preference-unavailable")).toBeTruthy()
  })

  it("a failed read keeps a dismissal already known in this browser: still hidden, no notice, no server read", async () => {
    window.localStorage.setItem("ss-start-here-hidden:u1", "1")
    auth.getUser = async () => ({ data: { user: null }, error: { message: "offline" } })
    render(<StartHere {...startBase} />)
    await flush()
    expect(startHere()).toBeNull()
    expect(screen.queryByTestId("preference-unavailable")).toBeNull()
    expect(auth.getUserCalls).toBe(0)
  })

  it("a dismissal kept only in this browser is saved to the account on a later visit", async () => {
    window.localStorage.setItem("ss-start-here-hidden:u1", "1")
    render(<StartHere {...startBase} />)
    await flush()
    expect(auth.adminWrites).toEqual([{ id: "u1", metadata: { ss_start_here_hidden: true } }])
  })

  it("with browser storage unavailable but the account dismissed, it stays hidden without reading the server", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    render(<StartHere {...startBase} hiddenOnAccount={true} />)
    await flush()
    expect(startHere()).toBeNull()
    expect(auth.getUserCalls).toBe(0)
  })

  it("with browser storage unavailable the account decides: not dismissed shows the panel", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    render(<StartHere {...startBase} />)
    await flush()
    expect(startHere()).not.toBeNull()
  })

  it("does not ask the server at all when the panel would not show anyway", async () => {
    render(<StartHere {...startBase} onlyDemoOrNone={false} />)
    await flush()
    expect(auth.getUserCalls).toBe(0)
  })

  it("A then B: B\x27s panel is unaffected by A\x27s dismissal, A\x27s late read, or A\x27s waiting save", async () => {
    // A's read is still out when the account changes to B
    const aRead = deferred<unknown>()
    auth.getUser = () => aRead.promise
    const { rerender } = render(<StartHere {...startBase} userId="u1" />)
    await flush()

    auth.signedIn = "u2"
    auth.getUser = null
    auth.account = {}
    rerender(<StartHere {...startBase} userId="u2" />)
    await flush()
    expect(startHere()).not.toBeNull() // B's own answer: not dismissed

    // A's late answer says dismissed; it must not hide B's panel
    await act(async () => { aRead.resolve({ data: { user: { id: "u1", user_metadata: { ss_start_here_hidden: true } } }, error: null }) })
    expect(startHere()).not.toBeNull()
  })

  it("A\x27s waiting save is refused when B is signed in, B\x27s account stays untouched, and B still sees the guide", async () => {
    auth.adminMode = "error"
    const { rerender } = render(<StartHere {...startBase} userId="u1" />)
    await flush()
    fireEvent.click(hideButton()) // A hides; the save fails and is queued
    await flush()
    expect(auth.requests).toBe(1)

    auth.signedIn = "u2" // the account changes before the retry
    auth.adminMode = "ok"
    rerender(<StartHere {...startBase} userId="u2" />)
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000) })
    expect(auth.adminWrites).toEqual([]) // the server refused A's save under B's login
    expect(auth.accounts.u2).toEqual({ full_name: "Roofer Two" })
    expect(startHere()).not.toBeNull() // B still sees the guide
    expect(hasUnsynced("u1")).toBe(true) // A\x27s choice is still waiting for A\x27s own login
  })
})

describe("Getting Started checklist", () => {
  const checklist = { mode: "paid" as const, done: notAllDone, userId: "u1" }

  it("Dismiss hides it, saves both modes on the account, and it stays hidden after a remount and in the other mode", async () => {
    const { unmount } = render(<OnboardingChecklist {...checklist} />)
    await flush()
    expect(checklistTitle()).not.toBeNull()
    fireEvent.click(screen.getAllByRole("button", { name: "Dismiss checklist" })[0])
    expect(checklistTitle()).toBeNull()
    await flush()
    expect(auth.adminWrites).toEqual([{ id: "u1", metadata: { ss_onboarding_free: "dismissed", ss_onboarding_paid: "dismissed" } }])
    expect(window.localStorage.getItem("ss_onboarding:u1:paid")).toBe("dismissed")
    expect(window.localStorage.getItem("ss_onboarding:u1:free")).toBe("dismissed")
    unmount()

    render(<OnboardingChecklist {...checklist} />)
    await flush()
    expect(checklistTitle()).toBeNull()
    cleanup()
    render(<OnboardingChecklist {...checklist} mode="free" done={[true, false, false, false]} />) // the plan changed
    await flush()
    expect(checklistTitle()).toBeNull()
  })

  it("an account dismissal from the login session hides it in either mode with no server read", async () => {
    for (const mode of ["paid", "free"] as const) {
      render(<OnboardingChecklist {...checklist} mode={mode} savedState="dismissed" />)
      await flush()
      expect(checklistTitle()).toBeNull()
      cleanup()
    }
    expect(auth.getUserCalls).toBe(0)
  })

  it("a dismissal found fresh on the account (including the older free-plan key) hides it in both modes", async () => {
    auth.account = { ss_onboarding_free: "dismissed" }
    for (const mode of ["paid", "free"] as const) {
      render(<OnboardingChecklist {...checklist} mode={mode} savedState={null} />)
      await flush()
      expect(checklistTitle()).toBeNull()
      cleanup()
      resetDismissalSyncForTests()
      window.localStorage.clear()
    }
  })

  it("keeps an existing stored dismissal for this person without any server read", async () => {
    window.localStorage.setItem("ss_onboarding:u1:paid", "dismissed")
    render(<OnboardingChecklist {...checklist} />)
    await flush()
    expect(checklistTitle()).toBeNull()
    expect(auth.getUserCalls).toBe(0)
  })

  it("shows nothing until the account has answered, and nothing flashes", async () => {
    const answer = deferred<unknown>()
    auth.getUser = () => answer.promise
    render(<OnboardingChecklist {...checklist} />)
    await flush()
    expect(checklistTitle()).toBeNull()
    await act(async () => { answer.resolve({ data: { user: { id: "u1", user_metadata: {} } }, error: null }) })
    expect(checklistTitle()).not.toBeNull()
  })

  it("a failed read shows a way to try again instead of the checklist or a blank", async () => {
    auth.getUser = async () => ({ data: { user: null }, error: { message: "offline" } })
    render(<OnboardingChecklist {...checklist} />)
    await flush()
    expect(checklistTitle()).toBeNull()
    expect(screen.getByTestId("preference-unavailable")).toBeTruthy()
    auth.getUser = null
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Try again" })) })
    await flush()
    expect(checklistTitle()).not.toBeNull()
  })

  it("a server error keeps it hidden and the save is retried later", async () => {
    auth.adminMode = "error"
    render(<OnboardingChecklist {...checklist} />)
    await flush()
    fireEvent.click(screen.getAllByRole("button", { name: "Dismiss checklist" })[0])
    await flush()
    expect(checklistTitle()).toBeNull()
    expect(hasUnsynced("u1")).toBe(true)
    auth.adminMode = "ok"
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000) })
    expect(hasUnsynced("u1")).toBe(false)
    expect(auth.account).toMatchObject({ ss_onboarding_free: "dismissed", ss_onboarding_paid: "dismissed", full_name: "Roofer One" })
  })

  it("Minimize is not Dismiss: it stays after a remount, saves only its own mode, and Expand brings the list back", async () => {
    const { unmount } = render(<OnboardingChecklist {...checklist} />)
    await flush()
    fireEvent.click(screen.getByRole("button", { name: "Minimize checklist" }))
    expect(screen.getByRole("button", { name: "Expand checklist" })).toBeTruthy()
    await flush()
    expect(auth.adminWrites).toEqual([{ id: "u1", metadata: { ss_onboarding_paid: "minimized" } }]) // only its own key, through the server route
    expect(auth.requests).toBe(1)
    expect(auth.directUpdates).toEqual([]) // nothing is saved from the browser directly any more
    expect(window.localStorage.getItem("ss_onboarding:u1:paid")).toBe("minimized")
    expect(window.localStorage.getItem("ss_onboarding:u1:free")).toBeNull()
    expect(hasUnsynced("u1")).toBe(false) // a minimize is not a dismissal and is not queued for retry
    unmount()

    render(<OnboardingChecklist {...checklist} savedState="minimized" />) // the login session now carries it
    await flush()
    expect(screen.getByRole("button", { name: "Expand checklist" })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Expand checklist" }))
    expect(screen.getByText("Create your first project")).toBeTruthy()
    await flush()
    expect(auth.adminWrites).toEqual([
      { id: "u1", metadata: { ss_onboarding_paid: "minimized" } },
      { id: "u1", metadata: { ss_onboarding_paid: "" } }, // Expand goes through the same route, key only
    ])
  })

  it("an account switch while the checklist stays on screen drops the previous person's Minimize: the next person sees the full list and nothing is written for them", async () => {
    const { rerender } = render(<OnboardingChecklist {...checklist} userId="u1" />)
    await flush()
    fireEvent.click(screen.getByRole("button", { name: "Minimize checklist" }))
    expect(screen.getByRole("button", { name: "Expand checklist" })).toBeTruthy()
    await flush()
    expect(auth.adminWrites).toEqual([{ id: "u1", metadata: { ss_onboarding_paid: "minimized" } }])

    auth.signedIn = "u2" // the signed-in person changes without the component being remounted
    rerender(<OnboardingChecklist {...checklist} userId="u2" savedState={null} />)
    await flush()
    expect(screen.queryByRole("button", { name: "Expand checklist" })).toBeNull()
    expect(screen.getByRole("button", { name: "Minimize checklist" })).toBeTruthy() // u2 sees the full list
    expect(window.localStorage.getItem("ss_onboarding:u2:paid")).toBeNull()
    expect(auth.adminWrites).toHaveLength(1) // nothing was written for u2
    expect(auth.accounts.u2).toEqual({ full_name: "Roofer Two" })

    // and going back to u1, their own choice is still theirs (browser copy), never u2's
    auth.signedIn = "u1"
    rerender(<OnboardingChecklist {...checklist} userId="u1" savedState={null} />)
    await flush()
    expect(screen.getByRole("button", { name: "Expand checklist" })).toBeTruthy()
  })

  it("a Minimize clicked after the browser's login has already become B's is refused by the server, so it changes nothing for either person", async () => {
    render(<OnboardingChecklist {...checklist} userId="u1" />)
    await flush()
    auth.signedIn = "u2" // the switch lands just before the save is sent
    fireEvent.click(screen.getByRole("button", { name: "Minimize checklist" }))
    await flush()
    expect(auth.requests).toBe(1)
    expect(auth.adminWrites).toEqual([])
    expect(auth.accounts.u2).toEqual({ full_name: "Roofer Two" })
    expect(auth.accounts.u1).toEqual({ full_name: "Roofer One" })
  })

  it("a failed Minimize save is not retried later and cannot reach another account", async () => {
    auth.adminMode = "error"
    render(<OnboardingChecklist {...checklist} userId="u1" />)
    await flush()
    fireEvent.click(screen.getByRole("button", { name: "Minimize checklist" }))
    await flush()
    expect(auth.requests).toBe(1)
    auth.adminMode = "ok"
    auth.signedIn = "u2"
    await act(async () => { await vi.advanceTimersByTimeAsync(120_000) })
    expect(auth.requests).toBe(1) // no retry
    expect(auth.adminWrites).toEqual([])
    expect(hasUnsynced("u1")).toBe(false)
  })

  it("a minimized checklist can still be dismissed", async () => {
    render(<OnboardingChecklist {...checklist} savedState="minimized" />)
    await flush()
    fireEvent.click(screen.getByRole("button", { name: "Dismiss checklist" }))
    expect(checklistTitle()).toBeNull()
    expect(screen.queryByRole("button", { name: "Expand checklist" })).toBeNull()
    await flush()
    expect(auth.adminWrites[0].metadata).toMatchObject({ ss_onboarding_free: "dismissed", ss_onboarding_paid: "dismissed" })
  })

  it("one person\x27s dismissal does not hide it for another person on the same browser", async () => {
    render(<OnboardingChecklist {...checklist} />)
    await flush()
    fireEvent.click(screen.getAllByRole("button", { name: "Dismiss checklist" })[0])
    await flush()
    cleanup()
    auth.signedIn = "u2"
    auth.account = {}
    render(<OnboardingChecklist {...checklist} userId="u2" />)
    await flush()
    expect(checklistTitle()).not.toBeNull()
  })

  it("A then B with A\x27s read still out: B is decided by B\x27s own answer only", async () => {
    const aRead = deferred<unknown>()
    auth.getUser = () => aRead.promise
    const { rerender } = render(<OnboardingChecklist {...checklist} userId="u1" />)
    await flush()
    auth.signedIn = "u2"
    auth.getUser = null
    auth.account = {}
    rerender(<OnboardingChecklist {...checklist} userId="u2" />)
    await flush()
    expect(checklistTitle()).not.toBeNull()
    await act(async () => { aRead.resolve({ data: { user: { id: "u1", user_metadata: { ss_onboarding_paid: "dismissed" } } }, error: null }) })
    expect(checklistTitle()).not.toBeNull()
  })

  it("stays out of the way once every step is done: no server read", async () => {
    render(<OnboardingChecklist {...checklist} done={[true, true, true, true]} />)
    await flush()
    expect(checklistTitle()).toBeNull()
    expect(auth.getUserCalls).toBe(0)
  })

  it("keeps the stored key names stable", async () => {
    render(<OnboardingChecklist {...checklist} />)
    await flush()
    fireEvent.click(screen.getAllByRole("button", { name: "Dismiss checklist" })[0])
    await flush()
    const keys = Object.keys(window.localStorage).filter((k) => k.startsWith("ss_onboarding")).sort()
    expect(keys).toEqual(["ss_onboarding:u1:free", "ss_onboarding:u1:paid"])
  })
})

describe("both panels together", () => {
  it("ask the server once between them, not once each", async () => {
    render(
      <>
        <StartHere {...startBase} />
        <OnboardingChecklist mode="paid" done={notAllDone} userId="u1" />
      </>
    )
    await flush()
    expect(auth.getUserCalls).toBe(1)
    expect(startHere()).not.toBeNull()
    expect(checklistTitle()).not.toBeNull()
  })
})
