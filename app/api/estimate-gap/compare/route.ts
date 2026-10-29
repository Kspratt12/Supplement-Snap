import { NextResponse } from "next/server"
import { requireGapAccess } from "../../../../lib/estimate-gap/guard"
import { compareEstimates } from "../../../../lib/estimate-gap/compare"
import { validateCorrections, validateDocument } from "../../../../lib/estimate-gap/validate"

export const runtime = "nodejs"

/**
 * Compares two already-read estimates, with the person's corrections and match decisions applied.
 * The calculation is the deterministic engine in lib/estimate-gap. Nothing is stored.
 */
export async function POST(request: Request) {
  const guard = await requireGapAccess(request, "gap-compare", 240)
  if (guard instanceof NextResponse) return guard

  let body: { insurer?: unknown; contractor?: unknown; corrections?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "The request could not be read." }, { status: 400 })
  }
  const insurer = validateDocument(body.insurer, "insurer")
  const contractor = validateDocument(body.contractor, "contractor")
  const corrections = validateCorrections(body.corrections)
  if (!insurer || !contractor || !corrections) {
    return NextResponse.json({ error: "The documents are not in the expected form. Read them again and retry." }, { status: 400 })
  }
  return NextResponse.json({ result: compareEstimates(insurer, contractor, corrections) }, { headers: { "Cache-Control": "no-store" } })
}
