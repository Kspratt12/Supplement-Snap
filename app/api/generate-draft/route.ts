import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "../../../lib/auth-utils"
import { rateLimited } from "../../../lib/rate-limit"
import { getAccess } from "../../../lib/plan"
import { buildDraftPrompt } from "../../../lib/draft-prompt"

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

    // Two prompts: a neutral placeholder when the field note describes no real
    // condition, and the full supplement paragraph when it does (see lib/draft-prompt.ts).
    const { prompt } = buildDraftPrompt({ damageType: damage_type, roofArea: roof_area, fieldNote: field_note })

    const message = await anthropic.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
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
