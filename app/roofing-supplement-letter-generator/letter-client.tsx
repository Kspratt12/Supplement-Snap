"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ATTACHMENT_OPTIONS,
  MAX_FINDINGS,
  buildBody,
  buildSubject,
  emptyFinding,
  emptyLetterInput,
  reviewWarnings,
  type LetterFinding,
  type LetterInput,
  type LetterKind,
} from "../../lib/supplement-letter"

const KINDS: { value: LetterKind; label: string; hint: string }[] = [
  { value: "initial", label: "Supplement request", hint: "First request for items missing from the estimate" },
  { value: "follow-up", label: "Follow-up", hint: "You sent a request and have not heard back" },
  { value: "reinspection", label: "Reinspection request", hint: "Ask the adjuster to review the conditions in person" },
]

const UNITS = ["", "SF", "LF", "SQ", "EA", "sheets"]

const input =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
const labelCls = "block text-sm font-medium text-zinc-700"

export function LetterClient() {
  // Held in memory only: nothing typed here is sent anywhere or saved in the browser
  const [form, setForm] = useState<LetterInput>(emptyLetterInput)
  const [copied, setCopied] = useState<"" | "subject" | "body" | "all" | "failed">("")

  function set<K extends keyof LetterInput>(key: K, value: LetterInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }
  function setFinding(i: number, key: keyof LetterFinding, value: string) {
    setForm((prev) => ({ ...prev, findings: prev.findings.map((f, j) => (j === i ? { ...f, [key]: value } : f)) }))
  }
  function addFinding() {
    setForm((prev) => (prev.findings.length >= MAX_FINDINGS ? prev : { ...prev, findings: [...prev.findings, emptyFinding()] }))
  }
  function removeFinding(i: number) {
    setForm((prev) => ({ ...prev, findings: prev.findings.length <= 1 ? [emptyFinding()] : prev.findings.filter((_, j) => j !== i) }))
  }
  function toggleAttachment(key: string) {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.includes(key) ? prev.attachments.filter((k) => k !== key) : [...prev.attachments, key],
    }))
  }

  const subject = buildSubject(form)
  const body = buildBody(form)
  const warnings = reviewWarnings(form)

  async function copy(what: "subject" | "body" | "all") {
    const text = what === "subject" ? subject : what === "body" ? body : `Subject: ${subject}\n\n${body}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
    } catch {
      setCopied("failed")
    }
    setTimeout(() => setCopied(""), 2500)
  }

  return (
    <div>
      <form className="space-y-8 print:hidden" onSubmit={(e) => e.preventDefault()} aria-label="Letter details">
        <fieldset>
          <legend className="text-lg font-bold text-zinc-900">1. What are you sending?</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {KINDS.map((k) => (
              <label
                key={k.value}
                className={`flex cursor-pointer flex-col rounded-lg border px-4 py-3 ${form.kind === k.value ? "border-indigo-500 bg-indigo-50" : "border-zinc-200 bg-white hover:border-indigo-200"}`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  <input type="radio" name="kind" value={k.value} checked={form.kind === k.value} onChange={() => set("kind", k.value)} className="h-4 w-4 accent-indigo-600" />
                  {k.label}
                </span>
                <span className="mt-1 text-xs text-zinc-500">{k.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-lg font-bold text-zinc-900">2. Claim details</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className={labelCls}>Claim number<input className={input} value={form.claimNumber} onChange={(e) => set("claimNumber", e.target.value)} /></label>
            <label className={labelCls}>Insurance company<input className={input} value={form.carrier} onChange={(e) => set("carrier", e.target.value)} /></label>
            <label className={labelCls}>Adjuster name<input className={input} value={form.adjusterName} onChange={(e) => set("adjusterName", e.target.value)} /></label>
            <label className={labelCls}>Homeowner (insured) name<input className={input} value={form.homeownerName} onChange={(e) => set("homeownerName", e.target.value)} /></label>
            <label className={`${labelCls} sm:col-span-2`}>Property address<input className={input} value={form.propertyAddress} onChange={(e) => set("propertyAddress", e.target.value)} autoComplete="off" /></label>
            <label className={labelCls}>Date of loss<input type="date" className={input} value={form.dateOfLoss} onChange={(e) => set("dateOfLoss", e.target.value)} /></label>
            {form.kind === "follow-up" ? (
              <label className={labelCls}>Date you sent the original request<input type="date" className={input} value={form.previousRequestDate} onChange={(e) => set("previousRequestDate", e.target.value)} /></label>
            ) : (
              <label className={labelCls}>Date the conditions were found<input type="date" className={input} value={form.dateFound} onChange={(e) => set("dateFound", e.target.value)} /></label>
            )}
          </div>
          <label className="mt-4 flex items-start gap-3 text-sm text-zinc-700">
            <input type="checkbox" checked={form.authorizationOnFile} onChange={(e) => set("authorizationOnFile", e.target.checked)} className="mt-0.5 h-5 w-5 flex-shrink-0 accent-indigo-600" />
            <span>
              I have the homeowner&apos;s written authorization to communicate with the carrier about this claim. Adds an &quot;on behalf of&quot; line. Rules on who may talk to the carrier vary by state; see{" "}
              <Link href="/blog/can-a-roofer-talk-to-the-insurance-company" className="font-medium text-indigo-600 underline hover:text-indigo-500">can a roofer talk to the insurance company</Link>.
            </span>
          </label>
        </fieldset>

        <fieldset>
          <legend className="text-lg font-bold text-zinc-900">3. Items you documented</legend>
          <p className="mt-1 text-sm text-zinc-500">Describe what you saw, where, and how much. Stick to what your photos and measurements show.</p>
          <div className="mt-3 space-y-4">
            {form.findings.map((f, i) => (
              <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-900">Item {i + 1}</p>
                  <button type="button" onClick={() => removeFinding(i)} className="min-h-[44px] px-2 text-xs font-medium text-zinc-500 hover:text-red-600">
                    {form.findings.length <= 1 ? "Clear" : "Remove"}
                  </button>
                </div>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <label className={labelCls}>Item<input className={input} placeholder="e.g. Damaged roof decking" value={f.item} onChange={(e) => setFinding(i, "item", e.target.value)} /></label>
                  <label className={labelCls}>Location<input className={input} placeholder="e.g. Rear slope, along the eave" value={f.location} onChange={(e) => setFinding(i, "location", e.target.value)} /></label>
                  <label className={labelCls}>Quantity<input inputMode="decimal" className={input} value={f.quantity} onChange={(e) => setFinding(i, "quantity", e.target.value)} /></label>
                  <label className={labelCls}>
                    Unit
                    <select className={input} value={f.unit} onChange={(e) => setFinding(i, "unit", e.target.value)}>
                      {UNITS.map((u) => (<option key={u} value={u}>{u || "None"}</option>))}
                    </select>
                  </label>
                  <label className={`${labelCls} sm:col-span-2`}>
                    What you observed
                    <textarea rows={3} className={input} placeholder="e.g. Boards were soft and delaminated under the old underlayment; photographed before new decking was installed." value={f.observation} onChange={(e) => setFinding(i, "observation", e.target.value)} />
                  </label>
                </div>
              </div>
            ))}
          </div>
          {form.findings.length < MAX_FINDINGS && (
            <button type="button" onClick={addFinding} className="mt-3 min-h-[44px] rounded-lg border border-dashed border-indigo-300 px-4 text-sm font-semibold text-indigo-600 hover:bg-indigo-50">
              + Add another item
            </button>
          )}
        </fieldset>

        <fieldset>
          <legend className="text-lg font-bold text-zinc-900">4. What you are attaching</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {ATTACHMENT_OPTIONS.map((o) => (
              <label key={o.key} className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700">
                <input type="checkbox" checked={form.attachments.includes(o.key)} onChange={() => toggleAttachment(o.key)} className="h-5 w-5 flex-shrink-0 accent-indigo-600" />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-lg font-bold text-zinc-900">5. Your signature</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className={labelCls}>Your name<input className={input} value={form.senderName} onChange={(e) => set("senderName", e.target.value)} autoComplete="name" /></label>
            <label className={labelCls}>Company<input className={input} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} autoComplete="organization" /></label>
            <label className={labelCls}>Phone<input type="tel" className={input} value={form.senderPhone} onChange={(e) => set("senderPhone", e.target.value)} autoComplete="tel" /></label>
            <label className={labelCls}>Email<input type="email" className={input} value={form.senderEmail} onChange={(e) => set("senderEmail", e.target.value)} autoComplete="email" /></label>
          </div>
        </fieldset>
      </form>

      <section className="mt-10 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:p-6 print:border-0 print:bg-white print:p-0" aria-label="Your letter">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <h2 className="text-lg font-bold text-zinc-900">Your {form.kind === "follow-up" ? "follow-up" : form.kind === "reinspection" ? "reinspection request" : "supplement request"}</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => copy("all")} className="min-h-[44px] rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500">
              {copied === "all" ? "Copied" : "Copy email"}
            </button>
            <button type="button" onClick={() => copy("body")} className="min-h-[44px] rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              {copied === "body" ? "Copied" : "Copy text only"}
            </button>
            <button type="button" onClick={() => window.print()} className="min-h-[44px] rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              Print or save as PDF
            </button>
          </div>
        </div>
        {copied === "failed" && (
          <p role="alert" className="mt-2 text-sm text-red-700 print:hidden">This browser blocked copying. Select the text below and copy it by hand.</p>
        )}

        {warnings.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 print:hidden" data-testid="letter-warnings">
            <p className="text-sm font-semibold text-amber-900">Before you send</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-amber-900">
              {warnings.map((w) => (<li key={w}>{w}</li>))}
            </ul>
          </div>
        )}

        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 print:border-0 print:p-0">
          <p className="text-sm text-zinc-500 print:hidden">Subject</p>
          <p className="text-sm font-semibold text-zinc-900 break-words" data-testid="letter-subject">{subject}</p>
          <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-zinc-800" data-testid="letter-body">{body}</pre>
        </div>
        <p className="mt-3 text-xs text-zinc-500 print:hidden">
          Read every line before sending and change anything that does not match your job. Nothing you type here is sent or saved; it stays in this browser tab and is gone when you close it.
        </p>
      </section>
    </div>
  )
}
