import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, cleanup } from "@testing-library/react"

const h = vi.hoisted(() => ({ calls: [] as Array<{ urls: string[]; projectId?: string }>, respond: null as null | ((urls: string[]) => { ok: boolean; json?: unknown } | "throw") }))

vi.mock("../lib/auth-fetch", () => ({
  authFetch: async (_input: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body))
    h.calls.push(body)
    const r = h.respond ? h.respond(body.urls) : { ok: true, json: { signed: Object.fromEntries(body.urls.map((u: string) => [u, `${u.replace("/public/", "/sign/")}?token=T`])), denied: [], expiresIn: 3600 } }
    if (r === "throw") throw new Error("offline")
    return { ok: r.ok, json: async () => r.json }
  },
}))

import { signedPhotoUrl, isStoredFileUrl, resetPhotoLinkCache } from "../lib/photo-access"
import { SignedImg } from "../lib/signed-img"

const BASE = "https://example-project.supabase.co/storage/v1/object/public/test-uploads"
const u = (n: number) => `${BASE}/1700000000000-aaaa-photo-${n}.jpg`

beforeEach(() => { resetPhotoLinkCache(); h.calls.length = 0; h.respond = null })
afterEach(() => { cleanup(); vi.useRealTimers() })

describe("signedPhotoUrl", () => {
  it("leaves addresses that are not our stored files alone, without a network call", async () => {
    for (const x of ["blob:http://localhost/abc", "data:image/png;base64,AAAA", "https://elsewhere.example/p.jpg", "", "/relative.jpg"]) expect(await signedPhotoUrl(x, "p1")).toBe(x)
    expect(h.calls).toHaveLength(0)
    expect(isStoredFileUrl(u(0))).toBe(true)
    expect(isStoredFileUrl("https://elsewhere.example/p.jpg")).toBe(false)
  })

  it("asks once for several photos requested together, with the project id", async () => {
    const out = await Promise.all([signedPhotoUrl(u(0), "p1"), signedPhotoUrl(u(1), "p1"), signedPhotoUrl(u(2), "p1")])
    expect(h.calls).toHaveLength(1)
    expect(h.calls[0].urls.sort()).toEqual([u(0), u(1), u(2)])
    expect(h.calls[0].projectId).toBe("p1")
    for (const link of out) expect(link).toContain("/object/sign/test-uploads/")
  })

  it("remembers a link and does not ask again while it is still good", async () => {
    await signedPhotoUrl(u(0), "p1")
    await signedPhotoUrl(u(0), "p1")
    expect(h.calls).toHaveLength(1)
  })

  it("gets a fresh link before the old one expires", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-11-12T10:00:00Z"))
    const first = await signedPhotoUrl(u(0), "p1")
    vi.setSystemTime(new Date("2026-11-12T10:30:00Z")) // 30 minutes in: still well inside the hour
    await signedPhotoUrl(u(0), "p1")
    expect(h.calls).toHaveLength(1)
    vi.setSystemTime(new Date("2026-11-12T10:56:00Z")) // within five minutes of expiry
    const refreshed = await signedPhotoUrl(u(0), "p1")
    expect(h.calls).toHaveLength(2)
    expect(first).toContain("token=")
    expect(refreshed).toContain("token=")
  })

  it("keeps projects apart: the same address for another project is asked again", async () => {
    await signedPhotoUrl(u(0), "p1")
    await signedPhotoUrl(u(0), "p2")
    expect(h.calls.map((c) => c.projectId)).toEqual(["p1", "p2"])
  })

  it("falls back to the original address when the server refuses, fails, or cannot be reached, and asks again next time", async () => {
    h.respond = (urls) => ({ ok: true, json: { signed: {}, denied: urls, expiresIn: 3600 } })
    expect(await signedPhotoUrl(u(0), "p1")).toBe(u(0))
    h.respond = () => ({ ok: false })
    expect(await signedPhotoUrl(u(0), "p1")).toBe(u(0))
    h.respond = () => "throw"
    expect(await signedPhotoUrl(u(0), "p1")).toBe(u(0))
    expect(h.calls).toHaveLength(3) // refusals and failures are not remembered
    h.respond = null
    expect(await signedPhotoUrl(u(0), "p1")).toContain("/object/sign/")
  })
})

describe("SignedImg", () => {
  it("shows a blank placeholder first, then the picture through the signed link, keeping the same classes and alt text", async () => {
    render(<SignedImg src={u(5)} projectId="p1" alt="Finding 1 photo 1" className="h-24 w-auto" />)
    const img = screen.getByAltText("Finding 1 photo 1") as HTMLImageElement
    expect(img.className).toBe("h-24 w-auto")
    expect(img.getAttribute("src")).toMatch(/^data:image\/gif/)
    await waitFor(() => expect(img.getAttribute("src")).toContain("/object/sign/test-uploads/1700000000000-aaaa-photo-5.jpg?token=T"))
  })

  it("shows the original address when no link can be had, so nothing that worked before is hidden", async () => {
    h.respond = () => ({ ok: false })
    render(<SignedImg src={u(6)} projectId="p1" alt="x" />)
    await waitFor(() => expect((screen.getByAltText("x") as HTMLImageElement).getAttribute("src")).toBe(u(6)))
  })

  it("passes ordinary pictures such as a chosen file preview straight through", async () => {
    render(<SignedImg src="blob:http://localhost/preview" alt="preview" />)
    await waitFor(() => expect((screen.getByAltText("preview") as HTMLImageElement).getAttribute("src")).toBe("blob:http://localhost/preview"))
    expect(h.calls).toHaveLength(0)
  })
})
