import { describe, expect, it } from "vitest"
import { buildXactimateCsv, CSV_HEADERS, CSV_REVIEW_NOTE, XACTIMATE_CODES } from "../lib/xactimate-csv"

// Reads the CSV back into rows of cells (handles quoted cells and doubled quotes)
function parse(csv: string): string[][] {
  const out: string[][] = []
  let row: string[] = [], cell = "", quoted = false
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i]
    if (quoted) {
      if (ch === '"' && csv[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ",") { row.push(cell); cell = "" }
    else if (ch === "\n") { row.push(cell); out.push(row); row = []; cell = "" }
    else cell += ch
  }
  row.push(cell); out.push(row)
  return out
}
const col = (name: string) => CSV_HEADERS.indexOf(name)
const exportRows = (captures: Parameters<typeof buildXactimateCsv>[0]["captures"]) =>
  parse(buildXactimateCsv({ projectName: "Smith", propertyAddress: "1 Main St", captures })).slice(2)

describe("Xactimate CSV", () => {
  it("starts with a clear review note, then the header", () => {
    const rows = parse(buildXactimateCsv({ captures: [{ damage_type: "Drip Edge", quantity: 10, unit: "LF" }] }))
    expect(rows[0]).toEqual([CSV_REVIEW_NOTE])
    expect(CSV_REVIEW_NOTE).toMatch(/starting list only/i)
    expect(CSV_REVIEW_NOTE).toMatch(/Review every row/i)
    expect(rows[1]).toEqual(CSV_HEADERS)
  })

  it("matching units: calculates the price and total", () => {
    const [row] = exportRows([{ damage_type: "Drip Edge", quantity: 120, unit: "LF", roof_area: "Front" }])
    expect(row[col("Item Code")]).toBe("RFG DRIP")
    expect(row[col("Quantity")]).toBe("120")
    expect(row[col("Unit")]).toBe("LF")
    expect(row[col("Unit Price")]).toBe("4.25")
    expect(row[col("Total")]).toBe("510.00")
    expect(row[col("Review Needed")]).toMatch(/Review the code and price/)
  })

  it("matching units are not case sensitive and quantity can be text or a decimal", () => {
    const [row] = exportRows([{ damage_type: "Ice & Water", quantity: "2.5", unit: " sf " }])
    expect(row[col("Unit Price")]).toBe("1.85")
    expect(row[col("Total")]).toBe("4.63")
  })

  it("mismatched units: leaves the price and total blank and says why", () => {
    const [row] = exportRows([{ damage_type: "Decking", quantity: 3, unit: "SQ" }])
    expect(row[col("Quantity")]).toBe("3")
    expect(row[col("Unit")]).toBe("SQ")
    expect(row[col("Unit Price")]).toBe("")
    expect(row[col("Total")]).toBe("")
    expect(row[col("Review Needed")]).toMatch(/Quantity is in SQ but the suggested price is per SF/)
  })

  it("no unit selected: never assumes the table's unit", () => {
    const [row] = exportRows([{ damage_type: "Vent / Pipe Boot", quantity: 1 }])
    expect(row[col("Unit")]).toBe("")
    expect(row[col("Unit Price")]).toBe("")
    expect(row[col("Total")]).toBe("")
    expect(row[col("Review Needed")]).toMatch(/No unit was selected/)
  })

  it("no usable quantity: leaves the price and total blank", () => {
    for (const quantity of [0, -2, "", null, undefined, "abc"]) {
      const [row] = exportRows([{ damage_type: "Drip Edge", quantity: quantity as never, unit: "LF" }])
      expect(row[col("Quantity")]).toBe("")
      expect(row[col("Unit Price")]).toBe("")
      expect(row[col("Total")]).toBe("")
    }
  })

  it("multiple mapped items: the crew's quantity goes on the first item only", () => {
    const rows = exportRows([{ damage_type: "Multiple Layers", quantity: 4, unit: "SQ" }])
    expect(rows).toHaveLength(2)
    expect(rows[0][col("Item Code")]).toBe("RFG TEAR")
    expect(rows[0][col("Quantity")]).toBe("4")
    expect(rows[0][col("Total")]).toBe("180.00")
    expect(rows[1][col("Item Code")]).toBe("RFG HAUL")
    expect(rows[1][col("Quantity")]).toBe("")
    expect(rows[1][col("Unit Price")]).toBe("")
    expect(rows[1][col("Total")]).toBe("")
    expect(rows[1][col("Review Needed")]).toMatch(/Enter your own quantity and price/)
  })

  it("every damage type that maps to several items follows the same rule", () => {
    for (const [type, mapping] of Object.entries(XACTIMATE_CODES)) {
      const rows = exportRows([{ damage_type: type, quantity: 5, unit: mapping.items[0].unit }])
      expect(rows).toHaveLength(mapping.items.length)
      rows.slice(1).forEach((r) => {
        expect(r[col("Quantity")]).toBe("")
        expect(r[col("Total")]).toBe("")
      })
    }
  })

  it("other and unknown damage types use the placeholder item with no price", () => {
    for (const damage_type of ["Other", "Something new", "", undefined]) {
      const [row] = exportRows([{ damage_type: damage_type as never, quantity: 2, unit: "EA" }])
      expect(row[col("Item Code")]).toBe("RFG MISC")
      expect(row[col("Quantity")]).toBe("2")
      expect(row[col("Unit Price")]).toBe("")
      expect(row[col("Total")]).toBe("")
      expect(row[col("Review Needed")]).toMatch(/No suggested price/)
    }
  })

  it("missing pricing never turns into a $0.00 amount", () => {
    expect(Object.values(XACTIMATE_CODES).flatMap((m) => m.items).filter((i) => i.unitPrice === 0)).toEqual([])
    const csv = buildXactimateCsv({ captures: [{ damage_type: "Other", quantity: 9, unit: "EA" }] })
    expect(csv).not.toMatch(/0\.00/)
  })

  it("keeps notes, project and address intact, including quotes and commas", () => {
    const [row] = exportRows([{ damage_type: "Drip Edge", quantity: 1, unit: "LF", field_note: 'He said "rot, here"' }])
    expect(row[col("Notes")]).toBe('He said "rot, here"')
    expect(row[col("Project")]).toBe("Smith")
    expect(row[col("Address")]).toBe("1 Main St")
    expect(row).toHaveLength(CSV_HEADERS.length)
  })

  it("every row has the same number of cells as the header", () => {
    const rows = exportRows([
      { damage_type: "Decking", quantity: 3, unit: "SQ" },
      { damage_type: "Flashing", quantity: 20, unit: "LF", field_note: "a,b" },
      { damage_type: "Other" },
    ])
    rows.forEach((r) => expect(r).toHaveLength(CSV_HEADERS.length))
  })
})
