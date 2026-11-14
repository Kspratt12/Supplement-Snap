import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

/**
 * Source-text checks for the public-copy alignment pass (they read the files as text, so they confirm what the code says,
 * not how a browser renders it): claims about approval, concealment and "adjuster-ready", the team FAQ in both places,
 * the footer and city-page strategy, and the links added on the evaluation path.
 */
const root = path.resolve(__dirname, "..")
const read = (f: string) => fs.readFileSync(path.join(root, f), "utf8").replace(/\r\n/g, "\n")
const exists = (f: string) => fs.existsSync(path.join(root, f))

const home = read("app/page.tsx")
const example = read("app/roofing-supplement-report-example/page.tsx")

describe("claims in the sections that were changed", () => {
  it("no 'adjuster-ready' wording remains on the public pages and metadata that were changed", () => {
    for (const f of ["app/page.tsx", "app/demo/page.tsx", "app/demo/layout.tsx", "app/opengraph-image.tsx", "app/how-roofing-supplements-work/page.tsx", "app/roofing-supplement-report-example/page.tsx", "app/roofing-supplement-software/[city]/page.tsx"]) {
      expect(read(f), f).not.toMatch(/adjuster-ready/i)
    }
  })

  it("the homepage no longer says an adjuster can approve every documented item, or that crews/office are separate logins", () => {
    expect(home).not.toMatch(/line item the adjuster can approve/)
    expect(home).not.toMatch(/Everything adjusters need/)
    expect(home).not.toMatch(/The office gets a professional supplement draft/)
    expect(home).toMatch(/fictional illustration, not a result, and nothing here guarantees approval or payment/)
  })

  it("the claim-status line says the status is updated by hand and is not an insurer connection", () => {
    expect(home).toMatch(/Status is updated by hand; Supplement Snap is not connected to insurers\./)
  })

  it("the homepage report preview is labeled fictional and asserts no unconditional concealment", () => {
    expect(home).toMatch(/A fictional example of a report\./)
    expect(home).not.toMatch(/All findings represent concealed conditions/)
    expect(home).not.toMatch(/This damage was concealed beneath the existing shingles/)
  })

  it("the report-example page labels itself a demonstration, not an export, and has no concealment or approval promises", () => {
    expect(example).toMatch(/Demonstration report, not a customer claim\./)
    expect(example).toMatch(/not an exported PDF from the app/)
    expect(example).not.toMatch(/concealed beneath|concealed under|Not visible prior to shingle removal/)
    expect(example).not.toMatch(/increases the chances of approval/)
    expect(example).toMatch(/does not guarantee coverage or approval/)
  })

  it("the report-example page links no PDF, since no real exported demonstration PDF is published", () => {
    expect(example).not.toMatch(/\.pdf/i)
    expect(example).not.toMatch(/downloads\//)
  })

  it("the demo description is the approved wording", () => {
    expect(read("app/demo/layout.tsx")).toContain("See how photos and field notes are captured on a phone and organized into a report you review before sending.")
    expect(read("app/demo/page.tsx")).toContain("organized into a report you review before sending")
  })
})

describe("homepage title", () => {
  it("leads with the main phrase, ends with the brand, and is the same in the page, Open Graph and Twitter tags", () => {
    const titles = [...home.matchAll(/^ {2,4}title: "([^"]+)",/gm)].map((m) => m[1]).slice(0, 3)
    expect(titles).toHaveLength(3)
    for (const t of titles) {
      expect(t).toBe("Roofing Supplement Software for Tear-Off Damage | Supplement Snap")
      expect(t.length).toBeLessThanOrEqual(65)
    }
  })
})

describe("the team FAQ", () => {
  it("is present in the structured data and on the page with the same words", () => {
    const s = [...home.matchAll(/text: "(Team members can view[^"]*)"/g)].map((m) => m[1])
    const v = [...home.matchAll(/a: "(Team members can view[^"]*)"/g)].map((m) => m[1])
    expect(s).toHaveLength(1)
    expect(v).toHaveLength(1)
    expect(s[0]).toBe(v[0])
    expect(home.match(/What can team members see and do\?/g)).toHaveLength(2)
  })
})

describe("city links and the indexing strategy", () => {
  const footer = read("lib/site-footer.tsx")
  const city = read("app/roofing-supplement-software/[city]/page.tsx")
  const sitemap = read("app/sitemap.ts")

  it("the shared footer has no city list", () => {
    expect(footer).not.toMatch(/roofing-supplement-software\//)
    expect(footer).not.toMatch(/by City/i)
  })

  it("the 'Also serving' wording is gone and the city bullet describes real team access", () => {
    expect(city).not.toMatch(/Also serving/)
    expect(city).not.toMatch(/Team access for crew, foreman, and office staff/)
  })

  it("the indexing strategy is unchanged: two indexed cities, the rest noindex, and only those two in the sitemap", () => {
    expect(city).toContain('const INDEXED_CITIES = ["raleigh-nc", "apex-nc"]')
    expect(city).toMatch(/robots: INDEXED_CITIES\.includes\(city\.slug\) \? \{ index: true, follow: true \} : \{ index: false, follow: true \}/)
    expect((sitemap.match(/roofing-supplement-software\/[a-z-]+-nc/g) || []).sort()).toEqual(["roofing-supplement-software/apex-nc", "roofing-supplement-software/raleigh-nc"])
  })

  it("Raleigh and Apex stay reachable from the software page through a neutral link", () => {
    const software = read("app/roofing-supplement-software/page.tsx")
    expect(software).toContain('href="/roofing-supplement-software/raleigh-nc"')
    expect(software).toContain('href="/roofing-supplement-software/apex-nc"')
    expect(software).not.toMatch(/serving|service area/i)
  })
})

describe("links added on the evaluation path", () => {
  const workflow = 'href="/roofing-supplement-software"'
  it("documentation guide, checklist, templates and report example each link to the workflow page", () => {
    for (const f of ["app/roofing-supplement-documentation/page.tsx", "app/free-roofing-supplement-checklist/page.tsx", "app/free-roofing-templates/page.tsx", "app/roofing-supplement-report-example/page.tsx"]) {
      expect(read(f), f).toContain(workflow)
    }
  })
  it("every internal page those links point to exists", () => {
    for (const p of ["app/roofing-supplement-software/page.tsx", "app/roofing-supplement-report-example/page.tsx", "app/pricing/page.tsx", "app/roofing-supplement-software/[city]/page.tsx"]) expect(exists(p), p).toBe(true)
  })
})
