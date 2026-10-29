// @vitest-environment node
import { describe, it, expect } from "vitest"
import { buildReportPdf } from "../lib/estimate-gap/report"
import { extractPdfPages } from "../lib/estimate-gap/extract"
import { parseDocument, compareEstimates } from "../lib/estimate-gap"

// SYNTHETIC TEST DATA
const INS = `1. Drip edge 180.00 LF 2.50 450.00
2. Pipe jack - remove & replace 2.00 EA 85.00 170.00
3. Flashing - step - aluminum 20.00 LF 8.75 175.00`
const CON = `1. Drip edge 200.00 LF 2.50 500.00
2. Ice and water shield 600.00 SF 1.85 1,110.00
3. Flashing - step - copper 22.00 LF 14.00 308.00
4. Ridge cap - synthetic 90.00 LF 6.00 640.00`

async function reportText(opts = {}) {
  const ins = parseDocument("insurer", [{ page: 1, text: INS }])
  const con = parseDocument("contractor", [{ page: 1, text: CON }])
  const pdf = buildReportPdf(compareEstimates(ins, con), { insurer: ins, contractor: con }, { generatedOn: new Date("2026-10-29"), ...opts })
  const bytes = new Uint8Array(pdf.output("arraybuffer"))
  const { pages } = await extractPdfPages(bytes)
  return { text: pages.map((p) => p.text).join("\n"), pages: pages.length, bytes }
}

describe("the comparison report PDF", () => {
  it("is a real PDF that can be read back", async () => {
    const { bytes, pages } = await reportText()
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-")
    expect(pages).toBeGreaterThanOrEqual(1)
  })
  it("starts with the disclaimers and states that nothing is guaranteed", async () => {
    const { text } = await reportText()
    expect(text).toMatch(/Read this first/)
    expect(text).toMatch(/not a coverage opinion/)
    expect(text).toMatch(/Nothing here guarantees approval, payment/)
  })
  it("prints each finding with the source row and page it came from", async () => {
    const { text } = await reportText()
    const flat = text.replace(/\s+/g, " ")
    expect(flat).toMatch(/Quantity differs: Drip edge/)
    expect(flat).toContain("Insurance estimate, page 1: 1. Drip edge 180.00 LF 2.50 450.00")
    expect(flat).toContain("Contractor estimate, page 1: 1. Drip edge 200.00 LF 2.50 500.00")
    expect(flat).toMatch(/Verified arithmetic discrepancies/)
    expect(flat).toContain("Ridge cap - synthetic 90.00 LF 6.00 640.00")
    expect(flat).toMatch(/\$540\.00/)
  })
  it("keeps the categories separate so an uncertain match is not presented as a fact", async () => {
    const { text } = await reportText()
    const flat = text.replace(/\s+/g, " ")
    expect(flat).toMatch(/Uncertain matches and items needing confirmation/)
    expect(flat).toMatch(/not treated as the same item until you confirm/)
    expect(flat).toMatch(/Possible scope differences needing professional review/)
    expect(flat).not.toMatch(/owes you|underpaid|guaranteed/i)
  })
  it("says so when the person corrected rows or decided matches by hand", async () => {
    const { text } = await reportText({ correctedRows: 2, confirmedPairs: 1, rejectedPairs: 1 })
    expect(text.replace(/\s+/g, " ")).toMatch(/2 row\(s\) corrected by hand; 1 match\(es\) confirmed by the reader; 1 match\(es\) rejected by the reader/)
  })
  it("says plainly when a reliable comparison was not possible", async () => {
    const ins = parseDocument("insurer", [{ page: 1, text: "" }])
    const con = parseDocument("contractor", [{ page: 1, text: CON }])
    const pdf = buildReportPdf(compareEstimates(ins, con), { insurer: ins, contractor: con })
    const { pages } = await extractPdfPages(new Uint8Array(pdf.output("arraybuffer")))
    const flat = pages.map((p) => p.text).join(" ").replace(/\s+/g, " ")
    expect(flat).toMatch(/A reliable comparison could not be made/)
    expect(flat).toMatch(/No line items could be read from the insurance estimate/)
  })
  it("runs onto extra pages for a long list without cutting anything off", async () => {
    const many = Array.from({ length: 60 }, (_, i) => `${i + 1}. Item number ${i} synthetic ${i + 1}.00 EA 10.00 ${(i + 1) * 10}.00`).join("\n")
    const ins = parseDocument("insurer", [{ page: 1, text: "1. Something else 1.00 EA 1.00 1.00" }])
    const con = parseDocument("contractor", [{ page: 1, text: many }])
    const pdf = buildReportPdf(compareEstimates(ins, con), { insurer: ins, contractor: con })
    const { pages } = await extractPdfPages(new Uint8Array(pdf.output("arraybuffer")))
    expect(pages.length).toBeGreaterThan(2)
    const flat = pages.map((p) => p.text).join(" ")
    expect(flat).toContain("Item number 59 synthetic")
    expect(flat).toMatch(/Page 1 of /)
  })
})
