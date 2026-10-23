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
      model: "claude-sonnet-5-5",
      max_tokens: 4000,
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
- Plain text only: no markdown, asterisks, headings or horizontal rules.
- Start directly with the narrative. No preface, no notes, no caveats or comments to the user, and no sign-off placeholders.
- Always finish with a complete closing sentence.
- The output should be ready to copy and paste into a supplement submission or adjuster correspondence.`,
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
