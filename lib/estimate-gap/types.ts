/**
 * Types for the Insurance Estimate Gap Detector engine.
 *
 * Money is stored as an integer count of ten-thousandths of a dollar ("tt"), so $1,125.00 is 11_250_000.
 * Quantities are stored as an integer count of thousandths ("milli"), so 25.00 is 25_000.
 * Whole numbers keep the arithmetic exact; no floating point is used for money.
 */

export type DocumentRole = "insurer" | "contractor"

/** The text of one page, as produced by a PDF text extractor. An empty string means no text was found on that page. */
export type PageText = { page: number; text: string }

export type LineConfidence = "high" | "medium" | "low"

export type ParsedLine = {
  /** Stable id inside one document, for example "I-p2-l14" */
  id: string
  role: DocumentRole
  /** 1-based page number from the source document */
  page: number
  /** The exact source text of the row. Never edited. */
  raw: string
  /** Optional code, only when the row clearly shows one (for example "RFG DRIP - ") */
  code?: string
  description: string
  quantityMilli?: number
  /** Upper-case unit as written (SQ, SF, LF, EA ...) */
  unit?: string
  unitPriceTt?: number
  /** A line total, only when the row has exactly one unit price and one total after the unit */
  totalTt?: number
  /** All money amounts found after the unit, in order, for rows with more than two columns */
  amountsTt: number[]
  confidence: LineConfidence
  /** Plain-language notes about anything unclear in this row */
  issues: string[]
  /** True when the user fixed this row by hand */
  correctedByUser?: boolean
}

export type SkippedLine = { page: number; raw: string; reason: string }

export type ParsedDocument = {
  role: DocumentRole
  lines: ParsedLine[]
  /** Rows that contain amounts but could not be read as a line item */
  skippedLines: SkippedLine[]
  pagesTotal: number
  /** Pages with no extractable text, usually scans or images */
  pagesWithoutText: number[]
}

export type MatchStatus =
  /** Same code and a compatible unit */
  | "code"
  /** Very similar wording and a compatible unit, with no scope-word conflict */
  | "likely"
  /** Looks related but something differs; the user must confirm before any difference is treated as real */
  | "uncertain"
  /** The user confirmed this pair */
  | "confirmed"

export type Match = {
  insurerLineId: string
  contractorLineId: string
  status: MatchStatus
  /** Wording similarity from 0 to 1 */
  score: number
  notes: string[]
}

export type FindingKind =
  | "arithmetic_discrepancy"
  | "quantity_difference"
  | "unit_price_difference"
  | "unit_mismatch"
  | "line_only_on_contractor_estimate"
  | "line_only_on_insurance_estimate"
  | "uncertain_match"
  | "extraction_gap"
  | "document_unreadable"

/**
 * How much weight a finding deserves.
 *  verified_arithmetic: recomputed from numbers printed in the same row
 *  observed_difference: a directly observed difference between two matched rows
 *  scope_review: may be a scope difference and needs professional review
 *  needs_confirmation: depends on a match the user has not confirmed
 *  not_extracted: the document could not be read reliably here
 */
export type FindingCategory = "verified_arithmetic" | "observed_difference" | "scope_review" | "needs_confirmation" | "not_extracted"

export type Evidence = {
  role: DocumentRole
  page: number
  /** Exact source text of the row */
  raw: string
  lineId?: string
}

export type Finding = {
  id: string
  kind: FindingKind
  category: FindingCategory
  title: string
  /** Why this was flagged, in plain words */
  explanation: string
  evidence: Evidence[]
  /** Numbers the finding is based on, all computed deterministically */
  numbers?: Record<string, number | string>
}

export type CorrectionSet = {
  /** Pairs the user confirmed as the same item: [insurerLineId, contractorLineId] */
  confirmedPairs?: Array<[string, string]>
  /** Pairs the user said are not the same item */
  rejectedPairs?: Array<[string, string]>
}

export type ComparisonResult = {
  canCompare: boolean
  /** Reasons a reliable comparison is not possible, if any */
  blockingReasons: string[]
  matches: Match[]
  findings: Finding[]
  counts: Record<FindingCategory, number>
  /** Notes about document quality that affect how far the results can be trusted */
  reliabilityNotes: string[]
  disclaimers: string[]
}

export const DISCLAIMERS: string[] = [
  "This comparison is a set of observations drawn from the two documents you uploaded. It is not a coverage opinion, legal advice, or an adjusting or engineering opinion.",
  "A line that appears on one estimate and not the other does not mean the insurer owes additional payment. A price or quantity difference does not mean either estimate is wrong.",
  "Coverage depends on the policy, the claim and the carrier. Nothing here guarantees approval, payment, or a higher recovery.",
  "Text was read from the documents automatically and can contain mistakes. Check every finding against the original document page before relying on it.",
]
