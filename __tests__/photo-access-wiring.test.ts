// @vitest-environment node
import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

/**
 * A guard, not a behaviour test: the dashboard page is too large to render in a unit test, so this checks that every place that
 * shows or fetches a stored photo, diagram or logo goes through the signed-link helper, and that the places that must keep the
 * saved address (deleting, saving, queueing) still read it as before. The real behaviour is covered by the acceptance steps.
 */
const read = (f: string) => fs.readFileSync(path.resolve(__dirname, "..", f), "utf8")
const page = read("app/app/page.tsx")
const settings = read("app/dashboard/company-settings.tsx")

describe("the dashboard goes through signed links", () => {
  it("shows stored photos with SignedImg and no plain <img> on a saved address", () => {
    expect((page.match(/<SignedImg/g) || []).length).toBe(4)
    expect(page).not.toMatch(/<img\s+src=\{url\}/)
    expect(page).not.toMatch(/<img\s+src=\{urls\[0\]\}/)
    expect(page).not.toMatch(/<img\s+src=\{viewerPhotos/)
  })

  it("fetches stored files for the PDF only through a signed link", () => {
    // the photo helper signs inside the fetch call itself
    expect(page).toContain("await fetch(await signedPhotoUrl(url, selectedProject?.id))")
    // the logo/diagram helper replaces `url` with the signed link first, and only then fetches `url`: no other bare fetch(url) may exist
    const bare = [...page.matchAll(/await fetch\(url\)/g)]
    expect(bare).toHaveLength(1)
    const signLine = page.indexOf("url = await signedPhotoUrl(url, selectedProject?.id)")
    expect(signLine).toBeGreaterThan(0)
    expect(bare[0].index!).toBeGreaterThan(signLine)
    expect(bare[0].index! - signLine).toBeLessThan(400)
  })

  it("opens the diagram and the annotator through signed links, not the saved address", () => {
    expect(page).toContain("openStoredFile(selectedProject.diagram_url")
    expect(page).toMatch(/signedPhotoUrl\(url, selectedProject\?\.id\)\.then\(\(link\) => \{ setAnnotateUrl\(link\)/)
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
})
