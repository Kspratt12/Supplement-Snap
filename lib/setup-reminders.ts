// Who should get a "finish setting up your login" reminder.
// This is for paying customers who have an account but have never signed in, for example someone whose
// account was created for them by hand. It sends at most two reminders and never nags people who are using the app.

export const FIRST_REMINDER_AFTER_HOURS = 72
export const SECOND_REMINDER_AFTER_DAYS = 7
export const MAX_REMINDERS = 2

export interface ReminderState {
  createdAt: string
  lastSignInAt?: string | null
  /** From the account's metadata: how many reminders were sent, and when the last one went out. */
  remindersSent?: number
  lastReminderAt?: string | null
  /** True when the account has an active or trialing subscription. */
  paid: boolean
}

export function needsSetupReminder(s: ReminderState, now: Date = new Date()): boolean {
  if (!s.paid) return false
  if (s.lastSignInAt) return false
  const sent = s.remindersSent ?? 0
  if (sent >= MAX_REMINDERS) return false
  const created = Date.parse(s.createdAt)
  if (!Number.isFinite(created)) return false
  const hoursOld = (now.getTime() - created) / 3_600_000
  if (hoursOld < FIRST_REMINDER_AFTER_HOURS) return false
  if (sent === 0) return true
  const last = s.lastReminderAt ? Date.parse(s.lastReminderAt) : NaN
  if (!Number.isFinite(last)) return false
  return (now.getTime() - last) / 86_400_000 >= SECOND_REMINDER_AFTER_DAYS
}
