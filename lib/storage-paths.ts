/**
 * Turns the photo web addresses saved on findings into the file paths used to delete them from storage.
 * A finding can hold several photos in image_urls, and older findings may only have image_url, so both are read.
 */

const BUCKET = "test-uploads"

type PhotoRow = { image_url?: string | null; image_urls?: string[] | null }

/** The storage path inside the bucket for one photo address, or null when the address is not one of ours. */
export function storagePathFromUrl(url: string | null | undefined): string | null {
  const match = (url || "").match(new RegExp(`${BUCKET}/([^?]+)`))
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

/** Every distinct storage path for every photo on every finding passed in. */
export function photoPathsForCaptures(rows: PhotoRow[]): string[] {
  const paths = new Set<string>()
  for (const row of rows) {
    const urls = [row.image_url, ...(Array.isArray(row.image_urls) ? row.image_urls : [])]
    for (const url of urls) {
      const path = storagePathFromUrl(url)
      if (path) paths.add(path)
    }
  }
  return [...paths]
}

type RemoveResult = { data: Array<{ name?: string }> | null; error: { message?: string } | null }
type StorageBucketLike = { remove: (paths: string[]) => Promise<RemoveResult> }

/**
 * Removes photo files and reports which ones the storage service did not confirm removing.
 * A call that returns without an error is not proof: the service lists the files it actually removed, and a file it
 * was not allowed to remove, or could not find, is simply missing from that list.
 */
export async function removePhotoFiles(bucket: StorageBucketLike, paths: string[]): Promise<{ notConfirmed: string[] }> {
  const wanted = [...new Set(paths)]
  if (wanted.length === 0) return { notConfirmed: [] }
  try {
    const { data, error } = await bucket.remove(wanted)
    if (error || !Array.isArray(data)) return { notConfirmed: wanted }
    if (data.length >= wanted.length) return { notConfirmed: [] }
    const removed = new Set(data.map((f) => f?.name))
    return { notConfirmed: wanted.filter((p) => !removed.has(p)) }
  } catch {
    return { notConfirmed: wanted }
  }
}
