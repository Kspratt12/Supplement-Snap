import { describe, it, expect } from "vitest"
import { jsPDF } from "jspdf"
import { ensureSpace, drawLabeledText, drawSectionLabel } from "../lib/pdf-layout"

/**
 * Report PDF layout: page breaks must not strand a section label at the
 * bottom of a page, and must not change the style of the text that follows.
 *
 * These tests run real jsPDF documents and record every doc.text() call with
 * the page it landed on and the style it was drawn in.
 */

const margin = 18

interface Call {
  text: string
  page: number
  y: number
  color: string
  size: number
}

function setup() {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()
  const calls: Call[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyDoc = doc as any
  const original = anyDoc.text.bind(doc)
  anyDoc.text = (text: unknown, x: number, y: number, ...rest: unknown[]) => {
    calls.push({
      text: Array.isArray(text) ? (text as string[]).join(" ") : String(text),
      page: doc.getCurrentPageInfo().pageNumber,
      y,
      color: doc.getTextColor(),
      size: doc.getFontSize(),
    })
    return original(text, x, y, ...rest)
  }
  return { doc, calls, geometry: { pageHeight, margin }, contentWidth: pageWidth - margin * 2, pageHeight }
}

function expectedColor(r: number, g: number, b: number): string {
  const ref = new jsPDF()
  ref.setTextColor(r, g, b)
  return ref.getTextColor()
}

const LONG_TEXT = "Step flashing severely corroded with multiple separation points at the chimney. ".repeat(14)
const SHORT_TEXT = "Rotted decking along the eave."

describe("ensureSpace", () => {
  it("stays on the page when the content fits", () => {
    const { doc, geometry } = setup()
    expect(ensureSpace(doc, 50, 20, geometry)).toBe(50)
    expect(doc.getNumberOfPages()).toBe(1)
  })

  it("starts a new page at the top margin when the content does not fit", () => {
    const { doc, geometry } = setup()
    expect(ensureSpace(doc, 270, 20, geometry)).toBe(margin)
    expect(doc.getNumberOfPages()).toBe(2)
  })

  it("draws nothing and leaves the text style alone across a page break", () => {
    const { doc, calls, geometry } = setup()
    doc.setFontSize(9)
    doc.setTextColor(50, 50, 60)
    const colorBefore = doc.getTextColor()
    ensureSpace(doc, 270, 20, geometry)
    expect(calls).toHaveLength(0)
    expect(doc.getFontSize()).toBe(9)
    expect(doc.getTextColor()).toBe(colorBefore)
  })
})

describe("drawLabeledText", () => {
  it("keeps the label and its text on the same page when it all fits", () => {
    const { doc, calls, geometry, contentWidth } = setup()
    const endY = drawLabeledText(doc, 50, { label: "FIELD NOTE", text: SHORT_TEXT, margin, contentWidth, geometry })
    expect(calls.map((c) => c.page)).toEqual([1, 1])
    expect(endY).toBeGreaterThan(50)
    expect(doc.getNumberOfPages()).toBe(1)
  })

  it("moves the label to the next page together with its text", () => {
    const { doc, calls, geometry, contentWidth } = setup()
    const startY = 250 // too low for a long explanation to fit below it
    const endY = drawLabeledText(doc, startY, { label: "SUPPLEMENT EXPLANATION", text: LONG_TEXT, margin, contentWidth, geometry, boxed: true })
    const label = calls[0]
    const body = calls[1]
    expect(label.text).toBe("SUPPLEMENT EXPLANATION")
    expect(body.page).toBe(label.page)
    expect(label.page).toBe(2)
    expect(label.y).toBe(margin)
    expect(endY).toBeGreaterThan(margin)
  })

  it("draws the text after a page break in the intended color and size, not the footer style", () => {
    const { doc, calls, geometry, contentWidth } = setup()
    drawLabeledText(doc, 250, { label: "SUPPLEMENT EXPLANATION", text: LONG_TEXT, margin, contentWidth, geometry, boxed: true })
    const body = calls[1]
    expect(body.size).toBe(9)
    expect(body.color).toBe(expectedColor(50, 50, 60))
    // The old per-break footer used a light gray (180, written as "0.706 g") at 7pt; it must not appear on page 2.
    const page2 = (doc.internal.pages as unknown as string[][])[2].join("\n")
    expect(page2).not.toMatch(/0\.706 g/)
    expect(page2).not.toMatch(/\/F\d+ 7 Tf/)
    // Sanity check that the assertion above can see styles: the intended 9pt body style is present.
    expect(page2).toMatch(/\/F\d+ 9 Tf/)
  })

  it("uses the note color for unboxed text", () => {
    const { doc, calls, geometry, contentWidth } = setup()
    drawLabeledText(doc, 50, { label: "FIELD NOTE", text: SHORT_TEXT, margin, contentWidth, geometry })
    expect(calls[1].color).toBe(expectedColor(60, 60, 70))
    expect(calls[0].color).toBe(expectedColor(130, 130, 140))
  })
})

describe("a full multi-finding report", () => {
  it("never leaves a label alone at the bottom of a page and never draws a per-break footer", () => {
    const { doc, calls, geometry, contentWidth } = setup()
    let y = margin
    const photoMarkers: { page: number; y: number }[] = []
    const findings = 25

    for (let i = 0; i < findings; i++) {
      // Finding header (same reservation the real builder makes)
      y = ensureSpace(doc, y, 30, geometry)
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(24, 24, 27)
      doc.text(`${i + 1} Decking - Front`, margin, y)
      y += 10.5

      y = drawLabeledText(doc, y, { label: "FIELD NOTE", text: i % 2 ? SHORT_TEXT : LONG_TEXT, margin, contentWidth, geometry })
      y = drawLabeledText(doc, y, { label: "SUPPLEMENT EXPLANATION", text: LONG_TEXT, margin, contentWidth, geometry, boxed: true })

      // Photo: reserve room for the label and the photo together, then draw the label
      const photoHeight = 60
      y = ensureSpace(doc, y, 4 + photoHeight + 12, geometry)
      y = drawSectionLabel(doc, y, "SUPPORTING PHOTOS (1)", margin, 4)
      photoMarkers.push({ page: doc.getCurrentPageInfo().pageNumber, y })
      doc.rect(margin, y, 120, photoHeight)
      y += photoHeight + 4
    }

    expect(doc.getNumberOfPages()).toBeGreaterThan(5)

    const labels = ["FIELD NOTE", "SUPPLEMENT EXPLANATION", "SUPPORTING PHOTOS (1)"]
    calls.forEach((call, idx) => {
      if (!labels.includes(call.text)) return
      // A label always sits above the footer reserve...
      expect(call.y).toBeLessThan(geometry.pageHeight - 15)
      // ...and the next piece of text (its body) is on the same page.
      if (call.text !== "SUPPORTING PHOTOS (1)") {
        expect(calls[idx + 1].page).toBe(call.page)
      }
    })
    // Every photo label was drawn on the same page as its photo.
    photoMarkers.forEach((m) => expect(m.y + 60).toBeLessThanOrEqual(geometry.pageHeight - 15))
    // No stray "Page N" text from the page-break helper (the final footer draws "Page N of M").
    expect(calls.some((c) => /^Page \d+$/.test(c.text))).toBe(false)
  })
})

describe("control: the previous inline logic", () => {
  // Reproduces the old behavior to prove these tests detect the bug it caused.
  it("strands the explanation label on one page and its text on the next", () => {
    const { doc, calls, geometry, contentWidth } = setup()
    let y = 250
    const checkPage = (needed: number) => {
      if (y + needed > geometry.pageHeight - 15) {
        doc.setFontSize(7)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(180, 180, 180)
        doc.text(`Page ${doc.getNumberOfPages()}`, 105, geometry.pageHeight - 8, { align: "center" })
        doc.addPage()
        y = margin
      }
    }
    checkPage(15)
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(130, 130, 140)
    doc.text("SUPPLEMENT EXPLANATION", margin, y)
    y += 3.5
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(50, 50, 60)
    const lines = doc.splitTextToSize(LONG_TEXT, contentWidth - 8)
    checkPage(lines.length * 4 + 8)
    doc.text(lines, margin + 4, y)

    const label = calls.find((c) => c.text === "SUPPLEMENT EXPLANATION")!
    const body = calls[calls.length - 1]
    expect(label.page).toBe(1)
    expect(body.page).toBe(2)
    // and the text on page 2 was drawn in the leaked footer style (light gray, 7pt), not the intended one
    expect(body.color).toBe(expectedColor(180, 180, 180))
    expect(body.size).toBe(7)
    const page2 = (doc.internal.pages as unknown as string[][])[2].join("\n")
    expect(page2).toMatch(/0\.706 g/)
    expect(page2).toMatch(/\/F\d+ 7 Tf/)
  })
})
