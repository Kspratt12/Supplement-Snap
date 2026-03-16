import { NextResponse } from "next/server"

// Comprehensive Xactimate-compatible line items with realistic pricing
// Prices are approximate national averages — contractors can adjust in Xactimate
const XACTIMATE_CODES: Record<string, { items: Array<{ code: string; description: string; unit: string; unitPrice: number }> }> = {
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
    items: [
      { code: "RFG MISC", description: "Roofing - miscellaneous supplement item", unit: "EA", unitPrice: 0.00 },
    ],
  },
}

export async function POST(request: Request) {
  try {
    const { projectName, propertyAddress, captures } = await request.json()

    if (!captures || captures.length === 0) {
      return NextResponse.json({ error: "No captures to export" }, { status: 400 })
    }

    // Build CSV header matching Xactimate import format
    const headers = [
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
    ]
    const rows = [headers.join(",")]

    for (const capture of captures) {
      const mapping = XACTIMATE_CODES[capture.damage_type] || XACTIMATE_CODES["Other"]
      const qty = capture.quantity || 1

      for (const item of mapping.items) {
        const captureUnit = capture.unit || item.unit
        const total = (qty * item.unitPrice).toFixed(2)
        const noteText = (capture.field_note || "").replace(/"/g, '""').substring(0, 200)
        const description = `${item.description}${capture.roof_area ? ` - ${capture.roof_area}` : ""}`

        const row = [
          "RFG",
          item.code,
          `"${description}"`,
          qty.toString(),
          captureUnit,
          item.unitPrice.toFixed(2),
          total,
          capture.roof_area || "",
          `"${noteText}"`,
          `"${(projectName || "").replace(/"/g, '""')}"`,
          `"${(propertyAddress || "").replace(/"/g, '""')}"`,
        ]
        rows.push(row.join(","))
      }
    }

    const csv = rows.join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${(projectName || "project").replace(/[^a-zA-Z0-9]/g, "_")}_xactimate.csv"`,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Export failed" }, { status: 500 })
  }
}
