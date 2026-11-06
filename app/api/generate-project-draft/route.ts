import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "../../../lib/auth-utils"
import { rateLimited } from "../../../lib/rate-limit"
import { getAccess } from "../../../lib/plan"
import { evaluateDraftReply, describeReplyForLog } from "../../../lib/draft-outcome"
import { buildProjectDraftPrompt } from "../../../lib/project-draft-prompt"

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

    // The findings list and the writing rules, with concealment claims allowed only where a finding's own note states them
    const prompt = buildProjectDraftPrompt({ projectName: project_name, propertyAddress: property_address, captures })

    const message = await anthropic.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    // Only a reply the model finished on its own is a draft. A reply cut off at the token limit is not saved or shown.
    // (This route keeps its 4,000 token allowance and default settings; they were not changed here.)
    const outcome = evaluateDraftReply(message)
    if (!outcome.ok) {
      console.error("Project draft not usable", { code: outcome.code, ...describeReplyForLog(message) })
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
