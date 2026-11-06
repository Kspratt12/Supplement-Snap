import { supabase } from "./supabase"
import { authFetch } from "./auth-fetch"

// Shared by the two onboarding panels ("Start here" on /app and "Getting Started" on /dashboard).
//
// A dismissal is kept in two places: a copy in this browser, keyed by the person, and a setting on their account (their
// user metadata), which is what lets it follow them to another browser or device. This file holds the parts they share:
//  - reading the browser copy without mistaking a read failure for "not dismissed",
//  - reading the account's current setting from the server once, however many panels ask,
//  - saving a dismissal to the account through the server (/api/onboarding-dismissal), which changes only the account the
//    request's own login proves and refuses the save if that is not the person it was queued for,
//  - remembering a dismissal that could not be saved yet and trying again a bounded number of times.
// Only dismissals are saved this way, and only ever as "dismissed"/true. Nothing here writes a false value, and only the
// keys listed in a panel's accountPatch are sent, so the rest of the account's metadata is left alone.

export type DismissalSpec = {
  /** Browser keys for this person. Any one of them holding localValue means dismissed. */
  localKeys: (userId: string) => string[]
  localValue: string
  /** The account metadata keys that record a dismissal, and the value each is set to */
  accountPatch: Record<string, unknown>
  /** Whether a metadata object (from the login session or a fresh read) records a dismissal */
  isDismissedInMetadata: (metadata: Record<string, unknown> | null | undefined) => boolean
}

export type LocalState = "dismissed" | "none" | "unreadable"

/** The browser copy. "unreadable" (blocked storage) is not "none": it says nothing about whether they dismissed. */
export function readLocalDismissal(spec: DismissalSpec, userId: string): LocalState {
  if (typeof window === "undefined") return "unreadable"
  let unreadable = false
  for (const key of spec.localKeys(userId)) {
    try {
      if (window.localStorage.getItem(key) === spec.localValue) return "dismissed"
    } catch {
      unreadable = true
    }
  }
  return unreadable ? "unreadable" : "none"
}

export function writeLocalDismissal(spec: DismissalSpec, userId: string) {
  if (typeof window === "undefined") return
  for (const key of spec.localKeys(userId)) {
    try {
      window.localStorage.setItem(key, spec.localValue)
    } catch {
      // storage can be blocked; the account copy and this page's own state still apply
    }
  }
}

// ---------------------------------------------------------------- reading the account's current setting

export type AccountRead = { ok: true; metadata: Record<string, unknown> } | { ok: false }

const READ_TTL_MS = 60_000
const reads = new Map<string, { at: number; result: AccountRead }>()
const readsInFlight = new Map<string, Promise<AccountRead>>()

/**
 * The account's current metadata, read from the server. Asked by several panels at once, it is one request. A good answer
 * is reused for a minute; a failure is never reused. The answer counts only if it is for the person asked about.
 */
export function fetchAccountMetadata(userId: string, opts: { force?: boolean } = {}): Promise<AccountRead> {
  if (!opts.force) {
    const hit = reads.get(userId)
    if (hit && Date.now() - hit.at < READ_TTL_MS) return Promise.resolve(hit.result)
    const running = readsInFlight.get(userId)
    if (running) return running
  }
  const request = (async (): Promise<AccountRead> => {
    try {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data?.user || data.user.id !== userId) return { ok: false }
      const result: AccountRead = { ok: true, metadata: (data.user.user_metadata ?? {}) as Record<string, unknown> }
      reads.set(userId, { at: Date.now(), result })
      return result
    } catch {
      return { ok: false }
    } finally {
      readsInFlight.delete(userId)
    }
  })()
  readsInFlight.set(userId, request)
  return request
}

// ---------------------------------------------------------------- saving to the account

/**
 * "ok": saved (or already saved). "error": worth trying again (offline, a server error, too many requests).
 * "rejected": the server refused it, for example because the browser is now signed in as someone else, so it is not
 * retried on this page and stays queued for the person it belongs to.
 */
export type SaveResult = "ok" | "error" | "rejected"

/**
 * Saves dismissal keys for userId. The server decides whose account changes from the request's own login, and refuses the
 * save, before changing anything, if that login is not userId. So even if the browser signs in as someone else between
 * queueing a save and sending it, the save cannot land on the new account. Only keys the server allows are sent (see
 * lib/dismissal-keys.ts); the values are fixed on the server.
 */
export async function saveDismissalToAccount(userId: string, patch: Record<string, unknown>): Promise<SaveResult> {
  const result = await postToRoute({ userId, keys: Object.keys(patch) })
  if (result === "ok") {
    const hit = reads.get(userId)
    if (hit && hit.result.ok) reads.set(userId, { at: hit.at, result: { ok: true, metadata: { ...hit.result.metadata, ...patch } } })
  }
  return result
}

/**
 * Saves a checklist Minimize or Expand for userId through the same server route, so it is bound to the verified login in
 * the same way: a save meant for one person is refused, before anything is written, if the browser is signed in as
 * someone else by the time it is sent. It is best effort and is not queued or retried, as before.
 */
export async function saveChecklistState(userId: string, mode: "free" | "paid", state: "minimized" | ""): Promise<SaveResult> {
  const result = await postToRoute({ userId, checklist: { mode, state } })
  if (result === "ok") {
    const hit = reads.get(userId)
    if (hit && hit.result.ok) reads.delete(userId) // the cached copy no longer matches the account; the next read asks again
  }
  return result
}

async function postToRoute(body: Record<string, unknown>): Promise<SaveResult> {
  try {
    const res = await authFetch("/api/onboarding-dismissal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) return "ok"
    if (res.status === 429 || res.status >= 500) return "error"
    return "rejected"
  } catch {
    return "error"
  }
}

// ---------------------------------------------------------------- dismissals that have not reached the account yet

const MARKER = (userId: string) => `ss-onboarding-unsynced:${userId}`
const pendingInMemory = new Map<string, Record<string, unknown>>()

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function readPending(userId: string): Record<string, unknown> | null {
  let stored: Record<string, unknown> = {}
  try {
    const raw = window.localStorage.getItem(MARKER(userId))
    const parsed = raw ? JSON.parse(raw) : null
    if (isPlainObject(parsed)) stored = parsed
  } catch {
    // unreadable or damaged: only what this page remembers applies
  }
  const merged = { ...stored, ...(pendingInMemory.get(userId) ?? {}) }
  return Object.keys(merged).length > 0 ? merged : null
}

function writePending(userId: string, pending: Record<string, unknown> | null) {
  if (pending) pendingInMemory.set(userId, pending)
  else pendingInMemory.delete(userId)
  try {
    if (pending) window.localStorage.setItem(MARKER(userId), JSON.stringify(pending))
    else window.localStorage.removeItem(MARKER(userId))
  } catch {
    // blocked storage: it is kept for this page only
  }
}

/** Remember that these account settings still have to be saved. Only dismissals are ever queued. */
export function queueUnsynced(userId: string, patch: Record<string, unknown>) {
  writePending(userId, { ...(readPending(userId) ?? {}), ...patch })
}

export function hasUnsynced(userId: string): boolean {
  return readPending(userId) !== null
}

/** In-page attempts per person: the first immediately, then after 5 s and after 30 s. A later page load tries again. */
const RETRY_DELAYS_MS = [5_000, 30_000]
const attempts = new Map<string, number>()
const flushing = new Map<string, Promise<void>>()
const timers = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Saves whatever dismissal is waiting for this person. Never loops: at most three attempts per page load, and none while
 * one is running. A save the server refused (for example another account is signed in now) is not retried on this page.
 */
export function flushUnsynced(userId: string): Promise<void> {
  const running = flushing.get(userId)
  if (running) return running
  const pending = readPending(userId)
  const used = attempts.get(userId) ?? 0
  if (!pending || used >= RETRY_DELAYS_MS.length + 1) return Promise.resolve()
  attempts.set(userId, used + 1)

  const attempt = (async () => {
    const result = await saveDismissalToAccount(userId, pending)
    if (result === "ok") {
      // drop only what was just saved; anything queued meanwhile stays
      const now = readPending(userId) ?? {}
      const rest = Object.fromEntries(Object.entries(now).filter(([k, v]) => !(k in pending) || pending[k] !== v))
      writePending(userId, Object.keys(rest).length > 0 ? rest : null)
      return
    }
    if (result === "error" && used < RETRY_DELAYS_MS.length && !timers.has(userId)) {
      timers.set(userId, setTimeout(() => {
        timers.delete(userId)
        void flushUnsynced(userId)
      }, RETRY_DELAYS_MS[used]))
    }
  })().finally(() => flushing.delete(userId))
  flushing.set(userId, attempt)
  return attempt
}

/** For tests: forget this page's in-memory state, as a fresh page load would (browser storage is left alone). */
export function resetDismissalSyncForTests() {
  reads.clear()
  readsInFlight.clear()
  pendingInMemory.clear()
  attempts.clear()
  flushing.clear()
  for (const t of timers.values()) clearTimeout(t)
  timers.clear()
}
