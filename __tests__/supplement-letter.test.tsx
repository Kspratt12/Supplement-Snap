import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { render, screen, fireEvent, within } from "@testing-library/react"
import { buildBody, buildSubject, emptyLetterInput, formatDate, filledFindings, reviewWarnings, type LetterInput } from "../lib/supplement-letter"
import { LetterClient } from "../app/roofing-supplement-letter-generator/letter-client"

// Fictional, synthetic claim used only by these tests
function sample(over: Partial<LetterInput> = {}): LetterInput {
  return {
    ...emptyLetterInput(),
    senderName: "Pat Example",
    companyName: "Example Roofing",
    senderPhone: "555-0100",
    senderEmail: "pat@example.com",
    homeownerName: "Jordan Sample",
    propertyAddress: "100 Test Lane, Exampleville",
    carrier: "Sample Mutual",
    claimNumber: "TEST-123",
    adjusterName: "Alex Adjuster",
    dateOfLoss: "2026-09-14",
    dateFound: "2026-11-03",
    findings: [
      { item: "Damaged decking", location: "Rear slope", quantity: "6", unit: "sheets", observation: "Soft, delaminated boards under the old underlayment." },
      { item: "", location: "", quantity: "", unit: "", observation: "" },
    ],
    ...over,
  }
}

describe("letter text", () => {
  it("builds an initial request with the claim block, numbered items, attachments and signature", () => {
    const body = buildBody(sample())
    expect(body).toMatch(/^Hello Alex Adjuster,/)
    expect(body).toContain("On November 3, 2026, during work on this roof, we documented the conditions listed here")
    expect(body).toContain("Claim number: TEST-123")
    expect(body).toContain("Date of loss: September 14, 2026")
    expect(body).toContain("1. Damaged decking, Rear slope (6 sheets)\n   Soft, delaminated boards under the old underlayment.")
    expect(body).not.toMatch(/^2\./m) // the empty row is left out
    expect(body).toContain("Attached: photos of each item; measurements.")
    expect(body.trim().endsWith("Pat Example\nExample Roofing\n555-0100\npat@example.com")).toBe(true)
  })

  it("never promises coverage, approval or payment", () => {
    for (const kind of ["initial", "follow-up", "reinspection"] as const) {
      const text = `${buildSubject(sample({ kind }))}\n${buildBody(sample({ kind, authorizationOnFile: true }))}`
      expect(text).not.toMatch(/\b(guarantee|owed|entitled|must pay|covered|approved|approve)\b/i)
    }
  })

  it("adds the on-behalf-of line only with authorization and a homeowner name", () => {
    expect(buildBody(sample())).not.toContain("on behalf of")
    expect(buildBody(sample({ authorizationOnFile: true }))).toContain("on behalf of Jordan Sample, with their authorization,")
    expect(buildBody(sample({ authorizationOnFile: true, homeownerName: "" }))).not.toContain("on behalf of")
  })

  it("follow-up and reinspection wording and subjects", () => {
    const f = sample({ kind: "follow-up", previousRequestDate: "2026-11-05" })
    expect(buildSubject(f)).toBe("Follow-up on supplement request – Claim TEST-123 – 100 Test Lane, Exampleville")
    expect(buildBody(f)).toContain("follow up on the supplement request sent on November 5, 2026")
    expect(buildBody(f)).toContain("Items in the request:")
    const r = sample({ kind: "reinspection" })
    expect(buildSubject(r)).toMatch(/^Reinspection request – Claim TEST-123/)
    expect(buildBody(r)).toContain("ask for a reinspection")
  })

  it("shows placeholders for missing essentials instead of inventing them", () => {
    const blank = emptyLetterInput()
    expect(buildSubject(blank)).toBe("Supplement request – Claim [claim number]")
    const body = buildBody(blank)
    expect(body).toContain("Claim number: [claim number]")
    expect(body).toContain("Property address: [property address]")
    expect(body).toContain("[your name]")
    expect(body).not.toContain("Insurance company:")
    expect(reviewWarnings(blank)).toEqual(expect.arrayContaining([
      "Add the claim number so the adjuster can match this to the file.",
      "List at least one item you documented.",
    ]))
  })

  it("dates and finding filtering", () => {
    expect(formatDate("2026-02-30")).toBe("2026-02-30") // not a real date: left as typed
    expect(formatDate("")).toBe("")
    expect(filledFindings([{ item: "", location: "", quantity: "", unit: "SF", observation: " " }])).toHaveLength(0)
    expect(buildBody(sample({ findings: [{ item: "", location: "Valley", quantity: "", unit: "", observation: "" }] }))).toContain("1. [item], Valley")
  })
})

describe("generator page", () => {
  it("updates the preview as the person types and switches letter type", () => {
    render(<LetterClient />)
    fireEvent.change(screen.getByLabelText("Claim number"), { target: { value: "TEST-9" } })
    fireEvent.change(screen.getByLabelText("Item"), { target: { value: "Pipe boot" } })
    expect(screen.getByTestId("letter-subject").textContent).toBe("Supplement request – Claim TEST-9")
    expect(screen.getByTestId("letter-body").textContent).toContain("1. Pipe boot")
    fireEvent.click(screen.getByLabelText(/Follow-up/))
    expect(screen.getByTestId("letter-subject").textContent).toMatch(/^Follow-up on supplement request/)
    expect(screen.getByLabelText("Date you sent the original request")).toBeTruthy()
  })

  it("adds and removes items", () => {
    render(<LetterClient />)
    fireEvent.click(screen.getByText("+ Add another item"))
    expect(screen.getAllByLabelText("Item")).toHaveLength(2)
    fireEvent.click(screen.getAllByText("Remove")[0])
    expect(screen.getAllByLabelText("Item")).toHaveLength(1)
  })

  it("lists what to fix before sending", () => {
    render(<LetterClient />)
    const box = screen.getByTestId("letter-warnings")
    expect(within(box).getByText(/Add the claim number/)).toBeTruthy()
  })

  it("the page source makes no network call and is in the sitemap", () => {
    const root = path.resolve(__dirname, "..")
    const client = fs.readFileSync(path.join(root, "app/roofing-supplement-letter-generator/letter-client.tsx"), "utf8")
    expect(client).not.toMatch(/fetch\(|authFetch|supabase|localStorage/)
    const sitemap = fs.readFileSync(path.join(root, "app/sitemap.ts"), "utf8")
    expect(sitemap).toContain("/roofing-supplement-letter-generator")
  })
})
