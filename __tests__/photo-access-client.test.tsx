import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react"

const h = vi.hoisted(() => ({ calls: [] as Array<{ urls: string[]; projectId?: string }>, respond: null as null | ((urls: string[], n: number) => { ok: boolean; json?: unknown } | "throw") }))

vi.mock("../lib/auth-fetch", () => ({
  authFetch: async (_input: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body))
    h.calls.push(body)
    const n = h.calls.length
    const r = h.respond ? h.respond(body.urls, n) : { ok: true, json: { signed: Object.fromEntries(body.urls.map((u: string) => [u, `${u.replace("/public/", "/sign/")}?token=T${n}`])), denied: [], expiresIn: 3600 } }
    if (r === "throw") throw new Error("offline")
    return { ok: r.ok, json: async () => r.json }
  },
}))

import { signedPhotoUrl, isStoredFileUrl, resetPhotoLinkCache, openStoredFile } from "../lib/photo-access"
import { SignedImg } from "../lib/signed-img"

const BASE = "https://example-project.supabase.co/storage/v1/object/public/test-uploads"
const u = (n: number) => `${BASE}/1700000000000-aaaa-photo-${n}.jpg`
const REFUSE = (urls: string[]) => ({ ok: true, json: { signed: {}, denied: urls, expiresIn: 3600 } })

beforeEach(() => { resetPhotoLinkCache(); h.calls.length = 0; h.respond = null })
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })

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
    vi.setSystemTime(new Date("2026-11-12T10:30:00Z"))
    await signedPhotoUrl(u(0), "p1")
    expect(h.calls).toHaveLength(1)
    vi.setSystemTime(new Date("2026-11-12T10:56:00Z")) // within five minutes of expiry
    const refreshed = await signedPhotoUrl(u(0), "p1")
    expect(h.calls).toHaveLength(2)
    expect(refreshed).not.toBe(first)
  })

  it("can be told to ignore what it remembers (a link that turned out to be expired)", async () => {
    const first = await signedPhotoUrl(u(0), "p1")
    const forced = await signedPhotoUrl(u(0), "p1", { force: true })
    expect(h.calls).toHaveLength(2)
    expect(forced).not.toBe(first)
  })

  it("keeps projects apart: the same address for another project is asked again", async () => {
    await signedPhotoUrl(u(0), "p1")
    await signedPhotoUrl(u(0), "p2")
    expect(h.calls.map((c) => c.projectId)).toEqual(["p1", "p2"])
  })

  it("returns null, never the plain public address, when the server refuses, fails, or cannot be reached; and asks again next time", async () => {
    h.respond = REFUSE
    expect(await signedPhotoUrl(u(0), "p1")).toBeNull()
    h.respond = () => ({ ok: false })
    expect(await signedPhotoUrl(u(0), "p1")).toBeNull()
    h.respond = () => "throw"
    expect(await signedPhotoUrl(u(0), "p1")).toBeNull()
    expect(h.calls).toHaveLength(3) // refusals and failures are not remembered
    h.respond = null
    expect(await signedPhotoUrl(u(0), "p1")).toContain("/object/sign/")
  })
})

describe("openStoredFile", () => {
  it("opens the file through the signed link in a tab opened from the click", async () => {
    const tab = { opener: {} as unknown, location: { href: "" }, close: vi.fn() }
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window)
    expect(await openStoredFile(`${BASE}/diagrams/1700000000000-dddd.pdf`, "p1")).toBe(true)
    expect(tab.location.href).toContain("/object/sign/test-uploads/diagrams/1700000000000-dddd.pdf?token=")
    expect(tab.opener).toBeNull()
  })

  it("closes the empty tab and reports false when no link can be had", async () => {
    h.respond = REFUSE
    const tab = { opener: {} as unknown, location: { href: "" }, close: vi.fn() }
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window)
    expect(await openStoredFile(`${BASE}/diagrams/1700000000000-dddd.pdf`, "p1")).toBe(false)
    expect(tab.close).toHaveBeenCalled()
    expect(tab.location.href).toBe("")
  })
})

describe("SignedImg", () => {
  it("shows a blank placeholder first, then the picture through the signed link, keeping the same classes and alt text", async () => {
    render(<SignedImg src={u(5)} projectId="p1" alt="Finding 1 photo 1" className="h-24 w-auto" />)
    const img = screen.getByAltText("Finding 1 photo 1") as HTMLImageElement
    expect(img.className).toBe("h-24 w-auto")
    expect(img.getAttribute("src")).toMatch(/^data:image\/gif/)
    await waitFor(() => expect(img.getAttribute("src")).toContain("/object/sign/test-uploads/1700000000000-aaaa-photo-5.jpg?token=T1"))
  })

  it("shows a visible 'could not be loaded' box, not the plain address and not nothing, when no link can be had; retry asks again and recovers", async () => {
    h.respond = REFUSE
    render(<SignedImg src={u(6)} projectId="p1" alt="Finding 2 photo 1" />)
    const box = await screen.findByRole("button", { name: /Finding 2 photo 1: could not be loaded\. Retry/ })
    expect(box.textContent).toMatch(/unavailable/i)
    expect(document.querySelector("img")).toBeNull()
    h.respond = null
    fireEvent.click(box)
    await waitFor(() => expect((screen.getByAltText("Finding 2 photo 1") as HTMLImageElement).getAttribute("src")).toContain("/object/sign/"))
    expect(h.calls).toHaveLength(2)
  })

  it("when a picture fails to load from its link (for example the link expired on a page left open), it gets one fresh link automatically, then shows the retry box", async () => {
    render(<SignedImg src={u(7)} projectId="p1" alt="Photo seven" />)
    const img = await waitFor(() => {
      const el = screen.getByAltText("Photo seven") as HTMLImageElement
      expect(el.getAttribute("src")).toContain("token=T1")
      return el
    })
    fireEvent.error(img)
    await waitFor(() => expect((screen.getByAltText("Photo seven") as HTMLImageElement).getAttribute("src")).toContain("token=T2"))
    expect(h.calls).toHaveLength(2)
    fireEvent.error(screen.getByAltText("Photo seven"))
    expect(await screen.findByRole("button", { name: /Photo seven: could not be loaded/ })).toBeTruthy()
    expect(h.calls).toHaveLength(2) // no endless retry loop
  })

  it("passes ordinary pictures such as a chosen file preview straight through", async () => {
    render(<SignedImg src="blob:http://localhost/preview" alt="preview" />)
    await waitFor(() => expect((screen.getByAltText("preview") as HTMLImageElement).getAttribute("src")).toBe("blob:http://localhost/preview"))
    expect(h.calls).toHaveLength(0)
  })
})
