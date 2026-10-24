// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Runs the real /api/generate-draft route with the model, login, plan and rate
 * limiter mocked, and checks what is sent to the model and what comes back.
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

import { POST } from "../app/api/generate-draft/route"

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/generate-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({ id: "user-1", email: "a@example.com" })
  mockGetAccess.mockResolvedValue({ active: true })
  mockRateLimited.mockReturnValue(false)
  mockCreate.mockResolvedValue({ content: [{ type: "text", text: "A draft." }], stop_reason: "end_turn" })
})

describe("POST /api/generate-draft", () => {
  it("rejects requests that are not signed in", async () => {
    mockGetUser.mockResolvedValue(null)
    const res = await post({ damage_type: "Decking", roof_area: "Front", field_note: "x" })
    expect(res.status).toBe(401)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("rejects requests that are rate limited", async () => {
    mockRateLimited.mockReturnValue(true)
    const res = await post({ damage_type: "Decking", roof_area: "Front", field_note: "x" })
    expect(res.status).toBe(429)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("requires a damage type and a roof area", async () => {
    expect((await post({ roof_area: "Front" })).status).toBe(400)
    expect((await post({ damage_type: "Decking" })).status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("sends the placeholder prompt for the live-demo test notes", async () => {
    for (const note of ["This is a test", "fffgffgfg", "", undefined]) {
      mockCreate.mockClear()
      const res = await post({ damage_type: "Decking", roof_area: "Front", field_note: note })
      expect(res.status).toBe(200)
      const sent = mockCreate.mock.calls[0][0]
      expect(sent.messages).toHaveLength(1)
      const prompt = sent.messages[0].content as string
      expect(prompt).toMatch(/Write exactly one sentence/)
      expect(prompt).not.toMatch(/IRC R\d/)
      expect(prompt).not.toMatch(/was not visible prior to shingle removal/)
    }
  })

  it("sends the full prompt, with the note, for a real note", async () => {
    const note = "Step flashing severely corroded with multiple separation points."
    const res = await post({ damage_type: "Flashing", roof_area: "Chimney", field_note: note })
    expect(res.status).toBe(200)
    const sent = mockCreate.mock.calls[0][0]
    const prompt = sent.messages[0].content as string
    expect(prompt).toContain(note)
    expect(prompt).toMatch(/2-4 sentences/)
    expect(prompt).toMatch(/Describe the remedy as a request/)
    expect(sent.model).toBe("claude-sonnet-5-5")
    expect(sent.max_tokens).toBe(600)
  })

  it("returns the draft text from every text block of the model reply", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "thinking", thinking: "..." }, { type: "text", text: "First. " }, { type: "text", text: "Second." }],
    })
    const res = await post({ damage_type: "Decking", roof_area: "Front", field_note: "Rotted decking along the eave" })
    expect(await res.json()).toEqual({ draft: "First. Second." })
  })

  it("returns a 502 when the model reply has no text", async () => {
    mockCreate.mockResolvedValue({ content: [], stop_reason: "end_turn" })
    const res = await post({ damage_type: "Decking", roof_area: "Front", field_note: "Rotted decking along the eave" })
    expect(res.status).toBe(502)
  })

  it("returns a 500 with a message when the model call fails", async () => {
    mockCreate.mockRejectedValue(new Error("boom"))
    const res = await post({ damage_type: "Decking", roof_area: "Front", field_note: "Rotted decking along the eave" })
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe("boom")
  })
})
