// @vitest-environment node
import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

/**
 * A guard, not a behaviour test: the dashboard page is too large to render in a unit test, so this checks that every place that
 * shows or fetches a stored photo, diagram or logo goes through the signed-link helper, that a missing link is treated as
 * "unavailable" (never as permission to use the plain address), and that the places that must keep the saved address
 * (deleting, saving, queueing) still read it as before. Real behaviour is covered by the acceptance steps.
 */
// Source files may use Windows line endings; match on one form
const read = (f: string) => fs.readFileSync(path.resolve(__dirname, "..", f), "utf8").replace(/\r\n/g, "\n")
const page = read("app/app/page.tsx")
const settings = read("app/dashboard/company-settings.tsx")
const helper = read("lib/photo-access.ts")

describe("the dashboard goes through signed links", () => {
  it("shows stored photos with SignedImg and no plain <img> on a saved address", () => {
    expect((page.match(/<SignedImg/g) || []).length).toBe(4)
    expect(page).not.toMatch(/<img\s+src=\{url\}/)
    expect(page).not.toMatch(/<img\s+src=\{urls\[0\]\}/)
    expect(page).not.toMatch(/<img\s+src=\{viewerPhotos/)
  })

  it("no longer hides a photo that fails to load; the failure is shown instead", () => {
    expect(page).not.toContain('(e.currentTarget.parentElement as HTMLElement).style.display = "none"')
  })

  it("fetches stored files for the PDF only through a signed link, and treats a missing link as a missing picture", () => {
    expect(page).toContain("const link = await signedPhotoUrl(url, selectedProject?.id)\n      if (!link) return null\n      const res = await fetch(link)")
    const bare = [...page.matchAll(/await fetch\(url\)/g)]
    expect(bare).toHaveLength(1)
    const signLine = page.indexOf("url = link")
    expect(signLine).toBeGreaterThan(0)
    expect(bare[0].index!).toBeGreaterThan(signLine)
    expect(bare[0].index! - signLine).toBeLessThan(400)
  })

  it("never quietly saves or sends a report that is missing pictures", () => {
    expect(page).toContain("pdfMissing.current.photos++")
    expect(page).toContain("pdfMissing.current.logo = true")
    expect(page).toContain("pdfMissing.current.diagram = true")
    expect(page).toContain('describeMissingPdfAssets(pdfMissing.current, "download")')
    expect(page).toContain('describeMissingPdfAssets(pdfMissing.current, "email")')
    // the check comes before the file is saved and before the email request is made
    expect(page.indexOf('describeMissingPdfAssets(pdfMissing.current, "download")')).toBeLessThan(page.indexOf("doc.save(`${safeName}-Report.pdf`)"))
    expect(page.indexOf('describeMissingPdfAssets(pdfMissing.current, "email")')).toBeLessThan(page.indexOf('authFetch("/api/send-report"'))
  })

  it("opens the diagram and the annotator through signed links, and says so when they cannot be opened", () => {
    expect(page).toContain("openStoredFile(selectedProject.diagram_url")
    expect(page).toContain("The diagram could not be opened")
    expect(page).toMatch(/signedPhotoUrl\(url, selectedProject\?\.id\)\.then\(\(link\) => \{ if \(!link\)/)
    expect(page).not.toMatch(/setAnnotateUrl\(url\)/)
  })

  it("keeps saving and deleting on the saved address", () => {
    expect(page).toContain("photoPathsForCaptures([{ image_url: c.image_url, image_urls: c.image_urls }])")
    expect(page).toContain("image_url: uploadedUrls[0] || \"\"")
  })

  it("shows the logo through a signed link, or from the chosen file right after upload", () => {
    expect(settings).toContain("<SignedImg src={logoUrl}")
    expect(settings).toContain("URL.createObjectURL(file)")
  })

  it("the helper has no path that returns a stored file's plain address when signing failed", () => {
    expect(helper).toContain("w.resolve(link || null)")
    expect(helper).not.toMatch(/resolve\(link \|\| w\.url\)/)
  })
})
