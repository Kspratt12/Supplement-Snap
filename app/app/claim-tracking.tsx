"use client"

import { useRef, useState } from "react"
import { SignedImg } from "../../lib/signed-img"
import {
  amountValue,
  followUpState,
  formatAmount,
  localToday,
  normalizePin,
  parseAmount,
  pinFromPoint,
  type Pin,
} from "../../lib/report-tracking"

type Tracking = { amount_requested?: unknown; amount_approved?: unknown; follow_up_on?: string | null; reminder_opt_in?: boolean }
export type TrackingPatch = { amount_requested: number | null; amount_approved: number | null; follow_up_on: string | null; reminder_opt_in?: boolean; reminder_tz?: string | null }

/**
 * Requested and approved amounts and the next follow-up date, all typed by the person. Shown only once the database has
 * these columns (supabase-migration-v16). Nothing here contacts an insurer, and nothing is sent: the follow-up date is a
 * reminder on screen only.
 */
export function ClaimTracking({
  project,
  readOnly,
  onSave,
  remindersAvailable = false,
}: {
  project: Tracking
  readOnly: boolean
  /** Saves the values; resolves to "" on success or a message to show */
  onSave: (patch: TrackingPatch) => Promise<string>
  /** Only when reminder emails are switched on for the site and the database has the columns */
  remindersAvailable?: boolean
}) {
  const requested = amountValue(project.amount_requested)
  const approved = amountValue(project.amount_approved)
  const followUp = project.follow_up_on ? String(project.follow_up_on).slice(0, 10) : ""
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ requested: "", approved: "", followUp: "", remind: false })
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const state = followUpState(followUp, localToday())

  function start() {
    setForm({ requested: requested === null ? "" : String(requested), approved: approved === null ? "" : String(approved), followUp, remind: project.reminder_opt_in === true })
    setError("")
    setEditing(true)
  }

  async function save() {
    const r = parseAmount(form.requested)
    const a = parseAmount(form.approved)
    if (r === "invalid" || a === "invalid") {
      setError("Enter amounts as numbers, for example 4250 or 4,250.50.")
      return
    }
    setSaving(true)
    const reminder = remindersAvailable ? { reminder_opt_in: form.remind && !!form.followUp, reminder_tz: Intl.DateTimeFormat().resolvedOptions().timeZone || null } : {}
    const problem = await onSave({ amount_requested: r, amount_approved: a, follow_up_on: form.followUp || null, ...reminder })
    setSaving(false)
    if (problem) setError(problem)
    else setEditing(false)
  }

  const input = "mt-1 w-full rounded border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"

  return (
    <div className="mt-2 rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400" data-testid="claim-tracking">
      {!editing ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span><span className="font-medium">Requested:</span> {requested === null ? "not entered" : formatAmount(requested)}</span>
          <span><span className="font-medium">Approved:</span> {approved === null ? "not entered" : formatAmount(approved)}</span>
          <span>
            <span className="font-medium">Follow up:</span>{" "}
            {followUp ? new Date(followUp + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "no date set"}
            {remindersAvailable && project.reminder_opt_in && followUp && <span className="ml-1.5 text-zinc-500">(email reminder on)</span>}
            {state === "due" && <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800" data-testid="follow-up-due">Due</span>}
          </span>
          {!readOnly && (
            <button type="button" onClick={start} className="-my-2 px-2 py-2 font-medium text-indigo-600 hover:text-indigo-500">
              {requested === null && approved === null && !followUp ? "+ Track amounts and follow-up" : "Edit"}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label className="block font-medium">Amount requested ($)<input inputMode="decimal" className={input} value={form.requested} onChange={(e) => setForm((f) => ({ ...f, requested: e.target.value }))} /></label>
            <label className="block font-medium">Amount approved ($)<input inputMode="decimal" className={input} value={form.approved} onChange={(e) => setForm((f) => ({ ...f, approved: e.target.value }))} /></label>
            <label className="block font-medium">Next follow-up<input type="date" className={input} value={form.followUp} onChange={(e) => setForm((f) => ({ ...f, followUp: e.target.value }))} /></label>
          </div>
          {remindersAvailable && (
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-indigo-600" checked={form.remind} disabled={!form.followUp} onChange={(e) => setForm((f) => ({ ...f, remind: e.target.checked }))} />
              <span>Email me once on the follow-up date, sometime after 8am in my time zone ({Intl.DateTimeFormat().resolvedOptions().timeZone}), at my account email. Only you get this email; nothing is sent to the adjuster.</span>
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={saving} onClick={save} className="rounded bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
            <button type="button" onClick={() => setEditing(false)} className="rounded border border-zinc-300 px-4 py-2.5 font-medium text-zinc-600 hover:bg-zinc-50">Cancel</button>
          </div>
          {error && <p role="alert" className="text-red-600">{error}</p>}
        </div>
      )}
      <p className="mt-1.5 text-[11px] text-zinc-500">
        Entered by you for your own tracking. Supplement Snap is not connected to insurers and does not confirm these amounts. {remindersAvailable ? "The follow-up date shows in the app; an email reminder to you is sent only if you turn it on." : "The follow-up date is a reminder in the app only; no email is sent."}
      </p>
    </div>
  )
}

/** Tap the roof diagram to place this finding's numbered pin. Shows the other findings' pins for reference. */
export function DiagramPinDialog({
  diagramUrl,
  projectId,
  number,
  current,
  others,
  onSave,
  onClose,
}: {
  diagramUrl: string
  projectId: string
  number: number
  current: unknown
  others: { n: number; pin: Pin }[]
  onSave: (pin: Pin | null) => Promise<string>
  onClose: () => void
}) {
  const [pin, setPin] = useState<Pin | null>(normalizePin(current))
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  async function save(value: Pin | null) {
    setSaving(true)
    const problem = await onSave(value)
    setSaving(false)
    if (problem) setError(problem)
    else onClose()
  }

  const dot = (n: number, p: Pin, mine: boolean) => (
    <span
      key={`${n}-${mine}`}
      aria-hidden="true"
      className={`pointer-events-none absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[11px] font-bold shadow ${mine ? "bg-red-600 text-white ring-2 ring-white" : "bg-indigo-600/80 text-white"}`}
      style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
    >
      {n}
    </span>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:px-4" role="dialog" aria-modal="true" aria-labelledby="pin-title">
      <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl sm:max-w-2xl sm:rounded-xl">
        <h2 id="pin-title" className="text-base font-bold text-zinc-900">Place finding {number} on the roof diagram</h2>
        <p className="mt-1 text-xs text-zinc-500">Tap where this finding is. The number matches the finding&apos;s number in the report.</p>
        <div
          ref={box}
          className="relative mt-3 cursor-crosshair select-none"
          data-testid="pin-target"
          onClick={(e) => {
            const rect = box.current?.getBoundingClientRect()
            if (!rect) return
            const p = pinFromPoint(e.clientX, e.clientY, rect)
            if (p) setPin(p)
          }}
        >
          <SignedImg projectId={projectId} src={diagramUrl} alt="Roof diagram" className="block w-full rounded-lg border border-zinc-200" draggable={false} />
          {others.filter((o) => o.n !== number).map((o) => dot(o.n, o.pin, false))}
          {pin && dot(number, pin, true)}
        </div>
        {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={!pin || saving} onClick={() => save(pin)} className="min-h-[44px] flex-1 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
            {saving ? "Saving..." : "Save pin"}
          </button>
          {normalizePin(current) && (
            <button type="button" disabled={saving} onClick={() => save(null)} className="min-h-[44px] rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              Remove pin
            </button>
          )}
          <button type="button" onClick={onClose} className="min-h-[44px] rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
        </div>
      </div>
    </div>
  )
}
