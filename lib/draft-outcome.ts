/**
 * Decides whether an AI reply is a finished draft that can be shown, saved and put in a report.
 *
 * A reply that stopped because it ran out of its output allowance (`max_tokens`) is cut off mid-sentence. It still
 * contains text, so reading only the text blocks used to accept it, save it, and mark the finding Ready to Send.
 * Only a reply the model finished on its own (`end_turn` or `stop_sequence`) counts as a complete draft.
 */
export type DraftFailureCode = "cut-off" | "empty" | "declined" | "unexpected"

export type DraftOutcome =
  | { ok: true; draft: string }
  | { ok: false; code: DraftFailureCode; error: string }

type ProviderReply = {
  stop_reason?: string | null
  content?: Array<{ type: string; text?: string }>
}

export const DRAFT_MESSAGES: Record<DraftFailureCode, string> = {
  "cut-off": "The AI draft was cut off before it finished, so it was not saved. Please try again.",
  empty: "The AI returned an empty draft. Please try again.",
  declined: "The AI could not write a draft for this. Check the field note and try again.",
  unexpected: "The AI draft did not finish normally, so it was not saved. Please try again.",
}

export function evaluateDraftReply(reply: ProviderReply): DraftOutcome {
  const blocks = Array.isArray(reply.content) ? reply.content : []
  // Read every text block: the first block is not always text
  const draft = blocks
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text as string)
    .join("")

  const stop = reply.stop_reason
  if (stop === "max_tokens") return { ok: false, code: "cut-off", error: DRAFT_MESSAGES["cut-off"] }
  if (stop === "refusal") return { ok: false, code: "declined", error: DRAFT_MESSAGES.declined }
  if (stop !== "end_turn" && stop !== "stop_sequence") return { ok: false, code: "unexpected", error: DRAFT_MESSAGES.unexpected }
  if (!draft.trim()) return { ok: false, code: "empty", error: DRAFT_MESSAGES.empty }
  return { ok: true, draft }
}

/** What is safe to log about a reply that was refused: the stop reason, the block kinds and token counts, never the text. */
export function describeReplyForLog(reply: ProviderReply & { usage?: { output_tokens?: number; input_tokens?: number } }) {
  return {
    stop_reason: reply.stop_reason ?? null,
    blocks: (reply.content ?? []).map((b) => b.type),
    output_tokens: reply.usage?.output_tokens ?? null,
    input_tokens: reply.usage?.input_tokens ?? null,
  }
}
