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

    // Build the structured findings list
    const findings = captures
      .map(
        (
          c: {
            damage_type: string
            roof_area: string
            field_note: string
            created_at?: string
          },
          i: number
        ) => {
          let entry = `${i + 1}. Damage Type: ${c.damage_type}\n   Roof Area: ${c.roof_area}`
          if (c.field_note) {
            entry += `\n   Field Note: ${c.field_note}`
          }
          if (c.created_at) {
            entry += `\n   Documented: ${new Date(c.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
          }
          return entry
        }
      )
      .join("\n\n")

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: `You are a senior supplement writer at a roofing restoration company. Write a professional insurance supplement explanation for concealed damage discovered during tear-off.

Project: ${project_name}
${property_address ? `Property Address: ${property_address}` : ""}

Findings:
${findings}

Instructions:
- Write in professional insurance documentation style suitable for carrier submission.
- Reference that these are concealed conditions discovered during the tear-off process that were not visible or detectable during the initial inspection.
- Combine all findings into one clean, unified supplement narrative — do NOT use bullet points or numbered lists in the output.
- Produce clear paragraphs that flow naturally. Group related findings by roof area when it makes sense.
- Each damage finding should be addressed with enough detail to justify the supplement request.
- Where applicable, reference relevant building code requirements (e.g., IRC R905.2.8.2 for ice barrier, IRC R903.2 for flashing, IRC R906.1 for ventilation). Only cite a code if it genuinely applies to a finding.
- Close with a summary statement that these concealed conditions require repair or replacement to restore the roof system to its pre-loss condition and to meet applicable building codes.
- Do NOT invent specific measurements, dimensions, or quantities not present in the field notes.
- Do NOT reference Xactimate line items or codes.
- Do NOT use generic AI filler language, marketing speak, or overly formal legalese.
- Sound like a real supplement writer — factual, direct, non-adversarial, and professional.
- The output should be ready to copy and paste into a supplement submission or adjuster correspondence.`,
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
