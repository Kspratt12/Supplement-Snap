// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Runs the real /api/generate-project-draft route with the model, login, plan and rate limiter mocked.
 * It must treat a reply that stopped at the token limit the same way as the capture draft route: not a draft.
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

const body = {
  project_name: "Garcia Roof",
  property_address: "9 Pine Ct",
  captures: [{ damage_type: "Decking", roof_area: "Front", field_note: "Rotted decking along the eave" }],
}
const post = (b: unknown = body) =>
  POST(new Request("http://localhost/api/generate-project-draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }))

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({ id: "user-1", email: "a@example.com" })
  mockGetAccess.mockResolvedValue({ active: true })
  mockRateLimited.mockReturnValue(false)
  mockCreate.mockResolvedValue({ content: [{ type: "text", text: "A complete narrative." }], stop_reason: "end_turn" })
})

describe("POST /api/generate-project-draft", () => {
  it("keeps its authorization checks", async () => {
    mockGetUser.mockResolvedValue(null)
    expect((await post()).status).toBe(401)
    mockGetUser.mockResolvedValue({ id: "user-1", email: "a@example.com" })
    mockRateLimited.mockReturnValue(true)
    expect((await post()).status).toBe(429)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("returns a complete reply as the draft", async () => {
    const res = await post()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ draft: "A complete narrative." })
  })

  it("joins every text block of a finished multi-block reply", async () => {
    mockCreate.mockResolvedValue({ stop_reason: "end_turn", content: [{ type: "thinking" }, { type: "text", text: "One. " }, { type: "text", text: "Two." }] })
    expect(await (await post()).json()).toEqual({ draft: "One. Two." })
  })

  it("does not return a reply that stopped at the token limit as a draft", async () => {
    mockCreate.mockResolvedValue({ stop_reason: "max_tokens", content: [{ type: "text", text: "The first finding is documented and we" }] })
    const res = await post()
    const out = await res.json()
    expect(res.status).toBe(502)
    expect(out.draft).toBeUndefined()
    expect(out.code).toBe("cut-off")
  })

  it("returns a 502 for a reply with no text", async () => {
    mockCreate.mockResolvedValue({ stop_reason: "end_turn", content: [] })
    expect((await post()).status).toBe(502)
  })

  it("returns a 500 with a message when the model call fails", async () => {
    mockCreate.mockRejectedValue(new Error("boom"))
    const res = await post()
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe("boom")
  })

  it("makes one model call and does not change this route's model settings", async () => {
    await post()
    expect(mockCreate).toHaveBeenCalledTimes(1)
    const sent = mockCreate.mock.calls[0][0]
    expect(sent.model).toBe("claude-sonnet-5-5")
    expect(sent.max_tokens).toBe(4000)
  })
})
