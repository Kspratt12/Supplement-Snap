import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { MAX_INVITES } from "../lib/plan"

/**
 * Source-text checks for the wording about team members. They read the page files as text, so they confirm what the code says,
 * not how a browser renders it.
 */
const root = path.resolve(__dirname, "..")
const read = (f: string) => fs.readFileSync(path.join(root, f), "utf8").replace(/\r\n/g, "\n")

describe("wording about team members matches how teams work", () => {
  const home = read("app/page.tsx")
  // The same answer is written twice: once for search engines (structured data) and once on the page.
  const forSearch = [...home.matchAll(/text: "(Yes, for projects on the owner's account\.[^"]*)"/g)].map((m) => m[1])
  const onPage = [...home.matchAll(/a: "(Yes, for projects on the owner's account\.[^"]*)"/g)].map((m) => m[1])

  it("the homepage answer is the same in the structured data and on the page", () => {
    expect(forSearch).toHaveLength(1)
    expect(onPage).toHaveLength(1)
    expect(forSearch[0]).toBe(onPage[0])
  })

  it("it says what members can and cannot do, and who owns a member's projects", () => {
    const a = onPage[0]
    expect(a).toMatch(/Team members can open the owner's projects/)
    expect(a).toMatch(/build and email reports, and export the CSV/)
    expect(a).toMatch(/only the owner's login can add or change findings/)
    expect(a).toMatch(/belongs to that member and is not visible to the owner/)
    expect(a).not.toMatch(/office staff can see all captures/)
  })

  it("the seat counts it gives are the plans' real limits, counting the owner", () => {
    expect(onPage[0]).toMatch(/up to 3 people on Team and 5 on Pro, counting the owner/)
    expect(MAX_INVITES.team + 1).toBe(3)
    expect(MAX_INVITES.pro + 1).toBe(5)
    expect(MAX_INVITES.starter).toBe(0)
    expect(onPage[0]).toMatch(/The Starter plan is one login/)
  })

  it("the pricing FAQ, the about page and the team panel no longer promise shared editing", () => {
    expect(read("app/pricing/page.tsx")).toMatch(/team logins that can view the owner's projects and send reports/)
    expect(read("app/pricing/page.tsx")).not.toMatch(/who need shared access/)
    expect(read("app/about/page.tsx")).toMatch(/Team and Pro plans add team logins that can view the owner(?:'|&apos;)s projects and send reports/)
    expect(read("app/about/page.tsx")).not.toMatch(/Team plans add shared access/)
    expect(read("app/dashboard/team-manager.tsx")).toMatch(/They can view your projects and send reports, but only you can edit them/)
    expect(read("app/dashboard/team-manager.tsx")).not.toMatch(/start collaborating/)
  })

  it("the Team feature list says what team access is, and its plan-specific lines are unchanged", () => {
    const list = read("app/pricing/page.tsx").match(/const TEAM_FEATURES = \[([\s\S]*?)\n\]/)?.[1] ?? ""
    expect(list).toMatch(/"Team access to view owner projects and prepare reports",/)
    expect(list).not.toMatch(/crew and office/)
    for (const line of ["Everything in Starter, plus:", "3 users total, including the owner", "Adjuster email open tracking", "Xactimate-style CSV export (starting line items)", "PDF reports & email"]) {
      expect(list, line).toContain(`"${line}",`)
    }
  })

  it("the seat lines say 'users total, including the owner' on the pricing page and the homepage, and match the plan limits", () => {
    const pricing = read("app/pricing/page.tsx")
    const proList = pricing.slice(pricing.indexOf("const PRO_FEATURES"), pricing.indexOf("]", pricing.indexOf("const PRO_FEATURES")))
    expect(proList).toContain('"5 users total, including the owner",')
    expect(pricing).toContain('"3 users total, including the owner",')
    const home = read("app/page.tsx")
    expect(home).toContain('"3 users total, including the owner", "PDF reports & email"')
    expect(home).toContain('"5 users total, including the owner", "Priority email replies"')
    for (const text of [pricing, home]) {
      expect(text).not.toMatch(/Up to 3 team members/)
      expect(text).not.toMatch(/Up to 5 team members/)
    }
    // 3 and 5 count the owner: the invite limits are 2 and 4
    expect(MAX_INVITES.team + 1).toBe(3)
    expect(MAX_INVITES.pro + 1).toBe(5)
  })

  it("the plan-dependent features it names are the ones Team and Pro have", () => {
    const plan = read("lib/plan.ts")
    expect(plan).toMatch(/xactimateExport: \(a: Access\) => a\.active && \(a\.plan === "team" \|\| a\.plan === "pro"/)
    expect(plan).toMatch(/emailTracking: \(a: Access\) => a\.active && \(a\.plan === "team" \|\| a\.plan === "pro"/)
    expect(plan).toMatch(/emailReports: \(a: Access\) => a\.active/)
  })
})
