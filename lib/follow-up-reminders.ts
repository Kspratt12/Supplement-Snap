/**
 * Opt-in follow-up reminders: one email to the project owner's own account address on the follow-up date, in the owner's
 * time zone. Never to adjusters, insurers or homeowners. Sending only happens when `send` is enabled; otherwise this only
 * reports what would be sent.
 *
 * Duplicate protection: each (project, follow-up date) is claimed in the database before sending. A claim that already
 * exists as "sent", or that is "claimed" by another run, is skipped. Failed sends are retried on later runs up to
 * MAX_ATTEMPTS, then left as failed.
 */
export const MAX_ATTEMPTS = 3

export type ReminderProject = {
  id: string
  user_id: string
  project_name: string
  follow_up_on: string | null
  reminder_opt_in: boolean
  reminder_tz: string | null
}

export type ClaimResult = "claimed" | "skip"

export type ReminderDeps = {
  candidates: () => Promise<ReminderProject[]> // opted-in projects with a follow-up date (date filtering happens here)
  claim: (projectId: string, date: string) => Promise<ClaimResult> // atomically create or re-open a failed claim below MAX_ATTEMPTS
  ownerEmail: (userId: string) => Promise<string | null> // the owner's confirmed account email, or null if the account is gone
  send: (msg: { to: string; subject: string; text: string; html: string }) => Promise<{ id: string }>
  markSent: (projectId: string, date: string, providerId: string) => Promise<void>
  markFailed: (projectId: string, date: string, error: string) => Promise<void>
}

/** The calendar date in a time zone, as yyyy-mm-dd. An unknown zone falls back to UTC rather than guessing. */
export function dateInZone(now: Date, tz: string | null): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz || "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now)
    const get = (t: string) => parts.find((p) => p.type === t)?.value
    return `${get("year")}-${get("month")}-${get("day")}`
  } catch {
    return now.toISOString().slice(0, 10)
  }
}

export function isDue(p: ReminderProject, now: Date): boolean {
  if (!p.reminder_opt_in || !p.follow_up_on) return false
  return p.follow_up_on.slice(0, 10) <= dateInZone(now, p.reminder_tz)
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string)

/** Minimal content: the project's name and a sign-in link. No claim number, address, amounts, adjuster or findings. */
export function reminderMessage(p: ReminderProject, siteUrl: string) {
  const link = `${siteUrl.replace(/\/$/, "")}/app?project=${encodeURIComponent(p.id)}`
  const subject = "Follow-up reminder from Supplement Snap"
  const text = `You asked Supplement Snap to remind you to follow up on "${p.project_name}" on ${p.follow_up_on}.\n\nOpen the project (sign-in required): ${link}\n\nYou can change or turn off this reminder in the project's tracking panel.`
  const html = `<p>You asked Supplement Snap to remind you to follow up on <strong>${esc(p.project_name)}</strong> on ${esc(p.follow_up_on || "")}.</p><p><a href="${esc(link)}">Open the project</a> (sign-in required).</p><p>You can change or turn off this reminder in the project's tracking panel.</p>`
  return { subject, text, html }
}

export type RunResult = { due: number; sent: number; failed: number; skipped: number; wouldSend: number }

export async function runReminders(deps: ReminderDeps, opts: { now: Date; send: boolean; siteUrl: string }): Promise<RunResult> {
  const result: RunResult = { due: 0, sent: 0, failed: 0, skipped: 0, wouldSend: 0 }
  for (const p of await deps.candidates()) {
    if (!isDue(p, opts.now)) continue
    result.due++
    const date = (p.follow_up_on as string).slice(0, 10)
    if (!opts.send) { result.wouldSend++; continue } // sending is off: nothing is claimed or sent
    if ((await deps.claim(p.id, date)) !== "claimed") { result.skipped++; continue }
    const to = await deps.ownerEmail(p.user_id)
    if (!to) { await deps.markFailed(p.id, date, "owner account not found"); result.failed++; continue }
    try {
      const { id } = await deps.send({ to, ...reminderMessage(p, opts.siteUrl) })
      await deps.markSent(p.id, date, id) // accepted by the provider; not proof of inbox delivery
      result.sent++
    } catch (e) {
      await deps.markFailed(p.id, date, (e instanceof Error ? e.message : "send failed").slice(0, 300))
      result.failed++
    }
  }
  return result
}
