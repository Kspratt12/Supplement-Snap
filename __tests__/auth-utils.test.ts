// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

/** The user id used by every private route comes from the verified token, never from the request. */

const mockGetUser = vi.fn()
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth: { getUser: (...a: unknown[]) => mockGetUser(...a) } }) }))

import { getAuthenticatedUser, getUserId } from "../lib/auth-utils"

const req = (headers: Record<string, string> = {}) => new Request("http://localhost/api/x", { headers })

beforeEach(() => {
  vi.clearAllMocks()
})

describe("auth-utils", () => {
  it("returns nothing when there is no token", async () => {
    expect(await getAuthenticatedUser(req())).toBeNull()
    expect(mockGetUser).not.toHaveBeenCalled()
  })

  it("returns nothing for an invalid or expired token", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "invalid JWT" } })
    expect(await getAuthenticatedUser(req({ Authorization: "Bearer bad" }))).toBeNull()
  })

  it("returns nothing, and does not throw, if the auth service fails", async () => {
    mockGetUser.mockRejectedValue(new Error("network"))
    expect(await getAuthenticatedUser(req({ Authorization: "Bearer x" }))).toBeNull()
  })

  it("uses the verified user's id and ignores an id supplied by the client", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "real-user", email: "a@example.com" } }, error: null })
    expect(await getUserId(req({ Authorization: "Bearer good" }), "someone-elses-id")).toBe("real-user")
  })

  it("does not fall back to a client-supplied id when the token is missing", async () => {
    expect(await getUserId(req(), "someone-elses-id")).toBeNull()
  })
})
