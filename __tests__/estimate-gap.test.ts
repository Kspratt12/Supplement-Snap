// @vitest-environment node
import { describe, it, expect } from "vitest"
import { compareEstimates, correctLine, expectedTotalTt, formatMoneyTt, parseDocument, parseMoneyTt, parseQuantityMilli } from "../lib/estimate-gap"
import type { PageText } from "../lib/estimate-gap"

/**
 * SYNTHETIC TEST DATA. Every document below was written for these tests. None comes from a real claim, and the tests
 * show the engine behaves as designed on these examples. They do not show accuracy on real-world estimates.
 */

const page = (text: string, n = 1): PageText => ({ page: n, text })

const INSURER = page(`Roofing estimate (SYNTHETIC TEST DATA)
1. Tear off, haul and dispose of comp. shingles - Laminated 25.00 SQ 45.00 1,125.00
2. Laminated - comp. shingle rfg. - w/ felt 25.00 SQ 220.00 5,500.00
3. Drip edge 180.00 LF 2.50 450.00
4. Pipe jack - remove & replace 2.00 EA 85.00 170.00
5. Flashing - step - aluminum 20.00 LF 8.75 175.00
Total 7,420.00`)

const CONTRACTOR = page(`Contractor estimate (SYNTHETIC TEST DATA)
1. Tear off, haul and dispose of comp. shingles - Laminated 27.00 SQ 45.00 1,215.00
2. Laminated - comp. shingle rfg. - w/ felt 25.00 SQ 235.00 5,875.00
3. Drip edge 180.00 LF 2.50 450.00
4. Ice & water shield 600.00 SF 1.85 1,110.00
5. Pipe jack - remove & replace 2.00 EA 85.00 170.00
6. Flashing - step - copper 22.00 LF 14.00 308.00`)

const compare = (ins: PageText[], con: PageText[], corrections = {}) =>
  compareEstimates(parseDocument("insurer", ins), parseDocument("contractor", con), corrections)

describe("money and quantity parsing", () => {
  it("reads amounts as exact whole numbers", () => {
    expect(parseMoneyTt("1,125.00")).toBe(11_250_000)
    expect(parseMoneyTt("$45")).toBe(450_000)
    expect(parseMoneyTt("(12.50)")).toBe(-125_000)
    expect(parseMoneyTt("12.3456")).toBe(123_456)
    expect(parseMoneyTt("abc")).toBeNull()
    expect(parseMoneyTt("1,12.00")).toBeNull()
  })
  it("reads quantities in thousandths and flags rounding", () => {
    expect(parseQuantityMilli("25.00")).toEqual({ milli: 25_000, rounded: false })
    expect(parseQuantityMilli("1,200.5")).toEqual({ milli: 1_200_500, rounded: false })
    expect(parseQuantityMilli("0.3333")).toEqual({ milli: 333, rounded: true })
    expect(parseQuantityMilli("x")).toBeNull()
  })
  it("multiplies exactly, without floating point drift", () => {
    expect(expectedTotalTt(25_000, 450_000)).toBe(11_250_000)
    expect(expectedTotalTt(333, 10_000)).toBe(3_330)
    expect(expectedTotalTt(900_000_000, 90_000_000)).toBe(81_000_000_000_000)
    expect(formatMoneyTt(11_250_000)).toBe("$1,125.00")
  })
})

describe("reading line items", () => {
  const doc = parseDocument("insurer", [INSURER])
  it("reads quantity, unit, unit price and total, and skips the total row", () => {
    expect(doc.lines).toHaveLength(5)
    const l = doc.lines[0]
    expect(l.quantityMilli).toBe(25_000)
    expect(l.unit).toBe("SQ")
    expect(l.unitPriceTt).toBe(450_000)
    expect(l.totalTt).toBe(11_250_000)
    expect(l.page).toBe(1)
    expect(l.raw).toContain("Tear off, haul and dispose")
  })
  it("does not treat a row with several amount columns as having a known total", () => {
    const d = parseDocument("insurer", [page("1. Shingles 25.00 SQ 220.00 5,500.00 440.00 1,100.00 7,040.00")])
    expect(d.lines[0].unitPriceTt).toBe(2_200_000)
    expect(d.lines[0].totalTt).toBeUndefined()
    expect(d.lines[0].issues.join(" ")).toMatch(/several amount columns/)
  })
  it("marks a row with one amount as unclear instead of guessing", () => {
    const d = parseDocument("insurer", [page("Miscellaneous item 1.00 EA 50.00")])
    expect(d.lines[0].unitPriceTt).toBeUndefined()
    expect(d.lines[0].totalTt).toBeUndefined()
    expect(d.lines[0].confidence).toBe("medium")
  })
  it("lists rows with amounts but no unit as skipped", () => {
    const d = parseDocument("insurer", [page("Drip edge 180 2.50 450.00")])
    expect(d.lines).toHaveLength(0)
    expect(d.skippedLines).toHaveLength(1)
  })
  it("reads a code only when the row clearly shows one", () => {
    const d = parseDocument("insurer", [page("RFG DRIP - Drip edge 180.00 LF 2.50 450.00"), page("Drip edge 180.00 LF 2.50 450.00", 2)])
    expect(d.lines[0].code).toBe("RFG DRIP")
    expect(d.lines[1].code).toBeUndefined()
  })
})

describe("comparing two estimates", () => {
  const result = compare([INSURER], [CONTRACTOR])
  const kinds = result.findings.map((f) => f.kind)

  it("reports a quantity difference with both source rows and the page", () => {
    const f = result.findings.find((x) => x.kind === "quantity_difference")!
    expect(f.category).toBe("observed_difference")
    expect(f.numbers).toMatchObject({ insurerQuantity: "25", contractorQuantity: "27", differenceMilli: 2000 })
    expect(f.evidence.map((e) => e.role).sort()).toEqual(["contractor", "insurer"])
    expect(f.evidence.every((e) => e.page === 1)).toBe(true)
  })
  it("reports a unit price difference and does not report identical rows", () => {
    const price = result.findings.filter((x) => x.kind === "unit_price_difference")
    expect(price).toHaveLength(1)
    expect(price[0].numbers).toMatchObject({ insurerUnitPrice: "$220.00", contractorUnitPrice: "$235.00" })
    expect(result.findings.some((f) => f.evidence.some((e) => e.raw.includes("Drip edge")))).toBe(false)
  })
  it("treats a row found only on the contractor estimate as scope to review, not as money owed", () => {
    const f = result.findings.find((x) => x.kind === "line_only_on_contractor_estimate")!
    expect(f.category).toBe("scope_review")
    expect(f.evidence[0].raw).toContain("Ice & water shield")
    expect(f.explanation).toMatch(/not, by itself, evidence/)
  })
  it("does not pair similar rows with different materials as the same item", () => {
    const f = result.findings.find((x) => x.kind === "uncertain_match")!
    expect(f.category).toBe("needs_confirmation")
    expect(f.explanation).toMatch(/not treated as the same item until you confirm/)
    // no quantity or price difference is asserted for the uncertain pair
    expect(kinds.filter((k) => k === "quantity_difference")).toHaveLength(1)
  })
  it("includes the standard disclaimers and makes no guarantee", () => {
    expect(result.disclaimers.join(" ")).toMatch(/Nothing here guarantees/)
    expect(JSON.stringify(result.findings)).not.toMatch(/guarantee|underpaid|owes you/i)
  })
  it("quotes only text that is in the source documents", () => {
    for (const f of result.findings) for (const e of f.evidence) {
      const src = e.role === "insurer" ? INSURER.text : CONTRACTOR.text
      expect(src).toContain(e.raw)
    }
  })
  it("gives the same answer every time", () => {
    expect(JSON.stringify(compare([INSURER], [CONTRACTOR]))).toBe(JSON.stringify(result))
  })
})

describe("user corrections to matches", () => {
  const base = compare([INSURER], [CONTRACTOR])
  const um = base.findings.find((f) => f.kind === "uncertain_match")!
  const pair: [string, string] = [um.evidence[0].lineId!, um.evidence[1].lineId!]

  it("reports real differences once the user confirms a pair", () => {
    const r = compare([INSURER], [CONTRACTOR], { confirmedPairs: [pair] })
    expect(r.findings.some((f) => f.kind === "uncertain_match")).toBe(false)
    const q = r.findings.filter((f) => f.kind === "quantity_difference")
    expect(q).toHaveLength(2)
    expect(r.findings.filter((f) => f.kind === "unit_price_difference")).toHaveLength(2)
    expect(r.matches.find((m) => m.insurerLineId === pair[0])!.status).toBe("confirmed")
  })
  it("leaves both rows unpaired when the user rejects the pair", () => {
    const r = compare([INSURER], [CONTRACTOR], { rejectedPairs: [pair] })
    expect(r.matches.some((m) => m.insurerLineId === pair[0])).toBe(false)
    expect(r.findings.some((f) => f.kind === "line_only_on_insurance_estimate" && f.evidence[0].lineId === pair[0])).toBe(true)
    expect(r.findings.some((f) => f.kind === "line_only_on_contractor_estimate" && f.evidence[0].lineId === pair[1])).toBe(true)
  })
})

describe("units", () => {
  it("converts squares to square feet and compares quantities, but not prices", () => {
    const r = compare(
      [page("Underlayment - synthetic 25.00 SQ 30.00 750.00")],
      [page("Underlayment - synthetic 2,600.00 SF 0.30 780.00")]
    )
    const q = r.findings.find((f) => f.kind === "quantity_difference")!
    expect(q.numbers).toMatchObject({ insurerQuantity: "2500", contractorQuantity: "2600", unit: "SF" })
    expect(q.explanation).toMatch(/1 square = 100 square feet/)
    expect(r.findings.some((f) => f.kind === "unit_price_difference")).toBe(false)
  })
  it("does not compare rows whose units cannot be converted", () => {
    const r = compare([page("Gutter apron 100.00 LF 4.00 400.00")], [page("Gutter apron 100.00 SF 4.00 400.00")])
    expect(r.findings.some((f) => f.kind === "quantity_difference" || f.kind === "unit_price_difference")).toBe(false)
    expect(r.findings.some((f) => f.kind === "uncertain_match")).toBe(true)
  })
})

describe("arithmetic", () => {
  it("flags a total that does not equal quantity times unit price as verified arithmetic", () => {
    const r = compare([INSURER], [page("Ridge cap - synthetic 90.00 LF 6.00 640.00")])
    const f = r.findings.find((x) => x.kind === "arithmetic_discrepancy")!
    expect(f.category).toBe("verified_arithmetic")
    expect(f.numbers).toMatchObject({ computedTotal: "$540.00", statedTotal: "$640.00" })
    expect(f.evidence[0].role).toBe("contractor")
  })
  it("allows a one-cent rounding difference", () => {
    const r = compare([INSURER], [page("Shingle starter - synthetic 33.33 LF 1.234 41.13")])
    expect(r.findings.some((f) => f.kind === "arithmetic_discrepancy")).toBe(false)
  })
  it("is cleared when the user corrects the row", () => {
    const con = parseDocument("contractor", [page("Ridge cap - synthetic 90.00 LF 6.00 640.00")])
    const ins = parseDocument("insurer", [INSURER])
    const fixed = correctLine(con, con.lines[0].id, { total: "540.00" })
    expect(fixed.errors).toEqual([])
    expect(fixed.doc.lines[0].raw).toBe(con.lines[0].raw)
    expect(fixed.doc.lines[0].correctedByUser).toBe(true)
    expect(compareEstimates(ins, fixed.doc).findings.some((f) => f.kind === "arithmetic_discrepancy")).toBe(false)
  })
})

describe("documents that cannot be read reliably", () => {
  it("refuses to compare when a document has no readable text, and says so", () => {
    const r = compare([page("", 1), page("", 2)], [CONTRACTOR])
    expect(r.canCompare).toBe(false)
    expect(r.blockingReasons.join(" ")).toMatch(/insurance estimate/)
    expect(r.findings.some((f) => f.kind === "document_unreadable")).toBe(true)
    expect(r.matches).toHaveLength(0)
  })
  it("compares what it can and reports pages without text", () => {
    const r = compare([INSURER, page("", 2)], [CONTRACTOR])
    expect(r.canCompare).toBe(true)
    const f = r.findings.find((x) => x.kind === "extraction_gap" && x.id.startsWith("F-nopages"))!
    expect(f.category).toBe("not_extracted")
    expect(f.explanation).toMatch(/page\(s\) 2/)
    expect(r.reliabilityNotes.join(" ")).toMatch(/1 of 2 page/)
  })
  it("reports unreadable rows instead of dropping them silently", () => {
    const r = compare([page(`${INSURER.text}\nWeird row 180 2.50 450.00`)], [CONTRACTOR])
    const f = r.findings.find((x) => x.id === "F-skipped-insurer")!
    expect(f.evidence[0].raw).toContain("Weird row")
  })
})

describe("correcting extraction errors", () => {
  const doc = parseDocument("insurer", [INSURER])
  it("rejects values that cannot be parsed and leaves the document unchanged", () => {
    const r = correctLine(doc, doc.lines[0].id, { quantity: "lots", unit: "FURLONG", unitPrice: "cheap" })
    expect(r.errors.length).toBe(3)
    expect(r.doc).toBe(doc)
  })
  it("reports an unknown row", () => {
    expect(correctLine(doc, "nope", { description: "x" }).errors[0]).toMatch(/not found/)
  })
})

describe("layouts closer to real estimates (SYNTHETIC)", () => {
  const XACT = `Dwelling Roof
DESCRIPTION QUANTITY UNIT PRICE TAX O&P RCV DEPREC. ACV
1. Tear off, haul and dispose of comp. shingles - Laminated 25.00 SQ 45.27 0.00 226.35 1,357.80 (0.00) 1,357.80
4. Roofing felt - 15 lb.
 25.00 SQ 28.40 4.12 142.00 856.12 (0.00) 856.12
Totals: Dwelling Roof 2,213.92`
  const CON = `Remove existing shingles and haul away 25 sq $48.00 $1,200.00
Underlayment - 15 lb felt 25 sq $31.00 $775.00
Deck repair allowance 4 sheets $85.00 $340.00`

  it("reads a description that wrapped onto its own line, shows both lines as evidence, and marks it for checking", () => {
    const d = parseDocument("insurer", [{ page: 1, text: XACT }])
    const felt = d.lines.find((l) => l.description.startsWith("Roofing felt"))!
    expect(felt.quantityMilli).toBe(25_000)
    expect(felt.raw).toBe("4. Roofing felt - 15 lb.\n25.00 SQ 28.40 4.12 142.00 856.12 (0.00) 856.12")
    expect(felt.confidence).toBe("medium")
    expect(felt.issues.join(" ")).toMatch(/taken from the line above/)
  })
  it("does not read a total or heading row as an item", () => {
    const d = parseDocument("insurer", [{ page: 1, text: XACT }])
    expect(d.lines).toHaveLength(2)
  })
  it("understands 'sheets' and 'each' as units", () => {
    const d = parseDocument("contractor", [{ page: 1, text: CON + "\nPipe boot 3 each $70.00 $210.00" }])
    expect(d.lines.map((l) => l.unit)).toEqual(["SQ", "SQ", "SHT", "EA"])
    expect(d.skippedLines).toHaveLength(0)
  })
  it("LIMITATION: rows worded very differently are not matched automatically, so they appear as one-sided rows until the reader pairs them", () => {
    const ins = parseDocument("insurer", [{ page: 1, text: XACT }])
    const con = parseDocument("contractor", [{ page: 1, text: CON }])
    const auto = compareEstimates(ins, con)
    expect(auto.findings.some((f) => f.kind === "line_only_on_contractor_estimate" && f.evidence[0].raw.includes("Remove existing shingles"))).toBe(true)
    expect(auto.findings.some((f) => f.kind === "quantity_difference" || f.kind === "unit_price_difference")).toBe(false)
    // the reader pairs the tear-off rows by hand: now the real price difference shows, with both rows as evidence
    const pair: [string, string] = [ins.lines[0].id, con.lines[0].id]
    const paired = compareEstimates(ins, con, { confirmedPairs: [pair] })
    const price = paired.findings.find((f) => f.kind === "unit_price_difference")!
    expect(price.numbers).toMatchObject({ insurerUnitPrice: "$45.27", contractorUnitPrice: "$48.00", matchStatus: "confirmed" })
  })
  it("rows with several amount columns are compared on quantity and unit price, and their arithmetic is not checked", () => {
    const ins = parseDocument("insurer", [{ page: 1, text: XACT }])
    const con = parseDocument("contractor", [{ page: 1, text: CON }])
    const r = compareEstimates(ins, con, { confirmedPairs: [[ins.lines[0].id, con.lines[0].id]] })
    expect(r.findings.some((f) => f.kind === "arithmetic_discrepancy")).toBe(false)
  })
})
