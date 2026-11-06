import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"

/**
 * The real Company Branding box with the network and storage replaced. It shows what the box says for each answer the
 * save request can get; it does not show what the real server stores.
 */

const n = vi.hoisted(() => ({
  posts: [] as Array<Record<string, unknown>>,
  reply: null as null | (() => Promise<unknown>),
}))

vi.mock("../lib/auth-fetch", () => ({
  authFetch: vi.fn(async (url: string, init?: { method?: string; body?: string }) => {
    if (init?.method === "POST") {
      n.posts.push(JSON.parse(init.body ?? "{}"))
      return n.reply ? n.reply() : { ok: true, status: 200, json: async () => ({ success: true }) }
    }
    return { ok: true, status: 200, json: async () => ({ settings: null }) }
  }),
}))
vi.mock("../lib/supabase", () => ({ supabase: { storage: { from: () => ({ upload: async () => ({ error: null }), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) } } }))

import { CompanySettings } from "../app/dashboard/company-settings"

const failure = (status: number, error?: string) => async () => ({ ok: false, status, json: async () => (error ? { error } : {}) })
const typeName = (v: string) => fireEvent.change(screen.getByPlaceholderText("Smith Roofing LLC"), { target: { value: v } })
const save = () => fireEvent.click(screen.getByRole("button", { name: /Save Branding|Branding Saved/ }))
const nameBox = () => screen.getByPlaceholderText("Smith Roofing LLC") as HTMLInputElement

beforeEach(() => {
  n.posts = []
  n.reply = null
})
afterEach(cleanup)

describe("company branding save feedback", () => {
  it("shows 'Branding Saved!' only after the server accepts the save", async () => {
    render(<CompanySettings userId="u1" />)
    typeName("Acme Roofing")
    expect(screen.queryByText("Branding Saved!")).toBeNull()
    save()
    expect(await screen.findByText("Branding Saved!")).toBeTruthy()
    expect(n.posts).toEqual([{ userId: "u1", companyName: "Acme Roofing", logoUrl: "" }])
  })

  it("a refused save (not on the plan) shows the server's reason, never 'saved', and keeps the typed name", async () => {
    n.reply = failure(403, "Custom branding is available on the Pro plan.")
    render(<CompanySettings userId="u1" />)
    typeName("Acme Roofing")
    save()
    expect((await screen.findByRole("alert")).textContent).toBe("Custom branding is available on the Pro plan.")
    expect(screen.queryByText("Branding Saved!")).toBeNull()
    expect(nameBox().value).toBe("Acme Roofing")
  })

  it("a failed plan check (503) says it could not check, not that the account is inactive", async () => {
    n.reply = failure(503, "We couldn't check your plan right now. Please try again in a moment.")
    render(<CompanySettings userId="u1" />)
    typeName("Acme Roofing")
    save()
    const alert = await screen.findByRole("alert")
    expect(alert.textContent).toMatch(/couldn't check your plan/)
    expect(alert.textContent).not.toMatch(/inactive|upgrade|Pro plan/i)
    expect(screen.queryByText("Branding Saved!")).toBeNull()
    expect(nameBox().value).toBe("Acme Roofing")
  })

  it("a 503 with no readable body still gets the plan-check wording", async () => {
    n.reply = async () => ({ ok: false, status: 503, json: async () => { throw new Error("not json") } })
    render(<CompanySettings userId="u1" />)
    typeName("Acme Roofing")
    save()
    expect((await screen.findByRole("alert")).textContent).toMatch(/couldn't check your plan/)
  })

  it("a server error with no message shows a generic error and keeps the input", async () => {
    n.reply = async () => ({ ok: false, status: 500, json: async () => { throw new Error("not json") } })
    render(<CompanySettings userId="u1" />)
    typeName("Acme Roofing")
    save()
    expect((await screen.findByRole("alert")).textContent).toMatch(/could not be saved/)
    expect(screen.queryByText("Branding Saved!")).toBeNull()
    expect(nameBox().value).toBe("Acme Roofing")
  })

  it("a network failure shows an error, not 'saved', and keeps the input", async () => {
    n.reply = async () => { throw new Error("offline") }
    render(<CompanySettings userId="u1" />)
    typeName("Acme Roofing")
    save()
    expect((await screen.findByRole("alert")).textContent).toMatch(/connection/)
    expect(screen.queryByText("Branding Saved!")).toBeNull()
    expect(nameBox().value).toBe("Acme Roofing")
  })

  it("the error clears when the person edits or tries again, and a retry that works shows 'saved'", async () => {
    n.reply = failure(503)
    render(<CompanySettings userId="u1" />)
    typeName("Acme Roofing")
    save()
    await screen.findByRole("alert")
    n.reply = null
    save()
    expect(await screen.findByText("Branding Saved!")).toBeTruthy()
    expect(screen.queryByRole("alert")).toBeNull()
    expect(n.posts).toHaveLength(2)
  })

  it("typing while a save is in flight is not shown as saved", async () => {
    let release!: () => void
    n.reply = () => new Promise((r) => { release = () => r({ ok: true, status: 200, json: async () => ({}) }) })
    render(<CompanySettings userId="u1" />)
    typeName("Acme")
    save()
    await waitFor(() => expect(n.posts).toHaveLength(1))
    typeName("Acme Roofing")
    release()
    await waitFor(() => expect(screen.getByRole("button", { name: "Save Branding" })).toBeTruthy())
    expect(screen.queryByText("Branding Saved!")).toBeNull()
    expect(nameBox().value).toBe("Acme Roofing")
  })
})
