/**
 * Builds the Xactimate-style CSV starting list.
 *
 * The earlier version of this file suggested item codes and unit prices from a fixed table. Neither the codes nor the prices
 * could be verified against Xactimate's own price list, so they are no longer suggested: those cells are left blank for the
 * contractor to fill from their own price list. Descriptions are general, and the crew's own quantity, unit, roof area and notes
 * are carried over unchanged. The file has not been tested through an Xactimate import.
 *
 * A price or total is never calculated and a missing value is never turned into 0.
 */

export type SuggestedItem = { description: string; unit: string }

export const SUGGESTED_ITEMS: Record<string, { items: SuggestedItem[] }> = {
  "Decking": {
    items: [
      { description: "Sheathing - plywood/OSB", unit: "SF" },
      { description: "Roofing felt (underlayment)", unit: "SF" },
    ],
  },
  "Flashing": {
    items: [
      { description: "Flashing - step/counter", unit: "LF" },
      { description: "Flashing - counter/cap", unit: "LF" },
    ],
  },
  "Vent / Pipe Boot": {
    items: [
      { description: "Roof vent / pipe jack (boot)", unit: "EA" },
    ],
  },
  "Drip Edge": {
    items: [
      { description: "Drip edge", unit: "LF" },
    ],
  },
  "Ice & Water": {
    items: [
      { description: "Ice & water shield membrane", unit: "SF" },
    ],
  },
  "Multiple Layers": {
    items: [
      { description: "Remove additional layer of roofing", unit: "SQ" },
      { description: "Haul debris - additional roofing layer", unit: "SQ" },
    ],
  },
  "Other": {
    items: [
      { description: "Roofing - other supplement item", unit: "EA" },
    ],
  },
}

export const CSV_HEADERS = [
  "Category",
  "Item Code",
  "Description",
  "Quantity",
  "Unit",
  "Unit Price",
  "Total",
  "Roof Area",
  "Notes",
  "Project",
  "Address",
  "Review Needed",
]

export const CSV_REVIEW_NOTE =
  "NOTE: This is a starting list only. Item codes and unit prices are intentionally left blank because they have not been verified against Xactimate's price list: enter them from your own price list. Descriptions are general suggestions. Review every row before you use it. This file has not been tested through an Xactimate import."

export type ExportCapture = {
  damage_type?: string | null
  roof_area?: string | null
  field_note?: string | null
  quantity?: number | string | null
  unit?: string | null
}

const text = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`

export function buildXactimateCsv(input: { projectName?: string | null; propertyAddress?: string | null; captures: ExportCapture[] }): string {
  const rows: string[] = [text(CSV_REVIEW_NOTE), CSV_HEADERS.join(",")]
  const project = text(input.projectName || "")
  const address = text(input.propertyAddress || "")

  for (const capture of input.captures) {
    if (!capture || typeof capture !== "object") continue
    const mapping = SUGGESTED_ITEMS[capture.damage_type || ""] || SUGGESTED_ITEMS["Other"]
    const qtyNumber = Number(capture.quantity)
    const hasQty = capture.quantity !== null && capture.quantity !== undefined && capture.quantity !== "" && Number.isFinite(qtyNumber) && qtyNumber > 0
    const enteredUnit = (capture.unit || "").trim().toUpperCase()
    const roofArea = (capture.roof_area || "").trim()
    const note = text(String(capture.field_note || "").substring(0, 200))

    mapping.items.forEach((item, index) => {
      const description = text(`${item.description}${roofArea ? ` - ${roofArea}` : ""}`)
      let quantity = ""
      let unit = item.unit
      let review = "Enter the item code and unit price from your own price list."

      if (index > 0) {
        // The crew counted the finding once. It is not safe to say the same quantity applies to every related item.
        review = "Related item that may also apply to this finding. Enter your own quantity, item code and price."
      } else {
        quantity = hasQty ? String(qtyNumber) : ""
        unit = enteredUnit
        if (!hasQty) review = "No usable quantity was entered. Enter the quantity, item code and unit price."
        else if (!enteredUnit) review = "No unit was selected. Enter the unit, item code and unit price."
        else if (qtyNumber === 1) review = "Quantity is 1, which is also the app's default: confirm it was measured. Enter the item code and unit price from your own price list."
      }

      rows.push([
        "RFG",
        "",
        description,
        quantity,
        unit,
        "",
        "",
        text(roofArea),
        note,
        project,
        address,
        text(review),
      ].join(","))
    })
  }

  return rows.join("\n")
}
