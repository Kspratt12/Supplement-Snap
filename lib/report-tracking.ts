/**
 * Report order, roof-diagram pins and manual claim tracking (requested/approved amounts, follow-up date).
 * Each needs a column from supabase-migration-v16; `hasColumn` lets the screen show a control only when the loaded rows
 * actually carry that column, so nothing appears to work before the database has it.
 */

export function hasColumn(row: object | null | undefined, column: string): boolean {
  return !!row && Object.prototype.hasOwnProperty.call(row, column)
}

type Orderable = { id: string; created_at: string; report_order?: number | null }

/**
 * The order findings appear in the report, PDF, text copy and CSV. Findings the person placed come first in their chosen
 * positions; the rest keep the order they were given in (the screen's newest-first list), so nothing changes until someone reorders.
 */
export function orderForReport<T extends Orderable>(list: T[]): T[] {
  const placed = list.some((c) => typeof c.report_order === "number")
  if (!placed) return [...list]
  return list
    .map((c, i) => ({ c, i }))
    .sort((a, b) => {
      const ao = typeof a.c.report_order === "number" ? a.c.report_order : Number.MAX_SAFE_INTEGER
      const bo = typeof b.c.report_order === "number" ? b.c.report_order : Number.MAX_SAFE_INTEGER
      return ao - bo || a.i - b.i
    })
    .map((x) => x.c)
}

/**
 * Moves one finding up or down and numbers the whole list 0..n-1, so every finding gets a fixed place. Returns only the
 * findings whose stored position changes. A move past either end changes nothing.
 */
export function moveInReport<T extends Orderable>(ordered: T[], id: string, direction: -1 | 1): { id: string; report_order: number }[] {
  const from = ordered.findIndex((c) => c.id === id)
  const to = from + direction
  if (from < 0 || to < 0 || to >= ordered.length) return []
  const next = [...ordered]
  ;[next[from], next[to]] = [next[to], next[from]]
  return next.map((c, i) => ({ id: c.id, report_order: i })).filter((u, i) => next[i].report_order !== u.report_order)
}

/** "$12,450.50" or "12450.5" -> 12450.5. Blank -> null (cleared). Anything else, or a negative or huge number, -> "invalid". */
export function parseAmount(input: string): number | null | "invalid" {
  const t = (input || "").replace(/[\s$,]/g, "")
  if (t === "") return null
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return "invalid"
  const n = Number(t)
  return Number.isFinite(n) && n < 100_000_000 ? n : "invalid"
}

export function formatAmount(n: number | null | undefined): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return ""
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" })
}

/** A stored amount (numeric columns may arrive as text) as a number, or null. */
export function amountValue(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : v
  return typeof n === "number" && Number.isFinite(n) ? n : null
}

/** today is yyyy-mm-dd in the person's own time zone */
export function localToday(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}

/** Whether a follow-up date set by the person is due. Purely a reminder on screen; nothing is sent. */
export function followUpState(date: string | null | undefined, today: string): "none" | "upcoming" | "due" {
  if (!date || !/^\d{4}-\d{2}-\d{2}/.test(date)) return "none"
  return date.slice(0, 10) <= today ? "due" : "upcoming"
}

export type Pin = { x: number; y: number }

/** A stored pin, or null when it is missing or not a valid position on the diagram. */
export function normalizePin(v: unknown): Pin | null {
  if (!v || typeof v !== "object") return null
  const { x, y } = v as { x?: unknown; y?: unknown }
  if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) return null
  if (x < 0 || x > 1 || y < 0 || y > 1) return null
  return { x, y }
}

/** Where a tap or click landed on the diagram, as a 0..1 position (so it stays put at any display size). */
export function pinFromPoint(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }): Pin | null {
  if (rect.width <= 0 || rect.height <= 0) return null
  const clamp = (n: number) => Math.min(1, Math.max(0, n))
  return { x: clamp((clientX - rect.left) / rect.width), y: clamp((clientY - rect.top) / rect.height) }
}

/** The numbered pins for a diagram, numbered the same way as the findings in the report. */
export function numberedPins<T extends { diagram_pin?: unknown }>(ordered: T[]): { n: number; pin: Pin }[] {
  return ordered.flatMap((c, i) => {
    const pin = normalizePin(c.diagram_pin)
    return pin ? [{ n: i + 1, pin }] : []
  })
}
