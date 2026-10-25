import { describe, it, expect } from "vitest"
import { calculateRoi } from "../lib/roi"

const base = { monthlyCost: 100, supplementsPerMonth: 10, extraPerSupplement: 400, helpedPercent: 50, hoursSavedPerSupplement: 1, hourlyValue: 30 }

describe("calculateRoi", () => {
  it("adds extra recovery and time value, then subtracts the cost", () => {
    const r = calculateRoi(base)
    expect(r.extraRecoveredPerMonth).toBe(2000) // 10 x 50% x 400
    expect(r.timeValuePerMonth).toBe(300) // 10 x 1 x 30
    expect(r.totalBenefitPerMonth).toBe(2300)
    expect(r.netPerMonth).toBe(2200)
  })
  it("computes how many helped supplements cover the monthly cost", () => {
    expect(calculateRoi(base).breakEvenSupplements).toBe(0.25)
    expect(calculateRoi({ ...base, extraPerSupplement: 0 }).breakEvenSupplements).toBeNull()
  })
  it("treats blanks, negatives and NaN as zero and never returns NaN", () => {
    const r = calculateRoi({ monthlyCost: NaN, supplementsPerMonth: -3, extraPerSupplement: NaN, helpedPercent: 500, hoursSavedPerSupplement: -1, hourlyValue: 0 })
    expect(r.valid).toBe(false)
    for (const v of [r.extraRecoveredPerMonth, r.timeValuePerMonth, r.totalBenefitPerMonth, r.netPerMonth]) expect(Number.isNaN(v)).toBe(false)
  })
  it("caps the helped share at 100 percent", () => {
    expect(calculateRoi({ ...base, helpedPercent: 500 }).extraRecoveredPerMonth).toBe(4000)
  })
  it("shows a loss when the benefit is smaller than the cost", () => {
    expect(calculateRoi({ ...base, supplementsPerMonth: 0 }).netPerMonth).toBe(-100)
  })
})
