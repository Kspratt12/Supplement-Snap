/**
 * Builds the text of a supplement request, follow-up or reinspection request from what the person typed.
 * Template only: no AI, no network, nothing stored. Every statement in the output comes from the person's own entries
 * or from fixed, neutral wording that asks for a review. Nothing here states that an item is covered, owed or approved.
 */

export type LetterKind = "initial" | "follow-up" | "reinspection"

export interface LetterFinding {
  item: string
  location: string
  quantity: string
  unit: string
  observation: string
}

export interface LetterInput {
  kind: LetterKind
  senderName: string
  companyName: string
  senderPhone: string
  senderEmail: string
  homeownerName: string
  propertyAddress: string
  carrier: string
  claimNumber: string
  adjusterName: string
  dateOfLoss: string // yyyy-mm-dd from a date input, or ""
  dateFound: string // yyyy-mm-dd, or ""
  previousRequestDate: string // yyyy-mm-dd, or "" (follow-ups)
  authorizationOnFile: boolean
  findings: LetterFinding[]
  attachments: string[]
}

export const ATTACHMENT_OPTIONS = [
  { key: "photos", label: "Photos of each item" },
  { key: "measurements", label: "Measurements" },
  { key: "diagram", label: "Roof diagram or aerial measurement report" },
  { key: "invoices", label: "Material invoices or receipts" },
  { key: "references", label: "Code or manufacturer documentation" },
  { key: "report", label: "Supplement report" },
] as const

export const MAX_FINDINGS = 15

export function emptyFinding(): LetterFinding {
  return { item: "", location: "", quantity: "", unit: "", observation: "" }
}

export function emptyLetterInput(): LetterInput {
  return {
    kind: "initial",
    senderName: "",
    companyName: "",
    senderPhone: "",
    senderEmail: "",
    homeownerName: "",
    propertyAddress: "",
    carrier: "",
    claimNumber: "",
    adjusterName: "",
    dateOfLoss: "",
    dateFound: "",
    previousRequestDate: "",
    authorizationOnFile: false,
    findings: [emptyFinding()],
    attachments: ["photos", "measurements"],
  }
}

const clean = (s: string) => (s || "").replace(/\s+/g, " ").trim()

/** "2026-11-03" -> "November 3, 2026". Anything that is not a plain date is returned as typed, trimmed. */
export function formatDate(value: string): string {
  const v = clean(value)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  if (!m) return v
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  if (Number.isNaN(d.getTime()) || d.getUTCDate() !== Number(m[3])) return v
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })
}

/** Findings with nothing typed in them are left out, so an empty row never prints as "1. –". */
export function filledFindings(findings: LetterFinding[]): LetterFinding[] {
  return findings.filter((f) => clean(f.item) || clean(f.location) || clean(f.observation) || clean(f.quantity))
}

function findingLines(findings: LetterFinding[]): string[] {
  return filledFindings(findings).map((f, i) => {
    const title = [clean(f.item) || "[item]", clean(f.location)].filter(Boolean).join(", ")
    const qty = clean(f.quantity) ? ` (${[clean(f.quantity), clean(f.unit)].filter(Boolean).join(" ")})` : ""
    const obs = clean(f.observation)
    return `${i + 1}. ${title}${qty}${obs ? `\n   ${obs}` : ""}`
  })
}

function claimRef(input: LetterInput): string {
  return clean(input.claimNumber) || "[claim number]"
}

export function buildSubject(input: LetterInput): string {
  const address = clean(input.propertyAddress)
  const tail = `Claim ${claimRef(input)}${address ? ` – ${address}` : ""}`
  if (input.kind === "follow-up") return `Follow-up on supplement request – ${tail}`
  if (input.kind === "reinspection") return `Reinspection request – ${tail}`
  return `Supplement request – ${tail}`
}

export function buildBody(input: LetterInput): string {
  const lines: string[] = []
  const adjuster = clean(input.adjusterName)
  lines.push(adjuster ? `Hello ${adjuster},` : "Hello,")
  lines.push("")

  const homeowner = clean(input.homeownerName)
  const onBehalf = input.authorizationOnFile && homeowner ? ` on behalf of ${homeowner}, with their authorization,` : ""
  const found = formatDate(input.dateFound)
  const items = findingLines(input.findings)

  if (input.kind === "follow-up") {
    const sent = formatDate(input.previousRequestDate)
    lines.push(
      `I am writing${onBehalf} to follow up on the supplement request${sent ? ` sent on ${sent}` : ""} for the claim below. Could you let me know where it stands, and whether you need anything else from me to complete your review?`,
    )
  } else if (input.kind === "reinspection") {
    lines.push(
      `I am writing${onBehalf} to ask for a reinspection of the roof for the claim below, so the conditions listed here can be reviewed in person. Please let me know what times work for you.`,
    )
  } else {
    lines.push(
      `I am writing${onBehalf} about the claim below. ${found ? `On ${found}, during work on this roof, we` : "During work on this roof, we"} documented the conditions listed here, which do not appear on the current estimate. Please review them with the attached documentation and let me know whether you need more information or a reinspection.`,
    )
  }

  lines.push("")
  const details: [string, string][] = [
    ["Claim number", claimRef(input)],
    ["Insurance company", clean(input.carrier)],
    ["Insured", homeowner],
    ["Property address", clean(input.propertyAddress) || "[property address]"],
    ["Date of loss", formatDate(input.dateOfLoss)],
  ]
  for (const [label, value] of details) if (value) lines.push(`${label}: ${value}`)

  if (items.length > 0) {
    lines.push("")
    lines.push(input.kind === "follow-up" ? "Items in the request:" : "Items documented:")
    lines.push(...items)
  }

  const attached = ATTACHMENT_OPTIONS.filter((o) => input.attachments.includes(o.key)).map((o) => o.label.toLowerCase())
  if (attached.length > 0) {
    lines.push("")
    lines.push(`Attached: ${attached.join("; ")}.`)
  }

  lines.push("")
  lines.push("Thank you for your time.")
  lines.push("")
  const signature = [clean(input.senderName) || "[your name]", clean(input.companyName), clean(input.senderPhone), clean(input.senderEmail)].filter(Boolean)
  lines.push(...signature)
  return lines.join("\n")
}

/** Things worth checking before the request goes out. Shown next to the output; never part of the letter. */
export function reviewWarnings(input: LetterInput): string[] {
  const out: string[] = []
  if (!clean(input.claimNumber)) out.push("Add the claim number so the adjuster can match this to the file.")
  if (!clean(input.propertyAddress)) out.push("Add the property address.")
  if (!clean(input.senderName)) out.push("Add your name for the signature.")
  if (input.kind !== "follow-up" && filledFindings(input.findings).length === 0) out.push("List at least one item you documented.")
  if (filledFindings(input.findings).some((f) => !clean(f.item))) out.push("One of the items has no name; it will print as [item].")
  if (input.kind === "follow-up" && !clean(input.previousRequestDate)) out.push("Add the date you sent the original request, if you have it.")
  if (input.authorizationOnFile && !clean(input.homeownerName)) out.push("Add the homeowner's name, or the authorization line is left out.")
  return out
}
