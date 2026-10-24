// Builds the free downloadable templates in public/downloads/.
//
//   node scripts/build-templates.mjs
//
// The generated files are committed, so this only needs to run when the
// template wording changes. It uses packages the app already depends on
// (jspdf, docx) plus jszip, which ships with docx.
//
// Content mirrors the published articles:
//   /blog/roofing-estimate-template
//   /blog/roofing-supplement-template
//   /blog/roof-damage-report-template

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { jsPDF } from "jspdf"
import JSZip from "jszip"
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, AlignmentType, Footer, PageNumber, PageBreak,
} from "docx"

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "downloads")
fs.mkdirSync(OUT, { recursive: true })

const FOOTER = "Free template from Supplement Snap (supplementsnap.io). General guidance, not legal advice."

// ───────────────────────── content ─────────────────────────
// Block types: title, h2, fields, para, note, bullets, checks, table, lines, pagebreak.
// fields rows are arrays of one or two labels.

const estimate = {
  file: "roofing-estimate-template",
  title: "Roofing Estimate",
  subtitle: "Fill in the blanks and replace the example wording with your own. Prices are yours to enter.",
  blocks: [
    { t: "h2", text: "Your company" },
    { t: "fields", rows: [["Company name", "License no. (if required)"], ["Address", "Phone"], ["Email"]] },
    { t: "h2", text: "Estimate details" },
    { t: "fields", rows: [["Estimate no.", "Date"], ["Valid until"]] },
    { t: "h2", text: "Customer" },
    { t: "fields", rows: [["Customer name", "Phone"], ["Job address", "Email"]] },
    { t: "h2", text: "Scope of work" },
    { t: "note", text: "Describe what is included, roof area by roof area. Example: Tear off existing shingles on all slopes. Install underlayment. Install [shingle brand and color]. Replace flashing, vents and drip edge as needed. Clean up and haul away debris." },
    { t: "lines", n: 4 },
    { t: "h2", text: "Line items" },
    { t: "note", text: "List materials, labor and other charges separately so the customer can follow the total." },
    { t: "table", cols: [["Description", 46], ["Quantity", 12], ["Unit", 12], ["Unit price", 15], ["Amount", 15]], rows: 12 },
    { t: "h2", text: "Other charges and total" },
    { t: "fields", rows: [["Disposal", "Permit"], ["Delivery", "Other"], ["Total price"]] },
    { t: "h2", text: "What could change the price" },
    { t: "note", text: "Example: hidden decking damage or extra layers found after tear-off, charged at the agreed unit price." },
    { t: "lines", n: 2 },
    { t: "h2", text: "Terms" },
    { t: "fields", rows: [["Payment schedule"], ["Warranty terms"], ["Start date window"]] },
    { t: "h2", text: "Acceptance" },
    { t: "para", text: "By signing, the customer accepts this estimate and its terms." },
    { t: "fields", rows: [["Customer signature", "Date"]] },
    { t: "note", text: "Check your state's licensing, written-contract and cancellation requirements before using this with customers." },
  ],
}

const supplementFinding = (n) => [
  { t: "fields", rows: [[`Finding ${n}: component`], ["Location (for example front slope eave)"], ["Condition (one or two plain sentences)"], ["When found"], ["Why it matters"], ["Needed (repair and quantity)"], ["Photo numbers"]] },
]

const supplement = {
  file: "roofing-supplement-template",
  title: "Roofing Supplement Request",
  subtitle: "A five-part package: cover page, findings summary, findings with photos, line items, and sign-off. Send it as one PDF.",
  blocks: [
    { t: "h2", text: "1. Cover page" },
    { t: "para", text: "Put these on the first page so the adjuster can match the document to the claim. A missing claim number is a common reason a package gets misfiled or delayed." },
    { t: "fields", rows: [
      ["Project name", "Property address"],
      ["Policy holder name", "Claim number"],
      ["Carrier", "Adjuster name"],
      ["Adjuster email", "Adjuster phone"],
      ["Date of loss", "Date of tear-off"],
      ["Date documented"],
      ["Your company name", "Contact person"],
      ["Contact phone", "Contact email"],
    ] },
    { t: "h2", text: "2. Findings summary" },
    { t: "note", text: "A short numbered list of each item and where it is." },
    { t: "table", cols: [["#", 6], ["Component and location", 50], ["Quantity requested", 24], ["Photos", 20]], rows: 8 },
    { t: "h2", text: "3. Findings, one block each" },
    { t: "note", text: "Keep wording neutral and factual. Avoid guessing at causes you cannot prove. Example: Decking, front slope eave. Three sheets of OSB soft and deteriorated from moisture. Found during tear-off. Cannot hold fasteners. Replace three sheets. Photos 4, 5, 6." },
    ...supplementFinding(1),
    ...supplementFinding(2),
    { t: "note", text: "Copy the block above for each additional finding. Put each narrative beside its photos." },
    { t: "h2", text: "4. Line items" },
    { t: "note", text: "Use the format your adjuster uses and the unit prices from the price list on the claim. Show how you got each quantity, for example 12 ft x 8 ft = 96 sq ft. If you build estimates in Xactimate, mirror its item names." },
    { t: "table", cols: [["Item description", 44], ["Quantity", 12], ["Unit", 10], ["Unit price", 17], ["Total", 17]], rows: 10 },
    { t: "h2", text: "5. Sign-off and contact" },
    { t: "para", text: "This supplement documentation was prepared based on concealed conditions discovered during tear-off operations and represents findings not visible during the initial inspection. (Edit this statement so it matches what is true for the job.)" },
    { t: "fields", rows: [["Prepared by", "Date"], ["Phone", "Email"]] },
    { t: "h2", text: "Before you send" },
    { t: "checks", items: [
      "Claim number is on the cover page and in the email subject line",
      "Subject line includes the claim number and the words supplement request",
      "Email body lists the number of findings, the total requested and what is attached",
      "Every finding has a location, a quantity and photo numbers",
      "Sent as a single PDF so nothing gets separated",
      "Follow-up note scheduled in writing a few days later",
    ] },
    { t: "note", text: "This template is a starting point, not legal advice. Your carrier may require its own forms. Adjust it to your carrier's requests and your state's rules." },
  ],
}

const damageFinding = (n) => [
  { t: "fields", rows: [[`Finding no. ${n}`, "Roof area or slope"], ["What was observed"], ["Measurement or count", "Photo numbers"], ["Why it matters (state it factually)"]] },
]

const damageReport = {
  file: "roof-damage-report-template",
  title: "Roof Damage Report",
  subtitle: "Short, specific and easy to verify. Someone who was not on the roof should understand what you found and where.",
  blocks: [
    { t: "h2", text: "Job details" },
    { t: "fields", rows: [["Property address"], ["Date of inspection", "Inspector name"], ["Client name"], ["Carrier", "Claim number"], ["Date of loss"]] },
    { t: "note", text: "Fill in carrier, claim number and date of loss only if applicable." },
    { t: "h2", text: "Roof summary" },
    { t: "fields", rows: [["Roof type and material"], ["Approximate age (if known)", "Number of layers"], ["Number of slopes", "Pitch"], ["General condition (one or two sentences)"]] },
    { t: "h2", text: "Findings" },
    { t: "note", text: "Sample finding (fictional): Finding 3. Rear slope, along the eave. Four sheets of roof decking were soft and deteriorated when walked, found after removing existing shingles and underlayment. Approximately 128 square feet affected. Photos 14 to 19. The condition was not visible from the surface before tear-off. Order: location, observation, quantity, photo reference, then a factual note. Do not guess at cause or argue about coverage." },
    ...damageFinding(1),
    ...damageFinding(2),
    ...damageFinding(3),
    { t: "note", text: "Copy the block for each additional finding." },
    { t: "h2", text: "Recommendations" },
    { t: "note", text: "Tie each recommendation to a numbered finding. Example: Replace damaged decking, rear slope, 128 square feet (Finding 3). Do not recommend work you cannot point to a finding for, and separate what is clearly needed from what is optional." },
    { t: "lines", n: 4 },
    { t: "h2", text: "Photo index" },
    { t: "table", cols: [["Photo #", 14], ["Roof area", 26], ["Short description", 60]], rows: 12 },
    { t: "h2", text: "Photos to take before anything is removed" },
    { t: "checks", items: [
      "The house from four sides",
      "Every slope, from a distance and up close",
      "Pitch, with a gauge or level in the frame",
      "Existing flashing, vents, drip edge and ridge",
      "Visible damage such as impacts, lifted shingles or granule loss",
      "A tape measure or marked area in the frame for scale",
    ] },
    { t: "h2", text: "Attachments" },
    { t: "checks", items: ["Aerial or manual measurement report", "Estimate", "Invoices or other supporting documents"] },
    { t: "note", text: "General guidance, not legal advice. Add whatever your carrier, client or jurisdiction requires." },
  ],
}

// ───────────────────────── PDF ─────────────────────────

function buildPdf(model) {
  const doc = new jsPDF({ unit: "mm", format: "letter" })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 16
  const CW = W - M * 2
  const FOOT = 14
  let y = M

  const ensure = (h) => { if (y + h > H - FOOT) { doc.addPage(); y = M } }
  const dark = () => doc.setTextColor(30, 30, 40)
  const gray = () => doc.setTextColor(110, 110, 120)

  // Approximate height of a block, used to keep a heading with the content under it.
  const textHeight = (text, size) => { doc.setFontSize(size); return doc.splitTextToSize(text, CW - 1.5).length * 4 + 2.5 }
  const blockHeight = (b) => {
    if (b.t === "fields") return b.rows.length * 8.5 + 1
    if (b.t === "lines") return b.n * 7.5 + 1
    if (b.t === "table") return 7 + 16
    if (b.t === "checks" || b.t === "bullets") return b.items.length <= 8 ? b.items.length * 5.7 + 1 : 3 * 5.7 // same rule the block itself uses to stay on one page
    if (b.t === "para") return textHeight(b.text, 9)
    if (b.t === "note") return textHeight(b.text, 8.5)
    return 0
  }
  // Height a heading must keep with it: following notes/paragraphs plus the first real block, capped.
  const keepWithHeading = (idx) => {
    let h = 0
    for (let i = idx + 1; i < model.blocks.length; i++) {
      const nb = model.blocks[i]
      h += blockHeight(nb)
      if (nb.t !== "note" && nb.t !== "para") break
    }
    return Math.min(h, 75)
  }

  // title
  doc.setFont("helvetica", "bold"); doc.setFontSize(20); dark()
  doc.text(model.title.toUpperCase(), M, y + 6); y += 10
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); gray()
  const sub = doc.splitTextToSize(model.subtitle, CW)
  doc.text(sub, M, y); y += sub.length * 4.2 + 1
  doc.setDrawColor(79, 70, 229); doc.setLineWidth(0.8); doc.line(M, y, W - M, y); y += 6

  for (const [bi, b] of model.blocks.entries()) {
    if (b.t === "h2") {
      ensure(12 + keepWithHeading(bi)); y += 3
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); dark(); doc.text(b.text, M, y)
      y += 2; doc.setDrawColor(210, 210, 220); doc.setLineWidth(0.3); doc.line(M, y, W - M, y); y += 5.5
    } else if (b.t === "para" || b.t === "note") {
      const italic = b.t === "note"
      doc.setFont("helvetica", italic ? "italic" : "normal"); doc.setFontSize(italic ? 8.5 : 9)
      italic ? gray() : dark()
      const lines = doc.splitTextToSize(b.text, CW - 1.5)
      ensure(lines.length * 4 + 2)
      doc.text(lines, M, y); y += lines.length * 4 + 2.5
    } else if (b.t === "fields") {
      const gap = 8
      ensure(b.rows.length * 8.5 + 1) // keep the whole block of fields on one page
      for (const row of b.rows) {
        ensure(9)
        const colW = row.length === 2 ? (CW - gap) / 2 : CW
        row.forEach((label, i) => {
          const x = M + i * (colW + gap)
          doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); gray()
          const lw = Math.min(doc.getTextWidth(label) + 2, colW * 0.62)
          const shown = doc.splitTextToSize(label, colW * 0.62)[0]
          doc.text(shown, x, y)
          doc.setDrawColor(150, 150, 160); doc.setLineWidth(0.25)
          doc.line(x + lw, y + 1, x + colW, y + 1)
        })
        y += 8.5
      }
      y += 1
    } else if (b.t === "lines") {
      for (let i = 0; i < b.n; i++) {
        ensure(8); doc.setDrawColor(150, 150, 160); doc.setLineWidth(0.25); doc.line(M, y + 1, W - M, y + 1); y += 7.5
      }
      y += 1
    } else if (b.t === "bullets" || b.t === "checks") {
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); dark()
      if (b.items.length <= 8) ensure(b.items.length * 5.7 + 1) // keep a short checklist on one page
      for (const item of b.items) {
        const lines = doc.splitTextToSize(item, CW - 7)
        ensure(lines.length * 4.2 + 1.5)
        if (b.t === "checks") { doc.setDrawColor(90, 90, 100); doc.setLineWidth(0.3); doc.rect(M, y - 2.8, 3.2, 3.2) }
        else doc.text("•", M + 0.5, y)
        doc.text(lines, M + 6, y); y += lines.length * 4.2 + 1.5
      }
      y += 1
    } else if (b.t === "table") {
      const total = b.cols.reduce((s, c) => s + c[1], 0)
      const widths = b.cols.map((c) => (c[1] / total) * CW)
      const header = () => {
        doc.setFillColor(238, 240, 246); doc.setDrawColor(190, 190, 200); doc.setLineWidth(0.25)
        let x = M
        b.cols.forEach((c, i) => {
          doc.rect(x, y, widths[i], 7, "FD")
          doc.setFont("helvetica", "bold"); doc.setFontSize(8); dark(); doc.text(c[0], x + 1.8, y + 4.7)
          x += widths[i]
        })
        y += 7
      }
      ensure(7 + 8 * 2); header()
      for (let r = 0; r < b.rows; r++) {
        if (y + 8 > H - FOOT) { doc.addPage(); y = M; header() }
        let x = M
        doc.setDrawColor(190, 190, 200); doc.setLineWidth(0.25)
        widths.forEach((w) => { doc.rect(x, y, w, 8); x += w })
        y += 8
      }
      y += 3
    } else if (b.t === "pagebreak") {
      doc.addPage(); y = M
    }
  }

  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(150, 150, 160)
    doc.text(FOOTER, M, H - 8)
    doc.text(`Page ${p} of ${pages}`, W - M, H - 8, { align: "right" })
  }
  doc.setProperties({ title: model.title, subject: "Free template from Supplement Snap", creator: "Supplement Snap" })
  return Buffer.from(doc.output("arraybuffer"))
}

// ───────────────────────── DOCX ─────────────────────────

const TW = 10240 // content width in twips (US Letter, 1000 twip margins)
const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE }
const lineBorder = { style: BorderStyle.SINGLE, size: 4, color: "999999" }
const gridBorder = { style: BorderStyle.SINGLE, size: 4, color: "BBBBBB" }

function run(text, o = {}) { return new TextRun({ text, font: "Calibri", ...o }) }

function buildDocx(model) {
  const kids = []
  kids.push(new Paragraph({ spacing: { after: 60 }, children: [run(model.title.toUpperCase(), { bold: true, size: 40 })] }))
  kids.push(new Paragraph({
    spacing: { after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "4F46E5", space: 4 } },
    children: [run(model.subtitle, { size: 18, color: "6E6E78" })],
  }))

  for (const b of model.blocks) {
    if (b.t === "h2") {
      kids.push(new Paragraph({
        spacing: { before: 240, after: 100 }, keepNext: true,
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "D2D2DC", space: 2 } },
        children: [run(b.text, { bold: true, size: 22 })],
      }))
    } else if (b.t === "para") {
      kids.push(new Paragraph({ spacing: { after: 100 }, children: [run(b.text, { size: 19 })] }))
    } else if (b.t === "note") {
      kids.push(new Paragraph({ spacing: { after: 100 }, children: [run(b.text, { size: 17, italics: true, color: "6E6E78" })] }))
    } else if (b.t === "fields") {
      const rows = b.rows.map((row) => {
        const cells = []
        if (row.length === 2) {
          row.forEach((label) => {
            cells.push(new TableCell({ width: { size: 1900, type: WidthType.DXA }, borders: noBorders, margins: { top: 90, bottom: 40 },
              children: [new Paragraph({ children: [run(label, { bold: true, size: 17, color: "6E6E78" })] })] }))
            cells.push(new TableCell({ width: { size: 3220, type: WidthType.DXA }, borders: { ...noBorders, bottom: lineBorder }, margins: { top: 90, bottom: 40 },
              children: [new Paragraph({ children: [run(" ", { size: 19 })] })] }))
          })
        } else {
          cells.push(new TableCell({ width: { size: 1900, type: WidthType.DXA }, borders: noBorders, margins: { top: 90, bottom: 40 },
            children: [new Paragraph({ children: [run(row[0], { bold: true, size: 17, color: "6E6E78" })] })] }))
          cells.push(new TableCell({ width: { size: 8340, type: WidthType.DXA }, columnSpan: 3, borders: { ...noBorders, bottom: lineBorder }, margins: { top: 90, bottom: 40 },
            children: [new Paragraph({ children: [run(" ", { size: 19 })] })] }))
        }
        return new TableRow({ cantSplit: true, children: cells })
      })
      kids.push(new Table({ width: { size: TW, type: WidthType.DXA }, columnWidths: [1900, 3220, 1900, 3220], borders: { ...noBorders, insideHorizontal: NONE, insideVertical: NONE }, rows }))
    } else if (b.t === "lines") {
      for (let i = 0; i < b.n; i++) {
        kids.push(new Paragraph({ spacing: { before: 120, after: 20 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999", space: 1 } }, children: [run(" ", { size: 19 })] }))
      }
    } else if (b.t === "bullets" || b.t === "checks") {
      for (const item of b.items) {
        kids.push(new Paragraph({ spacing: { after: 40 }, indent: { left: 360, hanging: 360 }, children: [run(b.t === "checks" ? "☐\t" : "•\t", { size: 19 }), run(item, { size: 19 })] }))
      }
    } else if (b.t === "table") {
      const total = b.cols.reduce((s, c) => s + c[1], 0)
      const widths = b.cols.map((c) => Math.round((c[1] / total) * TW))
      const head = new TableRow({ tableHeader: true, cantSplit: true, children: b.cols.map((c, i) => new TableCell({
        width: { size: widths[i], type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: "auto", fill: "EEF0F6" },
        borders: { top: gridBorder, bottom: gridBorder, left: gridBorder, right: gridBorder },
        children: [new Paragraph({ children: [run(c[0], { bold: true, size: 17 })] })],
      })) })
      const body = Array.from({ length: b.rows }, () => new TableRow({ cantSplit: true, height: { value: 400, rule: "atLeast" }, children: widths.map((w) => new TableCell({
        width: { size: w, type: WidthType.DXA }, borders: { top: gridBorder, bottom: gridBorder, left: gridBorder, right: gridBorder },
        children: [new Paragraph({ children: [run(" ", { size: 19 })] })],
      })) }))
      kids.push(new Table({ width: { size: TW, type: WidthType.DXA }, columnWidths: widths, rows: [head, ...body] }))
      kids.push(new Paragraph({ spacing: { after: 60 }, children: [] }))
    } else if (b.t === "pagebreak") {
      kids.push(new Paragraph({ children: [new PageBreak()] }))
    }
  }

  const doc = new Document({
    creator: "Supplement Snap",
    title: model.title,
    description: "Free template from Supplement Snap",
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
        run(FOOTER + "   Page ", { size: 14, color: "969696" }),
        new TextRun({ children: [PageNumber.CURRENT], size: 14, color: "969696", font: "Calibri" }),
        run(" of ", { size: 14, color: "969696" }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: "969696", font: "Calibri" }),
      ] })] }) },
      children: kids,
    }],
  })
  return Packer.toBuffer(doc)
}

// ───────────────────────── XLSX (estimate only) ─────────────────────────

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

async function buildXlsx() {
  // Style indexes (cellXfs): 0 default, 1 bold label, 2 title, 3 table header, 4 input box,
  // 5 money (hides zero), 6 bold money, 7 note, 8 wrapped input box, 9 plain number input box
  const rows = []
  const cell = (ref, v, s = 0) => (v === "" || v == null ? `<c r="${ref}" s="${s}"/>` : `<c r="${ref}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`)
  const formula = (ref, f, s) => `<c r="${ref}" s="${s}"><f>${esc(f)}</f><v>0</v></c>`
  const row = (n, cells, ht) => rows.push(`<row r="${n}"${ht ? ` ht="${ht}" customHeight="1"` : ""}>${cells.join("")}</row>`)

  row(1, [cell("A1", "ROOFING ESTIMATE", 2)], 24)
  row(2, [cell("A2", "Fill in the boxes. Amounts and totals calculate for you. Replace the example wording with your own.", 7)])
  row(4, [cell("A4", "Company name", 1), cell("B4", "", 4), cell("D4", "Estimate no.", 1), cell("E4", "", 4)])
  row(5, [cell("A5", "Address", 1), cell("B5", "", 4), cell("D5", "Date", 1), cell("E5", "", 4)])
  row(6, [cell("A6", "Phone / email", 1), cell("B6", "", 4), cell("D6", "Valid until", 1), cell("E6", "", 4)])
  row(7, [cell("A7", "License no. (if required)", 1), cell("B7", "", 4)])
  row(9, [cell("A9", "Customer name", 1), cell("B9", "", 4), cell("D9", "Phone / email", 1), cell("E9", "", 4)])
  row(10, [cell("A10", "Job address", 1), cell("B10", "", 4)])
  row(12, [cell("A12", "Scope of work", 1), cell("B12", "", 8), cell("C12", "", 8), cell("D12", "", 8), cell("E12", "", 8)], 48)
  row(13, [cell("A13", "Example: Tear off existing shingles on all slopes. Install underlayment. Install [shingle brand and color]. Replace flashing, vents and drip edge as needed. Clean up and haul away debris.", 7)])
  row(15, ["Description", "Quantity", "Unit", "Unit price", "Amount"].map((h, i) => cell(`${"ABCDE"[i]}15`, h, 3)))
  for (let r = 16; r <= 31; r++) {
    row(r, [cell(`A${r}`, "", 4), cell(`B${r}`, "", 9), cell(`C${r}`, "", 4), cell(`D${r}`, "", 9), formula(`E${r}`, `B${r}*D${r}`, 5)])
  }
  row(32, [cell("D32", "Subtotal", 1), formula("E32", "SUM(E16:E31)", 5)])
  row(33, [cell("D33", "Other charges (disposal, permit, delivery)", 1), cell("E33", "", 9)])
  row(34, [cell("D34", "TOTAL PRICE", 1), formula("E34", "E32+E33", 6)])
  row(36, [cell("A36", "What could change the price", 1), cell("B36", "", 8), cell("C36", "", 8), cell("D36", "", 8), cell("E36", "", 8)], 36)
  row(37, [cell("A37", "Example: hidden decking damage or extra layers found after tear-off, charged at the agreed unit price.", 7)])
  row(38, [cell("A38", "Terms (payment, warranty, start window)", 1), cell("B38", "", 8), cell("C38", "", 8), cell("D38", "", 8), cell("E38", "", 8)], 48)
  row(40, [cell("A40", "Customer signature", 1), cell("B40", "", 4), cell("D40", "Date", 1), cell("E40", "", 4)], 24)
  row(42, [cell("A42", "By signing, the customer accepts this estimate and its terms. Check your state's licensing, written-contract and cancellation requirements before using this with customers.", 7)])
  row(43, [cell("A43", FOOTER, 7)])

  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:E43"/><sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols><col min="1" max="1" width="34" customWidth="1"/><col min="2" max="2" width="14" customWidth="1"/><col min="3" max="3" width="12" customWidth="1"/><col min="4" max="4" width="40" customWidth="1"/><col min="5" max="5" width="18" customWidth="1"/></cols><sheetData>${rows.join("")}</sheetData><mergeCells count="6"><mergeCell ref="B12:E12"/><mergeCell ref="B36:E36"/><mergeCell ref="B38:E38"/><mergeCell ref="A13:E13"/><mergeCell ref="A37:E37"/><mergeCell ref="A42:E42"/></mergeCells><pageMargins left="0.6" right="0.6" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup orientation="portrait" fitToWidth="1" fitToHeight="0"/></worksheet>`

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00;-#,##0.00;;@"/></numFmts><fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="16"/><name val="Calibri"/></font><font><i/><sz val="9"/><color rgb="FF6E6E78"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEEF0F6"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFBBBBBB"/></left><right style="thin"><color rgb="FFBBBBBB"/></right><top style="thin"><color rgb="FFBBBBBB"/></top><bottom style="thin"><color rgb="FFBBBBBB"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="10"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/><xf numFmtId="164" fontId="1" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`

  const zip = new JSZip()
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`)
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`)
  zip.file("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets><sheet name="Estimate" sheetId="1" r:id="rId1"/></sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`)
  zip.file("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`)
  zip.file("xl/styles.xml", styles)
  zip.file("xl/worksheets/sheet1.xml", sheet)
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
}

// ───────────────────────── write ─────────────────────────

const write = (name, buf) => { fs.writeFileSync(path.join(OUT, name), buf); console.log(name.padEnd(46), (buf.length / 1024).toFixed(1) + " KB") }

for (const model of [estimate, supplement, damageReport]) {
  write(`${model.file}.pdf`, buildPdf(model))
  write(`${model.file}.docx`, await buildDocx(model))
}
write(`${estimate.file}.xlsx`, await buildXlsx())
