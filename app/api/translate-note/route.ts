import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 })
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `You are a language detection and translation tool for roofing damage notes.

Given the following text, determine the language. If it is already in English, respond with exactly:
ALREADY_ENGLISH

If it is NOT English, translate it into clear, professional English suitable for a roofing insurance supplement note. Respond with ONLY the translated text — no explanations, no labels, no quotes.

Text: "${text}"`,
        },
      ],
    })

    const block = message.content[0]
    const result = block.type === "text" ? block.text.trim() : ""

    if (result === "ALREADY_ENGLISH") {
      return NextResponse.json({ translated: false, text })
    }

    return NextResponse.json({ translated: true, text: result })
  } catch (err) {
    console.error("Translation error:", err)
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
