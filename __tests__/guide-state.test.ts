import { describe, it, expect, afterEach } from "vitest"
import { clearGuideVisit, hasCreatedProject, hideGuideThisVisit, isGuideHiddenThisVisit, markProjectCreated, shouldShowStartGuide } from "../lib/guide-state"

afterEach(() => {
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

  it("hide lasts for the visit and is cleared on logout", () => {
    expect(isGuideHiddenThisVisit()).toBe(false)
    hideGuideThisVisit()
    expect(isGuideHiddenThisVisit()).toBe(true)
    clearGuideVisit()
    expect(isGuideHiddenThisVisit()).toBe(false)
  })

  it("shows only for someone with no project of their own, who has not hidden it", () => {
    expect(shouldShowStartGuide({ onlyDemoOrNone: true, createdBefore: false, hiddenThisVisit: false })).toBe(true)
    expect(shouldShowStartGuide({ onlyDemoOrNone: false, createdBefore: false, hiddenThisVisit: false })).toBe(false)
    expect(shouldShowStartGuide({ onlyDemoOrNone: true, createdBefore: true, hiddenThisVisit: false })).toBe(false)
    expect(shouldShowStartGuide({ onlyDemoOrNone: true, createdBefore: false, hiddenThisVisit: true })).toBe(false)
  })
})
