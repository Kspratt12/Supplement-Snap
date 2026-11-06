/**
 * The quantity text for a finding, from the values saved with it: "Quantity: 3 SQ", or "Quantity: 3" when no unit was
 * saved. Returns null when no quantity was saved, so nothing is shown. No unit is invented and no value is converted.
 */
export function quantityLabel(quantity?: number | string | null, unit?: string | null): string | null {
  if (quantity === null || quantity === undefined || quantity === "") return null
  const n = typeof quantity === "number" ? quantity : Number(quantity)
  if (!Number.isFinite(n) || n <= 0) return null // matches the finding card, which shows a quantity only when it is above zero
  const u = (unit ?? "").trim()
  return `Quantity: ${n}${u ? " " + u : ""}`
}
