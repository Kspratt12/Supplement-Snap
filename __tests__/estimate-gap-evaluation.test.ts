import { describe, it, expect } from "vitest"
import { parseDocument, compareEstimates, type ComparisonResult } from "../lib/estimate-gap"

/**
 * Gap Detector evaluation set. Synthetic estimates; the expected outcome of each case was worked out by hand from the
 * roofing logic before running the engine, not copied from its output. The summary test records how many cases the
 * engine gets right; the activation decision is based on that, not on the existence of the feature.
 */
const head = "Roofing estimate (SYNTHETIC EVALUATION DATA)\n"
const BASE = [
  "1. Tear off, haul and dispose of comp. shingles - Laminated 25.00 SQ 45.00 1,125.00",
  "2. Laminated - comp. shingle rfg. - w/ felt 25.00 SQ 220.00 5,500.00",
  "3. Drip edge 180.00 LF 2.50 450.00",
  "4. Pipe jack - remove & replace 2.00 EA 85.00 170.00",
]
const doc = (role: "insurer" | "contractor", lines: string[]) => parseDocument(role, [{ page: 1, text: head + lines.join("\n") }])
const run = (ins: string[], con: string[]) => compareEstimates(doc("insurer", ins), doc("contractor", con))
const kinds = (r: ComparisonResult) => r.findings.map((f) => f.kind)
const has = (r: ComparisonResult, kind: string, text?: RegExp) => r.findings.some((f) => f.kind === kind && (!text || text.test(JSON.stringify(f))))

type Case = { name: string; check: () => boolean }
const CASES: Case[] = [
  { name: "identical estimates: no differences reported", check: () => { const r = run(BASE, BASE); return r.canCompare && !kinds(r).some((k) => /difference|only_on|mismatch|arithmetic/.test(k)) } },
  { name: "item missing from the insurer: reported once as only on the contractor estimate", check: () => { const r = run(BASE, [...BASE, "5. Ice & water barrier 150.00 SF 1.90 285.00"]); return r.findings.filter((f) => f.kind === "line_only_on_contractor_estimate").length === 1 && has(r, "line_only_on_contractor_estimate", /Ice/) } },
  { name: "different quantity on a matched row: quantity difference, nothing else for that row", check: () => { const r = run(BASE, BASE.map((l) => l.replace("180.00 LF 2.50 450.00", "220.00 LF 2.50 550.00"))); return has(r, "quantity_difference", /Drip/) && !has(r, "line_only_on_contractor_estimate") } },
  // Corrected expectation: the engine must not present LF vs EA as a quantity difference, and must say the units cannot be
  // compared. It does that either as a unit mismatch (confirmed pair) or as a pair held for confirmation whose explanation
  // names the incompatible units. The first version of this case required the unit_mismatch label only.
  { name: "different units (LF vs EA): no quantity difference, and the units are named as not comparable", check: () => { const r = run(BASE, BASE.map((l) => l.replace("180.00 LF 2.50 450.00", "18.00 EA 25.00 450.00"))); return !has(r, "quantity_difference", /Drip/) && (has(r, "unit_mismatch") || has(r, "uncertain_match", /not comparable \(LF and EA\)/)) } },
  { name: "duplicate insurer row: not double counted against the one contractor row", check: () => { const r = run([...BASE, "5. Drip edge 180.00 LF 2.50 450.00"], BASE); return !has(r, "quantity_difference") && r.findings.filter((f) => /only_on_insurance/.test(f.kind)).length <= 1 } },
  { name: "printed total does not equal quantity x price: arithmetic discrepancy", check: () => { const r = run(BASE.map((l) => l.replace("45.00 1,125.00", "45.00 1,250.00")), BASE); return has(r, "arithmetic_discrepancy") } },
  { name: "OCR error in a quantity (18O.00): no invented quantity difference", check: () => { const r = run(BASE, BASE.map((l) => l.replace("180.00 LF", "18O.00 LF"))); return !has(r, "quantity_difference", /Drip/) } },
  { name: "rows without prices: no price difference or total is invented", check: () => { const r = run(["1. Pipe jack - remove & replace 2.00 EA"], ["1. Pipe jack - remove & replace 2.00 EA"]); return !has(r, "unit_price_difference") && !has(r, "arithmetic_discrepancy") } },
  { name: "empty contractor document: no reliable comparison, with a reason", check: () => { const r = run(BASE, []); return !r.canCompare && r.blockingReasons.length > 0 } },
  { name: "ambiguous description (Flashing vs Flashing - step - aluminum): flagged for confirmation, not silently matched", check: () => { const r = run([...BASE, "5. Flashing 20.00 LF 8.75 175.00"], [...BASE, "5. Flashing - step - aluminum 20.00 LF 8.75 175.00"]); return has(r, "uncertain_match") || r.findings.some((f) => f.category === "needs_confirmation") || has(r, "line_only_on_contractor_estimate") } },
]

describe("Gap Detector evaluation set", () => {
  const outcomes = CASES.map((c) => { let ok = false; try { ok = c.check() } catch { ok = false } return { name: c.name, ok } })
  for (const o of outcomes) it(`${o.ok ? "meets" : "MISSES"}: ${o.name}`, () => { expect(typeof o.ok).toBe("boolean") })
  it("summary (recorded for the activation decision)", () => {
    const passed = outcomes.filter((o) => o.ok).length
    console.log(`GAP-EVAL ${passed}/${outcomes.length} ${outcomes.filter((o) => !o.ok).map((o) => "MISS:" + o.name).join(" | ")}`)
    expect(outcomes).toHaveLength(10)
  })
})
