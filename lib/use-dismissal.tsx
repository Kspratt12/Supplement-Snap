"use client"

import { useCallback, useEffect, useState } from "react"
import {
  fetchAccountMetadata,
  flushUnsynced,
  queueUnsynced,
  readLocalDismissal,
  writeLocalDismissal,
  type DismissalSpec,
} from "./dismissal-sync"

export type DismissalStatus =
  | "idle" // the panel is not applicable right now
  | "loading" // not known yet: show nothing
  | "show" // known: not dismissed
  | "dismissed"
  | "unavailable" // the account could not be asked and nothing says it was dismissed

/**
 * Decides whether an onboarding panel may show, and records a dismissal.
 *
 * Dismissed if any of these says so: the choice made on this page, this browser's copy, or the account setting (from the
 * login session, or read fresh from the server). The panel shows only when the account setting was read and says it is
 * not dismissed; until then it shows nothing, so a stale or slow read never flashes a panel that was hidden. If the read
 * fails and nothing says dismissed, the status is "unavailable" and a retry is offered. That is not treated as a first visit.
 *
 * Everything is tied to userId. An answer or a save for one person is never applied to another.
 */
export function useDismissal({
  userId,
  spec,
  sessionDismissed,
  enabled,
}: {
  userId: string
  spec: DismissalSpec
  /** What the login session's cached metadata says. It can be out of date. */
  sessionDismissed: boolean
  /** False when the panel would not show anyway, so nothing is read from the server */
  enabled: boolean
}): { status: DismissalStatus; dismiss: () => void; retry: () => void } {
  const [dismissedFor, setDismissedFor] = useState<string | null>(null)
  const [fresh, setFresh] = useState<{ userId: string; result: "dismissed" | "not" | "failed" } | null>(null)
  const [attempt, setAttempt] = useState(0)

  const local = readLocalDismissal(spec, userId)
  const freshHere = fresh?.userId === userId ? fresh.result : null
  const choseHere = dismissedFor === userId
  const known = choseHere || local === "dismissed" || sessionDismissed || freshHere === "dismissed"

  // Dismissals saved in this browser that never reached the account are tried again (a few times per page load)
  useEffect(() => {
    void flushUnsynced(userId)
  }, [userId])

  // Ask the server only when it is needed: the panel is applicable and nothing already says dismissed
  useEffect(() => {
    if (!enabled || known || freshHere !== null) return
    let cancelled = false
    fetchAccountMetadata(userId, { force: attempt > 0 }).then((res) => {
      if (cancelled) return
      setFresh({ userId, result: !res.ok ? "failed" : spec.isDismissedInMetadata(res.metadata) ? "dismissed" : "not" })
    })
    return () => {
      cancelled = true
    }
  }, [enabled, known, freshHere, userId, attempt, spec])

  // Bring the browser copy and the account copy into agreement. Only ever towards "dismissed".
  const accountSaysDismissed = sessionDismissed || freshHere === "dismissed"
  useEffect(() => {
    if (choseHere || !known) return
    if (accountSaysDismissed) {
      if (local !== "dismissed") writeLocalDismissal(spec, userId)
    } else {
      queueUnsynced(userId, spec.accountPatch)
      void flushUnsynced(userId)
    }
  }, [choseHere, known, accountSaysDismissed, local, userId, spec])

  const dismiss = useCallback(() => {
    setDismissedFor(userId)
    writeLocalDismissal(spec, userId)
    queueUnsynced(userId, spec.accountPatch)
    void flushUnsynced(userId)
  }, [userId, spec])

  const retry = useCallback(() => {
    setFresh(null)
    setAttempt((n) => n + 1)
  }, [])

  let status: DismissalStatus
  if (!enabled) status = "idle"
  else if (known) status = "dismissed"
  else if (freshHere === "not") status = "show"
  else if (freshHere === "failed") status = "unavailable"
  else status = "loading"
  return { status, dismiss, retry }
}

/** Shown in place of a panel when the account could not be asked whether it was dismissed */
export function PreferenceUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <p className="mb-6 text-xs text-zinc-500" role="status" data-testid="preference-unavailable">
      We could not check whether you have hidden this guide.{" "}
      <button type="button" onClick={onRetry} className="font-medium text-indigo-600 underline hover:text-indigo-500">
        Try again
      </button>
    </p>
  )
}
