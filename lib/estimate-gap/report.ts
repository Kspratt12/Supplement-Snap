import { jsPDF } from "jspdf"
import type { ComparisonResult, Finding, FindingCategory, ParsedDocument } from "./types"

/**
 * Builds the comparison report as a PDF. It only restates what the comparison found: every finding is printed with the
 * rows it came from and their page numbers, in the same category the screen shows. It adds no new conclusions.
 */

const CATEGORY_TITLES: Record<FindingCategory, { title: string; note: string }> = {
  verified_arithmetic: { title: "Verified arithmetic discrepancies", note: "Recomputed from numbers printed in the same row of one document." },
  observed_difference: { title: "Directly observed differences between matched rows", note: "A difference in what the two documents say. It does not show that either estimate is wrong." },
  scope_review: { title: "Possible scope differences needing professional review", note: "Rows with no match in the other document. Not evidence that anything is owed." },
  needs_confirmation: { title: "Uncertain matches and items needing confirmation", note: "No difference is reported until the match is confirmed." },
  not_extracted: { title: "Items that could not be reliably read", note: "These rows or pages are not part of the comparison." },
}
const ORDER: FindingCategory[] = ["verified_arithmetic", "observed_difference", "scope_review", "needs_confirmation", "not_extracted"]
const WHO = { insurer: "Insurance estimate", contractor: "Contractor estimate" } as const

export type ReportOptions = {
  title?: string
  /** How many rows the person corrected by hand before the comparison, so the report can say so */
  correctedRows?: number
  confirmedPairs?: number
  rejectedPairs?: number
  generatedOn?: Date
}

export function buildReportPdf(result: ComparisonResult, docs: { insurer: ParsedDocument; contractor: ParsedDocument }, opts: ReportOptions = {}): jsPDF {
  const pdf = new jsPDF({ unit: "pt", format: "letter" })
  const W = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight()
  const M = 48, textW = W - M * 2
  let y = M

  const ensure = (need: number) => { if (y + need > H - M) { pdf.addPage(); y = M } }
  const para = (text: string, size = 10, style: "normal" | "bold" | "italic" = "normal", gap = 4, indent = 0) => {
    pdf.setFont("helvetica", style); pdf.setFontSize(size)
    for (const line of pdf.splitTextToSize(text, textW - indent) as string[]) { ensure(size + 3); pdf.text(line, M + indent, y); y += size + 3 }
    y += gap
  }

  para(opts.title || "Insurance Estimate Comparison", 18, "bold", 2)
  para(`Prepared ${(opts.generatedOn || new Date()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 9, "normal", 8)
  para("Read this first", 11, "bold", 2)
  for (const d of result.disclaimers) para(d, 9, "normal", 3)

  y += 6
  para("Documents compared", 11, "bold", 2)
  for (const role of ["insurer", "contractor"] as const) {
    const d = docs[role]
    para(`${WHO[role]}: ${d.lines.length} line item(s) read from ${d.pagesTotal} page(s).`, 9, "normal", 1)
  }
  const edits: string[] = []
  if (opts.correctedRows) edits.push(`${opts.correctedRows} row(s) corrected by hand`)
  if (opts.confirmedPairs) edits.push(`${opts.confirmedPairs} match(es) confirmed by the reader`)
  if (opts.rejectedPairs) edits.push(`${opts.rejectedPairs} match(es) rejected by the reader`)
  if (edits.length) para(`Changes made by the person who prepared this comparison: ${edits.join("; ")}.`, 9, "italic", 4)

  if (!result.canCompare) {
    para("A reliable comparison could not be made", 12, "bold", 2)
    for (const r of result.blockingReasons) para(r, 10, "normal", 2, 8)
  }
  if (result.reliabilityNotes.length) {
    para("Document quality notes", 11, "bold", 2)
    for (const n of result.reliabilityNotes) para(`- ${n}`, 9, "normal", 2, 6)
  }

  para("Summary", 11, "bold", 2)
  for (const c of ORDER) para(`${CATEGORY_TITLES[c].title}: ${result.counts[c]}`, 9, "normal", 1)
  y += 8

  for (const c of ORDER) {
    const list: Finding[] = result.findings.filter((f) => f.category === c)
    if (!list.length) continue
    ensure(40)
    para(CATEGORY_TITLES[c].title, 13, "bold", 1)
    para(CATEGORY_TITLES[c].note, 9, "italic", 6)
    list.forEach((f, i) => {
      para(`${i + 1}. ${f.title}`, 10, "bold", 2)
      para(f.explanation, 9, "normal", 2, 10)
      for (const e of f.evidence) para(`${WHO[e.role]}, page ${e.page}: ${e.raw}`, 8, "normal", 1, 10)
      y += 6
    })
    y += 4
  }

  // Page numbers
  const pages = pdf.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p); pdf.setFont("helvetica", "normal"); pdf.setFontSize(8)
    pdf.text(`Page ${p} of ${pages}. Observations from two uploaded documents; not a coverage opinion or legal advice.`, M, H - 24)
  }
  return pdf
}
