// @vitest-environment node
import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import JSZip from "jszip"
// jsdom ships no type declarations here, so describe the small part this test uses
type JsdomCtor = new (html: string) => { window: { DOMParser: new () => { parseFromString(xml: string, type: string): Document } } }
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { JSDOM } = require("jsdom") as { JSDOM: JsdomCtor }
import { TEMPLATES, getTemplate } from "../lib/templates"

/**
 * The downloadable templates are generated files committed to public/downloads.
 * These tests open the real files and check what a visitor would get.
 */

const ROOT = path.join(__dirname, "..")
const PUBLIC = path.join(ROOT, "public")
const abs = (href: string) => path.join(PUBLIC, href.replace(/^\//, ""))
const parseXml = (xml: string): Document => {
  const Parser = new JSDOM("").window.DOMParser
  return new Parser().parseFromString(xml, "application/xml")
}
function assertWellFormed(xml: string, label: string) {
  const doc = parseXml(xml)
  const err = doc.getElementsByTagName("parsererror")
  expect(err.length, `${label} is not well-formed XML`).toBe(0)
  return doc
}

const ALL_FILES = TEMPLATES.flatMap((t) => t.files.map((f) => ({ t, f })))

// Phrases that must appear in every format of a template (labels sit on one line, without parentheses).
const SENTINELS: Record<string, string[]> = {
  "roofing-estimate-template": ["ROOFING ESTIMATE", "Scope of work", "Line items", "Customer signature", "Warranty terms"],
  "roofing-supplement-template": ["ROOFING SUPPLEMENT REQUEST", "Claim number", "Adjuster email", "Findings summary", "Before you send"],
  "roof-damage-report-template": ["ROOF DAMAGE REPORT", "Job details", "Roof summary", "Photo index", "Recommendations"],
  "roof-repair-estimate-template": ["ROOF REPAIR ESTIMATE", "The problem", "Repair scope", "What could change the price", "Workmanship warranty"],
  "good-better-best-roofing-proposal-template": ["ROOFING PROPOSAL: THREE OPTIONS", "Option 1: Good", "Option 2: Better", "Option 3: Best", "Customer choice"],
  "roofing-supplement-tracker": ["SUPPLEMENT TRACKER", "Open supplements", "Status words to use", "Each week", "Tracked by"],
  "roof-tear-off-findings-log": ["ROOF TEAR-OFF FINDINGS LOG", "Findings", "Before you leave the roof", "Crew lead", "Logged by"],
  "roofing-crew-documentation-checklist": ["CREW DOCUMENTATION CHECKLIST", "Before tear-off", "During tear-off", "Before the crew leaves", "Crew lead signature"],
}

describe("template registry", () => {
  it("lists every file that is linked, and every linked file exists and is a sensible size", () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(5)
    for (const { f } of ALL_FILES) {
      const p = abs(f.href)
      expect(fs.existsSync(p), `${f.href} is missing`).toBe(true)
      const size = fs.statSync(p).size
      expect(size).toBeGreaterThan(2000)
      expect(size).toBeLessThan(300 * 1024)
    }
  })

  it("has unique ids and hrefs and matching file extensions", () => {
    const ids = TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    const hrefs = ALL_FILES.map(({ f }) => f.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
    const ext = { PDF: ".pdf", "Fillable PDF": "-fillable.pdf", Word: ".docx", Excel: ".xlsx" } as const
    for (const { f } of ALL_FILES) expect(f.href.endsWith(ext[f.format])).toBe(true)
  })

  it("points each template at a guide that exists", () => {
    const blog = fs.readFileSync(path.join(ROOT, "app/blog/[slug]/page.tsx"), "utf8")
    for (const t of TEMPLATES) {
      const slug = t.guideHref.replace("/blog/", "")
      expect(blog.includes(`slug: "${slug}"`) || blog.includes(`"slug": "${slug}"`), `${t.guideHref} is not an article`).toBe(true)
    }
  })

  it("is used by the article pages: each downloads id in the blog file is a real template", () => {
    const blog = fs.readFileSync(path.join(ROOT, "app/blog/[slug]/page.tsx"), "utf8")
    const used = [...blog.matchAll(/"?downloads"?:\s*"([^"]+)"/g)].map((m) => m[1])
    expect(used.length).toBeGreaterThanOrEqual(3)
    for (const id of used) expect(getTemplate(id), `unknown template id ${id}`).toBeDefined()
  })
})

describe("PDF files", () => {
  const pdfs = ALL_FILES.filter(({ f }) => f.format === "PDF" || f.format === "Fillable PDF")
  it.each(pdfs.map(({ t, f }) => [t.id, f.href]))("%s: valid US Letter PDF with the expected text", (id, href) => {
    const buf = fs.readFileSync(abs(href))
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-")
    const text = buf.toString("latin1")
    // jsPDF writes the numbers as "612." and "792."; 612 x 792 points is US Letter
    expect(text).toMatch(/\/MediaBox\s*\[\s*0\.?0*\s+0\.?0*\s+612\.?0*\s+792\.?0*\s*\]/)
    expect(text).toContain("Supplement Snap")
    expect(text).toMatch(/not legal advice/)
    for (const s of SENTINELS[id]) expect(text, `${s} missing from ${href}`).toContain(s)
    // Table header cells are the only filled rectangles; each must be filled light grey, never the dark
    // text colour (jsPDF shares one colour between text and fills, which once made headers solid black).
    const fills = [...text.matchAll(/([\d.]+ [\d.]+ [\d.]+) rg\n[^\n]* re\nB\n/g)].map((m) => m[1])
    expect(fills.length, "table header cells").toBeGreaterThan(0)
    for (const c of fills) expect(c).toBe("0.93 0.94 0.96")
    const pages = (text.match(/\/Type\s*\/Page[^s]/g) || []).length
    expect(pages).toBeGreaterThanOrEqual(1)
    expect(pages).toBeLessThanOrEqual(4)
  })
})

describe("Fillable PDFs", () => {
  const fillable = ALL_FILES.filter(({ f }) => f.format === "Fillable PDF")
  const plain = ALL_FILES.filter(({ f }) => f.format === "PDF")
  const widgets = (text: string) => (text.match(/\/Subtype\s*\/Widget/g) || []).length

  it("offers a fillable version of every template that has a plain PDF, and only those", () => {
    expect(fillable.length).toBe(plain.length)
    for (const { t } of plain) expect(fillable.some((x) => x.t.id === t.id), `${t.id} has no fillable PDF`).toBe(true)
  })

  it.each(fillable.map(({ t, f }) => [t.id, f.href]))("%s: has a form with many unique text fields inside the page", (_id, href) => {
    const text = fs.readFileSync(abs(href)).toString("latin1")
    expect(text).toContain("/AcroForm")
    expect(widgets(text)).toBeGreaterThan(40)
    // checkboxes must start unticked (jsPDF defaults them to ticked)
    expect(text).not.toMatch(/\/AS\s*\/On/)
    expect((text.match(/\/FT\s*\/Btn/g) || []).length).toBe((text.match(/\/AS\s*\/Off/g) || []).length)
    // every widget is a text box or a checkbox
    expect((text.match(/\/FT\s*\/(?:Tx|Btn)/g) || []).length).toBe(widgets(text))
    expect((text.match(/\/FT\s*\/Tx/g) || []).length).toBeGreaterThan(40)
    const names = [...text.matchAll(/\/T\s*\(([^)]*)\)/g)].map((m) => m[1])
    expect(names.length).toBeGreaterThanOrEqual(widgets(text))
    expect(new Set(names).size, "duplicate field names").toBe(names.length)
    for (const m of text.matchAll(/\/Rect\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/g)) {
      const [x1, y1, x2, y2] = m.slice(1).map(Number)
      expect(x1).toBeGreaterThanOrEqual(0); expect(y1).toBeGreaterThanOrEqual(0)
      expect(x2).toBeLessThanOrEqual(612); expect(y2).toBeLessThanOrEqual(792)
      expect(x2).toBeGreaterThan(x1); expect(y2).toBeGreaterThan(y1)
    }
  })

  it("keeps the plain PDFs free of form fields", () => {
    for (const { f } of plain) expect(widgets(fs.readFileSync(abs(f.href)).toString("latin1")), f.href).toBe(0)
  })
})

describe("Word files", () => {
  const docs = ALL_FILES.filter(({ f }) => f.format === "Word")
  it.each(docs.map(({ t, f }) => [t.id, f.href]))("%s: valid document with the expected text, US Letter, footer", async (id, href) => {
    const zip = await JSZip.loadAsync(fs.readFileSync(abs(href)))
    for (const part of ["[Content_Types].xml", "_rels/.rels", "word/document.xml"]) expect(zip.file(part), `${part} missing`).not.toBeNull()
    const documentXml = await zip.file("word/document.xml")!.async("string")
    assertWellFormed(documentXml, `${href} document.xml`)
    // every other XML part is well-formed too
    for (const name of Object.keys(zip.files).filter((n) => n.endsWith(".xml") || n.endsWith(".rels"))) {
      assertWellFormed(await zip.file(name)!.async("string"), `${href} ${name}`)
    }
    const text = [...documentXml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]).join(" ")
    for (const s of SENTINELS[id]) expect(text, `${s} missing from ${href}`).toContain(s)
    expect(documentXml).toMatch(/<w:pgSz[^>]*w:w="12240"[^>]*w:h="15840"/)
    const footers = Object.keys(zip.files).filter((n) => /^word\/footer\d*\.xml$/.test(n))
    expect(footers.length).toBeGreaterThanOrEqual(1)
    const footerXml = await zip.file(footers[0])!.async("string")
    expect(footerXml).toContain("not legal advice")
    expect(footerXml).toMatch(/PAGE/)
    // blank fill-in areas exist (tables with cells)
    expect((documentXml.match(/<w:tc>/g) || []).length).toBeGreaterThan(20)
  })
})

describe("Excel estimate", () => {
  const href = "/downloads/roofing-estimate-template.xlsx"

  async function load() {
    const zip = await JSZip.loadAsync(fs.readFileSync(abs(href)))
    const sheetXml = await zip.file("xl/worksheets/sheet1.xml")!.async("string")
    const stylesXml = await zip.file("xl/styles.xml")!.async("string")
    return { zip, sheetXml, stylesXml, sheet: assertWellFormed(sheetXml, "sheet1"), styles: assertWellFormed(stylesXml, "styles") }
  }

  it("has the standard parts, all well-formed and registered in the content types", async () => {
    const { zip } = await load()
    const parts = ["[Content_Types].xml", "_rels/.rels", "xl/workbook.xml", "xl/_rels/workbook.xml.rels", "xl/styles.xml", "xl/worksheets/sheet1.xml"]
    for (const part of parts) {
      expect(zip.file(part), `${part} missing`).not.toBeNull()
      assertWellFormed(await zip.file(part)!.async("string"), part)
    }
    const types = await zip.file("[Content_Types].xml")!.async("string")
    for (const p of ["/xl/workbook.xml", "/xl/worksheets/sheet1.xml", "/xl/styles.xml"]) expect(types).toContain(`PartName="${p}"`)
    const rels = await zip.file("xl/_rels/workbook.xml.rels")!.async("string")
    expect(rels).toContain('Target="worksheets/sheet1.xml"')
    expect(rels).toContain('Target="styles.xml"')
    expect(await zip.file("xl/workbook.xml")!.async("string")).toContain('fullCalcOnLoad="1"')
  })

  it("has unique cell references in row order, and every style index exists", async () => {
    const { sheet, styles } = await load()
    const xfCount = styles.getElementsByTagName("cellXfs")[0].getElementsByTagName("xf").length
    const seen = new Set<string>()
    let lastRow = 0
    for (const row of Array.from(sheet.getElementsByTagName("row"))) {
      const r = Number(row.getAttribute("r"))
      expect(r).toBeGreaterThan(lastRow)
      lastRow = r
      let lastCol = 0
      for (const c of Array.from(row.getElementsByTagName("c"))) {
        const ref = c.getAttribute("r")!
        expect(seen.has(ref), `duplicate cell ${ref}`).toBe(false)
        seen.add(ref)
        expect(ref.endsWith(String(r))).toBe(true)
        const col = ref.charCodeAt(0) - 64
        expect(col).toBeGreaterThan(lastCol)
        lastCol = col
        expect(Number(c.getAttribute("s"))).toBeLessThan(xfCount)
      }
    }
    expect(seen.size).toBeGreaterThan(80)
  })

  it("has merges that do not overlap", async () => {
    const { sheet } = await load()
    const cells = new Set<string>()
    for (const m of Array.from(sheet.getElementsByTagName("mergeCell"))) {
      const [a, b] = m.getAttribute("ref")!.split(":")
      const [c1, c2] = [a.charCodeAt(0), b.charCodeAt(0)]
      const [r1, r2] = [Number(a.slice(1)), Number(b.slice(1))]
      for (let c = c1; c <= c2; c++) for (let r = r1; r <= r2; r++) {
        const key = String.fromCharCode(c) + r
        expect(cells.has(key), `overlapping merge at ${key}`).toBe(false)
        cells.add(key)
      }
    }
  })

  it("calculates amounts as quantity x unit price, a subtotal and a total", async () => {
    const { sheet } = await load()
    const formulas: Record<string, string> = {}
    for (const c of Array.from(sheet.getElementsByTagName("c"))) {
      const f = c.getElementsByTagName("f")[0]
      if (f) formulas[c.getAttribute("r")!] = f.textContent!
    }
    for (let r = 16; r <= 31; r++) expect(formulas[`E${r}`]).toBe(`B${r}*D${r}`)
    expect(formulas.E32).toBe("SUM(E16:E31)")
    expect(formulas.E34).toBe("E32+E33")

    // Evaluate them with real numbers: 2 x 100.50, 10 x 25, other charges 40 -> 201 + 250 = 451, total 491.
    const input: Record<string, number> = { B16: 2, D16: 100.5, B17: 10, D17: 25, E33: 40 }
    const val = (ref: string): number => {
      if (ref in input) return input[ref]
      const f = formulas[ref]
      if (!f) return 0
      let m: RegExpMatchArray | null
      if ((m = f.match(/^([A-Z]\d+)\*([A-Z]\d+)$/))) return val(m[1]) * val(m[2])
      if ((m = f.match(/^SUM\(([A-Z])(\d+):([A-Z])(\d+)\)$/))) { let s = 0; for (let r = Number(m[2]); r <= Number(m[4]); r++) s += val(m[1] + r); return s }
      if ((m = f.match(/^([A-Z]\d+)\+([A-Z]\d+)$/))) return val(m[1]) + val(m[2])
      throw new Error("unsupported formula " + f)
    }
    expect(val("E16")).toBe(201)
    expect(val("E17")).toBe(250)
    expect(val("E32")).toBe(451)
    expect(val("E34")).toBe(491)
  })

  it("has the same sections as the PDF and Word versions", async () => {
    const { sheetXml } = await load()
    const text = [...sheetXml.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((m) => m[1]).join(" ")
    for (const s of ["ROOFING ESTIMATE", "Scope of work", "Customer name", "Description", "Quantity", "Unit price", "Amount", "Subtotal", "TOTAL PRICE", "Customer signature", "not legal advice"]) {
      expect(text, `${s} missing from the Excel file`).toContain(s)
    }
  })
})

describe("template previews", () => {
  /** width and height from a JPEG's start-of-frame marker */
  function jpegSize(buf: Buffer): { w: number; h: number } {
    let i = 2
    while (i < buf.length) {
      if (buf[i] !== 0xff) throw new Error("not a JPEG marker")
      const marker = buf[i + 1]
      const len = buf.readUInt16BE(i + 2)
      if (marker >= 0xc0 && marker <= 0xc3) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) }
      i += 2 + len
    }
    throw new Error("no size found")
  }

  it("every template has a real preview picture of the size the page expects, small enough to load quickly", () => {
    for (const t of TEMPLATES) {
      const file = path.join(process.cwd(), "public", t.preview.src)
      expect(fs.existsSync(file), t.id).toBe(true)
      const buf = fs.readFileSync(file)
      expect(buf[0] === 0xff && buf[1] === 0xd8, `${t.id} is a JPEG`).toBe(true)
      expect(jpegSize(buf), t.id).toEqual({ w: t.preview.width, h: t.preview.height })
      expect(buf.length, `${t.id} size`).toBeLessThan(150 * 1024)
    }
  })
  it("every preview has descriptive alt text that names the template", () => {
    for (const t of TEMPLATES) {
      expect(t.preview.alt.toLowerCase(), t.id).toContain(t.title.toLowerCase())
      expect(t.preview.alt.length).toBeGreaterThan(30)
    }
  })
  it("previews are named after the template and live in one folder", () => {
    for (const t of TEMPLATES) expect(t.preview.src).toBe(`/templates/previews/${t.id}-preview.jpg`)
  })
})
