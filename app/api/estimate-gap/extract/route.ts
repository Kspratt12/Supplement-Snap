import { NextResponse } from "next/server"
import { requireGapAccess } from "../../../../lib/estimate-gap/guard"
import { extractPdfPages, ExtractError, MAX_PDF_BYTES, EXTRACT_MESSAGES } from "../../../../lib/estimate-gap/extract"
import { parseDocument } from "../../../../lib/estimate-gap/parse"

export const runtime = "nodejs"

/**
 * Reads ONE estimate PDF and returns the line items found in it. The file is processed in memory and is never
 * saved, and its contents are never logged. Access is checked before the upload is read.
 */
export async function POST(request: Request) {
  const guard = await requireGapAccess(request, "gap-extract", 30)
  if (guard instanceof NextResponse) return guard

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: "The upload could not be read." }, { status: 400 })
  }
  const role = form.get("role")
  const file = form.get("file")
  if (role !== "insurer" && role !== "contractor") return NextResponse.json({ error: "Say whether this is the insurance or the contractor estimate." }, { status: 400 })
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a PDF file." }, { status: 400 })
  if (file.size > MAX_PDF_BYTES) return NextResponse.json({ error: EXTRACT_MESSAGES.too_large, code: "too_large" }, { status: 413 })

  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const { pages, pageCount } = await extractPdfPages(bytes)
    const document = parseDocument(role, pages)
    return NextResponse.json({ document, pageCount }, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    if (err instanceof ExtractError) return NextResponse.json({ error: err.message, code: err.code }, { status: 422 })
    // Do not log anything about the document itself
    console.error("Gap Detector: unexpected read failure")
    return NextResponse.json({ error: "Something went wrong reading this file. Please try again.", code: "unreadable" }, { status: 500 })
  }
}
