import { supabase } from "./supabase"

const STORAGE_BUCKET = "test-uploads"

export interface UploadResult {
  urls: string[]
  failedIndexes: number[]
}

/**
 * Upload photos to Supabase Storage with retry logic and exponential backoff.
 * Handles partial failures gracefully — successfully uploaded photos are preserved
 * even if later uploads fail.
 *
 * @param blobs - Compressed image blobs to upload
 * @param maxRetries - Number of retry attempts per photo (default: 3)
 * @param onProgress - Optional callback for progress updates
 * @returns Object containing successful URLs and indexes of failed uploads
 */
export async function uploadPhotosWithRetry(
  blobs: Blob[],
  maxRetries = 3,
  onProgress?: (uploaded: number, total: number) => void
): Promise<UploadResult> {
  const urls: string[] = []
  const failedIndexes: number[] = []

  for (let i = 0; i < blobs.length; i++) {
    const blob = blobs[i]
    let uploaded = false

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-photo-${i}.jpg`

      try {
        const { error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, blob, { contentType: "image/jpeg" })

        if (!error) {
          const { data } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(fileName)
          urls.push(data.publicUrl)
          uploaded = true
          break
        }

        // If this isn't the last attempt, wait with exponential backoff
        if (attempt < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)))
        }
      } catch {
        // Network error — retry with backoff
        if (attempt < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)))
        }
      }
    }

    if (!uploaded) {
      failedIndexes.push(i)
    }

    onProgress?.(urls.length, blobs.length)
  }

  return { urls, failedIndexes }
}

/**
 * Clean up orphaned files from Supabase Storage when a capture save fails.
 */
export async function cleanupOrphanedUploads(urls: string[]) {
  const filePaths = urls
    .map((url) => url.match(/test-uploads\/(.+)$/)?.[1])
    .filter((p): p is string => !!p)

  if (filePaths.length > 0) {
    await supabase.storage.from(STORAGE_BUCKET).remove(filePaths)
  }
}
