import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { damage_type, roof_area, field_note } = await request.json()

    if (!damage_type || !roof_area) {
      return NextResponse.json(
        { error: "Missing damage_type or roof_area" },
        { status: 400 }
      )
    }

    const noteSection = field_note
      ? `The contractor's field note states: "${field_note}"`
      : "No additional field notes were provided by the contractor."

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
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
- Do NOT invent specific measurements or dimensions unless the field note includes them.
- Do NOT reference Xactimate codes.
- Do NOT use generic AI filler language.
- Sound like a real supplement writer at a roofing restoration company.
- The tone should be factual and non-adversarial.`,
        },
      ],
    })

    const block = message.content[0]
    const draft = block.type === "text" ? block.text : ""

    return NextResponse.json({ draft })
  } catch (err) {
    console.error("Claude API error:", err)
    const message =
      err instanceof Error ? err.message : "Unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
