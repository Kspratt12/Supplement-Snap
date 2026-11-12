import { afterEach, describe, expect, it } from "vitest"
import { readFileSync } from "fs"
import { trackEvent } from "../lib/analytics"

afterEach(() => {
  delete (window as unknown as { plausible?: unknown }).plausible
})

const app = readFileSync("app/app/page.tsx", "utf8").replace(/\r\n/g, "\n")

describe("upgrade_modal_viewed", () => {
  it("the modal is only opened through openUpgradeModal, so every opening carries one of the fixed sources", () => {
    expect(app.match(/setShowUpgradeModal\(true\)/g)).toHaveLength(1)
    const sources = [...app.matchAll(/openUpgradeModal\("([a-z_]+)"\)/g)].map((m) => m[1])
    expect(new Set(sources)).toEqual(new Set(["pdf", "email", "csv", "annotate", "project_limit", "capture_limit"]))
  })

  it("is sent from an effect that runs on the hidden-to-visible change, with only the fixed source", () => {
    expect(app).toMatch(
      /useEffect\(\(\) => \{\n\s+if \(showUpgradeModal\) trackEvent\("upgrade_modal_viewed", \{ source: upgradeSource\.current \}\)\n\s+\}, \[showUpgradeModal\]\)/,
    )
    expect(app.match(/trackEvent\("upgrade_modal_viewed"/g)).toHaveLength(1)
  })

  it("sends the source as the only property", () => {
    const calls: unknown[][] = []
    ;(window as unknown as { plausible: (...a: unknown[]) => void }).plausible = (...a) => { calls.push(a) }
    trackEvent("upgrade_modal_viewed", { source: "pdf" })
    expect(calls).toEqual([["upgrade_modal_viewed", { props: { source: "pdf" } }]])
  })

  it("an analytics failure cannot stop the modal from opening", () => {
    ;(window as unknown as { plausible: () => void }).plausible = () => { throw new Error("blocked") }
    expect(() => trackEvent("upgrade_modal_viewed", { source: "email" })).not.toThrow()
  })
})
