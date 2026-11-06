import { describe, it, expect, afterEach, beforeEach, vi } from "vitest"

// The account setting is a call to Supabase. Here it is a stand-in, so nothing is sent anywhere.
const authFetch = vi.hoisted(() => vi.fn())
vi.mock("../lib/supabase", () => ({ supabase: { auth: {} } }))
vi.mock("../lib/auth-fetch", () => ({ authFetch }))

import { resetDismissalSyncForTests } from "../lib/dismissal-sync"
import { GUIDE_HIDDEN_SETTING, hasCreatedProject, hideGuide, isGuideHidden, markProjectCreated, shouldShowStartGuide } from "../lib/guide-state"

beforeEach(() => {
  authFetch.mockReset().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
})
afterEach(() => {
  resetDismissalSyncForTests()
  vi.restoreAllMocks()
  window.localStorage.clear()
  window.sessionStorage.clear()
})

describe("guide state", () => {
  it("remembers a created project per person", () => {
    expect(hasCreatedProject("a")).toBe(false)
    markProjectCreated("a")
    expect(hasCreatedProject("a")).toBe(true)
    expect(hasCreatedProject("b")).toBe(false)
  })

  it("remembers Hide for that person only, on the same browser", () => {
    expect(isGuideHidden("a")).toBe(false)
    hideGuide("a")
    expect(isGuideHidden("a")).toBe(true)
    expect(isGuideHidden("b")).toBe(false)
  })

  it("keeps Hide after the browser session ends (it is not a session-only choice)", () => {
    hideGuide("a")
    window.sessionStorage.clear()
    expect(isGuideHidden("a")).toBe(true)
  })

  it("treats the setting saved on the account as hidden, even with no browser copy", () => {
    expect(isGuideHidden("a", true)).toBe(true)
    expect(isGuideHidden("a", false)).toBe(false)
    expect(isGuideHidden("a", undefined)).toBe(false)
  })

  it("also saves the choice on the account, by asking the server to record the Hide key for this person", async () => {
    hideGuide("a")
    await vi.waitFor(() => expect(authFetch).toHaveBeenCalledTimes(1))
    const [url, init] = authFetch.mock.calls[0]
    expect(url).toBe("/api/onboarding-dismissal")
    expect(JSON.parse(init.body)).toEqual({ userId: "a", keys: [GUIDE_HIDDEN_SETTING] })
  })

  it("does not break when saving on the account fails or throws", () => {
    authFetch.mockRejectedValue(new Error("offline"))
    expect(() => hideGuide("a")).not.toThrow()
    authFetch.mockImplementation(() => {
      throw new Error("sync failure")
    })
    expect(() => hideGuide("a")).not.toThrow()
    expect(isGuideHidden("a")).toBe(true) // the browser copy was still written
  })

  it("does not break when browser storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    expect(() => hideGuide("a")).not.toThrow()
    expect(isGuideHidden("a")).toBe(false) // nothing could be saved here
    expect(isGuideHidden("a", true)).toBe(true) // the account setting still applies
  })

  it("shows only for someone with no project of their own, who has not hidden it", () => {
    expect(shouldShowStartGuide({ onlyDemoOrNone: true, createdBefore: false, hidden: false })).toBe(true)
    expect(shouldShowStartGuide({ onlyDemoOrNone: false, createdBefore: false, hidden: false })).toBe(false)
    expect(shouldShowStartGuide({ onlyDemoOrNone: true, createdBefore: true, hidden: false })).toBe(false)
    expect(shouldShowStartGuide({ onlyDemoOrNone: true, createdBefore: false, hidden: true })).toBe(false)
  })
})
