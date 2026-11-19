import "fake-indexeddb/auto"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { openDB } from "idb"
import {
  alignMetadata,
  appendPhotos,
  metadataForUploaded,
  removePhotoAt,
  withShot,
  shotCoverage,
  photoLabel,
  photoFileDetails,
  deviceRecordedAt,
  isLocalOnlyId,
  isNetworkFailure,
  PROVENANCE_NOTE,
} from "../lib/photo-evidence"
import { canvasPoint } from "../app/dashboard/photo-annotator"
import { queueCapture, getQueuedForProject, markFailed } from "../lib/offline-queue"

// All values are synthetic
const gps = (n: number) => ({ latitude: 35 + n, longitude: -78 - n, timestamp: "2026-11-03T14:00:00Z", make: "Cam", model: `M${n}`, orientation: 1 })

describe("photo details stay with the right photo", () => {
  it("drops the details of photos that failed to upload, in the same positions", () => {
    const meta = [gps(0), gps(1), gps(2)]
    // photo 1 failed: the upload returns links for photos 0 and 2 only
    expect(metadataForUploaded(meta, [1])).toEqual([gps(0), gps(2)])
    expect(metadataForUploaded(meta, [])).toEqual(meta)
    expect(metadataForUploaded(meta, [0, 1, 2])).toEqual([])
  })

  it("aligns a short, long, missing or broken list to the photo count", () => {
    expect(alignMetadata(undefined, 2)).toEqual([null, null])
    expect(alignMetadata([gps(0)], 3)).toEqual([gps(0), null, null])
    expect(alignMetadata([gps(0), gps(1), gps(2)], 1)).toEqual([gps(0)])
    expect(alignMetadata(["x", 5, null, gps(3)], 4)).toEqual([null, null, null, gps(3)])
    expect(alignMetadata("not a list", 1)).toEqual([null])
  })

  it("appending to an older finding with fewer details puts the new details under the new photos", () => {
    // Older finding: 2 photos but only 1 details entry (saved before details existed for every photo)
    const { urls, meta } = appendPhotos(["a", "b"], [gps(0)], ["c"], [gps(9)])
    expect(urls).toEqual(["a", "b", "c"])
    expect(meta).toEqual([gps(0), null, gps(9)])
  })

  it("removing a photo removes its details and renumbers marked-up copies", () => {
    const urls = ["a", "b", "c", "d"]
    const meta = [gps(0), gps(1), { markupOf: 1 }, { markupOf: 2 }]
    const out = removePhotoAt(urls, meta, 0)
    expect(out.urls).toEqual(["b", "c", "d"])
    expect(out.meta).toEqual([gps(1), { markupOf: 0 }, { markupOf: 1 }])
    const gone = removePhotoAt(urls, meta, 1)
    expect(gone.meta[1]).toEqual({ markupOf: null }) // its original was removed
    expect(photoLabel(gone.meta[1])).toBe("Marked-up copy")
  })

  it("shot tags and labels", () => {
    const tagged = withShot([null, gps(1)], 0, "wide")
    expect(tagged[0]).toEqual({ shot: "wide" })
    expect(shotCoverage(tagged)).toEqual({ wide: true, closeup: false })
    expect(photoLabel({ shot: "closeup" })).toBe("Close-up")
    expect(photoLabel({ markupOf: 0 })).toBe("Marked-up copy of photo 1")
    expect(photoLabel(null)).toBe("")
  })
})

describe("where each detail came from", () => {
  it("labels camera data as coming from the photo file and leaves out what is missing or meaningless", () => {
    const line = photoFileDetails(gps(0))
    expect(line.startsWith("From the photo file: taken ")).toBe(true)
    expect(line).toContain("GPS 35.000000, -78.000000")
    expect(line).toContain("camera Cam M0")
    expect(photoFileDetails({ latitude: 0, longitude: 0 })).toBe("") // 0,0 is a missing fix, not a location
    expect(photoFileDetails({ timestamp: "not a date" })).toBe("")
    expect(photoFileDetails({ markupOf: 0 })).toBe("")
    expect(PROVENANCE_NOTE).toMatch(/does not verify them/)
  })

  it("keeps a queued finding's device time only when it is a believable time", () => {
    const now = Date.parse("2026-11-19T12:00:00Z")
    expect(deviceRecordedAt("2026-11-17T09:30:00Z", now)).toBe("2026-11-17T09:30:00.000Z")
    expect(deviceRecordedAt("2027-01-01T00:00:00Z", now)).toBeUndefined() // device clock in the future
    expect(deviceRecordedAt("1999-01-01T00:00:00Z", now)).toBeUndefined()
    expect(deviceRecordedAt("garbage", now)).toBeUndefined()
    expect(deviceRecordedAt(0, now)).toBeUndefined()
  })

  it("tells a dropped connection from a refusal", () => {
    expect(isNetworkFailure("TypeError: Failed to fetch")).toBe(true)
    expect(isNetworkFailure("Load failed")).toBe(true)
    expect(isNetworkFailure('new row violates row-level security policy for table "captures"')).toBe(false)
    expect(isNetworkFailure(undefined)).toBe(false)
    expect(isLocalOnlyId("local-offline-1")).toBe(true)
    expect(isLocalOnlyId("6f1c0c1e-0000-4000-8000-000000000000")).toBe(false)
  })
})

describe("queued findings can be listed per project after a reload", () => {
  beforeEach(async () => {
    const db = await openDB("supplement-snap-offline", 1, { upgrade(d) { d.createObjectStore("pending-captures", { keyPath: "id" }).createIndex("by-status", "status") } })
    await db.clear("pending-captures")
    db.close()
  })

  it("returns every state for that project only, oldest first", async () => {
    const base = { damageType: "Decking", roofArea: "Front", fieldNote: "n", quantity: 1, unit: "", photos: [], photoNames: [], photoMetadata: [] }
    await queueCapture({ ...base, id: "b", projectId: "p1", createdAt: "2026-11-02T00:00:00Z" })
    await queueCapture({ ...base, id: "a", projectId: "p1", createdAt: "2026-11-01T00:00:00Z" })
    await queueCapture({ ...base, id: "x", projectId: "p2", createdAt: "2026-11-01T00:00:00Z" })
    await markFailed("b")
    const list = await getQueuedForProject("p1")
    expect(list.map((c) => c.id)).toEqual(["a", "b"])
    expect(list[1].status).toBe("failed")
    expect(list[1].retryCount).toBe(1)
  })
})

describe("mark-up touch handling", () => {
  const rect = { left: 10, top: 20, width: 300, height: 200 }
  const canvas = { width: 1500, height: 1000 }

  it("reads the finger position when the touch ends (touches is empty then)", () => {
    const end = { touches: [], changedTouches: [{ clientX: 160, clientY: 120 }] }
    expect(canvasPoint(end, rect, canvas)).toEqual({ x: 750, y: 500 })
  })

  it("scales screen positions to the canvas's full-resolution pixels", () => {
    expect(canvasPoint({ touches: [{ clientX: 10, clientY: 20 }] }, rect, canvas)).toEqual({ x: 0, y: 0 })
    expect(canvasPoint({ clientX: 310, clientY: 220 }, rect, canvas)).toEqual({ x: 1500, y: 1000 })
  })

  it("never throws on an event with no position", () => {
    const fn = vi.fn(() => canvasPoint({ touches: [], changedTouches: [] }, rect, canvas))
    expect(fn()).toEqual({ x: 0, y: 0 })
  })
})
