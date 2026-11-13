// @vitest-environment node
import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

/**
 * Search results and share previews must not promise more than the Free plan includes: PDF reports and email are paid-plan features.
 * Pages without their own Open Graph/Twitter text inherit the layout default, so the default and each key page are pinned.
 * (Read from source: importing the page modules would start the Supabase client, which needs a browser-like runtime.)
 */
const read = (f: string) => fs.readFileSync(path.resolve(__dirname, "..", f), "utf8").split("\r\n").join("\n")
const metadataBlock = (src: string) => src.slice(src.indexOf("export const metadata"), src.indexOf("\n}\n", src.indexOf("export const metadata")) + 3)

describe("share metadata does not overstate the Free plan", () => {
  it("the site default no longer says every account can send PDF reports", () => {
    const block = metadataBlock(read("app/layout.tsx"))
    expect(block).not.toMatch(/send adjuster-ready PDF reports|Send Reports/i)
    // title, description, Open Graph and Twitter all carry the corrected text
    expect((block.match(/PDF reports and email are on paid plans/g) || []).length).toBe(3)
    expect((block.match(/Roofing Supplement Software \| Supplement Snap/g) || []).length).toBe(3)
  })

  it("pricing has its own Open Graph and Twitter text that matches its title and description", () => {
    const block = metadataBlock(read("app/pricing/page.tsx"))
    const title = /title: "([^"]+)"/.exec(block)![1]
    const desc = /description: "([^"]+)"/.exec(block)![1]
    expect(block).toMatch(/openGraph: \{/)
    expect(block).toMatch(/twitter: \{/)
    expect(block).toContain('url: "https://supplementsnap.io/pricing"')
    // the same title and description appear three times (page, Open Graph, Twitter)
    expect(block.split(`title: "${title}"`).length - 1).toBe(3)
    expect(block.split(`description: "${desc}"`).length - 1).toBe(3)
  })

  it("the roofing software page's Twitter text matches its Open Graph text", () => {
    const block = metadataBlock(read("app/roofing-supplement-software/page.tsx"))
    expect(block).toMatch(/twitter: \{ card: "summary_large_image", title: TITLE, description: DESCRIPTION \}/)
  })

  it("the homepage keeps the Free versus paid wording and its structured data and CSV card name the plans", () => {
    const src = read("app/page.tsx")
    expect(metadataBlock(src)).toMatch(/Try one project free; PDF reports and email are on paid plans/)
    expect(src).toMatch(/on paid plans, send adjuster-ready PDF reports/)
    expect(src).toMatch(/On the Team and Pro plans, the CSV export lists general line-item descriptions/)
  })
})

describe("article text does not promise Free-plan features that need a paid plan", () => {
  const blog = read("app/blog/[slug]/page.tsx")

  it("no article says the free project includes downloading the PDF report", () => {
    expect(blog).not.toMatch(/download the PDF report before paying/i)
    expect(blog).toMatch(/before paying anything; PDF reports and email are on paid plans/)
  })

  it("the shared fallback call-to-action names the plans that include the CSV export", () => {
    expect(blog).toContain("On the Team and Pro plans, Supplement Snap's Xactimate-style CSV lists general line items")
    expect(blog).not.toMatch(/"Supplement Snap's Xactimate-style CSV lists general line items/)
  })
})
