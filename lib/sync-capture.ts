import { supabase } from "./supabase"
import { arrayBufferToFile, type PendingCapture } from "./offline-queue"
import { cleanupOrphanedUploads, uploadPhotosWithRetry } from "./upload-utils"

/**
 * The id the saved finding gets on the server. It is worked out from the queue entry's own id, so every retry of the
 * same queued capture uses the same id and the database refuses a second copy.
 */
export async function serverCaptureId(queueId: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`supplement-snap:offline-capture:${queueId}`))
  const bytes = new Uint8Array(digest).slice(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

type SavedState = { state: "yes" | "no" | "unknown"; imageUrls?: unknown }

/**
 * Whether the finding for this queue entry is already on the server, in this capture's own project. "unknown" means the
 * answer could not be read or the finding is not one this capture may treat as its own. For "yes" it also returns the photo
 * list the saved finding holds, uninterpreted.
 */
async function savedState(serverId: string, projectId: string): Promise<SavedState> {
  try {
    const { data, error } = await supabase.from("captures").select("id, project_id, image_urls").eq("id", serverId).maybeSingle()
    if (error) return { state: "unknown" }
    if (!data) return { state: "no" }
    return data.project_id === projectId ? { state: "yes", imageUrls: data.image_urls } : { state: "unknown" }
  } catch {
    return { state: "unknown" }
  }
}

/**
 * Saves one capture that was queued while the phone had no signal. Returns true only when the finding is on the server
 * with every photo that was queued for it; anything less leaves the queue entry, with its note and photos, as it was.
 *
 * - A capture with no photos (a note-only finding) is saved without any upload.
 * - If any photo fails to upload, nothing is saved, the photos that did upload are removed again, and the capture stays
 *   queued so a later attempt can send all of them.
 * - The photos are uploaded first and the record second, so if the record cannot be saved (for example the project was
 *   deleted in the meantime) the photos that were just uploaded are removed again. Otherwise they would stay in the public
 *   photo bucket with no record pointing to them, and every retry would upload them again.
 * - The record has a fixed id (see serverCaptureId). If an earlier attempt already saved it, for example because the
 *   answer was lost on a bad connection, this attempt finds it and reports success instead of saving a second copy. When
 *   the record might exist but cannot be checked, the uploaded photos are kept rather than removed. When another attempt
 *   saved it first, only this attempt's own uploads that the saved finding does not use are removed.
 */
export async function uploadQueuedCapture(capture: PendingCapture, compress: (file: File) => Promise<Blob>): Promise<boolean> {
  try {
    if (capture.photos.length === 0 && !capture.fieldNote.trim()) return false // nothing to save

    const serverId = await serverCaptureId(capture.id)
    if ((await savedState(serverId, capture.projectId)).state === "yes") return true

    let urls: string[] = []
    if (capture.photos.length > 0) {
      const files = capture.photos.map((buf, i) => arrayBufferToFile(buf, capture.photoNames[i] || `photo-${i}.jpg`))
      const compressed = await Promise.all(files.map((f) => compress(f)))
      const result = await uploadPhotosWithRetry(compressed)
      urls = result.urls
      if (result.failedIndexes.length > 0 || urls.length !== capture.photos.length) {
        if (urls.length > 0) await cleanupOrphanedUploads(urls)
        return false
      }
    }

    const { error } = await supabase.from("captures").insert({
      id: serverId,
      project_id: capture.projectId,
      image_url: urls[0] || "",
      image_urls: urls,
      damage_type: capture.damageType,
      roof_area: capture.roofArea,
      field_note: capture.fieldNote,
      status: "Captured",
      quantity: capture.quantity,
      unit: capture.unit || null,
      photo_metadata: capture.photoMetadata,
    })
    if (error) {
      const saved = await savedState(serverId, capture.projectId)
      if (saved.state === "yes") {
        // Another attempt saved it first. Whatever this attempt uploaded that the saved finding does not use is removed,
        // using only this attempt's own uploads; if the saved photo list cannot be read as a list of text, nothing is.
        // Removal failing never changes the fact that the finding is saved.
        const kept = saved.imageUrls
        if (urls.length > 0 && Array.isArray(kept) && kept.every((u) => typeof u === "string")) {
          const unused = urls.filter((u) => !(kept as string[]).includes(u))
          if (unused.length > 0) {
            try {
              await cleanupOrphanedUploads(unused)
            } catch {
              // the finding is saved; the leftover files are not worth failing the sync for
            }
          }
        }
        return true
      }
      if (saved.state === "no" && urls.length > 0) await cleanupOrphanedUploads(urls)
      return false
    }
    return true
  } catch {
    return false
  }
}
