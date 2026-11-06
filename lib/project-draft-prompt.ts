/**
 * The prompt for the whole-project supplement draft.
 *
 * It used to tell the model, for every project, to say the damage was concealed, discovered during tear-off and not
 * visible at the initial inspection, and to close by saying those concealed conditions require repair to meet code.
 * That is a claim about a particular claim. It belongs in the draft only for a finding whose own field note says it, the
 * same rule the single-finding draft already follows (see draft-prompt.ts).
 */

export type ProjectDraftCapture = {
  damage_type: string
  roof_area: string
  field_note?: string | null
  created_at?: string
}

const SAYS_CONCEALED = /(conceal|hidden|not visible|wasn'?t visible|not detectable|tear[- ]?off|torn off)/i
const NEGATED = /\b(no|not|without|none)\b[^.]{0,20}(hidden|conceal)/i

/** True only when the contractor's own note says the condition was concealed, hidden or found at tear-off. */
export function noteStatesConcealment(note?: string | null): boolean {
  const text = (note ?? "").trim()
  if (!text) return false
  if (NEGATED.test(text)) return false
  return SAYS_CONCEALED.test(text)
}

export function buildProjectDraftPrompt({
  projectName,
  propertyAddress,
  captures,
}: {
  projectName: string
  propertyAddress?: string | null
  captures: ProjectDraftCapture[]
}): string {
  const findings = captures
    .map((c, i) => {
      let entry = `${i + 1}. Damage Type: ${c.damage_type}\n   Roof Area: ${c.roof_area}`
      if (c.field_note) {
        entry += `\n   Field Note: ${c.field_note}`
      }
      if (c.created_at) {
        entry += `\n   Documented: ${new Date(c.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
      }
      entry += `\n   Concealment or tear-off discovery: ${noteStatesConcealment(c.field_note) ? "stated in the field note" : "not stated"}`
      return entry
    })
    .join("\n\n")

  return `You are a senior supplement writer at a roofing restoration company. Write a professional insurance supplement explanation for the documented roof findings below.

Project: ${projectName}
${propertyAddress ? `Property Address: ${propertyAddress}` : ""}

Findings:
${findings}

Instructions:
- Write in professional insurance documentation style suitable for carrier submission.
- Say that a condition was concealed, was discovered during tear-off, or was not visible or detectable at the initial inspection ONLY for a finding marked "Concealment or tear-off discovery: stated in the field note". For every other finding, do not say or imply that it was hidden, concealed, discovered at any particular time, or missed at inspection; describe only what was documented.
- Combine all findings into one clean, unified supplement narrative — do NOT use bullet points or numbered lists in the output.
- Produce clear paragraphs that flow naturally. Group related findings by roof area when it makes sense.
- Each damage finding should be addressed with enough detail to justify the supplement request.
- Where applicable, reference relevant building code requirements (e.g., IRC R905.2.8.2 for ice barrier, IRC R903.2 for flashing, IRC R906.1 for ventilation). Only cite a code if it genuinely applies to a finding.
- Close with a short summary statement that these documented findings are submitted for the carrier's review. Say that a finding requires repair or replacement to restore the roof system to its pre-loss condition or to meet applicable building codes only where its field note states that need; otherwise do not claim a required repair or code compliance.
- Do NOT invent specific measurements, dimensions, quantities, causes or conditions not present in the field notes. If a finding has little or no detail, describe only what was documented, say plainly that the documentation is limited, and do not add conditions that were not stated.
- Do NOT reference Xactimate line items or codes.
- Do NOT use generic AI filler language, marketing speak, or overly formal legalese.
- Sound like a real supplement writer — factual, direct, non-adversarial, and professional.
- Plain text only: no markdown, asterisks, headings or horizontal rules.
- Start directly with the narrative. No preface, no notes, no caveats or comments to the user, and no sign-off placeholders.
- Always finish with a complete closing sentence.
- The output should be ready to copy and paste into a supplement submission or adjuster correspondence.`
}
