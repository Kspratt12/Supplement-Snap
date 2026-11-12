import { authFetch } from "./auth-fetch"
import { storagePathFromUrl } from "./storage-paths"

/**
 * Turns a stored photo/diagram/logo address into one that can be opened right now.
 *
 * The address saved on a finding stays exactly as it is (it identifies the file and is what deletion reads). Only
 * what is shown or fetched is swapped for a short-lived link from /api/photo-urls.
 *
 * It never throws and it never quietly falls back to the plain public address. For one of our stored files it returns
 * the link, or null when no link could be had (offline, signed out, not allowed, server error). Callers must treat null as
 * "unavailable" and tell the person, so a missing photo is never mistaken for a photo that is not there.
 * Anything that is not one of our stored files (a chosen file's preview, a data address) is returned unchanged.
 */

const REFRESH_MARGIN_MS = 5 * 60 * 1000
const FALLBACK_TTL_MS = 3600 * 1000

type Entry = { link: string; expiresAt: number }
type Waiter = { url: string; resolve: (link: string | null) => void }

const cache = new Map<string, Entry>()
const inFlight = new Map<string, Promise<string | null>>()
const queues = new Map<string, { waiters: Waiter[]; timer: ReturnType<typeof setTimeout> | null }>()

const key = (projectId: string | undefined, url: string) => `${projectId || ""}|${url}`

/** Only addresses that point at our storage bucket are ever sent for signing. */
export function isStoredFileUrl(url: string | null | undefined): url is string {
  return !!url && storagePathFromUrl(url) !== null && /^https?:\/\//i.test(url)
}

export function resetPhotoLinkCache() {
  cache.clear()
  inFlight.clear()
  for (const q of queues.values()) if (q.timer) clearTimeout(q.timer)
  queues.clear()
}

async function flush(projectId: string | undefined) {
  const k = projectId || ""
  const q = queues.get(k)
  if (!q) return
  queues.delete(k)
  const urls = [...new Set(q.waiters.map((w) => w.url))]
  let signed: Record<string, string> = {}
  let expiresInMs = FALLBACK_TTL_MS
  try {
    const res = await authFetch("/api/photo-urls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls, ...(projectId ? { projectId } : {}) }),
    })
    if (res.ok) {
      const json = (await res.json()) as { signed?: Record<string, string>; expiresIn?: number }
      signed = json.signed || {}
      if (typeof json.expiresIn === "number" && json.expiresIn > 0) expiresInMs = json.expiresIn * 1000
    }
  } catch {
    // every waiter below gets null: unavailable
  }
  for (const w of q.waiters) {
    const link = signed[w.url]
    // Only a granted link is remembered; a refusal or failure is asked again next time
    if (link) cache.set(key(projectId, w.url), { link, expiresAt: Date.now() + expiresInMs })
    w.resolve(link || null)
  }
}

export function signedPhotoUrl(url: string, projectId?: string, opts: { force?: boolean } = {}): Promise<string | null> {
  if (!isStoredFileUrl(url)) return Promise.resolve(url)
  const k = key(projectId, url)
  if (opts.force) cache.delete(k)
  const hit = cache.get(k)
  if (hit && hit.expiresAt - Date.now() > REFRESH_MARGIN_MS) return Promise.resolve(hit.link)
  const pending = inFlight.get(k)
  if (pending) return pending

  const p = new Promise<string | null>((resolve) => {
    const qk = projectId || ""
    let q = queues.get(qk)
    if (!q) {
      q = { waiters: [], timer: null }
      queues.set(qk, q)
      q.timer = setTimeout(() => { void flush(projectId) }, 10)
    }
    q.waiters.push({ url, resolve })
  }).finally(() => { inFlight.delete(k) })
  inFlight.set(k, p)
  return p
}

/**
 * Open a stored file (for example a roof diagram) in a new tab. The tab is opened straight away, from the click, so
 * a popup blocker allows it; its address is set once the link is ready. Returns false (and closes the empty tab) when
 * no link could be had, so the caller can say so.
 */
export async function openStoredFile(url: string, projectId?: string): Promise<boolean> {
  const w = window.open("", "_blank")
  const link = await signedPhotoUrl(url, projectId)
  if (!link) {
    w?.close()
    return false
  }
  if (w) {
    w.opener = null
    w.location.href = link
  } else {
    window.location.href = link
  }
  return true
}
