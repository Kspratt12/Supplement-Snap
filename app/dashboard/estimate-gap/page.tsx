"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "../../../lib/auth-context"
import { authFetch } from "../../../lib/auth-fetch"
import { correctLine } from "../../../lib/estimate-gap/correct"
import { formatMoneyTt, formatQuantityMilli } from "../../../lib/estimate-gap/parse"
import type { ComparisonResult, DocumentRole, Finding, FindingCategory, ParsedDocument, ParsedLine } from "../../../lib/estimate-gap/types"

const MAX_BYTES = 4 * 1024 * 1024
const WHO: Record<DocumentRole, string> = { insurer: "Insurance estimate", contractor: "Contractor estimate" }
const CATEGORY: Record<FindingCategory, { title: string; note: string; tone: string }> = {
  verified_arithmetic: { title: "Verified arithmetic discrepancies", note: "Recomputed from numbers printed in the same row of one document.", tone: "border-red-200 bg-red-50" },
  observed_difference: { title: "Directly observed differences", note: "A difference in what the two documents say. It does not show that either estimate is wrong.", tone: "border-amber-200 bg-amber-50" },
  scope_review: { title: "Possible scope differences needing professional review", note: "Rows with no match in the other document. Not evidence that anything is owed.", tone: "border-blue-200 bg-blue-50" },
  needs_confirmation: { title: "Uncertain matches: please confirm", note: "No difference is reported for these until you confirm they are the same item.", tone: "border-violet-200 bg-violet-50" },
  not_extracted: { title: "Could not be read reliably", note: "These rows or pages are not part of the comparison.", tone: "border-zinc-300 bg-zinc-100" },
}
const ORDER: FindingCategory[] = ["verified_arithmetic", "observed_difference", "scope_review", "needs_confirmation", "not_extracted"]

type Slot = { file: File | null; doc: ParsedDocument | null; state: "idle" | "reading" | "done" | "error"; error: string }
const emptySlot: Slot = { file: null, doc: null, state: "idle", error: "" }

function checkFile(file: File): string {
  if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") return "Choose a PDF file."
  if (file.size > MAX_BYTES) return "This file is larger than 4 MB. Save a smaller copy and try again."
  if (file.size === 0) return "This file is empty."
  return ""
}

export default function EstimateGapPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [available, setAvailable] = useState<boolean | null>(null)
  const [statusError, setStatusError] = useState("")
  const [slots, setSlots] = useState<Record<DocumentRole, Slot>>({ insurer: emptySlot, contractor: emptySlot })
  const [confirmed, setConfirmed] = useState<Array<[string, string]>>([])
  const [rejected, setRejected] = useState<Array<[string, string]>>([])
  const [correctedRows, setCorrectedRows] = useState(0)
  // The latest answer from the server, together with exactly what it was an answer to
  const [outcome, setOutcome] = useState<{ ins: ParsedDocument; con: ParsedDocument; confirmed: Array<[string, string]>; rejected: Array<[string, string]>; result: ComparisonResult | null; error: string } | null>(null)
  const [editing, setEditing] = useState<{ role: DocumentRole; id: string } | null>(null)
  const [editValues, setEditValues] = useState({ description: "", quantity: "", unit: "", unitPrice: "", total: "" })
  const [editError, setEditError] = useState("")

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    authFetch("/api/estimate-gap/status")
      .then(async (r) => {
        if (cancelled) return
        if (!r.ok) { setAvailable(false); return }
        setAvailable(!!(await r.json()).available)
      })
      .catch(() => { if (!cancelled) setStatusError("Could not check your plan. Please reload the page.") })
    return () => { cancelled = true }
  }, [user])

  const insDoc = slots.insurer.doc, conDoc = slots.contractor.doc

  // Compare whenever both documents are ready or a correction or match decision changes
  useEffect(() => {
    if (!insDoc || !conDoc) return
    let cancelled = false
    authFetch("/api/estimate-gap/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insurer: insDoc, contractor: conDoc, corrections: { confirmedPairs: confirmed, rejectedPairs: rejected } }),
    })
      .then(async (r) => {
        if (cancelled) return
        const body = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(body.error || "The comparison could not be made.")
        setOutcome({ ins: insDoc, con: conDoc, confirmed, rejected, result: body.result as ComparisonResult, error: "" })
      })
      .catch((e: Error) => { if (!cancelled) setOutcome({ ins: insDoc, con: conDoc, confirmed, rejected, result: null, error: e.message }) })
    return () => { cancelled = true }
  }, [insDoc, conDoc, confirmed, rejected])

  // Only show an answer that matches what is on screen now
  const current = outcome && outcome.ins === insDoc && outcome.con === conDoc && outcome.confirmed === confirmed && outcome.rejected === rejected ? outcome : null
  const result = current?.result ?? null
  const compareError = current?.error ?? ""
  const comparing = !!(insDoc && conDoc) && !current

  function setSlot(role: DocumentRole, patch: Partial<Slot>) {
    setSlots((s) => ({ ...s, [role]: { ...s[role], ...patch } }))
  }

  function pick(role: DocumentRole, file: File | null) {
    setConfirmed([]); setRejected([]); setCorrectedRows(0)
    if (!file) { setSlot(role, { ...emptySlot }); return }
    const problem = checkFile(file)
    setSlot(role, { file, doc: null, state: problem ? "error" : "idle", error: problem })
  }

  async function read(role: DocumentRole) {
    const slot = slots[role]
    if (!slot.file) return
    setSlot(role, { state: "reading", error: "" })
    try {
      const form = new FormData()
      form.set("role", role)
      form.set("file", slot.file)
      const res = await authFetch("/api/estimate-gap/extract", { method: "POST", body: form })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "This file could not be read.")
      setSlot(role, { doc: body.document as ParsedDocument, state: "done" })
    } catch (e) {
      setSlot(role, { doc: null, state: "error", error: e instanceof Error ? e.message : "This file could not be read." })
    }
  }

  function startEdit(role: DocumentRole, l: ParsedLine) {
    setEditing({ role, id: l.id })
    setEditError("")
    setEditValues({
      description: l.description,
      quantity: l.quantityMilli !== undefined ? formatQuantityMilli(l.quantityMilli) : "",
      unit: l.unit || "",
      unitPrice: l.unitPriceTt !== undefined ? (l.unitPriceTt / 10000).toFixed(2) : "",
      total: l.totalTt !== undefined ? (l.totalTt / 10000).toFixed(2) : "",
    })
  }

  function saveEdit() {
    if (!editing) return
    const doc = slots[editing.role].doc
    if (!doc) return
    const out = correctLine(doc, editing.id, editValues)
    if (out.errors.length) { setEditError(out.errors.join(" ")); return }
    setSlot(editing.role, { doc: out.doc })
    setCorrectedRows((n) => n + 1)
    setEditing(null)
  }

  async function downloadReport() {
    if (!result || !insDoc || !conDoc) return
    const { buildReportPdf } = await import("../../../lib/estimate-gap/report")
    buildReportPdf(result, { insurer: insDoc, contractor: conDoc }, { correctedRows, confirmedPairs: confirmed.length, rejectedPairs: rejected.length }).save("estimate-comparison.pdf")
  }

  function decide(f: Finding, how: "confirm" | "reject") {
    const i = f.evidence.find((e) => e.role === "insurer")?.lineId
    const c = f.evidence.find((e) => e.role === "contractor")?.lineId
    if (!i || !c) return
    if (how === "confirm") setConfirmed((p) => [...p, [i, c]])
    else setRejected((p) => [...p, [i, c]])
  }

  if (authLoading || !user) return null

  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="inline-flex min-h-[44px] items-center text-sm font-medium text-zinc-600 hover:text-zinc-900">&larr; Dashboard</Link>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">Preview</span>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Insurance Estimate Gap Detector</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">Upload the insurance estimate and your own estimate as PDFs. This lists where line items, quantities and prices differ, and the page each difference came from. Files are read in memory and are not saved.</p>

        {statusError && <p role="alert" className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{statusError}</p>}

        {available === null && !statusError && <p className="mt-8 text-sm text-zinc-500">Checking your plan...</p>}

        {available === false && (
          <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-6" data-testid="gap-unavailable">
            <h2 className="text-base font-semibold text-zinc-900">Not available yet</h2>
            <p className="mt-2 text-sm text-zinc-600">The Insurance Estimate Gap Detector is still in development and is not available on your plan. Nothing has been uploaded or read.</p>
          </div>
        )}

        {available && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {(["insurer", "contractor"] as DocumentRole[]).map((role) => {
                const s = slots[role]
                return (
                  <section key={role} className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5" aria-labelledby={`${role}-h`}>
                    <h2 id={`${role}-h`} className="text-sm font-semibold text-zinc-900">{WHO[role]}</h2>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      aria-label={`${WHO[role]} PDF`}
                      onChange={(e) => pick(role, e.target.files?.[0] || null)}
                      className="mt-3 block w-full text-sm text-zinc-600 file:mr-3 file:min-h-[44px] file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:text-sm file:font-semibold file:text-white"
                    />
                    {s.error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{s.error}</p>}
                    <div className="mt-3 flex items-center gap-3">
                      <button type="button" onClick={() => read(role)} disabled={!s.file || s.state === "reading" || (s.state === "error" && !!checkFile(s.file as File))}
                        className="min-h-[44px] rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white disabled:opacity-40">
                        {s.state === "reading" ? "Reading..." : s.state === "error" && s.file && !checkFile(s.file) ? "Try again" : s.state === "done" ? "Read again" : "Read this file"}
                      </button>
                      {s.state === "done" && s.doc && <span className="text-sm text-green-700">{s.doc.lines.length} line item(s) read from {s.doc.pagesTotal} page(s)</span>}
                    </div>
                  </section>
                )
              })}
            </div>

            {comparing && <p className="mt-6 text-sm text-zinc-500">Comparing...</p>}
            {compareError && <p role="alert" className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{compareError}</p>}

            {insDoc && conDoc && (
              <section className="mt-8">
                <h2 className="text-lg font-semibold text-zinc-900">Check what was read</h2>
                <p className="mt-1 text-sm text-zinc-600">Text is read automatically and can contain mistakes. Compare each row with your document, and correct any that are wrong. The comparison updates as you correct them.</p>
                {(["insurer", "contractor"] as DocumentRole[]).map((role) => {
                  const d = slots[role].doc as ParsedDocument
                  return (
                    <details key={role} className="mt-4 rounded-xl border border-zinc-200 bg-white" data-testid={`rows-${role}`}>
                      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-zinc-900">{WHO[role]}: {d.lines.length} row(s) read</summary>
                      <ul className="divide-y divide-zinc-100">
                        {d.lines.map((l) => (
                          <li key={l.id} className="px-4 py-3 text-sm">
                            {editing?.id === l.id ? (
                              <div className="space-y-2">
                                {(["description", "quantity", "unit", "unitPrice", "total"] as const).map((k) => (
                                  <label key={k} className="block">
                                    <span className="text-xs font-medium text-zinc-500">{k === "unitPrice" ? "Unit price" : k[0].toUpperCase() + k.slice(1)}</span>
                                    <input value={editValues[k]} onChange={(e) => setEditValues((v) => ({ ...v, [k]: e.target.value }))} className="mt-1 block min-h-[44px] w-full rounded-lg border border-zinc-300 px-3 text-sm" />
                                  </label>
                                ))}
                                {editError && <p role="alert" className="text-sm text-red-700">{editError}</p>}
                                <div className="flex gap-2">
                                  <button type="button" onClick={saveEdit} className="min-h-[44px] rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white">Save row</button>
                                  <button type="button" onClick={() => setEditing(null)} className="min-h-[44px] rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-medium text-zinc-900">{l.description || "(no description)"}</p>
                                  <p className="mt-0.5 text-xs text-zinc-500">
                                    Page {l.page} · {l.quantityMilli !== undefined ? formatQuantityMilli(l.quantityMilli) : "?"} {l.unit || ""}
                                    {l.unitPriceTt !== undefined ? ` · ${formatMoneyTt(l.unitPriceTt)} each` : ""}
                                    {l.totalTt !== undefined ? ` · total ${formatMoneyTt(l.totalTt)}` : ""}
                                  </p>
                                  {l.correctedByUser && <p className="mt-0.5 text-xs text-indigo-700">Corrected by you</p>}
                                  {l.issues.map((i, n) => <p key={n} className="mt-0.5 text-xs text-amber-700">{i}</p>)}
                                </div>
                                <button type="button" onClick={() => startEdit(role, l)} className="min-h-[44px] shrink-0 px-2 text-sm font-medium text-indigo-700">Correct</button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )
                })}
              </section>
            )}

            {result && (
              <section className="mt-10" data-testid="gap-results">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-zinc-900">Findings</h2>
                  <button type="button" onClick={downloadReport} className="min-h-[44px] rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white">Download report (PDF)</button>
                </div>

                {!result.canCompare && (
                  <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <p className="font-semibold">A reliable comparison could not be made.</p>
                    <ul className="mt-1 list-disc pl-5">{result.blockingReasons.map((r) => <li key={r}>{r}</li>)}</ul>
                  </div>
                )}
                {result.reliabilityNotes.length > 0 && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="font-semibold">Document quality</p>
                    <ul className="mt-1 list-disc pl-5">{result.reliabilityNotes.map((n) => <li key={n}>{n}</li>)}</ul>
                  </div>
                )}

                {ORDER.map((cat) => {
                  const list = result.findings.filter((f) => f.category === cat)
                  if (!list.length) return null
                  return (
                    <div key={cat} className="mt-6">
                      <h3 className="text-base font-semibold text-zinc-900">{CATEGORY[cat].title} ({list.length})</h3>
                      <p className="text-xs text-zinc-500">{CATEGORY[cat].note}</p>
                      <ul className="mt-3 space-y-3">
                        {list.map((f) => (
                          <li key={f.id} className={`rounded-xl border p-4 ${CATEGORY[cat].tone}`}>
                            <p className="text-sm font-semibold text-zinc-900">{f.title}</p>
                            <p className="mt-1 text-sm text-zinc-700">{f.explanation}</p>
                            {f.evidence.length > 0 && (
                              <ul className="mt-2 space-y-1">
                                {f.evidence.map((e, n) => (
                                  <li key={n} className="break-words rounded bg-white/70 px-2 py-1 font-mono text-xs text-zinc-700">{WHO[e.role]} · page {e.page}: {e.raw}</li>
                                ))}
                              </ul>
                            )}
                            {f.kind === "line_only_on_contractor_estimate" && result.findings.some((x) => x.kind === "line_only_on_insurance_estimate") && (
                              <label className="mt-3 block">
                                <span className="text-xs font-medium text-zinc-600">The two estimates may word the same work differently. If this row matches one on the insurance estimate, pick it:</span>
                                <select
                                  aria-label="Pair with an insurance estimate row"
                                  defaultValue=""
                                  onChange={(e) => {
                                    const c = f.evidence[0]?.lineId
                                    if (c && e.target.value) setConfirmed((p) => [...p, [e.target.value, c]])
                                  }}
                                  className="mt-1 block min-h-[44px] w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm"
                                >
                                  <option value="">Not matched</option>
                                  {result.findings.filter((x) => x.kind === "line_only_on_insurance_estimate").map((x) => (
                                    <option key={x.id} value={x.evidence[0]?.lineId}>{x.title.replace("On the insurance estimate only: ", "") || "(no description)"}</option>
                                  ))}
                                </select>
                              </label>
                            )}
                            {f.kind === "uncertain_match" && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button type="button" onClick={() => decide(f, "confirm")} className="min-h-[44px] rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white">Same item</button>
                                <button type="button" onClick={() => decide(f, "reject")} className="min-h-[44px] rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700">Not the same</button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
                {result.canCompare && result.findings.length === 0 && <p className="mt-6 text-sm text-zinc-600">No differences were found between the rows that could be read.</p>}

                <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-4 text-xs text-zinc-600">
                  {result.disclaimers.map((d) => <p key={d} className="mt-1 first:mt-0">{d}</p>)}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
