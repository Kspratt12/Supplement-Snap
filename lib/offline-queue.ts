import { openDB, type DBSchema } from "idb"

export interface PendingCapture {
  id: string
  projectId: string
  damageType: string
  roofArea: string
  fieldNote: string
  quantity: number
  unit: string
  photos: ArrayBuffer[]
  photoNames: string[]
  photoMetadata: object[]
  status: "pending" | "uploading" | "failed"
  retryCount: number
  createdAt: string
}

interface SupplementSnapDB extends DBSchema {
  "pending-captures": {
    key: string
    value: PendingCapture
    indexes: { "by-status": string }
  }
}

const DB_NAME = "supplement-snap-offline"
const DB_VERSION = 1

async function getDB() {
  return openDB<SupplementSnapDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore("pending-captures", { keyPath: "id" })
      store.createIndex("by-status", "status")
    },
  })
}

/** Queue a capture for later upload when offline */
export async function queueCapture(capture: Omit<PendingCapture, "status" | "retryCount">) {
  const db = await getDB()
  await db.put("pending-captures", { ...capture, status: "pending", retryCount: 0 })
}

/** Get all pending + failed (retryable) captures */
export async function getPendingCaptures(): Promise<PendingCapture[]> {
  const db = await getDB()
  const pending = await db.getAllFromIndex("pending-captures", "by-status", "pending")
  const failed = await db.getAllFromIndex("pending-captures", "by-status", "failed")
  return [...pending, ...failed.filter((c) => c.retryCount < 5)]
}

/** Get count of queued captures */
export async function getPendingCount(): Promise<number> {
  const db = await getDB()
  const pending = await db.countFromIndex("pending-captures", "by-status", "pending")
  const failed = await db.countFromIndex("pending-captures", "by-status", "failed")
  return pending + failed
}

/** Remove a capture after successful upload */
export async function markUploaded(id: string) {
  const db = await getDB()
  await db.delete("pending-captures", id)
}

/** Mark a capture as failed and increment retry count */
export async function markFailed(id: string) {
  const db = await getDB()
  const item = await db.get("pending-captures", id)
  if (item) {
    item.status = "failed"
    item.retryCount += 1
    await db.put("pending-captures", item)
  }
}

/** Mark a capture as currently uploading */
export async function markUploading(id: string) {
  const db = await getDB()
  const item = await db.get("pending-captures", id)
  if (item) {
    item.status = "uploading"
    await db.put("pending-captures", item)
  }
}

/**
 * Process the offline queue: upload each pending capture using the provided function.
 * Returns the number of successfully synced captures.
 */
export async function syncPendingCaptures(
  uploadFn: (capture: PendingCapture) => Promise<boolean>
): Promise<number> {
  const captures = await getPendingCaptures()
  let synced = 0

  for (const capture of captures) {
    await markUploading(capture.id)
    try {
      const success = await uploadFn(capture)
      if (success) {
        await markUploaded(capture.id)
        synced++
      } else {
        await markFailed(capture.id)
      }
    } catch {
      await markFailed(capture.id)
    }
  }

  return synced
}

/** Convert a File to ArrayBuffer for IndexedDB storage */
export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer()
}

/** Convert an ArrayBuffer back to a File for upload */
export function arrayBufferToFile(buffer: ArrayBuffer, name: string): File {
  return new File([buffer], name, { type: "image/jpeg" })
}
