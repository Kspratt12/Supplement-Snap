import type { DocumentRole, PageText, ParsedDocument, ParsedLine, SkippedLine } from "./types"

/**
 * Turns extracted page text into line items.
 *
 * It reads rows in the common estimate layout: description, quantity, unit, then one or more amounts.
 * It is deliberately strict. A row it is not sure about is either marked low confidence or listed as skipped.
 * It never invents a value: every number comes from the source row.
 */

export const KNOWN_UNITS = ["SQ", "SF", "LF", "EA", "HR", "SY", "LS", "CF", "CY", "DA", "DAY", "MO", "GAL", "TON", "SHT", "BDL", "RL", "PR", "LB"]

/** Whole decimal text to a scaled integer without floating point. Returns null if it is not a plain decimal. */
function scaled(text: string, decimals: number): { value: number; rounded: boolean } | null {
  const m = text.trim().match(/^(-?)(\d*)(?:\.(\d+))?$/)
  if (!m || (m[2] === "" && !m[3])) return null
  const sign = m[1] ? -1 : 1
  const whole = m[2] || "0"
  let frac = m[3] || ""
  let rounded = false
  if (frac.length > decimals) {
    rounded = /[1-9]/.test(frac.slice(decimals))
    frac = frac.slice(0, decimals)
  }
  frac = frac.padEnd(decimals, "0")
  const value = sign * (Number(whole) * 10 ** decimals + Number(frac || "0"))
  return Number.isSafeInteger(value) ? { value, rounded } : null
}

/** "1,125.00", "$45", "(12.50)" -> ten-thousandths of a dollar. Null when the text is not an amount. */
export function parseMoneyTt(token: string): number | null {
  let t = token.trim()
  let negative = false
  if (/^\(.*\)$/.test(t)) { negative = true; t = t.slice(1, -1) }
  if (t.endsWith("-")) { negative = true; t = t.slice(0, -1) }
  if (t.startsWith("-")) { negative = !negative; t = t.slice(1) }
  t = t.replace(/^\$/, "")
  if (!/^\d{1,3}(,\d{3})+(\.\d{1,4})?$|^\d+(\.\d{1,4})?$/.test(t)) return null
  const s = scaled(t.replace(/,/g, ""), 4)
  if (!s) return null
  return negative ? -s.value : s.value
}

/** "25.00" -> 25_000. Returns null when the text is not a quantity. */
export function parseQuantityMilli(token: string): { milli: number; rounded: boolean } | null {
  const t = token.trim().replace(/,/g, "")
  if (!/^-?\d*\.?\d+$/.test(t)) return null
  const s = scaled(t, 3)
  return s ? { milli: s.value, rounded: s.rounded } : null
}

export function formatMoneyTt(tt: number): string {
  const sign = tt < 0 ? "-" : ""
  const abs = Math.abs(tt)
  const cents = Math.round(abs / 100)
  const dollars = Math.floor(cents / 100)
  return `${sign}$${dollars.toLocaleString("en-US")}.${String(cents % 100).padStart(2, "0")}`
}

export function formatQuantityMilli(milli: number): string {
  const v = milli / 1000
  return Number.isInteger(v) ? v.toFixed(0) : v.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")
}

const isAmountToken = (t: string) => parseMoneyTt(t) !== null
const isPlaceholder = (t: string) => /^[-–—]{1,3}$/.test(t)
// Long forms some estimates use. Only unambiguous ones: "square" is left out because it could mean square feet.
const UNIT_ALIASES: Record<string, string> = { EACH: "EA", SHEET: "SHT", SHEETS: "SHT", HOUR: "HR", HOURS: "HR", HRS: "HR", DAYS: "DAY", TONS: "TON" }
const unitToken = (t: string) => {
  if (!/^[A-Za-z]+\.?$/.test(t)) return null
  const u = t.replace(/\.$/, "").toUpperCase()
  if (KNOWN_UNITS.includes(u)) return u
  return UNIT_ALIASES[u] || null
}

const CODE_AT_START = /^(?:\[)?([A-Z]{3,4}[ -][A-Z0-9&/]{2,10})(?:\])?\s+[-–—:]\s+(.+)$/

/** Parse one row. Returns a line, a skip reason, or null if the row has no amounts and is not a line item. */
function parseRow(raw: string): { line: Omit<ParsedLine, "id" | "role" | "page" | "raw"> } | { skip: string } | null {
  const cleaned = raw.replace(/ /g, " ").replace(/\s+/g, " ").trim()
  if (!cleaned) return null
  const tokens = cleaned.split(" ")
  const hasAmount = tokens.some((t) => isAmountToken(t) && /[.,$]/.test(t))
  if (!hasAmount) return null

  // Find "<quantity> <unit>" followed only by amounts or placeholders
  for (let i = 1; i < tokens.length; i++) {
    const unit = unitToken(tokens[i])
    if (!unit) continue
    const qty = parseQuantityMilli(tokens[i - 1])
    if (!qty) continue
    const after = tokens.slice(i + 1)
    if (!after.every((t) => isAmountToken(t) || isPlaceholder(t))) continue
    const amounts = after.filter(isAmountToken).map((t) => parseMoneyTt(t) as number)
    if (amounts.length === 0) continue

    let descTokens = tokens.slice(0, i - 1)
    // A leading row number such as "12." or "12)"
    if (descTokens.length && /^\d{1,3}[.)]$/.test(descTokens[0])) descTokens = descTokens.slice(1)
    let description = descTokens.join(" ").trim()
    let code: string | undefined
    const cm = description.match(CODE_AT_START)
    if (cm) { code = cm[1].replace("-", " ").toUpperCase(); description = cm[2].trim() }

    const issues: string[] = []
    let confidence: ParsedLine["confidence"] = "high"
    if (qty.rounded) { issues.push("The quantity has more than three decimals and was rounded."); confidence = "medium" }
    if (!description || description.length < 3) { issues.push("No readable description was found on this row."); confidence = "low" }

    const line: Omit<ParsedLine, "id" | "role" | "page" | "raw"> = {
      description,
      quantityMilli: qty.milli,
      unit,
      amountsTt: amounts,
      confidence,
      issues,
    }
    if (code) line.code = code
    if (amounts.length === 1) {
      line.confidence = confidence === "high" ? "medium" : confidence
      line.issues.push("Only one amount was found after the unit, so it is not clear whether it is a unit price or a total. No price comparison or arithmetic check is made for this row.")
    } else if (amounts.length === 2) {
      line.unitPriceTt = amounts[0]
      line.totalTt = amounts[1]
    } else {
      // Rows with tax, overhead and profit, depreciation and similar columns: only the unit price is reliably the first amount
      line.unitPriceTt = amounts[0]
      line.issues.push("This row has several amount columns, so its total is not read. Quantity and unit price are compared; its arithmetic is not checked.")
    }
    return { line }
  }
  return { skip: "The row has an amount but no recognizable quantity and unit." }
}

/** Heading and summary rows that are expected to carry amounts but are not line items. */
const NOT_A_LINE = /^(total|subtotal|sub-total|grand total|line item total|summary|overhead|profit|o&p|sales tax|tax|deductible|net claim|replacement cost value|actual cash value|recoverable depreciation|rcv|acv|page \d+)\b/i

export function parseDocument(role: DocumentRole, pages: PageText[]): ParsedDocument {
  const lines: ParsedLine[] = []
  const skippedLines: SkippedLine[] = []
  const pagesWithoutText: number[] = []
  const prefix = role === "insurer" ? "I" : "C"

  for (const p of pages) {
    if (!p.text || !p.text.replace(/\s+/g, "")) { pagesWithoutText.push(p.page); continue }
    let n = 0
    // The line just above, if it had no amounts: some estimates wrap a long description onto its own line
    let above: string | null = null
    for (const rawRow of p.text.split(/\r?\n/)) {
      const row = rawRow.trim()
      if (!row) continue
      if (NOT_A_LINE.test(row)) { above = null; continue }
      n++
      const parsed = parseRow(row)
      if (!parsed) { above = row.length <= 140 ? row : null; continue }
      if ("skip" in parsed) { skippedLines.push({ page: p.page, raw: row, reason: parsed.skip }); above = null; continue }
      const line = parsed.line
      let rawText = row
      if (line.description.trim().length < 3 && above) {
        rawText = above + "\n" + row // the evidence shows both lines exactly as the document had them
        line.description = above.replace(/^\d{1,3}[.)]\s+/, "").trim()
        line.issues.push("The description was taken from the line above, where the text wrapped. Check that it is the right one.")
        if (line.confidence === "low") line.confidence = "medium"
      }
      above = null
      lines.push({ id: `${prefix}-p${p.page}-l${n}`, role, page: p.page, raw: rawText, ...line })
    }
  }
  return { role, lines, skippedLines, pagesTotal: pages.length, pagesWithoutText }
}
