import { describe, it, expect } from "vitest"
import { parseDocument, compareEstimates } from "../lib/estimate-gap"

// Unit handling in the (switched-off) estimate comparison. Synthetic rows only.
const h = "Roofing estimate (SYNTHETIC)\n"
const cmp = (ins: string, con: string) => compareEstimates(parseDocument("insurer", [{ page: 1, text: h + ins }]), parseDocument("contractor", [{ page: 1, text: h + con }]))
const kinds = (r: ReturnType<typeof cmp>) => r.findings.map((f) => f.kind)

describe("units", () => {
  it("incompatible units (LF vs EA) are never reported as a quantity or price difference, and the units are named", () => {
    const r = cmp("1. Drip edge 180.00 LF 2.50 450.00", "1. Drip edge 18.00 EA 25.00 450.00")
    expect(kinds(r)).not.toContain("quantity_difference")
    expect(kinds(r)).not.toContain("unit_price_difference")
    expect(JSON.stringify(r.findings)).toMatch(/not comparable \(LF and EA\)/)
  })

  it("a row with no unit is not compared on quantity", () => {
    const r = cmp("1. Drip edge 180.00 LF 2.50 450.00", "1. Drip edge 220.00 2.50 550.00")
    expect(kinds(r)).not.toContain("quantity_difference")
  })

  it("squares and square feet are converted (1 SQ = 100 SF), and only then compared", () => {
    const same = cmp("1. Laminated - comp. shingle rfg. - w/ felt 25.00 SQ 220.00 5,500.00", "1. Laminated - comp. shingle rfg. - w/ felt 2,500.00 SF 2.20 5,500.00")
    expect(kinds(same)).not.toContain("quantity_difference")
    const diff = cmp("1. Laminated - comp. shingle rfg. - w/ felt 25.00 SQ 220.00 5,500.00", "1. Laminated - comp. shingle rfg. - w/ felt 2,800.00 SF 2.20 6,160.00")
    const q = diff.findings.find((f) => f.kind === "quantity_difference")
    if (q) expect(q.explanation).toMatch(/converted to square feet/)
    else expect(kinds(diff)).toContain("uncertain_match") // held for confirmation rather than compared
  })
})
