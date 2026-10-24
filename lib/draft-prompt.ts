/**
 * Builds the prompt for the per-finding supplement explanation.
 *
 * Two prompts, not one with a guard bolted on: when the contractor's field note
 * does not describe a real condition (blank, test text, keyboard mashing), the
 * model gets a prompt that never mentions codes, hidden damage or replacement,
 * so there is nothing for it to follow. A longer prompt that says "cite codes"
 * in one rule and "do not cite codes" in another produces mixed results.
 */

// Words people type to try the app, or when they have nothing to say yet.
const PLACEHOLDER_WORDS = new Set([
  "test", "testing", "tests", "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "placeholder",
  "asdf", "qwerty", "tbd", "todo", "none", "nothing", "blah", "sample", "demo", "na", "n", "a", "x",
])
// Filler that carries no roofing information on its own.
const FILLER_WORDS = new Set([
  "this", "is", "a", "an", "the", "just", "only", "note", "notes", "my", "for", "it", "one", "of", "here", "some", "text", "field",
])
const KEYBOARD_RUNS = /(qwert|asdf|zxcv|hjkl|uiop)/i

export function isUninformativeNote(note: string | null | undefined): boolean {
  const text = (note ?? "").trim()
  if (text.length < 10) return true

  // Notes made only of filler and placeholder words ("This is a test", "Test note", "lorem ipsum dolor sit").
  const tokens = text.toLowerCase().replace(/[^a-z0-9/\s]/g, " ").split(/\s+/).filter(Boolean)
  const meaningful = tokens.filter((t) => !FILLER_WORDS.has(t))
  if (meaningful.every((t) => PLACEHOLDER_WORDS.has(t))) return true

  // Keyboard mashing: runs of adjacent keys, or long strings with almost no vowels.
  if (KEYBOARD_RUNS.test(text)) return true
  const letters = text.replace(/[^a-z]/gi, "")
  if (letters.length >= 6) {
    const vowels = (letters.match(/[aeiou]/gi) || []).length
    if (vowels / letters.length < 0.2) return true
    // One character making up most of the note ("aaaaaaaaaaaa").
    const counts: Record<string, number> = {}
    for (const ch of letters.toLowerCase()) counts[ch] = (counts[ch] || 0) + 1
    if (Math.max(...Object.values(counts)) / letters.length > 0.6) return true
  }
  return false
}

export interface DraftPromptInput {
  damageType: string
  roofArea: string
  fieldNote?: string | null
}

export interface DraftPrompt {
  prompt: string
  /** True when the field note was treated as having no usable detail. */
  minimal: boolean
}

export const MINIMAL_DRAFT_PLACEHOLDER = "[Add details from your field notes before sending.]"

export function buildDraftPrompt({ damageType, roofArea, fieldNote }: DraftPromptInput): DraftPrompt {
  if (isUninformativeNote(fieldNote)) {
    return {
      minimal: true,
      prompt: `You are a roofing insurance supplement documentation assistant. The contractor's field note for this finding is missing or does not describe an actual condition, so write only a neutral placeholder.

Damage type: ${damageType}
Roof area: ${roofArea}

Rules:
- Write exactly one sentence, in plain text with no markdown.
- The sentence may state only the damage type, the roof area and that the contractor documented it during tear-off.
- Do NOT describe any condition, cause, measurement or quantity.
- Do NOT say that anything must be repaired or replaced.
- Do NOT cite any building code, standard or manufacturer requirement.
- Do NOT say the damage was hidden or not visible before tear-off.
- After the sentence, add this exact text on the same line: ${MINIMAL_DRAFT_PLACEHOLDER}`,
    }
  }

  return {
    minimal: false,
    prompt: `You are a roofing insurance supplement documentation assistant. Write a short, professional supplement-ready paragraph for an insurance claim based on damage found during roof tear-off.

Damage type: ${damageType}
Roof area: ${roofArea}
The contractor's field note states: "${(fieldNote ?? "").trim()}"

Rules:
- Write 2-4 sentences maximum, in plain text with no markdown, asterisks or headings.
- Use professional, insurance-friendly language and a factual, non-adversarial tone.
- Use only facts given above. Do NOT invent measurements, dimensions, quantities, causes or conditions that the field note does not state.
- State that the damage was discovered during tear-off and was not visible prior to shingle removal.
- Describe the remedy as a request, for example "we are requesting that the cost of removing and replacing the flashing be included in the scope". Do NOT state that something is required by code unless the field note says so.
- You may cite a building code only when the damage type clearly supports it (for example IRC R905.2.8.2 for ice barrier, IRC R903.2 for flashing, IRC R906.1 for ventilation). If you cite one, say the contractor should verify it against the locally adopted code.
- Do NOT reference Xactimate codes.
- Do NOT use generic AI filler language. Sound like a real supplement writer at a roofing restoration company.`,
  }
}
