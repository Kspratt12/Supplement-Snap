// @vitest-environment node
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import path from "node:path"
import { PDF_FOOTER_LINES, DEFAULT_REPORT_EMAIL_MESSAGE } from "../lib/report-wording"

const CLAIMS = /concealed|not visible|discovered|hidden damage|tear-off/i

describe("fixed report wording makes no claim about a particular claim", () => {
  it("the PDF footer and the starting email message do not assert concealment, discovery or timing", () => {
    for (const line of PDF_FOOTER_LINES) expect(line).not.toMatch(CLAIMS)
    expect(DEFAULT_REPORT_EMAIL_MESSAGE).not.toMatch(CLAIMS)
    expect(DEFAULT_REPORT_EMAIL_MESSAGE).toMatch(/attached supplement documentation/)
  })

  it("the page uses this wording and no longer contains the old sentences (source inspection, not a render)", () => {
    const src = readFileSync(path.join(__dirname, "..", "app", "app", "page.tsx"), "utf8")
    expect(src).toContain("PDF_FOOTER_LINES")
    expect(src).toContain("DEFAULT_REPORT_EMAIL_MESSAGE")
    expect(src).not.toContain("prepared based on concealed conditions")
    expect(src).not.toContain("concealed damage was discovered that was not visible")
  })
})
