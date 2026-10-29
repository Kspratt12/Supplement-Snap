import type { PageText } from "./types"

/**
 * Reads the text of a PDF, page by page, in memory. Nothing is written to disk or storage.
 *
 * It only reads text that is really in the file. A scanned page (a picture of text) has no text layer, so it comes
 * back empty and is reported as such; this code does not guess at it and does no image reading.
 */

export const MAX_PDF_BYTES = 4 * 1024 * 1024 // stays under the hosting platform's request size limit
export const MAX_PDF_PAGES = 60

export type ExtractErrorCode = "not_a_pdf" | "too_large" | "empty" | "password_protected" | "damaged" | "too_many_pages" | "unreadable"

export class ExtractError extends Error {
  code: ExtractErrorCode
  constructor(code: ExtractErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

export const EXTRACT_MESSAGES: Record<ExtractErrorCode, string> = {
  not_a_pdf: "This file is not a PDF. Upload the estimate as a PDF file.",
  too_large: "This PDF is larger than 4 MB. Save a smaller copy and try again.",
  empty: "This file is empty.",
  password_protected: "This PDF is password protected. Remove the password and upload it again.",
  damaged: "This PDF could not be opened. It may be damaged. Try saving or printing it to a new PDF.",
  too_many_pages: `This PDF has more than ${MAX_PDF_PAGES} pages. Upload only the estimate pages.`,
  unreadable: "This PDF could not be read. Try saving a new copy and uploading that.",
}

const fail = (code: ExtractErrorCode) => new ExtractError(code, EXTRACT_MESSAGES[code])

/** Checks the file really is a PDF by its first bytes, never by its name or the type the browser reported */
export function checkPdfBytes(data: Uint8Array): void {
  if (data.byteLength === 0) throw fail("empty")
  if (data.byteLength > MAX_PDF_BYTES) throw fail("too_large")
  // "%PDF-" must appear within the first 1024 bytes
  const head = new TextDecoder("latin1").decode(data.subarray(0, Math.min(1024, data.byteLength)))
  if (!head.includes("%PDF-")) throw fail("not_a_pdf")
}

type TextItem = { str: string; transform: number[]; width?: number; hasEOL?: boolean }

/** Groups the text pieces of one page into rows by their position, left to right, top to bottom */
export function rowsFromItems(items: TextItem[]): string {
  const pieces = items
    .filter((i) => typeof i.str === "string" && i.str.trim() !== "" && Array.isArray(i.transform))
    .map((i) => ({ text: i.str, x: i.transform[4], y: i.transform[5] }))
  pieces.sort((a, b) => b.y - a.y || a.x - b.x)
  const rows: Array<{ y: number; parts: Array<{ x: number; text: string }> }> = []
  for (const p of pieces) {
    const row = rows.find((r) => Math.abs(r.y - p.y) <= 2.5)
    if (row) row.parts.push({ x: p.x, text: p.text })
    else rows.push({ y: p.y, parts: [{ x: p.x, text: p.text }] })
  }
  return rows
    .sort((a, b) => b.y - a.y)
    .map((r) => r.parts.sort((a, b) => a.x - b.x).map((p) => p.text.trim()).join(" "))
    .join("\n")
}

export async function extractPdfPages(data: Uint8Array): Promise<{ pages: PageText[]; pageCount: number }> {
  checkPdfBytes(data)
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
  // The library is given its own copy of the bytes so the caller's copy is not consumed
  const copy = new Uint8Array(data)
  let doc: Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]>
  try {
    doc = await pdfjs.getDocument({ data: copy, isEvalSupported: false, useSystemFonts: false, disableFontFace: true, verbosity: 0 }).promise
  } catch (err) {
    const name = (err as { name?: string })?.name || ""
    if (name === "PasswordException") throw fail("password_protected")
    if (name === "InvalidPDFException" || name === "FormatError" || name === "MissingPDFException") throw fail("damaged")
    throw fail("unreadable")
  }
  try {
    if (doc.numPages > MAX_PDF_PAGES) throw fail("too_many_pages")
    const pages: PageText[] = []
    for (let n = 1; n <= doc.numPages; n++) {
      try {
        const page = await doc.getPage(n)
        const content = await page.getTextContent()
        pages.push({ page: n, text: rowsFromItems(content.items as TextItem[]) })
      } catch {
        // One bad page does not stop the rest; it is reported as a page with no readable text
        pages.push({ page: n, text: "" })
      }
    }
    return { pages, pageCount: doc.numPages }
  } finally {
    await doc.destroy().catch(() => {})
  }
}
