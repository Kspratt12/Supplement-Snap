import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "../../../lib/auth-utils"
import { rateLimited } from "../../../lib/rate-limit"
import { getAccess } from "../../../lib/plan"
import { buildDraftPrompt } from "../../../lib/draft-prompt"
import { evaluateDraftReply, describeReplyForLog } from "../../../lib/draft-outcome"

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

    // This model thinks before it answers, and that thinking counts against max_tokens. A 600 token allowance left
    // too little for the paragraph itself, so replies stopped mid-sentence. A short paragraph needs little thinking
    // (effort "low") and a larger allowance. Worst case at this size is 1,500 output tokens per request.
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 1500,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: prompt }],
    })

    // Only a reply the model finished on its own is a draft. A reply cut off at the token limit is not saved or shown.
    const outcome = evaluateDraftReply(message)
    if (!outcome.ok) {
      console.error("Draft not usable", { code: outcome.code, ...describeReplyForLog(message) })
      return NextResponse.json({ error: outcome.error, code: outcome.code }, { status: 502 })
    }

    return NextResponse.json({ draft: outcome.draft })
  } catch (err) {
    console.error("Claude API error:", err)
    const message =
      err instanceof Error ? err.message : "Unknown error occurred"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
