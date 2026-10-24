import { describe, it, expect } from "vitest"
import { isUninformativeNote, buildDraftPrompt, MINIMAL_DRAFT_PLACEHOLDER } from "../lib/draft-prompt"

/**
 * The supplement explanation must not invent a damage story from a note that
 * describes nothing, and must not stop a real (even terse) note from being used.
 */

const NOTES_WITH_NO_DETAIL: Array<[string, string | null | undefined]> = [
  ["undefined", undefined],
  ["null", null],
  ["empty", ""],
  ["spaces only", "      "],
  ["keyboard mashing from the live demo", "fffgffgfg"],
  ["test text from the live demo", "This is a test"],
  ["test", "test"],
  ["test note", "Test note"],
  ["testing", "Testing testing"],
  ["lorem ipsum", "lorem ipsum dolor sit"],
  ["asdf", "asdf asdf asdf"],
  ["qwerty", "qwerty uiop"],
  ["repeated letter", "aaaaaaaaaaaa"],
  ["no vowels", "bcdfghjklmn"],
  ["n/a", "n/a"],
  ["too short", "ok"],
  ["just filler words", "this is a note"],
]

const NOTES_WITH_DETAIL: Array<[string, string]> = [
  ["a normal note", "Rotted decking along the eave, about 3 sheets, soft underfoot"],
  ["the flashing note from the live demo", "Step flashing severely corroded with multiple separation points. Not visible prior to shingle removal."],
  ["a terse but real note", "Rotted OSB"],
  ["a pipe boot", "Pipe boot cracked at base"],
  ["layers", "2 layers of shingles found"],
  ["missing drip edge", "Missing drip edge along rake"],
  ["the word test inside a real note", "Test cut shows rotted decking under second layer"],
  ["a note that mentions testing a moisture meter", "Moisture meter test read high at the north valley"],
  ["Spanish note translated by the app", "Madera podrida en el borde del techo"],
]

describe("isUninformativeNote", () => {
  it.each(NOTES_WITH_NO_DETAIL)("treats %s as having no usable detail", (_label, note) => {
    expect(isUninformativeNote(note)).toBe(true)
  })

  it.each(NOTES_WITH_DETAIL)("keeps %s as usable", (_label, note) => {
    expect(isUninformativeNote(note)).toBe(false)
  })
})

describe("buildDraftPrompt", () => {
  const input = { damageType: "Decking", roofArea: "Front" }

  it.each(NOTES_WITH_NO_DETAIL)("uses the neutral placeholder prompt for %s", (_label, note) => {
    const { prompt, minimal } = buildDraftPrompt({ ...input, fieldNote: note })
    expect(minimal).toBe(true)
    expect(prompt).toContain("Damage type: Decking")
    expect(prompt).toContain("Roof area: Front")
    expect(prompt).toContain(MINIMAL_DRAFT_PLACEHOLDER)
    // Nothing in this prompt invites codes, hidden-damage claims or replacement language,
    // and the junk note is never passed to the model.
    expect(prompt).not.toMatch(/IRC R\d/)
    expect(prompt).not.toMatch(/discovered during tear-off and was not visible/i)
    expect(prompt).not.toMatch(/field note states/i)
    if (typeof note === "string" && note.trim()) expect(prompt).not.toContain(note.trim())
    expect(prompt).toMatch(/Do NOT say that anything must be repaired or replaced/)
    expect(prompt).toMatch(/Do NOT cite any building code/)
  })

  it.each(NOTES_WITH_DETAIL)("uses the full prompt for %s and includes the note", (_label, note) => {
    const { prompt, minimal } = buildDraftPrompt({ ...input, fieldNote: note })
    expect(minimal).toBe(false)
    expect(prompt).toContain(`The contractor's field note states: "${note}"`)
    expect(prompt).toMatch(/Use only facts given above/)
    expect(prompt).toMatch(/Describe the remedy as a request/)
    expect(prompt).toMatch(/contractor should verify it against the locally adopted code/)
    expect(prompt).not.toContain(MINIMAL_DRAFT_PLACEHOLDER)
  })

  it("never contains the same instruction twice in conflicting form", () => {
    for (const [, note] of [...NOTES_WITH_NO_DETAIL, ...NOTES_WITH_DETAIL]) {
      const { prompt, minimal } = buildDraftPrompt({ ...input, fieldNote: note as string })
      if (minimal) {
        // The placeholder prompt has no rule that asks for a code or for replacement
        expect(prompt).not.toMatch(/reference the relevant building code|You may cite a building code/)
      } else {
        // The full prompt has no instruction to leave the draft empty
        expect(prompt).not.toMatch(/Write exactly one sentence/)
      }
    }
  })

  it("trims the note and keeps the damage type and roof area", () => {
    const { prompt } = buildDraftPrompt({ damageType: "Flashing", roofArea: "Chimney", fieldNote: "   Step flashing rusted through at the chimney   " })
    expect(prompt).toContain('"Step flashing rusted through at the chimney"')
    expect(prompt).toContain("Damage type: Flashing")
    expect(prompt).toContain("Roof area: Chimney")
  })
})
