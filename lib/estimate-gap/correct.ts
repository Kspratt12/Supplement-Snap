import { KNOWN_UNITS, parseMoneyTt, parseQuantityMilli } from "./parse"
import type { ParsedDocument } from "./types"

export type LineCorrection = {
  description?: string
  code?: string
  quantity?: string
  unit?: string
  unitPrice?: string
  total?: string
}

/**
 * Applies a person's correction to one extracted row and returns a new document.
 * The original source text (raw) is kept so evidence still shows exactly what the document said.
 * Anything that cannot be parsed is rejected with a clear message and the document is left unchanged.
 */
export function correctLine(doc: ParsedDocument, lineId: string, patch: LineCorrection): { doc: ParsedDocument; errors: string[] } {
  const errors: string[] = []
  const idx = doc.lines.findIndex((l) => l.id === lineId)
  if (idx < 0) return { doc, errors: ["That row was not found."] }
  const line = { ...doc.lines[idx] }

  if (patch.description !== undefined) {
    const d = patch.description.trim()
    if (d.length < 3) errors.push("The description is too short.")
    else line.description = d
  }
  if (patch.code !== undefined) {
    const c = patch.code.trim().toUpperCase()
    if (c) line.code = c
    else delete line.code
  }
  if (patch.quantity !== undefined) {
    const q = parseQuantityMilli(patch.quantity)
    if (!q) errors.push("The quantity is not a number.")
    else line.quantityMilli = q.milli
  }
  if (patch.unit !== undefined) {
    const u = patch.unit.trim().toUpperCase()
    if (!KNOWN_UNITS.includes(u)) errors.push(`The unit must be one of: ${KNOWN_UNITS.join(", ")}.`)
    else line.unit = u
  }
  let price = line.unitPriceTt, total = line.totalTt
  if (patch.unitPrice !== undefined) {
    const p = parseMoneyTt(patch.unitPrice)
    if (p === null) errors.push("The unit price is not an amount.")
    else price = p
  }
  if (patch.total !== undefined) {
    const t = patch.total.trim() === "" ? undefined : parseMoneyTt(patch.total)
    if (t === null) errors.push("The total is not an amount.")
    else total = t
  }
  if (errors.length) return { doc, errors }

  line.unitPriceTt = price
  line.totalTt = total
  line.amountsTt = [price, total].filter((v): v is number => v !== undefined)
  line.confidence = "high"
  line.issues = []
  line.correctedByUser = true

  const lines = doc.lines.slice()
  lines[idx] = line
  return { doc: { ...doc, lines }, errors: [] }
}
