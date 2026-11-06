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
 * The user_metadata to store: everything already there, plus the requested dismissal keys at their allowed values.
 * Returns null when every requested key is already recorded, so nothing needs writing. A dismissal is never lowered.
 */
export function dismissalMetadata(existing: Record<string, unknown> | null | undefined, keys: DismissalKey[]): Record<string, unknown> | null {
  const current = existing ?? {}
  const missing = keys.filter((k) => current[k] !== ALLOWED_DISMISSALS[k])
  if (missing.length === 0) return null
  return { ...current, ...Object.fromEntries(missing.map((k) => [k, ALLOWED_DISMISSALS[k]])) }
}
