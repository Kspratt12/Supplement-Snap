/**
 * Decides whether a database write really happened.
 *
 * When row security refuses an update or delete, the database answers with no error and no rows changed. A write is
 * only counted as saved when the request asked for the changed rows back (`.select("id")`) and at least one came back.
 */
export type WriteOutcome = "ok" | "refused" | "error"

export function writeOutcome(res: { data?: unknown; error?: { message?: string } | null }): WriteOutcome {
  if (res.error) return "error"
  if (!Array.isArray(res.data) || res.data.length === 0) return "refused"
  return "ok"
}

/** Shown when a change was refused or matched nothing, so the screen never claims a save that did not happen. */
export const NOT_SAVED_NO_PERMISSION =
  "This change was not saved. Your account may not have permission to edit this project, or it no longer exists."
