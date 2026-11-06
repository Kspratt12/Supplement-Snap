import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

/**
 * The shared dismissal logic behind the "Start here" and "Getting Started" panels, together with the real server route it
 * saves through. The login service and the account store are replaced by stand-ins: "signedIn" is whose login the browser
 * holds right now, "accounts" is what the server stores for each person. These tests show what the app does with the
 * answers it is given; they do not show how the real account service behaves. All people and data are made up.
 */

const auth = vi.hoisted(() => {
  const o = {
    signedIn: "u1" as string | null,
    accounts: {} as Record<string, Record<string, unknown>>,
    requests: 0, // saves that reached the server route
    getUserCalls: 0,
    getUser: null as null | (() => Promise<unknown>),
    adminWrites: [] as Array<{ id: string; metadata: Record<string, unknown> }>,
    adminMode: "ok" as "ok" | "error" | "throw",
    networkDown: false,
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
    },
  },
}))
// The server side: the token on the request proves who is calling, and the admin client changes the account
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
          auth.accounts[id] = attrs.user_metadata
          return { error: null }
        },
      },
    },
  }),
}))
vi.mock("../lib/rate-limit", () => ({ rateLimited: () => false }))
// The browser's request carries whoever is signed in at the moment it is sent, like the real authFetch
vi.mock("../lib/auth-fetch", () => ({
  authFetch: async (url: string, init: RequestInit) => {
    if (auth.networkDown) throw new Error("offline")
    auth.requests++
    const headers = new Headers(init.headers)
    if (auth.signedIn) headers.set("Authorization", `Bearer token-${auth.signedIn}`)
    const { POST } = await import("../app/api/onboarding-dismissal/route")
    return POST(new Request("http://localhost" + url, { ...init, headers }))
  },
}))

import {
  fetchAccountMetadata,
  flushUnsynced,
  hasUnsynced,
  queueUnsynced,
  readLocalDismissal,
  resetDismissalSyncForTests,
  saveDismissalToAccount,
  writeLocalDismissal,
  type DismissalSpec,
} from "../lib/dismissal-sync"
import { START_HERE_SPEC } from "../lib/guide-state"

const PATCH = { ss_start_here_hidden: true }
const settle = () => vi.advanceTimersByTimeAsync(0)

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] })
  auth.signedIn = "u1"
  auth.accounts = { u1: { full_name: "Roofer One", ss_speech_lang: "es-MX" }, u2: { full_name: "Roofer Two" } }
  auth.requests = 0
  auth.getUserCalls = 0
  auth.getUser = null
  auth.adminWrites = []
  auth.adminMode = "ok"
  auth.networkDown = false
})
afterEach(() => {
  resetDismissalSyncForTests()
  window.localStorage.clear()
  vi.useRealTimers()
})

describe("saving to the account", () => {
  it("changes the verified person\x27s account, adds only the dismissal key, and leaves the rest of the metadata alone", async () => {
    expect(await saveDismissalToAccount("u1", PATCH)).toBe("ok")
    expect(auth.adminWrites).toEqual([{ id: "u1", metadata: { full_name: "Roofer One", ss_speech_lang: "es-MX", ss_start_here_hidden: true } }])
    expect(auth.accounts.u2).toEqual({ full_name: "Roofer Two" })
  })

  it("reports a server failure (returned or thrown) and a network failure as worth retrying", async () => {
    auth.adminMode = "error"
    expect(await saveDismissalToAccount("u1", PATCH)).toBe("error")
    auth.adminMode = "throw"
    expect(await saveDismissalToAccount("u1", PATCH)).toBe("error")
    auth.adminMode = "ok"
    auth.networkDown = true
    expect(await saveDismissalToAccount("u1", PATCH)).toBe("error")
    expect(auth.adminWrites).toEqual([])
  })

  it("is refused, with no change anywhere, when the browser is signed in as someone else", async () => {
    auth.signedIn = "u2"
    expect(await saveDismissalToAccount("u1", PATCH)).toBe("rejected")
    expect(auth.adminWrites).toEqual([])
    expect(auth.accounts.u2).toEqual({ full_name: "Roofer Two" })
    expect(auth.accounts.u1).not.toHaveProperty("ss_start_here_hidden")
  })

  it("is refused when nobody is signed in", async () => {
    auth.signedIn = null
    expect(await saveDismissalToAccount("u1", PATCH)).toBe("rejected")
    expect(auth.adminWrites).toEqual([])
  })

  it("refuses keys it does not own, with no change", async () => {
    expect(await saveDismissalToAccount("u1", { full_name: "Someone Else" })).toBe("rejected")
    expect(await saveDismissalToAccount("u1", { ss_start_here_hidden: true, role: "admin" })).toBe("rejected")
    expect(auth.adminWrites).toEqual([])
  })

  it("the account written is the one the login proves, even when the request names someone else", async () => {
    // The browser is signed in as u2 but names u1: nothing changes for either
    auth.signedIn = "u2"
    await saveDismissalToAccount("u1", PATCH)
    // The browser is signed in as u1 and the request names u1: only u1 changes
    auth.signedIn = "u1"
    await saveDismissalToAccount("u1", PATCH)
    expect(auth.adminWrites.map((w) => w.id)).toEqual(["u1"])
  })
})

describe("a dismissal that has not reached the account yet", () => {
  it("is kept in the browser, tried again after 5 s and 30 s, then left alone for the rest of the page", async () => {
    auth.adminMode = "error"
    queueUnsynced("u1", PATCH)
    void flushUnsynced("u1")
    await settle()
    expect(auth.requests).toBe(1)
    expect(hasUnsynced("u1")).toBe(true)
    expect(window.localStorage.getItem("ss-onboarding-unsynced:u1")).toBe(JSON.stringify(PATCH))

    await vi.advanceTimersByTimeAsync(5_000)
    expect(auth.requests).toBe(2)
    await vi.advanceTimersByTimeAsync(30_000)
    expect(auth.requests).toBe(3)

    await vi.advanceTimersByTimeAsync(10 * 60_000) // nothing more, however long the page stays open
    void flushUnsynced("u1")
    await vi.advanceTimersByTimeAsync(60_000)
    expect(auth.requests).toBe(3)
    expect(hasUnsynced("u1")).toBe(true) // still remembered
  })

  it("is tried again on the next page load, and forgotten once it is saved", async () => {
    auth.adminMode = "error"
    queueUnsynced("u1", PATCH)
    void flushUnsynced("u1")
    await vi.advanceTimersByTimeAsync(40_000)
    expect(auth.requests).toBe(3)

    resetDismissalSyncForTests() // a new page load: memory is empty, the browser copy remains
    auth.adminMode = "ok"
    void flushUnsynced("u1")
    await settle()
    expect(auth.requests).toBe(4)
    expect(auth.accounts.u1).toMatchObject({ ss_start_here_hidden: true })
    expect(hasUnsynced("u1")).toBe(false)
    expect(window.localStorage.getItem("ss-onboarding-unsynced:u1")).toBeNull()
  })

  it("survives a thrown server error and a later success", async () => {
    auth.adminMode = "throw"
    queueUnsynced("u1", PATCH)
    void flushUnsynced("u1")
    await settle()
    expect(hasUnsynced("u1")).toBe(true)
    auth.adminMode = "ok"
    await vi.advanceTimersByTimeAsync(5_000)
    expect(auth.accounts.u1).toMatchObject({ ss_start_here_hidden: true })
    expect(hasUnsynced("u1")).toBe(false)
  })

  it("queued for A and sent after the browser switched to B: refused, B\x27s account untouched, not retried on this page, and it goes out once A is signed in again", async () => {
    queueUnsynced("u1", PATCH)
    auth.signedIn = "u2" // the switch happens before the save is sent
    void flushUnsynced("u1")
    await vi.advanceTimersByTimeAsync(60_000)
    expect(auth.requests).toBe(1) // one attempt, refused by the server, no retry
    expect(auth.adminWrites).toEqual([])
    expect(auth.accounts.u2).toEqual({ full_name: "Roofer Two" })
    expect(hasUnsynced("u1")).toBe(true)

    resetDismissalSyncForTests() // next page load, A signed in again
    auth.signedIn = "u1"
    void flushUnsynced("u1")
    await settle()
    expect(auth.adminWrites.map((w) => w.id)).toEqual(["u1"])
    expect(hasUnsynced("u1")).toBe(false)
  })

  it("in flight when the browser switches to B: the request already carries A\x27s login, so it still changes only A", async () => {
    queueUnsynced("u1", PATCH)
    const sending = flushUnsynced("u1") // authFetch has read A\x27s login by the time this call returns control
    auth.signedIn = "u2" // switch while the request is out
    await sending
    expect(auth.adminWrites.map((w) => w.id)).toEqual(["u1"])
    expect(auth.accounts.u2).toEqual({ full_name: "Roofer Two" })
  })

  it("keeps each person\x27s waiting dismissal separate", () => {
    queueUnsynced("u1", PATCH)
    expect(hasUnsynced("u1")).toBe(true)
    expect(hasUnsynced("u2")).toBe(false)
  })

  it("only ever sends the three allowed keys, and the server stores only true or \"dismissed\", never false", async () => {
    auth.adminMode = "error"
    queueUnsynced("u1", PATCH)
    queueUnsynced("u1", { ss_onboarding_free: "dismissed", ss_onboarding_paid: "dismissed" })
    void flushUnsynced("u1")
    await settle()
    auth.adminMode = "ok"
    await vi.advanceTimersByTimeAsync(5_000)
    expect(auth.adminWrites).toHaveLength(1)
    expect(auth.adminWrites[0].metadata).toEqual({
      full_name: "Roofer One",
      ss_speech_lang: "es-MX",
      ss_start_here_hidden: true,
      ss_onboarding_free: "dismissed",
      ss_onboarding_paid: "dismissed",
    })
  })

  it("keeps a waiting dismissal when the browser cannot store it, for as long as the page is open", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    auth.adminMode = "error"
    queueUnsynced("u1", PATCH)
    expect(hasUnsynced("u1")).toBe(true)
    void flushUnsynced("u1")
    await settle()
    expect(hasUnsynced("u1")).toBe(true) // the server failed, so it is still waiting
    auth.adminMode = "ok"
    await vi.advanceTimersByTimeAsync(5_000)
    expect(hasUnsynced("u1")).toBe(false)
    vi.restoreAllMocks()
  })

  it("ignores a damaged waiting entry", () => {
    window.localStorage.setItem("ss-onboarding-unsynced:u1", "{not json")
    expect(hasUnsynced("u1")).toBe(false)
    window.localStorage.setItem("ss-onboarding-unsynced:u1", "[1,2]")
    expect(hasUnsynced("u1")).toBe(false)
  })
})

describe("reading the account\x27s current setting", () => {
  it("asks the server once however many panels ask at the same time", async () => {
    const [a, b] = await Promise.all([fetchAccountMetadata("u1"), fetchAccountMetadata("u1")])
    expect(auth.getUserCalls).toBe(1)
    expect(a).toEqual(b)
    expect(a).toMatchObject({ ok: true })
  })

  it("reuses a good answer for a minute, then asks again", async () => {
    await fetchAccountMetadata("u1")
    await fetchAccountMetadata("u1")
    expect(auth.getUserCalls).toBe(1)
    await vi.advanceTimersByTimeAsync(61_000)
    await fetchAccountMetadata("u1")
    expect(auth.getUserCalls).toBe(2)
  })

  it("never reuses a failure", async () => {
    auth.getUser = async () => ({ data: { user: null }, error: { message: "offline" } })
    expect(await fetchAccountMetadata("u1")).toEqual({ ok: false })
    auth.getUser = null
    expect(await fetchAccountMetadata("u1")).toMatchObject({ ok: true })
    expect(auth.getUserCalls).toBe(2)
  })

  it("treats a thrown error as a failed read, not as \"not dismissed\"", async () => {
    auth.getUser = async () => {
      throw new Error("offline")
    }
    expect(await fetchAccountMetadata("u1")).toEqual({ ok: false })
  })

  it("does not accept an answer about someone else", async () => {
    auth.signedIn = "u2"
    expect(await fetchAccountMetadata("u1")).toEqual({ ok: false })
  })

  it("can be forced to ask again", async () => {
    await fetchAccountMetadata("u1")
    await fetchAccountMetadata("u1", { force: true })
    expect(auth.getUserCalls).toBe(2)
  })
})

describe("the browser copy", () => {
  const spec: DismissalSpec = START_HERE_SPEC

  it("tells dismissed, none and unreadable apart, so blocked storage is not read as a first visit", () => {
    expect(readLocalDismissal(spec, "u1")).toBe("none")
    writeLocalDismissal(spec, "u1")
    expect(readLocalDismissal(spec, "u1")).toBe("dismissed")
    expect(readLocalDismissal(spec, "u2")).toBe("none")
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    expect(readLocalDismissal(spec, "u2")).toBe("unreadable")
    vi.restoreAllMocks()
  })

  it("keeps the stored key names stable, so earlier dismissals still count", () => {
    expect(spec.localKeys("u1")).toEqual(["ss-start-here-hidden:u1"])
    expect(spec.localValue).toBe("1")
    expect(spec.accountPatch).toEqual({ ss_start_here_hidden: true })
    expect(spec.isDismissedInMetadata({ ss_start_here_hidden: true })).toBe(true)
    expect(spec.isDismissedInMetadata({ ss_start_here_hidden: false })).toBe(false)
    expect(spec.isDismissedInMetadata({})).toBe(false)
    expect(spec.isDismissedInMetadata(null)).toBe(false)
  })
})
