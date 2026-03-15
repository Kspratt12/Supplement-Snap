import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { project_name, property_address, captures } = await request.json()

    if (!captures || captures.length === 0) {
      return NextResponse.json(
        { error: "No captures to summarize" },
        { status: 400 }
      )
    }

    const captureList = captures
      .map(
        (c: { damage_type: string; roof_area: string; field_note: string }, i: number) =>
          `${i + 1}. Damage: ${c.damage_type} | Area: ${c.roof_area}${c.field_note ? ` | Note: ${c.field_note}` : ""}`
      )
      .join("\n")

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `You are a roofing insurance supplement documentation assistant. Write a combined supplement summary for an insurance claim based on all damage items found during roof tear-off on a single property.

Project: ${project_name}
${property_address ? `Property: ${property_address}` : ""}

Damage items documented during tear-off:
${captureList}

Rules:
- Write a unified supplement summary covering all documented damage items.
- Open with a brief statement identifying the property and that damage was discovered during tear-off.
- Address each damage item in its own sentence or two, grouped logically by roof area when possible.
- Close with a summary statement that these conditions were not visible prior to shingle removal and require repair or replacement.
- Use professional, insurance-friendly language suitable for adjuster correspondence or claim notes.
- Do NOT invent measurements or dimensions not present in the field notes.
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
