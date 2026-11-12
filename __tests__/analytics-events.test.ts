import { afterEach, describe, expect, it, vi } from "vitest"
import { readFileSync } from "fs"
import { trackEvent } from "../lib/analytics"

afterEach(() => {
  delete (window as unknown as { plausible?: unknown }).plausible
})

describe("trackEvent never gets in the way of the app", () => {
  it("does nothing when Plausible is not loaded (blocked or not yet ready)", () => {
    expect(() => trackEvent("project_created")).not.toThrow()
    expect(() => trackEvent("pdf_downloaded")).not.toThrow()
  })

  it("does not throw when Plausible itself throws", () => {
    ;(window as unknown as { plausible: () => void }).plausible = () => { throw new Error("blocked") }
    expect(() => trackEvent("project_created")).not.toThrow()
  })

  it("sends the event name alone, with no properties", () => {
    const calls: unknown[][] = []
    ;(window as unknown as { plausible: (...a: unknown[]) => void }).plausible = (...a) => { calls.push(a) }
    trackEvent("project_created")
    trackEvent("pdf_downloaded")
    expect(calls).toEqual([["project_created"], ["pdf_downloaded"]])
  })
})

describe("where the events are sent", () => {
  const read = (p: string) => readFileSync(p, "utf8").replace(/\r\n/g, "\n")
  const app = read("app/app/page.tsx")
  const quick = read("app/dashboard/quick-capture.tsx")
  const analytics = read("lib/analytics.ts")

  it("the event names are new and do not duplicate an existing one", () => {
    const names = [...analytics.matchAll(/^\s+\| "([a-z_]+)"$/gm)].map((m) => m[1])
    expect(names.filter((n) => n === "project_created")).toHaveLength(1)
    expect(names.filter((n) => n === "pdf_downloaded")).toHaveLength(1)
    expect(names.some((n) => /first/.test(n))).toBe(false)
  })

  it("project_created is sent only after a project was actually saved, with no properties", () => {
    expect(app).toMatch(/if \(!error && data\) \{\n\s+if \(user\) markProjectCreated\(user\.id\)\n\s+trackEvent\("project_created"\)/)
    expect(quick).toMatch(/if \(data\) \{\n\s+trackEvent\("project_created"\)/)
    expect(app.match(/trackEvent\("project_created"[^)]*\)/g)).toEqual(['trackEvent("project_created")'])
  })

  it("the automatic demo project does not count as a created project", () => {
    const demo = app.slice(app.indexOf("Auto-create a demo project"), app.indexOf("Auto-create a demo project") + 2500)
    expect(demo).not.toMatch(/trackEvent/)
  })

  it("pdf_downloaded is sent only after the file was saved, not when assets are missing or the build fails", () => {
    expect(app).toMatch(/doc\.save\(`\$\{safeName\}-Report\.pdf`\)\n\s+trackEvent\("pdf_downloaded"\)/)
    expect(app.match(/trackEvent\("pdf_downloaded"[^)]*\)/g)).toEqual(['trackEvent("pdf_downloaded")'])
  })
})
