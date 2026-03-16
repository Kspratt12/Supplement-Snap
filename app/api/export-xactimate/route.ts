import { NextResponse } from "next/server"

// Maps damage types to Xactimate-compatible category codes and descriptions
const XACTIMATE_CODES: Record<string, { category: string; code: string; unit: string }> = {
  "Decking": { category: "RFG", code: "RFG SHTHN", unit: "SF" },
  "Flashing": { category: "RFG", code: "RFG FLSH", unit: "LF" },
  "Vent / Pipe Boot": { category: "RFG", code: "RFG VENT", unit: "EA" },
  "Drip Edge": { category: "RFG", code: "RFG DRIP", unit: "LF" },
  "Ice & Water": { category: "RFG", code: "RFG I&WS", unit: "SF" },
  "Multiple Layers": { category: "RFG", code: "RFG TEAR", unit: "SQ" },
  "Other": { category: "RFG", code: "RFG MISC", unit: "EA" },
}

export async function POST(request: Request) {
  try {
    const { projectName, propertyAddress, captures } = await request.json()

    if (!captures || captures.length === 0) {
      return NextResponse.json({ error: "No captures to export" }, { status: 400 })
    }

    // Build CSV header matching Xactimate import format
    const headers = ["Category", "Item Code", "Description", "Quantity", "Unit", "Roof Area", "Notes", "Project", "Address"]
    const rows = [headers.join(",")]

    for (const capture of captures) {
      const mapping = XACTIMATE_CODES[capture.damage_type] || XACTIMATE_CODES["Other"]
      const description = `${capture.damage_type} — ${capture.roof_area}${capture.field_note ? ": " + capture.field_note.replace(/"/g, '""').substring(0, 100) : ""}`
      const row = [
        mapping.category,
        mapping.code,
        `"${description}"`,
        "1",
        mapping.unit,
        capture.roof_area || "",
        `"${(capture.field_note || "").replace(/"/g, '""').substring(0, 200)}"`,
        `"${(projectName || "").replace(/"/g, '""')}"`,
        `"${(propertyAddress || "").replace(/"/g, '""')}"`,
      ]
      rows.push(row.join(","))
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
