import { describe, it, expect, vi } from "vitest"

// The home page imports the signed-in header, which reads the auth context. Only the page's exported metadata is under test.
vi.mock("../lib/auth-context", () => ({ useAuth: () => ({ user: null, loading: false, signOut: vi.fn() }) }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))

import { metadata } from "../app/page"

describe("home page description", () => {
  const search = String(metadata.description)
  const og = String(metadata.openGraph?.description)
  const twitter = String((metadata.twitter as { description?: string } | undefined)?.description)

  it("is the same in the search, Open Graph and Twitter fields", () => {
    expect(og).toBe(search)
    expect(twitter).toBe(search)
  })

  it("fits a search snippet", () => {
    expect(search.length).toBeLessThanOrEqual(160)
  })

  it("does not imply the Free plan includes PDF export or email, which are paid features (see app/pricing/page.tsx compare table)", () => {
    expect(search).toMatch(/paid plans?/i)
    expect(search).not.toMatch(/email an adjuster-ready PDF/i)
    expect(search).not.toMatch(/free project\.$/i)
  })

  it("still describes the Free allowance as a project to try, not unlimited use", () => {
    expect(search).toMatch(/one project free/i)
  })
})
