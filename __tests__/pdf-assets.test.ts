import { describe, it, expect } from "vitest"
import { describeMissingPdfAssets, noMissingPdfAssets } from "../lib/pdf-assets"

describe("describeMissingPdfAssets", () => {
  it("says nothing when nothing is missing", () => {
    expect(describeMissingPdfAssets(noMissingPdfAssets(), "download")).toBeNull()
    expect(describeMissingPdfAssets(noMissingPdfAssets(), "email")).toBeNull()
  })

  it("names what is missing and that nothing was saved or sent, so the report is never quietly incomplete", () => {
    expect(describeMissingPdfAssets({ photos: 1, logo: false, diagram: false }, "download")).toBe("The report was not created because 1 photo could not be loaded. No file was saved. Check your connection and try again in a moment.")
    expect(describeMissingPdfAssets({ photos: 3, logo: false, diagram: false }, "email")).toBe("The report was not created because 3 photos could not be loaded. Nothing was sent. Check your connection and try again in a moment.")
    expect(describeMissingPdfAssets({ photos: 2, logo: true, diagram: true }, "email")).toBe("The report was not created because 2 photos, the roof diagram and your company logo could not be loaded. Nothing was sent. Check your connection and try again in a moment.")
    expect(describeMissingPdfAssets({ photos: 0, logo: true, diagram: false }, "download")).toContain("your company logo could not be loaded")
  })
})

import { readFileSync } from "fs"
import { describeExportFailure } from "../lib/pdf-assets"

describe("an unexpected PDF or CSV failure is shown to the customer, never silent", () => {
  it("the message says nothing was saved and what to do, with no error text or personal data", () => {
    for (const kind of ["pdf", "csv"] as const) {
      const m = describeExportFailure(kind)
      expect(m).toContain("no file was saved")
      expect(m).toContain("Try again")
      expect(m).toContain("support@supplementsnap.io")
      expect(m).not.toMatch(/Error|stack|undefined|\bat \w+\(/)
    }
    expect(describeExportFailure("pdf")).toMatch(/^The PDF/)
    expect(describeExportFailure("csv")).toMatch(/^The CSV/)
  })

  const page = readFileSync("app/app/page.tsx", "utf8").replace(/\r\n/g, "\n")
  const fn = (name: string) => {
    const start = page.indexOf(`async function ${name}()`)
    return page.slice(start, page.indexOf("\n  }\n", start) + 5)
  }

  it("download PDF reports a failure in the alert notice and always restores the button", () => {
    const body = fn("downloadPdf")
    expect(body).toMatch(/catch \(err\) \{[^}]*showNotice\(describeExportFailure\("pdf"\)\)/)
    expect(body).toMatch(/finally \{\s*setPdfGenerating\(false\)/)
    // success is only reported after the file is saved
    expect(body.indexOf("doc.save(")).toBeLessThan(body.indexOf('trackEvent("pdf_downloaded")'))
  })

  it("CSV export reports a failure, ignores a second tap while running, and always releases that guard", () => {
    const body = fn("exportXactimate")
    expect(body).toMatch(/if \(csvExporting\.current\) return/)
    expect(body).toMatch(/catch \(err\) \{[^}]*showNotice\(describeExportFailure\("csv"\)\)/)
    expect(body).toMatch(/finally \{\s*csvExporting\.current = false/)
  })

  it("the notice is an alert region so screen readers announce it", () => {
    expect(page).toMatch(/\{notice && \(\s*<div role="alert"/)
  })
})
