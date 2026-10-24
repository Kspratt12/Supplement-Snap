import type { jsPDF } from "jspdf"

export interface PageGeometry {
  pageHeight: number
  margin: number
}

// Space kept clear at the bottom of every page for the footer.
const FOOTER_RESERVE = 15

/**
 * Starts a new page when `needed` mm will not fit below `y`. Returns the y to
 * continue from. It deliberately draws nothing and changes no font, size or
 * color: the page footer ("Page N of M") is drawn once at the end of the
 * document, and a footer drawn here would leak its light-gray 7pt style into
 * the text that follows the break.
 */
export function ensureSpace(doc: jsPDF, y: number, needed: number, geometry: PageGeometry): number {
  if (y + needed > geometry.pageHeight - FOOTER_RESERVE) {
    doc.addPage()
    return geometry.margin
  }
  return y
}

/** Small gray section label, e.g. "SUPPORTING PHOTOS (2)". Returns the new y. */
export function drawSectionLabel(doc: jsPDF, y: number, label: string, margin: number, gap = 3.5): number {
  doc.setFontSize(7.5)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(130, 130, 140)
  doc.text(label, margin, y)
  return y + gap
}

interface LabeledTextOptions {
  label: string
  text: string
  margin: number
  contentWidth: number
  geometry: PageGeometry
  /** Draw the text inside a bordered, lightly filled box (used for the supplement explanation). */
  boxed?: boolean
}

/**
 * Draws a section label followed by its text. The label and the text are kept
 * together: if the text will not fit on the current page, the label moves to
 * the next page with it instead of being left alone at the bottom of a page.
 */
export function drawLabeledText(doc: jsPDF, y: number, opts: LabeledTextOptions): number {
  const { label, text, margin, contentWidth, geometry, boxed } = opts

  // Measure first, using the same font the text will be drawn in.
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  const lines = doc.splitTextToSize(text, boxed ? contentWidth - 8 : contentWidth)
  const boxHeight = lines.length * 4 + 6
  const bodyNeeded = boxed ? boxHeight + 2 : lines.length * 4 + 2

  let cursor = ensureSpace(doc, y, 3.5 + bodyNeeded, geometry)
  cursor = drawSectionLabel(doc, cursor, label, margin)

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  if (boxed) {
    doc.setTextColor(50, 50, 60)
    doc.setFillColor(248, 248, 252)
    doc.setDrawColor(220, 220, 230)
    doc.setLineWidth(0.3)
    doc.roundedRect(margin, cursor - 2, contentWidth, boxHeight, 2, 2, "FD")
    doc.text(lines, margin + 4, cursor + 2)
    return cursor + boxHeight + 3
  }

  doc.setTextColor(60, 60, 70)
  doc.text(lines, margin, cursor)
  return cursor + lines.length * 4 + 3
}
