import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { PLAN_INTENTS, afterAuthPath, parsePlanIntent, withPlan } from "../lib/plan-intent"

const read = (p: string) => readFileSync(p, "utf8").replace(/\r\n/g, "\n")

describe("the plan chosen before signing up", () => {
  it("accepts exactly starter, team and pro (from ?plan= or ?start=)", () => {
    for (const p of PLAN_INTENTS) {
      expect(parsePlanIntent(`?plan=${p}`)).toBe(p)
      expect(parsePlanIntent(`?start=${p}`)).toBe(p)
      expect(parsePlanIntent(`plan=${p}`)).toBe(p)
    }
  })

  it("ignores anything else, so the address cannot inject a plan or a path", () => {
    for (const bad of ["?plan=enterprise", "?plan=STARTER", "?plan=starter%0d%0a", "?plan=//evil.example", "?plan=javascript:alert(1)", "?plan=", "?other=starter", "", null, undefined]) {
      expect(parsePlanIntent(bad as string | null | undefined)).toBeNull()
    }
  })

  it("after authentication goes to the pricing page with the plan ready, otherwise the dashboard; only fixed paths are ever produced", () => {
    expect(afterAuthPath("team")).toBe("/pricing?start=team")
    expect(afterAuthPath(null)).toBe("/dashboard")
    expect(withPlan("/signup", "pro")).toBe("/signup?plan=pro")
    expect(withPlan("/login", null)).toBe("/login")
  })
})

describe("the sign-in requirement is wired through every step (source checks)", () => {
  const signup = read("app/signup/page.tsx")
  const login = read("app/login/page.tsx")
  const button = read("app/pricing/checkout-button.tsx")
  const route = read("app/api/create-checkout-session/route.ts")

  it("the server refuses a visitor with no session and an unverified email, before any Stripe call", () => {
    const afterUser = route.slice(route.indexOf("await getAuthenticatedUser(request)"))
    expect(afterUser.indexOf('code: "sign-in-required"')).toBeGreaterThan(-1)
    expect(afterUser.indexOf('code: "email-not-verified"')).toBeGreaterThan(-1)
    expect(afterUser.indexOf('code: "sign-in-required"')).toBeLessThan(afterUser.indexOf("stableCustomer("))
    expect(afterUser.indexOf('code: "email-not-verified"')).toBeLessThan(afterUser.indexOf("stableCustomer("))
    // the account comes from the verified token only, never from the request body
    expect(route).not.toMatch(/body\.(userId|email)/)
  })

  it("the button sends a signed-out visitor to sign up with the plan, and handles an unverified email", () => {
    expect(button).toMatch(/res\.status === 401/)
    expect(button).toMatch(/withPlan\("\/signup"/)
  })

  it("signup and login keep the plan through authentication, including the email-confirmation link", () => {
    for (const page of [signup, login]) {
      expect(page).toContain("parsePlanIntent(window.location.search)")
      expect(page).toMatch(/afterAuthPath\(/)
      expect(page).not.toMatch(/router\.(push|replace)\("\/dashboard"\)/)
    }
    expect(signup).toMatch(/emailRedirectTo: `\$\{window\.location\.origin\}\$\{withPlan\("\/login", currentPlan\(\)\)\}`/)
    expect(signup).toContain('withPlan("/login", currentPlan())')
    expect(login).toContain('withPlan("/signup", currentPlan())')
  })

  it("after authentication the plan is only OFFERED again: a Continue button, never an automatic checkout", () => {
    const banner = button.slice(button.indexOf("export function PlanResumeBanner"))
    expect(banner).toContain("<CheckoutButton")
    expect(banner).not.toMatch(/useEffect|handleCheckout\(\)|\.click\(\)|setTimeout/)
  })

  it("existing subscribers' billing management is untouched: the portal route and account page do not depend on the new plan intent", () => {
    expect(read("app/api/stripe/portal/route.ts")).not.toContain("plan-intent")
    expect(read("app/account/page.tsx")).not.toContain("plan-intent")
  })
})
