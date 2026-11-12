import { describe, expect, it } from "vitest"
import { readFileSync } from "fs"

const read = (p: string) => readFileSync(p, "utf8").replace(/\r\n/g, "\n")

const APPROVED =
  "Plan changes aren't available through the billing portal yet. Email support@supplementsnap.io from your account email to request a change. We'll confirm the available options and any billing impact before making changes."

describe("temporary email-based plan-change wording", () => {
  it("the pricing FAQ uses the approved wording and no longer promises a move to Pro", () => {
    const s = read("app/pricing/page.tsx")
    expect(s).toContain(APPROVED)
    expect(s).toContain('q: "Can I change plans later?"')
    expect(s).not.toMatch(/we'll move you to Pro/)
  })

  it("the account page links to an email request instead of sending customers to pricing for a change", () => {
    const s = read("app/account/page.tsx")
    expect(s).toContain("Request a plan change")
    expect(s).toContain("mailto:support@supplementsnap.io")
    expect(s).not.toMatch(/"Change plan"/)
    // people with no plan still go to the plans
    expect(s).toMatch(/See plans/)
  })

  it("the checkout refusal gives the same path and limits Manage billing to what the portal does", () => {
    const s = read("app/api/create-checkout-session/route.ts")
    expect(s).toContain("Plan changes aren't available through the billing portal yet.")
    expect(s).toContain("support@supplementsnap.io")
    expect(s).toContain("Use Manage billing to update your card, view invoices or cancel.")
    expect(s).not.toMatch(/to change or cancel it/)
  })

  it("no copy claims plan switching or automatic entitlement updates", () => {
    for (const f of ["app/pricing/page.tsx", "app/account/page.tsx", "app/api/create-checkout-session/route.ts"]) {
      expect(read(f)).not.toMatch(/switch (your )?plan|automatically (update|upgrade)|upgrade instantly/i)
    }
  })
})
