import { supabase } from "./supabase"
import { arrayBufferToFile, type PendingCapture } from "./offline-queue"
import { cleanupOrphanedUploads, uploadPhotosWithRetry } from "./upload-utils"

/**
 * Saves one capture that was queued while the phone had no signal.
 *
 * The photos are uploaded first and the record second, so if the record cannot be saved (for example the project was
 * deleted in the meantime) the photos that were just uploaded are removed again. Otherwise they would stay in the public
 * photo bucket with no record pointing to them, and every retry would upload them again.
 */
export async function uploadQueuedCapture(capture: PendingCapture, compress: (file: File) => Promise<Blob>): Promise<boolean> {
  try {
    const files = capture.photos.map((buf, i) => arrayBufferToFile(buf, capture.photoNames[i] || `photo-${i}.jpg`))
    const compressed = await Promise.all(files.map((f) => compress(f)))
    const { urls } = await uploadPhotosWithRetry(compressed)
    if (urls.length === 0) return false

    const { error } = await supabase.from("captures").insert({
      project_id: capture.projectId,
      image_url: urls[0],
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
      await cleanupOrphanedUploads(urls)
      return false
    }
    return true
  } catch {
    return false
  }
}
