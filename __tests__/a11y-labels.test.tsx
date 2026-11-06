import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import { readFileSync } from "node:fs"
import path from "node:path"

/**
 * Accessible-name checks for three spots found on the live site:
 * - the dashboard Company Name box had a visible label that was not connected to it, so a screen reader announced the
 *   example text "Smith Roofing LLC" instead of "Company Name";
 * - the dashboard project search box had only placeholder text for a name;
 * - the miniature product pictures on the home page were read out as if they were page content.
 * These run against the real components with the network replaced; they do not exercise any live service.
 */

vi.mock("../lib/auth-fetch", () => ({
  authFetch: vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ settings: null }) })),
}))
vi.mock("../lib/supabase", () => ({ supabase: { storage: { from: () => ({ upload: async () => ({ error: null }), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) } } }))
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {}, replace: () => {} }), usePathname: () => "/", useSearchParams: () => new URLSearchParams() }))

import { CompanySettings } from "../app/dashboard/company-settings"

afterEach(cleanup)

const read = (rel: string) => readFileSync(path.join(__dirname, "..", rel), "utf8")

describe("accessible names", () => {
  it("connects the Company Name label to its box", () => {
    render(<CompanySettings userId="u1" />)
    const box = screen.getByLabelText("Company Name") as HTMLInputElement
    expect(box.tagName).toBe("INPUT")
    expect(box.placeholder).toBe("Smith Roofing LLC") // the example text stays a placeholder, not the name
  })

  it("gives the dashboard project search box a name that is not just its placeholder", () => {
    // The dashboard page needs many services to render, so this checks the source of that one input.
    const src = read("app/dashboard/page.tsx")
    const at = src.indexOf('placeholder="Search projects..."')
    expect(at).toBeGreaterThan(-1)
    // the whole <input ... /> element around that placeholder (its onChange contains ">", so find its start and end by tag)
    const start = src.lastIndexOf("<input", at)
    const end = src.indexOf("/>", at)
    expect(src.slice(start, end)).toContain('aria-label="Search projects"')
  })

  it("hides the three decorative product pictures on the home page from screen readers", () => {
    // The home page is a large page; this checks the source of the three picture blocks rather than rendering it.
    const src = read("app/page.tsx")
    const hidden = src.match(/<div aria-hidden="true" className="relative bg-gradient-to-br from-indigo-50 to-zinc-50 p-4">/g) ?? []
    const all = src.match(/<div [^>]*className="relative bg-gradient-to-br from-indigo-50 to-zinc-50 p-4">/g) ?? []
    expect(all.length).toBe(3)
    expect(hidden.length).toBe(3)
  })
})
