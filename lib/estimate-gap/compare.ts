import { DISCLAIMERS } from "./types"
import type { ComparisonResult, CorrectionSet, Evidence, Finding, FindingCategory, Match, MatchStatus, ParsedDocument, ParsedLine } from "./types"
import { formatMoneyTt, formatQuantityMilli } from "./parse"

/**
 * Compares a parsed insurance estimate with a parsed contractor estimate.
 *
 * Rules that keep the output honest:
 *  - All arithmetic uses whole numbers (see types.ts). No language model is involved.
 *  - Two rows are only treated as the same item when their code matches or their wording is very close, their units
 *    are comparable and no scope word or number in the description disagrees. Anything weaker is an "uncertain match"
 *    that the user must confirm before any difference is treated as real.
 *  - Every finding carries the exact source rows and page numbers it came from.
 *  - Findings describe what the documents show. They never say an insurer owes money.
 */

const STOPWORDS = new Set(["the", "a", "an", "of", "and", "for", "with", "to", "per", "in", "on", "at", "or", "by", "is"])
/** Words that change the scope of the work. If these differ between two rows, the rows may not be the same work. */
const SCOPE_WORDS = new Set(["rr", "install", "only", "remove", "detach", "reset", "repair", "replace", "haul", "dispose", "labor", "material", "additional"])

function tokens(description: string): string[] {
  const text = description
    .toLowerCase()
    .replace(/r\s*&\s*r|remove\s*(?:&|and)\s*replace/g, " rr ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9/#. ]+/g, " ")
  return text
    .split(/\s+/)
    .map((t) => t.replace(/^[./#]+|[./#]+$/g, ""))
    .filter(Boolean)
    .map((t) => (t.length > 3 && t.endsWith("s") && !t.endsWith("ss") ? t.slice(0, -1) : t))
    .filter((t) => !STOPWORDS.has(t))
}

const hasDigit = (t: string) => /\d/.test(t)

function similarity(a: string[], b: string[]): number {
  const A = new Set(a), B = new Set(b)
  if (!A.size || !B.size) return 0
  let inter = 0
  for (const t of A) if (B.has(t)) inter++
  return inter / (A.size + B.size - inter)
}

const sameSet = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((x) => b.has(x))

type UnitRelation = "same" | "convertible" | "incompatible"
function unitRelation(a?: string, b?: string): UnitRelation {
  if (!a || !b) return "incompatible"
  if (a === b) return "same"
  if ((a === "SQ" && b === "SF") || (a === "SF" && b === "SQ")) return "convertible"
  return "incompatible"
}

/** Quantity in the unit both rows can share: square feet when one is in squares and one in square feet. */
function sharedQuantity(line: ParsedLine, relation: UnitRelation): number | undefined {
  if (line.quantityMilli === undefined) return undefined
  if (relation === "convertible" && line.unit === "SQ") return line.quantityMilli * 100
  return line.quantityMilli
}

const RANK: Record<MatchStatus, number> = { confirmed: 0, code: 1, likely: 2, uncertain: 3 }
const keyOf = (i: string, c: string) => `${i}|${c}`

export function matchLines(insurer: ParsedDocument, contractor: ParsedDocument, corrections: CorrectionSet = {}): Match[] {
  const confirmed = new Set((corrections.confirmedPairs || []).map(([i, c]) => keyOf(i, c)))
  const rejected = new Set((corrections.rejectedPairs || []).map(([i, c]) => keyOf(i, c)))
  const candidates: Match[] = []

  for (const i of insurer.lines) {
    const ti = tokens(i.description)
    for (const c of contractor.lines) {
      const k = keyOf(i.id, c.id)
      if (rejected.has(k)) continue
      const tc = tokens(c.description)
      const score = similarity(ti, tc)
      const rel = unitRelation(i.unit, c.unit)
      const notes: string[] = []

      const scopeI = new Set(ti.filter((t) => SCOPE_WORDS.has(t))), scopeC = new Set(tc.filter((t) => SCOPE_WORDS.has(t)))
      const numI = new Set(ti.filter(hasDigit)), numC = new Set(tc.filter(hasDigit))
      const scopeConflict = !sameSet(scopeI, scopeC)
      const numberConflict = !sameSet(numI, numC)
      if (scopeConflict) notes.push(`The wording differs on scope words (insurance: ${[...scopeI].join(", ") || "none"}; contractor: ${[...scopeC].join(", ") || "none"}).`)
      if (numberConflict) notes.push(`The descriptions contain different sizes or numbers (insurance: ${[...numI].join(", ") || "none"}; contractor: ${[...numC].join(", ") || "none"}).`)
      if (rel === "incompatible") notes.push(`The units are not comparable (${i.unit || "none"} and ${c.unit || "none"}).`)
      if (rel === "convertible") notes.push("One row is in squares and the other in square feet; 1 square is 100 square feet.")

      let status: MatchStatus | null = null
      if (confirmed.has(k)) status = "confirmed"
      else if (i.code && c.code && i.code === c.code) status = rel === "incompatible" ? "uncertain" : "code"
      else if (score >= 0.75 && rel !== "incompatible" && !scopeConflict && !numberConflict) status = "likely"
      else if (score >= 0.45) status = "uncertain"
      if (!status) continue
      if (status === "uncertain" && score < 0.75 && !notes.length) notes.push("The wording is only partly similar.")
      candidates.push({ insurerLineId: i.id, contractorLineId: c.id, status, score: Math.round(score * 100) / 100, notes })
    }
  }

  candidates.sort((a, b) => RANK[a.status] - RANK[b.status] || b.score - a.score || a.insurerLineId.localeCompare(b.insurerLineId) || a.contractorLineId.localeCompare(b.contractorLineId))
  const usedI = new Set<string>(), usedC = new Set<string>()
  const out: Match[] = []
  for (const m of candidates) {
    if (usedI.has(m.insurerLineId) || usedC.has(m.contractorLineId)) continue
    usedI.add(m.insurerLineId); usedC.add(m.contractorLineId)
    out.push(m)
  }
  return out
}

/** quantity x unit price, rounded to the nearest ten-thousandth of a dollar, using exact integer arithmetic */
export function expectedTotalTt(quantityMilli: number, unitPriceTt: number): number {
  const product = BigInt(quantityMilli) * BigInt(unitPriceTt)
  const half = product >= BigInt(0) ? BigInt(500) : BigInt(-500)
  return Number((product + half) / BigInt(1000))
}

/** Printed totals are in whole cents, so a computed total is rounded to the cent before it is compared with one */
export function roundToCentTt(tt: number): number {
  const cents = Math.floor(Math.abs(tt) / 100 + 0.5)
  return (tt < 0 ? -cents : cents) * 100
}

const evidenceOf = (l: ParsedLine): Evidence => ({ role: l.role, page: l.page, raw: l.raw, lineId: l.id })
const LABEL = { insurer: "insurance estimate", contractor: "contractor estimate" } as const

const ARITHMETIC_TOLERANCE_TT = 100 // one cent
const QUANTITY_TOLERANCE_MILLI = 10 // one hundredth of a unit
const PRICE_TOLERANCE_TT = 50 // half a cent

function arithmeticFindings(doc: ParsedDocument): Finding[] {
  const out: Finding[] = []
  for (const l of doc.lines) {
    if (l.quantityMilli === undefined || l.unitPriceTt === undefined || l.totalTt === undefined || l.amountsTt.length !== 2) continue
    const expected = roundToCentTt(expectedTotalTt(l.quantityMilli, l.unitPriceTt))
    if (Math.abs(expected - l.totalTt) <= ARITHMETIC_TOLERANCE_TT) continue
    const sure = l.confidence === "high"
    out.push({
      id: `F-arith-${l.id}`,
      kind: "arithmetic_discrepancy",
      category: sure ? "verified_arithmetic" : "needs_confirmation",
      title: `Line total does not equal quantity times unit price (${LABEL[l.role]}, page ${l.page})`,
      explanation: `On this row of the ${LABEL[l.role]}, ${formatQuantityMilli(l.quantityMilli)} ${l.unit} at ${formatMoneyTt(l.unitPriceTt)} comes to ${formatMoneyTt(expected)}, but the row shows ${formatMoneyTt(l.totalTt)}. ` +
        (sure ? "This is recomputed from the numbers printed in the same row. " : "The row was read with low certainty, so check it against the page. ") +
        "If the second amount on the row is not meant to be the line total, correct the row and the finding will update.",
      evidence: [evidenceOf(l)],
      numbers: { quantity: formatQuantityMilli(l.quantityMilli), unit: l.unit || "", unitPrice: formatMoneyTt(l.unitPriceTt), computedTotal: formatMoneyTt(expected), statedTotal: formatMoneyTt(l.totalTt), differenceTt: l.totalTt - expected },
    })
  }
  return out
}

function extractionFindings(doc: ParsedDocument): { findings: Finding[]; notes: string[] } {
  const findings: Finding[] = []
  const notes: string[] = []
  const who = LABEL[doc.role]
  if (doc.pagesWithoutText.length) {
    notes.push(`${doc.pagesWithoutText.length} of ${doc.pagesTotal} page(s) of the ${who} had no readable text (pages ${doc.pagesWithoutText.join(", ")}). They may be scanned images.`)
    findings.push({
      id: `F-nopages-${doc.role}`,
      kind: doc.pagesWithoutText.length === doc.pagesTotal ? "document_unreadable" : "extraction_gap",
      category: "not_extracted",
      title: `Pages without readable text in the ${who}`,
      explanation: `No text could be read from page(s) ${doc.pagesWithoutText.join(", ")} of the ${who}. Line items on those pages are not part of this comparison. Upload a text-based PDF, or enter those rows by hand.`,
      evidence: [],
    })
  }
  if (doc.skippedLines.length) {
    notes.push(`${doc.skippedLines.length} row(s) of the ${who} contain amounts but could not be read as line items.`)
    findings.push({
      id: `F-skipped-${doc.role}`,
      kind: "extraction_gap",
      category: "not_extracted",
      title: `${doc.skippedLines.length} row(s) in the ${who} could not be read as line items`,
      explanation: `These rows contain amounts, but no quantity and unit could be recognized, so they are not part of the comparison. The first few are shown. Add or correct them if they are real line items.`,
      evidence: doc.skippedLines.slice(0, 5).map((s) => ({ role: doc.role, page: s.page, raw: s.raw })),
    })
  }
  const low = doc.lines.filter((l) => l.confidence === "low").length
  if (low) notes.push(`${low} row(s) of the ${who} were read with low confidence.`)
  return { findings, notes }
}

export function compareEstimates(insurer: ParsedDocument, contractor: ParsedDocument, corrections: CorrectionSet = {}): ComparisonResult {
  const findings: Finding[] = []
  const reliabilityNotes: string[] = []
  const blockingReasons: string[] = []

  for (const doc of [insurer, contractor]) {
    const { findings: f, notes } = extractionFindings(doc)
    findings.push(...f)
    reliabilityNotes.push(...notes)
    if (doc.lines.length === 0) blockingReasons.push(`No line items could be read from the ${LABEL[doc.role]}.`)
  }
  findings.push(...arithmeticFindings(insurer), ...arithmeticFindings(contractor))

  const canCompare = blockingReasons.length === 0
  let matches: Match[] = []

  if (canCompare) {
    matches = matchLines(insurer, contractor, corrections)
    const byI = new Map(insurer.lines.map((l) => [l.id, l]))
    const byC = new Map(contractor.lines.map((l) => [l.id, l]))
    const matchedI = new Set(matches.map((m) => m.insurerLineId)), matchedC = new Set(matches.map((m) => m.contractorLineId))

    for (const m of matches) {
      const i = byI.get(m.insurerLineId) as ParsedLine, c = byC.get(m.contractorLineId) as ParsedLine
      const ev = [evidenceOf(i), evidenceOf(c)]

      if (m.status === "uncertain") {
        findings.push({
          id: `F-uncertain-${i.id}-${c.id}`,
          kind: "uncertain_match",
          category: "needs_confirmation",
          title: `Possible match that needs your confirmation`,
          explanation: `"${i.description}" (insurance estimate) and "${c.description}" (contractor estimate) look related (wording similarity ${Math.round(m.score * 100)}%), but they are not treated as the same item until you confirm. ${m.notes.join(" ")} No quantity or price difference is reported for this pair.`,
          evidence: ev,
          numbers: { similarityPercent: Math.round(m.score * 100) },
        })
        continue
      }

      const rel = unitRelation(i.unit, c.unit)
      if (rel === "incompatible") {
        findings.push({
          id: `F-unit-${i.id}-${c.id}`,
          kind: "unit_mismatch",
          category: "needs_confirmation",
          title: "Confirmed pair has units that cannot be compared",
          explanation: `These rows are paired, but they use different units (${i.unit || "none"} and ${c.unit || "none"}), so quantities and prices cannot be compared directly.`,
          evidence: ev,
        })
        continue
      }

      const qi = sharedQuantity(i, rel), qc = sharedQuantity(c, rel)
      const basis = rel === "convertible" ? "SF" : i.unit
      const how = m.status === "code" ? "matched by the same item code" : m.status === "confirmed" ? "confirmed by you as the same item" : `matched by very similar wording (${Math.round(m.score * 100)}%)`
      const extra = rel === "convertible" ? " Squares were converted to square feet (1 square = 100 square feet)." : ""
      if (qi !== undefined && qc !== undefined && Math.abs(qc - qi) > QUANTITY_TOLERANCE_MILLI) {
        const diff = qc - qi
        findings.push({
          id: `F-qty-${i.id}-${c.id}`,
          kind: "quantity_difference",
          category: "observed_difference",
          title: `Quantity differs: ${i.description}`,
          explanation: `These rows were ${how}. The insurance estimate lists ${formatQuantityMilli(qi)} ${basis} and the contractor estimate lists ${formatQuantityMilli(qc)} ${basis}, a difference of ${formatQuantityMilli(Math.abs(diff))} ${basis} (${diff > 0 ? "more" : "less"} on the contractor estimate).${extra} This is a directly observed difference. It does not show that either estimate is wrong.`,
          evidence: ev,
          numbers: { insurerQuantity: formatQuantityMilli(qi), contractorQuantity: formatQuantityMilli(qc), unit: basis || "", differenceMilli: diff, matchStatus: m.status },
        })
      }
      if (rel === "same" && i.unitPriceTt !== undefined && c.unitPriceTt !== undefined && Math.abs(c.unitPriceTt - i.unitPriceTt) > PRICE_TOLERANCE_TT) {
        const diff = c.unitPriceTt - i.unitPriceTt
        const totalNote = i.totalTt !== undefined && c.totalTt !== undefined ? ` The printed line totals are ${formatMoneyTt(i.totalTt)} and ${formatMoneyTt(c.totalTt)}.` : ""
        findings.push({
          id: `F-price-${i.id}-${c.id}`,
          kind: "unit_price_difference",
          category: "observed_difference",
          title: `Unit price differs: ${i.description}`,
          explanation: `These rows were ${how}. The unit price is ${formatMoneyTt(i.unitPriceTt)} per ${i.unit} on the insurance estimate and ${formatMoneyTt(c.unitPriceTt)} per ${c.unit} on the contractor estimate.${totalNote} Prices can differ because of price lists, regions, materials or labor. A difference does not show that either price is wrong.`,
          evidence: ev,
          numbers: { insurerUnitPrice: formatMoneyTt(i.unitPriceTt), contractorUnitPrice: formatMoneyTt(c.unitPriceTt), unit: i.unit || "", differenceTt: diff, matchStatus: m.status },
        })
      }
    }

    for (const c of contractor.lines) {
      if (matchedC.has(c.id)) continue
      findings.push({
        id: `F-onlyC-${c.id}`,
        kind: "line_only_on_contractor_estimate",
        category: "scope_review",
        title: `On the contractor estimate only: ${c.description}`,
        explanation: `No corresponding row was found on the insurance estimate. This may be a scope difference, a different name for the same work, or a row that was not read correctly. It is not, by itself, evidence that additional payment is owed. It needs professional review against the policy and the claim.${c.confidence === "low" ? " This row was read with low confidence." : ""}`,
        evidence: [evidenceOf(c)],
      })
    }
    for (const i of insurer.lines) {
      if (matchedI.has(i.id)) continue
      findings.push({
        id: `F-onlyI-${i.id}`,
        kind: "line_only_on_insurance_estimate",
        category: "observed_difference",
        title: `On the insurance estimate only: ${i.description}`,
        explanation: `No corresponding row was found on the contractor estimate. The work may be named differently, may be included elsewhere, or may not be part of the contractor's scope.`,
        evidence: [evidenceOf(i)],
      })
    }
  }

  const order: FindingCategory[] = ["verified_arithmetic", "observed_difference", "scope_review", "needs_confirmation", "not_extracted"]
  findings.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.id.localeCompare(b.id))
  const counts = Object.fromEntries(order.map((c) => [c, findings.filter((f) => f.category === c).length])) as Record<FindingCategory, number>

  return { canCompare, blockingReasons, matches, findings, counts, reliabilityNotes, disclaimers: DISCLAIMERS }
}
