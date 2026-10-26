import { describe, it, expect } from "vitest"
import { hasActiveSubscription } from "../lib/auth-context"

describe("hasActiveSubscription (what the app screens use)", () => {
  it("is true for active, trialing and past due (retrying) subscriptions", () => {
    expect(hasActiveSubscription("active")).toBe(true)
    expect(hasActiveSubscription("trialing")).toBe(true)
    expect(hasActiveSubscription("past_due")).toBe(true)
  })
  it("is false once a plan is cancelled or was never paid", () => {
    expect(hasActiveSubscription("canceled")).toBe(false)
    expect(hasActiveSubscription("inactive")).toBe(false)
  })
})
