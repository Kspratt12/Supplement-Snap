import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Roofing-specific glossary embedded in the system prompt to ensure
// accurate translation of industry terms, especially Spanish.
const ROOFING_GLOSSARY = `
When translating roofing terminology, use these precise mappings:
- "madera podrida" → "deteriorated/rotted wood decking"
- "tapajuntas" → "step flashing"
- "cumbrera" → "ridge cap"
- "tejas solapadas" → "overlapping shingles"
- "tejas" → "shingles"
- "canalón" / "canal" → "gutter"
- "alero" → "eave"
- "caballete" → "ridge"
- "claraboya" → "skylight"
- "membrana" → "underlayment membrane"
- "goteras" → "leaks"
- "botas de tubo" → "pipe boots"
- "sellador" → "sealant/caulk"
- "fieltro" → "roofing felt"
- "tablero OSB" → "OSB decking/sheathing"
- "contrapiso" → "roof deck substrate"
- "barrera de hielo y agua" → "ice and water shield"
- "borde de goteo" → "drip edge"
- "respiradero" → "roof vent"
- "valle" → "valley"
- "parpadeo" / "flasheo" → "flashing"
- "teja rota" → "cracked/broken shingle"
- "ampolla" → "blister"
- "ondulación" → "buckling"
- "granizo" → "hail"
- "daño por viento" → "wind damage"
- "clavo expuesto" → "exposed nail"
- "podrido" → "rotted/deteriorated"
- "húmedo" / "mojado" → "moisture-damaged"
- "capa" → "layer"
- "doble capa" → "double layer / multiple layers"
`.trim()

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 })
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You are a language detection and translation tool for roofing damage field notes.

Given the following text, determine the language. If it is already in English, respond with exactly:
ALREADY_ENGLISH

If it is NOT English, translate it into clear, professional English suitable for a roofing insurance supplement note.

${ROOFING_GLOSSARY}

Important rules:
- Respond with ONLY the translated text — no explanations, no labels, no quotes.
- Always use precise roofing industry terminology in the translation.
- If the input is extremely short (1-2 words), translate the term but do NOT expand or add context that wasn't in the original.

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
