import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "../../../lib/auth-utils"
import { rateLimited } from "../../../lib/rate-limit"
import { getAccess } from "../../../lib/plan"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const access = await getAccess(user.id, user.email)
  if (rateLimited(`ai:${user.id}`, access.active ? 120 : 15, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
  }

  try {
    const { damage_type, roof_area, field_note } = await request.json()

    if (!damage_type || !roof_area) {
      return NextResponse.json(
        { error: "Missing damage_type or roof_area" },
        { status: 400 }
      )
    }

    // Hallucination guard: if field note is extremely brief (under 10 chars),
    // instruct the model to stay minimal and not invent details
    const isMinimalNote = !field_note || field_note.trim().length < 10
    const noteSection = field_note
      ? `The contractor's field note states: "${field_note}"`
      : "No additional field notes were provided by the contractor."

    const hallucGuard = isMinimalNote
      ? `\n- IMPORTANT: The field note is very brief or absent. Write ONLY 1-2 sentences. Do NOT invent specific damage details, measurements, quantities, causes, or conditions not stated in the note. Do NOT cite any building code and do NOT claim that repair or replacement is required. Only state the damage type, the roof area, and that the contractor documented it during tear-off. The contractor must add the detail before this is sent.`
      : ""

    const message = await anthropic.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `You are a roofing insurance supplement documentation assistant. Write a short, professional supplement-ready paragraph for an insurance claim based on damage found during roof tear-off.

Damage type: ${damage_type}
Roof area: ${roof_area}
${noteSection}

Rules:
- Write 2-4 sentences maximum.
- Use professional, insurance-friendly language.
- State that the damage was discovered during tear-off and was not visible prior to shingle removal.
- Where applicable, reference the relevant building code requirement (e.g., IRC R905.2.8.2 for ice barrier, IRC R903.2 for flashing, IRC R906.1 for ventilation, local building code for decking replacement). Only cite a code if it genuinely applies to the damage type.
- Do NOT invent specific measurements, dimensions, causes or conditions unless the field note includes them. Use only facts given above.
- Cite a building code only when the field note or damage type clearly supports it, and the contractor will verify it against their local code.
- Do NOT reference Xactimate codes.
- Do NOT use generic AI filler language.
- Sound like a real supplement writer at a roofing restoration company.
- The tone should be factual and non-adversarial.
- Plain text only: no markdown, asterisks or headings.${hallucGuard}`,
        },
      ],
    })

    // Read every text block: the first block is not always text
    const draft = message.content.filter((b) => b.type === "text").map((b) => b.text).join("")
    if (!draft.trim()) {
      console.error("Claude returned no text", { stop_reason: message.stop_reason, blocks: message.content.map((b) => b.type) })
      return NextResponse.json({ error: "The AI returned an empty draft. Please try again." }, { status: 502 })
    }

    return NextResponse.json({ draft })
  } catch (err) {
    console.error("Claude API error:", err)
    const message =
      err instanceof Error ? err.message : "Unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
