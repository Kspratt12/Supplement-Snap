// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * The route together with the REAL shared login helper (lib/auth-utils.ts), with only the account service replaced. The
 * helper accepts a bearer token or, when there is no bearer header, a session cookie; with a bearer header it uses that
 * token alone. The route additionally requires the bearer header. These tests pin down that combination. They do not show
 * how the real account service behaves. All people and data are made up.
 */

const world = vi.hoisted(() => ({
  tokens: {} as Record<string, { id: string; user_metadata: Record<string, unknown> }>,
  checkedTokens: [] as string[],
  writes: [] as Array<{ id: string; user_metadata: Record<string, unknown> }>,
  stored: {} as Record<string, Record<string, unknown>>,
}))

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      getUser: async (token: string) => {
        world.checkedTokens.push(token)
        const user = world.tokens[token]
        return user ? { data: { user }, error: null } : { data: { user: null }, error: { message: "invalid" } }
      },
      admin: {
        updateUserById: async (id: string, attrs: { user_metadata: Record<string, unknown> }) => {
          world.writes.push({ id, user_metadata: attrs.user_metadata })
          world.stored[id] = { ...(world.stored[id] ?? {}), ...attrs.user_metadata } // merged key by key, as the service does
          return { error: null }
        },
        getUserById: async (id: string) => ({ data: { user: { id, user_metadata: world.stored[id] ?? {} } }, error: null }),
      },
    },
  }),
}))
vi.mock("../lib/rate-limit", () => ({ rateLimited: () => false }))

import { POST } from "../app/api/onboarding-dismissal/route"

const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
const cookieFor = (token: string) => `sb-proj-auth-token=${encodeURIComponent(JSON.stringify({ access_token: token }))}`

const send = (headers: Record<string, string>, userId: string) =>
  POST(
    new Request("http://localhost/api/onboarding-dismissal", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ userId, keys: ["ss_start_here_hidden"] }),
    })
  )

beforeEach(() => {
  world.tokens = {
    "token-a": { id: A, user_metadata: { full_name: "Alice Example" } },
    "token-b": { id: B, user_metadata: { full_name: "Bob Example" } },
  }
  world.checkedTokens = []
  world.writes = []
  world.stored = { [A]: { full_name: "Alice Example" }, [B]: { full_name: "Bob Example" } }
})

describe("which login the route accepts", () => {
  it("a bearer token for A changes A", async () => {
    expect((await send({ Authorization: "Bearer token-a" }, A)).status).toBe(200)
    expect(world.writes).toEqual([{ id: A, user_metadata: { ss_start_here_hidden: true } }]) // only the changed key is sent
    expect(world.stored[A]).toEqual({ full_name: "Alice Example", ss_start_here_hidden: true })
  })

  it("a valid session cookie with no bearer header is refused, and the cookie is never even checked", async () => {
    expect((await send({ cookie: cookieFor("token-a") }, A)).status).toBe(401)
    expect(world.checkedTokens).toEqual([])
    expect(world.writes).toEqual([])
  })

  it("an invalid bearer token is refused, and a valid cookie beside it is not used instead", async () => {
    expect((await send({ Authorization: "Bearer not-a-token", cookie: cookieFor("token-a") }, A)).status).toBe(401)
    expect(world.checkedTokens).toEqual(["not-a-token"])
    expect(world.writes).toEqual([])
  })

  it("a bearer token for A with a cookie for B uses A only: B\x27s cookie is never checked", async () => {
    const asA = await send({ Authorization: "Bearer token-a", cookie: cookieFor("token-b") }, A)
    expect(asA.status).toBe(200)
    expect(world.writes.map((w) => w.id)).toEqual([A])
    expect(world.checkedTokens).toEqual(["token-a"])
  })

  it("the same mixed request naming B is refused as the wrong account, with no change to either person", async () => {
    const asB = await send({ Authorization: "Bearer token-a", cookie: cookieFor("token-b") }, B)
    expect(asB.status).toBe(409)
    expect(world.writes).toEqual([])
    expect(world.checkedTokens).toEqual(["token-a"])
  })
})
