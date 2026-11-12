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
