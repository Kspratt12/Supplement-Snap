// @vitest-environment node
import { describe, it, expect } from "vitest"
import { evaluateDraftReply, describeReplyForLog, DRAFT_MESSAGES } from "../lib/draft-outcome"
import { quantityLabel } from "../lib/quantity-label"

const text = (t: string) => ({ type: "text", text: t })

describe("evaluateDraftReply: only a reply the model finished is a draft", () => {
  it("accepts a complete reply", () => {
    const r = evaluateDraftReply({ stop_reason: "end_turn", content: [text("Soft decking is documented on the main roof.")] })
    expect(r).toEqual({ ok: true, draft: "Soft decking is documented on the main roof." })
  })

  it("rejects a reply that stopped at the token limit, even though it contains text", () => {
    // This is the failure seen live: text that ends in the middle of a sentence
    const r = evaluateDraftReply({ stop_reason: "max_tokens", content: [text("We are requesting that the cost of removing and")] })
    expect(r).toEqual({ ok: false, code: "cut-off", error: DRAFT_MESSAGES["cut-off"] })
  })

  it("rejects a reply with no text, and one that is only spaces", () => {
    expect(evaluateDraftReply({ stop_reason: "end_turn", content: [] })).toMatchObject({ ok: false, code: "empty" })
    expect(evaluateDraftReply({ stop_reason: "end_turn", content: [text("   \n")] })).toMatchObject({ ok: false, code: "empty" })
    expect(evaluateDraftReply({ stop_reason: "end_turn" })).toMatchObject({ ok: false, code: "empty" })
  })

  it("joins every text block and ignores thinking blocks, when the model finished", () => {
    const r = evaluateDraftReply({
      stop_reason: "end_turn",
      content: [{ type: "thinking" }, text("First sentence. "), { type: "thinking" }, text("Second sentence.")],
    })
    expect(r).toEqual({ ok: true, draft: "First sentence. Second sentence." })
  })

  it("does not accept a multi-block reply that was cut off", () => {
    const r = evaluateDraftReply({ stop_reason: "max_tokens", content: [{ type: "thinking" }, text("Half a sent")] })
    expect(r).toMatchObject({ ok: false, code: "cut-off" })
  })

  it("rejects a refusal, and any stop reason that is not a normal finish", () => {
    expect(evaluateDraftReply({ stop_reason: "refusal", content: [text("I can't")] })).toMatchObject({ ok: false, code: "declined" })
    expect(evaluateDraftReply({ stop_reason: "tool_use", content: [text("x")] })).toMatchObject({ ok: false, code: "unexpected" })
    expect(evaluateDraftReply({ stop_reason: "pause_turn", content: [text("x")] })).toMatchObject({ ok: false, code: "unexpected" })
    expect(evaluateDraftReply({ stop_reason: null, content: [text("x")] })).toMatchObject({ ok: false, code: "unexpected" })
    expect(evaluateDraftReply({ content: [text("x")] })).toMatchObject({ ok: false, code: "unexpected" })
  })

  it("accepts a stop-sequence finish", () => {
    expect(evaluateDraftReply({ stop_reason: "stop_sequence", content: [text("Done.")] })).toMatchObject({ ok: true })
  })

  it("logs the stop reason, block kinds and token counts, never the draft text", () => {
    const log = describeReplyForLog({
      stop_reason: "max_tokens",
      content: [{ type: "thinking" }, text("private customer note text")],
      usage: { output_tokens: 600, input_tokens: 410 },
    })
    expect(log).toEqual({ stop_reason: "max_tokens", blocks: ["thinking", "text"], output_tokens: 600, input_tokens: 410 })
    expect(JSON.stringify(log)).not.toContain("private customer note")
  })
})

describe("quantityLabel: only what was saved, nothing invented", () => {
  it("shows the quantity and unit", () => {
    expect(quantityLabel(3, "SQ")).toBe("Quantity: 3 SQ")
    expect(quantityLabel(12.5, "LF")).toBe("Quantity: 12.5 LF")
  })
  it("shows the quantity alone when no unit was saved", () => {
    expect(quantityLabel(1, null)).toBe("Quantity: 1")
    expect(quantityLabel(1, undefined)).toBe("Quantity: 1")
    expect(quantityLabel(1, "  ")).toBe("Quantity: 1")
  })
  it("shows nothing when there is no usable quantity", () => {
    expect(quantityLabel(null, "SQ")).toBeNull()
    expect(quantityLabel(undefined, "SQ")).toBeNull()
    expect(quantityLabel(0, "SQ")).toBeNull()
    expect(quantityLabel(-2, "SQ")).toBeNull()
    expect(quantityLabel("", "SQ")).toBeNull()
    expect(quantityLabel("abc", "SQ")).toBeNull()
  })
})
