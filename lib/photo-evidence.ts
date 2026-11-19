/**
 * Keeps each finding's photo list and its per-photo details (camera data, shot type, mark-up origin) in step, and words
 * where each detail came from. Pure functions so the capture screen, the offline sync and the PDF all use the same rules.
 *
 * photo_metadata[i] always describes image_urls[i]. A slot with nothing known is null. Older findings may hold a shorter,
 * longer or missing list; alignMetadata brings it to the photo count so a detail is never printed under the wrong photo.
 */

export type ShotType = "wide" | "closeup"

export interface PhotoDetails {
  latitude?: number | null
  longitude?: number | null
  timestamp?: string | null
  make?: string | null
  model?: string | null
  orientation?: number | null
  /** Chosen by the person: an overview of the area, or a close-up of the condition */
  shot?: ShotType | null
  /** Set on a marked-up copy: the 0-based position of the photo it was drawn on, at the time it was made */
  markupOf?: number | null
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v)

/** The details list resized to `count` photos: extra entries dropped, missing ones filled with null, non-objects nulled. */
export function alignMetadata(meta: unknown, count: number): (PhotoDetails | null)[] {
  const list = Array.isArray(meta) ? meta : []
  return Array.from({ length: Math.max(0, count) }, (_, i) => (isObject(list[i]) ? (list[i] as PhotoDetails) : null))
}

/**
 * The details for the photos that actually uploaded, in upload order. uploadPhotosWithRetry returns only the successful
 * links (in order) plus the positions that failed, so the details of failed photos must be dropped the same way.
 */
export function metadataForUploaded(meta: (PhotoDetails | null)[], failedIndexes: number[]): (PhotoDetails | null)[] {
  const failed = new Set(failedIndexes)
  return meta.map((m) => m ?? null).filter((_, i) => !failed.has(i))
}

/** Adds photos to a finding, keeping the existing details aligned with the existing photos first. */
export function appendPhotos(
  existingUrls: string[],
  existingMeta: unknown,
  newUrls: string[],
  newMeta: (PhotoDetails | null)[],
): { urls: string[]; meta: (PhotoDetails | null)[] } {
  return {
    urls: [...existingUrls, ...newUrls],
    meta: [...alignMetadata(existingMeta, existingUrls.length), ...alignMetadata(newMeta, newUrls.length)],
  }
}

/** Removes one photo and its details. A marked-up copy that pointed at a later photo is renumbered; one that pointed at the removed photo loses the link. */
export function removePhotoAt(urls: string[], meta: unknown, index: number): { urls: string[]; meta: (PhotoDetails | null)[] } {
  const aligned = alignMetadata(meta, urls.length)
  const keptUrls = urls.filter((_, i) => i !== index)
  const keptMeta = aligned
    .filter((_, i) => i !== index)
    .map((m) => {
      if (!m || typeof m.markupOf !== "number") return m
      if (m.markupOf === index) return { ...m, markupOf: null }
      return m.markupOf > index ? { ...m, markupOf: m.markupOf - 1 } : m
    })
  return { urls: keptUrls, meta: keptMeta }
}

/** Sets or clears the shot type of one photo before it is saved. */
export function withShot(meta: (PhotoDetails | null)[], index: number, shot: ShotType | null): (PhotoDetails | null)[] {
  return meta.map((m, i) => (i === index ? { ...(m || {}), shot } : m))
}

/** Which kinds of shot a finding has. Used only for an optional hint; nothing is ever blocked on it. */
export function shotCoverage(meta: (PhotoDetails | null)[]): { wide: boolean; closeup: boolean } {
  return { wide: meta.some((m) => m?.shot === "wide"), closeup: meta.some((m) => m?.shot === "closeup") }
}

/** Short label shown with a photo in the app and the PDF, or "" when nothing was chosen. */
export function photoLabel(meta: PhotoDetails | null | undefined): string {
  if (!meta) return ""
  if (typeof meta.markupOf === "number") return `Marked-up copy of photo ${meta.markupOf + 1}`
  if (meta.markupOf === null && "markupOf" in meta) return "Marked-up copy"
  if (meta.shot === "wide") return "Wide shot"
  if (meta.shot === "closeup") return "Close-up"
  return ""
}

const validNumber = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n)

/**
 * The camera data line for one photo, labeled as coming from the photo file. "" when the file carried none.
 * A marked-up copy is a new image drawn in the app, so it carries no camera data of its own.
 */
export function photoFileDetails(meta: PhotoDetails | null | undefined, locale = "en-US"): string {
  if (!meta) return ""
  const parts: string[] = []
  if (meta.timestamp) {
    const d = new Date(meta.timestamp)
    if (!Number.isNaN(d.getTime())) parts.push(`taken ${d.toLocaleString(locale)}`)
  }
  if (validNumber(meta.latitude) && validNumber(meta.longitude) && !(meta.latitude === 0 && meta.longitude === 0)) {
    parts.push(`GPS ${meta.latitude.toFixed(6)}, ${meta.longitude.toFixed(6)}`)
  }
  const camera = [meta.make, meta.model].filter((s) => typeof s === "string" && s.trim()).join(" ")
  if (camera) parts.push(`camera ${camera}`)
  return parts.length > 0 ? `From the photo file: ${parts.join("  |  ")}` : ""
}

/** Printed once in every report that shows photo details, so the source of each date and location is clear. */
export const PROVENANCE_NOTE =
  "Photo dates, locations and camera details are read from the data the camera stored in each photo file (EXIF). Supplement Snap shows them as stored and does not verify them; photos without that data show none. A finding's recorded date is when it was saved in the app on the device."

/**
 * The time a finding queued on the device was saved there, to keep as its recorded date when it reaches the server.
 * Anything that is not a real time, or is in the future (a wrong device clock), is not used, and the server's own time applies.
 */
export function deviceRecordedAt(createdAt: unknown, now = Date.now()): string | undefined {
  if (typeof createdAt !== "string" || !createdAt) return undefined
  const t = new Date(createdAt).getTime()
  if (!Number.isFinite(t) || t > now + 5 * 60_000 || t < Date.UTC(2020, 0, 1)) return undefined
  return new Date(t).toISOString()
}

/** Id prefix for a finding that exists only in this device's queue and not yet on the server. */
export const LOCAL_ID_PREFIX = "local-"

export function isLocalOnlyId(id: string): boolean {
  return id.startsWith(LOCAL_ID_PREFIX)
}

/** Whether a save error looks like the connection rather than the database refusing the row. */
export function isNetworkFailure(message: string | undefined | null): boolean {
  if (!message) return false
  return /failed to fetch|fetch failed|networkerror|network request failed|load failed|timed? ?out|ECONNRESET|ENOTFOUND|EAI_AGAIN|offline/i.test(message)
}
