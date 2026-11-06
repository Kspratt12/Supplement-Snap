// The only account settings the dismissal route may write, and the only value each may be given. The server sets the
// values itself; a request names keys, never values, so it cannot set one to false or to anything else.
export const ALLOWED_DISMISSALS = {
  ss_start_here_hidden: true,
  ss_onboarding_free: "dismissed",
  ss_onboarding_paid: "dismissed",
} as const

export type DismissalKey = keyof typeof ALLOWED_DISMISSALS

export function isDismissalKey(key: unknown): key is DismissalKey {
  return typeof key === "string" && Object.prototype.hasOwnProperty.call(ALLOWED_DISMISSALS, key)
}

/**
 * The request body: who the browser believes it is saving for, and which dismissal keys. Anything else is refused.
 * The user id is only an expectation to be checked against the verified login; it never chooses whose account is changed.
 */
export function parseDismissalRequest(body: unknown): { userId: string; keys: DismissalKey[] } | null {
  if (typeof body !== "object" || body === null) return null
  const { userId, keys } = body as { userId?: unknown; keys?: unknown }
  if (typeof userId !== "string" || userId.length === 0 || userId.length > 100) return null
  if (!Array.isArray(keys) || keys.length === 0 || keys.length > Object.keys(ALLOWED_DISMISSALS).length) return null
  if (!keys.every(isDismissalKey)) return null
  return { userId, keys: [...new Set(keys)] as DismissalKey[] }
}

/**
 * The metadata change to send: only the requested dismissal keys that are not already at their allowed value. Nothing else
 * from the stored metadata is included, so a write can never put back an older copy of a key it does not own. Returns null
 * when every requested key is already recorded. A dismissal is never lowered.
 */
export function dismissalPatch(existing: Record<string, unknown> | null | undefined, keys: DismissalKey[]): Record<string, unknown> | null {
  const current = existing ?? {}
  const missing = keys.filter((k) => current[k] !== ALLOWED_DISMISSALS[k])
  if (missing.length === 0) return null
  return Object.fromEntries(missing.map((k) => [k, ALLOWED_DISMISSALS[k]]))
}

// ---------------------------------------------------------------- Minimize and Expand

export type ChecklistMode = "free" | "paid"
export type ChecklistState = "minimized" | ""

/** The account key that holds the checklist state for a plan mode */
export const checklistKey = (mode: ChecklistMode) => `ss_onboarding_${mode}` as const

/**
 * The body of a Minimize or Expand save: who the browser believes it is saving for, which plan mode, and the new state.
 * As with dismissals, the user id is only an expectation checked against the verified login.
 */
export function parseChecklistRequest(body: unknown): { userId: string; mode: ChecklistMode; state: ChecklistState } | null {
  if (typeof body !== "object" || body === null) return null
  const { userId, checklist } = body as { userId?: unknown; checklist?: unknown }
  if (typeof userId !== "string" || userId.length === 0 || userId.length > 100) return null
  if (typeof checklist !== "object" || checklist === null) return null
  const { mode, state } = checklist as { mode?: unknown; state?: unknown }
  if (mode !== "free" && mode !== "paid") return null
  if (state !== "minimized" && state !== "") return null
  return { userId, mode, state }
}

/**
 * The single-key change for a Minimize or Expand, or null when there is nothing to write. A dismissal is never lowered:
 * if that mode is already dismissed on the account, the change is dropped.
 */
export function checklistPatch(existing: Record<string, unknown> | null | undefined, mode: ChecklistMode, state: ChecklistState): Record<string, unknown> | null {
  const key = checklistKey(mode)
  const current = existing?.[key]
  if (current === "dismissed") return null
  if ((current ?? "") === state) return null
  return { [key]: state }
}
