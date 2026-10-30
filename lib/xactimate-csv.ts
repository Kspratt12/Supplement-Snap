/**
 * Builds the Xactimate-style CSV starting list.
 *
 * The codes and unit prices below are a fixed table of illustrative figures with no documented source. They have not been checked
 * against any contractor's Xactimate price list and the file has not been tested through an Xactimate import, so every
 * row needs the contractor's review.
 *
 * A dollar amount is only calculated when the crew's quantity is in the same unit the table price is for. Otherwise the
 * price and total are left blank, because multiplying a quantity in one unit by a price for another gives a wrong number.
 */

export type PriceItem = { code: string; description: string; unit: string; unitPrice: number | null }

export const XACTIMATE_CODES: Record<string, { items: PriceItem[] }> = {
  "Decking": {
    items: [
      { code: "RFG SHTHN", description: "Sheathing - plywood/OSB - 1/2\" CDX", unit: "SF", unitPrice: 2.18 },
      { code: "RFG RFLT30", description: "Roofing felt - 30# - install only", unit: "SF", unitPrice: 0.52 },
    ],
  },
  "Flashing": {
    items: [
      { code: "RFG FLSH", description: "Flashing - step/counter - aluminum", unit: "LF", unitPrice: 8.75 },
      { code: "RFG FLSHC", description: "Flashing - counter/cap - remove & replace", unit: "LF", unitPrice: 6.50 },
    ],
  },
  "Vent / Pipe Boot": {
    items: [
      { code: "RFG VENT", description: "Roof vent - pipe jack/boot - remove & replace", unit: "EA", unitPrice: 85.00 },
    ],
  },
  "Drip Edge": {
    items: [
      { code: "RFG DRIP", description: "Drip edge - aluminum - remove & replace", unit: "LF", unitPrice: 4.25 },
    ],
  },
  "Ice & Water": {
    items: [
      { code: "RFG I&WS", description: "Ice & water shield membrane - install", unit: "SF", unitPrice: 1.85 },
    ],
  },
  "Multiple Layers": {
    items: [
      { code: "RFG TEAR", description: "Remove additional layer of roofing", unit: "SQ", unitPrice: 45.00 },
      { code: "RFG HAUL", description: "Haul debris - additional roofing layer", unit: "SQ", unitPrice: 22.50 },
    ],
  },
  "Other": {
    // No suggested price: the contractor enters their own
    items: [
      { code: "RFG MISC", description: "Roofing - miscellaneous supplement item", unit: "EA", unitPrice: null },
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
  "NOTE: Suggested item codes and unit prices are a starting list only. They come from a fixed table of illustrative prices that is not from a documented Xactimate price source and has not been checked against your Xactimate price list. Review every row and price it yourself. A blank price or total means one could not be worked out safely."

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
    const mapping = XACTIMATE_CODES[capture.damage_type || ""] || XACTIMATE_CODES["Other"]
    const qtyNumber = Number(capture.quantity)
    const hasQty = capture.quantity !== null && capture.quantity !== undefined && capture.quantity !== "" && Number.isFinite(qtyNumber) && qtyNumber > 0
    const enteredUnit = (capture.unit || "").trim().toUpperCase()
    const roofArea = (capture.roof_area || "").trim()
    const note = text(String(capture.field_note || "").substring(0, 200))

    mapping.items.forEach((item, index) => {
      const description = text(`${item.description}${roofArea ? ` - ${roofArea}` : ""}`)
      let quantity = ""
      let unit = item.unit
      let unitPrice = ""
      let total = ""
      let review = "Review the code and price before use."

      if (index > 0) {
        // The crew counted the finding once. It is not safe to say the same quantity applies to every related item.
        review = "Related item that may also apply to this finding. Enter your own quantity and price."
      } else {
        quantity = hasQty ? String(qtyNumber) : ""
        unit = enteredUnit
        if (!hasQty) {
          review = "No usable quantity was entered, so no price or total was calculated."
        } else if (!enteredUnit) {
          review = "No unit was selected, so no price or total was calculated."
        } else if (enteredUnit !== item.unit) {
          review = `Quantity is in ${enteredUnit} but the suggested price is per ${item.unit}, so no price or total was calculated.`
        } else if (item.unitPrice === null) {
          review = "No suggested price for this item. Enter your own price."
        } else {
          unitPrice = item.unitPrice.toFixed(2)
          total = (Math.round(qtyNumber * item.unitPrice * 100) / 100).toFixed(2)
        }
      }

      rows.push([
        "RFG",
        item.code,
        description,
        quantity,
        unit,
        unitPrice,
        total,
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
