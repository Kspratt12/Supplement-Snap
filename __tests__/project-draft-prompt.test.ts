// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * The whole-project draft prompt: concealment, tear-off discovery and required-repair claims are allowed only for a
 * finding whose own field note states them. Runs the prompt builder and the real route with the model mocked, so this
 * shows what the model is told, not what it writes.
 */

const mockCreate = vi.fn()
const mockGetUser = vi.fn()
const mockGetAccess = vi.fn()
const mockRateLimited = vi.fn()

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: (...args: unknown[]) => mockCreate(...args) }
  },
}))
vi.mock("../lib/auth-utils", () => ({ getAuthenticatedUser: (...a: unknown[]) => mockGetUser(...a) }))
vi.mock("../lib/plan", () => ({ getAccess: (...a: unknown[]) => mockGetAccess(...a) }))
vi.mock("../lib/rate-limit", () => ({ rateLimited: (...a: unknown[]) => mockRateLimited(...a) }))

import { POST } from "../app/api/generate-project-draft/route"
import { buildProjectDraftPrompt, noteStatesConcealment } from "../lib/project-draft-prompt"

const UNCONDITIONAL = [
  /for concealed damage discovered during tear-off/i,
  /Reference that these are concealed conditions discovered during the tear-off process/i,
  /that these concealed conditions require repair/i,
]

const unsupported = { damage_type: "Soft decking", roof_area: "Main roof", field_note: "ZZ account separation fixture" }
const supported = { damage_type: "Decking", roof_area: "Front slope", field_note: "Rotted decking hidden under the old shingles, found during tear-off." }

describe("noteStatesConcealment", () => {
  it("is true only when the note itself says concealed, hidden, not visible or found at tear-off", () => {
    expect(noteStatesConcealment("Rotted decking hidden under the shingles")).toBe(true)
    expect(noteStatesConcealment("Found during tear-off, not visible from the ladder")).toBe(true)
    expect(noteStatesConcealment("Concealed flashing corrosion at the chimney")).toBe(true)
  })
  it("is false for a note that says nothing about it, an empty note, or a note that denies it", () => {
    expect(noteStatesConcealment("ZZ account separation fixture")).toBe(false)
    expect(noteStatesConcealment("Step flashing corroded with separation at the joints")).toBe(false)
    expect(noteStatesConcealment("")).toBe(false)
    expect(noteStatesConcealment(null)).toBe(false)
    expect(noteStatesConcealment(undefined)).toBe(false)
    expect(noteStatesConcealment("No hidden damage found")).toBe(false)
    expect(noteStatesConcealment("Not concealed, visible from the ground")).toBe(false)
  })
})

describe("buildProjectDraftPrompt", () => {
  it("never tells the model to assert concealment, tear-off discovery or required repairs for every project", () => {
    for (const captures of [[unsupported], [supported], [unsupported, supported]]) {
      const prompt = buildProjectDraftPrompt({ projectName: "ZZ Draft Test", captures })
      for (const phrase of UNCONDITIONAL) expect(prompt).not.toMatch(phrase)
    }
  })

  it("marks a finding that does not state concealment as not stated, and tells the model not to claim it", () => {
    const prompt = buildProjectDraftPrompt({ projectName: "ZZ Draft Test", captures: [unsupported] })
    const findingsOnly = prompt.slice(0, prompt.indexOf("Instructions:")) // the rules below quote the marker, so look at the findings alone
    expect(findingsOnly).toContain("Concealment or tear-off discovery: not stated")
    expect(findingsOnly).not.toContain("Concealment or tear-off discovery: stated in the field note")
    expect(prompt).toMatch(/ONLY for a finding marked "Concealment or tear-off discovery: stated in the field note"/)
    expect(prompt).toMatch(/do not say or imply that it was hidden, concealed, discovered at any particular time, or missed at inspection/)
    expect(prompt).toMatch(/otherwise do not claim a required repair or code compliance/)
    expect(prompt).toMatch(/documentation is limited/)
  })

  it("marks a finding whose note states concealment, so that supported claim stays available", () => {
    const prompt = buildProjectDraftPrompt({ projectName: "ZZ Draft Test", captures: [supported] })
    expect(prompt).toContain("Concealment or tear-off discovery: stated in the field note")
    expect(prompt).toContain("Rotted decking hidden under the old shingles, found during tear-off.")
  })

  it("marks each finding in a mixed list separately, in order", () => {
    const prompt = buildProjectDraftPrompt({ projectName: "ZZ Draft Test", captures: [unsupported, supported] })
    const first = prompt.indexOf("1. Damage Type: Soft decking")
    const second = prompt.indexOf("2. Damage Type: Decking")
    expect(first).toBeGreaterThan(-1)
    expect(second).toBeGreaterThan(first)
    expect(prompt.slice(first, second)).toContain("not stated")
    expect(prompt.slice(second)).toContain("stated in the field note")
  })

  it("keeps the output structure and the other writing rules", () => {
    const prompt = buildProjectDraftPrompt({ projectName: "Garcia Roof", propertyAddress: "9 Pine Ct", captures: [supported] })
    expect(prompt).toContain("Project: Garcia Roof")
    expect(prompt).toContain("Property Address: 9 Pine Ct")
    expect(prompt).toMatch(/do NOT use bullet points or numbered lists/)
    expect(prompt).toMatch(/Do NOT invent specific measurements/)
    expect(prompt).toMatch(/Do NOT reference Xactimate/)
    expect(prompt).toMatch(/Plain text only/)
    expect(prompt).toMatch(/Always finish with a complete closing sentence/)
    expect(prompt).toMatch(/Only cite a code if it genuinely applies/)
  })
})

describe("POST /api/generate-project-draft sends the qualified prompt", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ id: "user-1", email: "a@example.com" })
    mockGetAccess.mockResolvedValue({ active: true })
    mockRateLimited.mockReturnValue(false)
    mockCreate.mockResolvedValue({ content: [{ type: "text", text: "A complete narrative." }], stop_reason: "end_turn" })
  })

  it("passes the findings with their concealment markers to the model, and keeps its settings", async () => {
    const res = await POST(
      new Request("http://localhost/api/generate-project-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_name: "ZZ Draft Test", property_address: "", captures: [unsupported, supported] }),
      }),
    )
    expect(res.status).toBe(200)
    const sent = mockCreate.mock.calls[0][0]
    const prompt = sent.messages[0].content as string
    expect(prompt).toContain("Concealment or tear-off discovery: not stated")
    expect(prompt).toContain("Concealment or tear-off discovery: stated in the field note")
    for (const phrase of UNCONDITIONAL) expect(prompt).not.toMatch(phrase)
    expect(sent.model).toBe("claude-sonnet-5-5")
    expect(sent.max_tokens).toBe(4000)
  })
})
