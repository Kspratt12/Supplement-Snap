import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

/**
 * Source-text checks for the search-snippet rewrites and the roof condition report article:
 * the new article is complete, listed, in the sitemap and linked; every related slug resolves;
 * snippets stay within length; no approval or coverage promises were added.
 */
const root = path.resolve(__dirname, "..")
const read = (f: string) => fs.readFileSync(path.join(root, f), "utf8").replace(/\r\n/g, "\n")
const blog = read("app/blog/[slug]/page.tsx")
const listing = read("app/blog/page.tsx")
const sitemap = read("app/sitemap.ts")

const slugs = [...blog.matchAll(/^ {4}slug: "([^"]+)",/gm)].map((m) => m[1])
const listed = [...listing.matchAll(/{ slug: "([^"]+)"/g)].map((m) => m[1])
const block = (slug: string) => {
  const start = blog.indexOf(`    slug: "${slug}",`)
  const next = blog.indexOf("\n    slug: \"", start + 10)
  return blog.slice(start, next === -1 ? undefined : next)
}
const field = (slug: string, name: string) => block(slug).match(new RegExp(`${name}: "([^"]*)"`))?.[1] ?? ""

describe("snippet rewrites", () => {
  it.each([
    ["xactimate-codes-for-roofing-supplements", "Xactimate Roofing Supplement Items: How Each Is Counted"],
    ["roof-tear-off-cost", "Roof Tear-Off Cost: What Drives the Price"],
    ["roofing-supplement-companies-vs-software", "Roofing Supplement Services vs. Doing It In-House"],
    ["roof-condition-report", "Roof Condition Report: What It Is and What to Include"],
  ])("%s has the intended title tag within length", (slug, title) => {
    expect(field(slug, "metaTitle")).toBe(title)
    expect(title.length).toBeLessThanOrEqual(60)
  })

  it("the changed descriptions stay within 160 characters", () => {
    for (const s of ["roof-tear-off-cost", "roof-condition-report", "xactimate-codes-for-roofing-supplements"]) {
      const d = field(s, "metaDescription")
      expect(d.length, s).toBeGreaterThan(80)
      expect(d.length, s).toBeLessThanOrEqual(160)
    }
  })

  it("the Xactimate-codes snippet does not promise a list of codes the article does not contain", () => {
    expect(field("xactimate-codes-for-roofing-supplements", "metaDescription")).toMatch(/Codes and prices not listed/)
    expect(field("xactimate-codes-for-roofing-supplements", "metaTitle")).not.toMatch(/code list|all codes|complete/i)
  })

  it("the tear-off article now points to the product, with the approved free-versus-paid wording", () => {
    const b = block("roof-tear-off-cost")
    expect(b).toMatch(/midCtaAfter: 2,/)
    expect(b).toMatch(/PDF reports and email are on paid plans/)
    expect(b).not.toMatch(/guarantee|approved supplement/i)
  })
})

describe("roof condition report article", () => {
  const b = block("roof-condition-report")

  it("exists once, with sections, FAQ and related links", () => {
    expect(slugs.filter((s) => s === "roof-condition-report")).toHaveLength(1)
    expect((b.match(/heading: "/g) || []).length).toBeGreaterThanOrEqual(6)
    expect((b.match(/q: "/g) || []).length).toBeGreaterThanOrEqual(3)
    expect(b).toMatch(/related: \[/)
  })

  it("every related slug and every internal link inside it points at a real article or page", () => {
    const related = [...(b.match(/related: \[([^\]]*)\]/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1])
    expect(related.length).toBeGreaterThan(2)
    for (const r of related) expect(listed, r).toContain(r)
    for (const m of b.matchAll(/href='\/blog\/([a-z0-9-]+)'/g)) expect(listed, m[1]).toContain(m[1])
    for (const m of b.matchAll(/href='(\/[a-z0-9-]+)'/g)) expect(fs.existsSync(path.join(root, "app", m[1], "page.tsx")), m[1]).toBe(true)
  })

  it("states its limits and promises no coverage, approval or rating features", () => {
    expect(b).toMatch(/does not decide insurance coverage/)
    expect(b).toMatch(/does not rate a roof's condition/)
    expect(b).not.toMatch(/guarantee(s|d)? (coverage|approval|payment)|will be approved/i)
  })

  it("is listed on the blog index and in the sitemap exactly once, and the city sitemap entries are unchanged", () => {
    expect(listing.match(/slug: "roof-condition-report"/g)).toHaveLength(1)
    expect(sitemap.match(/blog\/roof-condition-report/g)).toHaveLength(1)
    expect((sitemap.match(/roofing-supplement-software\/[a-z-]+-nc/g) || []).sort()).toEqual(["roofing-supplement-software/apex-nc", "roofing-supplement-software/raleigh-nc"])
  })

  it("the roof inspection report guide links to it", () => {
    expect(block("roof-inspection-report")).toMatch(/"roof-condition-report"/)
  })
})
