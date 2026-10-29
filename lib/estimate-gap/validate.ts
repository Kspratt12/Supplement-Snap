import type { CorrectionSet, DocumentRole, ParsedDocument, ParsedLine } from "./types"

/**
 * Checks data sent by the browser before the comparison runs on it. The browser is not trusted: a document that
 * is the wrong shape, too large, or has impossible numbers is rejected rather than half-used.
 */

export const MAX_LINES = 3000
const MAX_TEXT = 600

const isStr = (v: unknown, max = MAX_TEXT): v is string => typeof v === "string" && v.length <= max
const isInt = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v)
const optInt = (v: unknown) => v === undefined || isInt(v)

function validLine(l: unknown, role: DocumentRole): l is ParsedLine {
  if (!l || typeof l !== "object") return false
  const x = l as Record<string, unknown>
  return (
    isStr(x.id, 60) && x.role === role && isInt(x.page) && x.page >= 1 && x.page <= 1000 &&
    isStr(x.raw) && isStr(x.description) &&
    (x.code === undefined || isStr(x.code, 40)) &&
    optInt(x.quantityMilli) && (x.unit === undefined || isStr(x.unit, 6)) && optInt(x.unitPriceTt) && optInt(x.totalTt) &&
    Array.isArray(x.amountsTt) && x.amountsTt.length <= 20 && x.amountsTt.every(isInt) &&
    (x.confidence === "high" || x.confidence === "medium" || x.confidence === "low") &&
    Array.isArray(x.issues) && x.issues.length <= 20 && x.issues.every((i) => isStr(i))
  )
}

export function validateDocument(value: unknown, role: DocumentRole): ParsedDocument | null {
  if (!value || typeof value !== "object") return null
  const d = value as Record<string, unknown>
  if (d.role !== role || !Array.isArray(d.lines) || d.lines.length > MAX_LINES) return null
  if (!d.lines.every((l) => validLine(l, role))) return null
  const ids = new Set(d.lines.map((l: ParsedLine) => l.id))
  if (ids.size !== d.lines.length) return null
  if (!Array.isArray(d.skippedLines) || d.skippedLines.length > MAX_LINES) return null
  if (!d.skippedLines.every((s: unknown) => !!s && typeof s === "object" && isInt((s as { page: unknown }).page) && isStr((s as { raw: unknown }).raw) && isStr((s as { reason: unknown }).reason))) return null
  if (!isInt(d.pagesTotal) || d.pagesTotal < 0 || d.pagesTotal > 1000) return null
  if (!Array.isArray(d.pagesWithoutText) || d.pagesWithoutText.length > 1000 || !d.pagesWithoutText.every(isInt)) return null
  return {
    role,
    lines: d.lines as ParsedLine[],
    skippedLines: d.skippedLines as ParsedDocument["skippedLines"],
    pagesTotal: d.pagesTotal,
    pagesWithoutText: d.pagesWithoutText as number[],
  }
}

export function validateCorrections(value: unknown): CorrectionSet | null {
  if (value === undefined || value === null) return {}
  if (typeof value !== "object") return null
  const v = value as Record<string, unknown>
  const pairs = (p: unknown): Array<[string, string]> | null => {
    if (p === undefined) return []
    if (!Array.isArray(p) || p.length > 5000) return null
    if (!p.every((x) => Array.isArray(x) && x.length === 2 && isStr(x[0], 60) && isStr(x[1], 60))) return null
    return p as Array<[string, string]>
  }
  const confirmedPairs = pairs(v.confirmedPairs), rejectedPairs = pairs(v.rejectedPairs)
  if (!confirmedPairs || !rejectedPairs) return null
  return { confirmedPairs, rejectedPairs }
}
