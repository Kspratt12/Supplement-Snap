// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

const h = vi.hoisted(() => ({
  user: { id: "user-a", email: "a@example.test" } as null | { id: string; email: string },
  rows: { project: { id: "p1", diagram_url: null as string | null } as null | { id: string; diagram_url: string | null }, captures: [] as Array<{ image_url?: string | null; image_urls?: string[] | null }>, logo: null as null | { logo_url: string | null } },
  clients: [] as Array<{ url: string; key: string; headers: Record<string, string> | undefined }>,
  signCalls: [] as Array<{ paths: string[]; ttl: number }>,
  signResult: null as null | { data: unknown; error: unknown },
}))

vi.mock("../lib/auth-utils", () => ({ getAuthenticatedUser: async () => h.user }))

vi.mock("@supabase/supabase-js", () => ({
  createClient: (url: string, key: string, opts?: { global?: { headers?: Record<string, string> } }) => {
    h.clients.push({ url, key, headers: opts?.global?.headers })
    return {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: table === "projects" ? h.rows.project : table === "company_settings" ? h.rows.logo : null, error: null }),
            then: (resolve: (v: unknown) => void) => resolve({ data: table === "captures" ? h.rows.captures : [], error: null }),
          }),
        }),
      }),
      storage: {
        from: () => ({
          createSignedUrls: async (paths: string[], ttl: number) => {
            h.signCalls.push({ paths, ttl })
            return h.signResult ?? { data: paths.map((p) => ({ path: p, signedUrl: `https://example-project.supabase.co/storage/v1/object/sign/test-uploads/${p}?token=T`, error: null })), error: null }
          },
        }),
      },
    }
  },
}))

import { POST } from "../app/api/photo-urls/route"

const BASE = "https://example-project.supabase.co/storage/v1/object/public/test-uploads"
const MINE = `${BASE}/1700000000000-aaaa-photo-0.jpg`
const OTHERS = `${BASE}/1700000000000-zzzz-photo-0.jpg`

const call = (body: unknown, auth: string | null = "Bearer user-a-token") =>
  POST(new Request("http://localhost/api/photo-urls", { method: "POST", headers: { "Content-Type": "application/json", ...(auth ? { Authorization: auth } : {}) }, body: typeof body === "string" ? body : JSON.stringify(body) }))

beforeEach(() => {
  h.user = { id: "user-a", email: "a@example.test" }
  h.rows.project = { id: "p1", diagram_url: null }
  h.rows.captures = [{ image_url: MINE, image_urls: [MINE] }]
  h.rows.logo = null
  h.clients.length = 0
  h.signCalls.length = 0
  h.signResult = null
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example-project.supabase.co"
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-for-test"
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key-for-test"
})

describe("POST /api/photo-urls", () => {
  it("refuses a caller who is not signed in, without reading or signing anything", async () => {
    h.user = null
    const res = await call({ urls: [MINE], projectId: "p1" })
    expect(res.status).toBe(401)
    expect(h.clients).toHaveLength(0)
    expect(h.signCalls).toHaveLength(0)
  })

  it("refuses a request with no bearer token even if the session check passes", async () => {
    const res = await call({ urls: [MINE], projectId: "p1" }, null)
    expect(res.status).toBe(401)
    expect(h.signCalls).toHaveLength(0)
  })

  it("rejects a malformed or empty request and one that is too large", async () => {
    expect((await call("{not json")).status).toBe(400)
    expect((await call({ urls: [] })).status).toBe(400)
    expect((await call({ projectId: "p1" })).status).toBe(400)
    expect((await call({ urls: Array.from({ length: 101 }, (_, i) => `${BASE}/${i}.jpg`) })).status).toBe(400)
  })

  it("signs a file on the user's own project for one hour and returns it keyed by the address that was asked for", async () => {
    const res = await call({ urls: [MINE], projectId: "p1" })
    expect(res.status).toBe(200)
    expect(res.headers.get("Cache-Control")).toBe("no-store")
    const json = await res.json()
    expect(json.denied).toEqual([])
    expect(json.expiresIn).toBe(3600)
    expect(json.signed[MINE]).toContain("/object/sign/test-uploads/1700000000000-aaaa-photo-0.jpg?token=")
    expect(h.signCalls).toEqual([{ paths: ["1700000000000-aaaa-photo-0.jpg"], ttl: 3600 }])
  })

  it("reads permission as the caller (their token and the public key), and uses the service key only to create links", async () => {
    await call({ urls: [MINE], projectId: "p1" })
    const asUser = h.clients.find((c) => c.headers?.Authorization)!
    expect(asUser.key).toBe("anon-key-for-test")
    expect(asUser.headers?.Authorization).toBe("Bearer user-a-token")
    const service = h.clients.filter((c) => c.key === "service-key-for-test")
    expect(service).toHaveLength(1)
    expect(service[0].headers).toBeUndefined()
    // and the service key never appears in a response
    const res = await call({ urls: [MINE], projectId: "p1" })
    expect(JSON.stringify(await res.json())).not.toContain("service-key-for-test")
  })

  it("denies a file that is not on the project and does not ask storage to sign it", async () => {
    const res = await call({ urls: [MINE, OTHERS], projectId: "p1" })
    const json = await res.json()
    expect(Object.keys(json.signed)).toEqual([MINE])
    expect(json.denied).toEqual([OTHERS])
    expect(h.signCalls[0].paths).toEqual(["1700000000000-aaaa-photo-0.jpg"])
  })

  it("cross-account: when the caller cannot see the project (the row rules return nothing), nothing is signed and storage is never called", async () => {
    h.rows.project = null
    h.rows.captures = []
    const res = await call({ urls: [MINE, OTHERS], projectId: "someone-elses-project" })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.signed).toEqual({})
    expect(json.denied.sort()).toEqual([MINE, OTHERS].sort())
    expect(h.signCalls).toHaveLength(0)
    expect(h.clients.filter((c) => c.key === "service-key-for-test")).toHaveLength(0)
  })

  it("signs the project's diagram and the caller's own logo", async () => {
    const diagram = `${BASE}/diagrams/1700000000000-dddd.pdf`
    const logo = `${BASE}/logo-user-a-1111-logo.png`
    h.rows.project = { id: "p1", diagram_url: diagram }
    h.rows.logo = { logo_url: logo }
    const json = await (await call({ urls: [diagram, logo], projectId: "p1" })).json()
    expect(Object.keys(json.signed).sort()).toEqual([diagram, logo].sort())
  })

  it("does not accept addresses outside our bucket or with path tricks", async () => {
    const json = await (await call({ urls: ["https://evil.example/x.jpg", `${BASE}/../x.jpg`, `${BASE}/a/b/c.jpg`], projectId: "p1" })).json()
    expect(json.signed).toEqual({})
    expect(h.signCalls).toHaveLength(0)
  })

  it("reports a storage failure as an error, not as a success with missing links", async () => {
    h.signResult = { data: null, error: { message: "boom" } }
    const res = await call({ urls: [MINE], projectId: "p1" })
    expect(res.status).toBe(502)
    expect(JSON.stringify(await res.json())).not.toContain("boom")
  })
})
