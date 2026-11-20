import { openDB, type DBSchema } from "idb"

export interface PendingCapture {
  id: string
  projectId: string
  /** The account that saved it. Only that account's session lists, counts or uploads it. Missing on entries saved before this field existed. */
  userId?: string
  damageType: string
  roofArea: string
  fieldNote: string
  quantity: number
  unit: string
  photos: ArrayBuffer[]
  photoNames: string[]
  photoMetadata: (object | null)[]
  /** refused: the account is no longer allowed to add to this project; never retried, kept until the person discards it */
  status: "pending" | "uploading" | "failed" | "refused"
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

/** Automatic syncs stop retrying a capture after this many failed attempts. Only a manual sync tries it again. */
export const RETRY_CAP = 5

/**
 * Get all pending + failed (retryable) captures.
 * Pass includeStuck from the sync routine to also pick up captures left in "uploading" when the page was
 * closed or the phone lost power mid-upload; without that they would sit in the queue forever.
 * Pass includeCapped only for a sync the person asked for: it also returns failed captures that have used up their
 * automatic retries. Nothing else ever returns those, so they cannot be retried in a loop on their own.
 */
export async function getPendingCaptures(includeStuck = false, includeCapped = false, userId?: string): Promise<PendingCapture[]> {
  const db = await getDB()
  const pending = await db.getAllFromIndex("pending-captures", "by-status", "pending")
  const failed = await db.getAllFromIndex("pending-captures", "by-status", "failed")
  const stuck = includeStuck ? await db.getAllFromIndex("pending-captures", "by-status", "uploading") : []
  return [...pending, ...stuck, ...failed.filter((c) => includeCapped || c.retryCount < RETRY_CAP)].filter(belongsTo(userId))
}

/**
 * Whether a queued capture belongs to the signed-in account. With no account given, every entry counts (the old
 * behaviour). Entries saved before userId was recorded have none and are treated as belonging to whoever is signed in.
 */
export function belongsTo(userId?: string) {
  return (c: PendingCapture) => !userId || !c.userId || c.userId === userId
}

/** How many queued captures have used up their automatic retries and are waiting for a manual sync */
export async function getCappedCount(userId?: string): Promise<number> {
  const db = await getDB()
  const failed = await db.getAllFromIndex("pending-captures", "by-status", "failed")
  return failed.filter(belongsTo(userId)).filter((c) => c.retryCount >= RETRY_CAP).length
}

/**
 * Every capture still held on this device for one project, whatever its state, oldest first. The capture screen shows
 * these as "on this device" cards so a refresh or a reopened page does not hide findings that have not reached the server.
 */
export async function getQueuedForProject(projectId: string, userId?: string): Promise<PendingCapture[]> {
  const db = await getDB()
  const all = await db.getAll("pending-captures")
  return all.filter((c) => c.projectId === projectId).filter(belongsTo(userId)).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/** Get count of queued captures (for one account when userId is given) */
export async function getPendingCount(userId?: string): Promise<number> {
  const db = await getDB()
  const all = await db.getAll("pending-captures")
  return all.filter(belongsTo(userId)).filter((c) => c.status !== "refused").length
}

/** The account's queued captures that the database refused (access removed). They are never retried automatically. */
export async function getRefused(userId?: string): Promise<PendingCapture[]> {
  const db = await getDB()
  return (await db.getAllFromIndex("pending-captures", "by-status", "refused")).filter(belongsTo(userId))
}

export async function markRefused(id: string) {
  const db = await getDB()
  const item = await db.get("pending-captures", id)
  if (item) {
    item.status = "refused"
    await db.put("pending-captures", item)
  }
}

/** Removes one of the signed-in account's queued captures from this device, at the person's request. */
export async function discardQueued(id: string, userId?: string): Promise<boolean> {
  const db = await getDB()
  const item = await db.get("pending-captures", id)
  if (!item || !belongsTo(userId)(item)) return false
  await db.delete("pending-captures", id)
  return true
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
let syncing = false

export async function syncPendingCaptures(
  uploadFn: (capture: PendingCapture) => Promise<boolean | "refused">,
  options: { includeCapped?: boolean; userId?: string } = {}
): Promise<number> {
  // Two syncs at once (for example two "back online" events) would upload the same capture twice.
  if (syncing) return 0
  syncing = true
  try {
    return await runSync(uploadFn, !!options.includeCapped, options.userId)
  } finally {
    syncing = false
  }
}

async function runSync(uploadFn: (capture: PendingCapture) => Promise<boolean | "refused">, includeCapped: boolean, userId?: string): Promise<number> {
  // Only the signed-in account's captures: another account on the same browser never uploads them
  const captures = await getPendingCaptures(true, includeCapped, userId)
  let synced = 0

  for (const capture of captures) {
    await markUploading(capture.id)
    try {
      const success = await uploadFn(capture)
      if (success === "refused") {
        await markRefused(capture.id)
      } else if (success) {
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
