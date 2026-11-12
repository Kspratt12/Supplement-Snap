import { describe, expect, it } from "vitest"
import { buildXactimateCsv, CSV_HEADERS, CSV_REVIEW_NOTE, SUGGESTED_ITEMS } from "../lib/xactimate-csv"

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

describe("Xactimate CSV: compatibility with the earlier file layout", () => {
  it("keeps all 12 columns in the same order", () => {
    expect(CSV_HEADERS).toEqual([
      "Category", "Item Code", "Description", "Quantity", "Unit", "Unit Price", "Total",
      "Roof Area", "Notes", "Project", "Address", "Review Needed",
    ])
    const rows = parse(buildXactimateCsv({ captures: [{ damage_type: "Drip Edge", quantity: 10, unit: "LF" }] }))
    expect(rows[1]).toEqual(CSV_HEADERS)
  })

  it("starts with one review note row that says what is blank and that the file is not import-tested", () => {
    const rows = parse(buildXactimateCsv({ captures: [{ damage_type: "Drip Edge", quantity: 10, unit: "LF" }] }))
    expect(rows[0]).toEqual([CSV_REVIEW_NOTE])
    expect(CSV_REVIEW_NOTE).toMatch(/starting list only/i)
    expect(CSV_REVIEW_NOTE).toMatch(/intentionally left blank/i)
    expect(CSV_REVIEW_NOTE).toMatch(/Review every row/i)
    expect(CSV_REVIEW_NOTE).toMatch(/not been tested through an Xactimate import/i)
    expect(CSV_REVIEW_NOTE).not.toMatch(/compatible|imports? directly|native/i)
  })

  it("every row has the same number of cells as the header, for every damage type", () => {
    const captures = [...Object.keys(SUGGESTED_ITEMS), "Something new", ""].map((damage_type) => ({ damage_type, quantity: 3, unit: "EA", field_note: "a,b" }))
    exportRows(captures).forEach((r) => expect(r).toHaveLength(CSV_HEADERS.length))
  })
})

describe("Xactimate CSV: unverified suggestions are left blank", () => {
  it("never writes an item code, unit price or total, whatever the quantity and unit", () => {
    for (const damage_type of [...Object.keys(SUGGESTED_ITEMS), "Something new", undefined]) {
      for (const unit of ["SF", "LF", "SQ", "EA", "", " lf "]) {
        for (const quantity of [1, 2.5, "7", 0, -1, "", null, "abc", undefined]) {
          for (const r of exportRows([{ damage_type: damage_type as never, quantity: quantity as never, unit }])) {
            expect(r[col("Item Code")]).toBe("")
            expect(r[col("Unit Price")]).toBe("")
            expect(r[col("Total")]).toBe("")
          }
        }
      }
    }
  })

  it("never turns missing information into $0 or a calculated amount", () => {
    const csv = buildXactimateCsv({ captures: [{ damage_type: "Decking", quantity: 12, unit: "SF" }, { damage_type: "Other", quantity: 9, unit: "EA" }] })
    expect(csv).not.toMatch(/0\.00/)
    expect(csv).not.toMatch(/\$/)
    expect(csv).not.toMatch(/RFG [A-Z]/)
  })

  it("the review column tells the user to enter the code and price from their own price list", () => {
    const [row] = exportRows([{ damage_type: "Drip Edge", quantity: 4, unit: "LF" }])
    expect(row[col("Review Needed")]).toMatch(/item code and unit price from your own price list/i)
  })
})

describe("Xactimate CSV: what the crew entered is carried over unchanged", () => {
  it("keeps the crew's quantity and unit, even when the unit differs from the suggested one", () => {
    const [row] = exportRows([{ damage_type: "Decking", quantity: 3, unit: "SQ", roof_area: "Front" }])
    expect(row[col("Quantity")]).toBe("3")
    expect(row[col("Unit")]).toBe("SQ")
    expect(row[col("Roof Area")]).toBe("Front")
  })

  it("keeps a decimal quantity given as text, and upper-cases a unit typed with spaces", () => {
    const [row] = exportRows([{ damage_type: "Ice & Water", quantity: "2.5", unit: " sf " }])
    expect(row[col("Quantity")]).toBe("2.5")
    expect(row[col("Unit")]).toBe("SF")
  })

  it("no usable quantity or no unit: those cells stay blank and the row says what to enter", () => {
    for (const quantity of [0, -2, "", null, undefined, "abc"]) {
      const [row] = exportRows([{ damage_type: "Drip Edge", quantity: quantity as never, unit: "LF" }])
      expect(row[col("Quantity")]).toBe("")
      expect(row[col("Review Needed")]).toMatch(/No usable quantity/)
    }
    const [noUnit] = exportRows([{ damage_type: "Vent / Pipe Boot", quantity: 1 }])
    expect(noUnit[col("Unit")]).toBe("")
    expect(noUnit[col("Review Needed")]).toMatch(/No unit was selected/)
  })

  it("the crew's quantity goes on the first item only; related items are blank for the user to complete", () => {
    const rows = exportRows([{ damage_type: "Multiple Layers", quantity: 4, unit: "SQ" }])
    expect(rows).toHaveLength(2)
    expect(rows[0][col("Quantity")]).toBe("4")
    expect(rows[1][col("Quantity")]).toBe("")
    expect(rows[1][col("Review Needed")]).toMatch(/Enter your own quantity, item code and price/)
  })

  it("other and unknown damage types use one general row", () => {
    for (const damage_type of ["Other", "Something new", "", undefined]) {
      const rows = exportRows([{ damage_type: damage_type as never, quantity: 2, unit: "EA" }])
      expect(rows).toHaveLength(1)
      expect(rows[0][col("Quantity")]).toBe("2")
      expect(rows[0][col("Description")]).toMatch(/other supplement item/i)
    }
  })

  it("keeps notes, project and address intact, including quotes, commas and line breaks are not added", () => {
    const [row] = exportRows([{ damage_type: "Drip Edge", quantity: 1, unit: "LF", field_note: 'He said "rot, here"' }])
    expect(row[col("Notes")]).toBe('He said "rot, here"')
    expect(row[col("Project")]).toBe("Smith")
    expect(row[col("Address")]).toBe("1 Main St")
    expect(row).toHaveLength(CSV_HEADERS.length)
  })

  it("truncates a long note to 200 characters as before", () => {
    const [row] = exportRows([{ damage_type: "Drip Edge", quantity: 1, unit: "LF", field_note: "x".repeat(500) }])
    expect(row[col("Notes")]).toHaveLength(200)
  })

  it("descriptions are general and do not invent material, size or action details", () => {
    for (const mapping of Object.values(SUGGESTED_ITEMS)) {
      for (const item of mapping.items) {
        expect(item.description).not.toMatch(/aluminum|CDX|30#|1\/2|R&R|install only|remove & replace/i)
      }
    }
  })

  it("no downstream totals exist: a quantity can no longer produce a dollar figure", () => {
    const csv = buildXactimateCsv({ captures: [{ damage_type: "Flashing", quantity: 1000000, unit: "LF" }] })
    expect(csv).not.toMatch(/\d+\.\d\d/)
  })
})
