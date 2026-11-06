import "fake-indexeddb/auto"
import { describe, it, expect, beforeEach } from "vitest"
import { openDB } from "idb"
import { queueCapture, getPendingCount, getPendingCaptures, getCappedCount, syncPendingCaptures, markUploading, RETRY_CAP, type PendingCapture } from "../lib/offline-queue"

const make = (id: string): Omit<PendingCapture, "status" | "retryCount"> => ({
  id,
  projectId: "p1",
  damageType: "Decking",
  roofArea: "Front",
  fieldNote: "Soft decking",
  quantity: 1,
  unit: "sheet",
  photos: [new TextEncoder().encode("photo").buffer as ArrayBuffer],
  photoNames: ["a.jpg"],
  photoMetadata: [],
  createdAt: "2026-10-25T00:00:00Z",
})

beforeEach(async () => {
  const db = await openDB("supplement-snap-offline", 1, { upgrade(d) { d.createObjectStore("pending-captures", { keyPath: "id" }).createIndex("by-status", "status") } })
  await db.clear("pending-captures")
  db.close()
})

describe("offline capture queue", () => {
  it("keeps captures made without signal and removes each one once it uploads", async () => {
    await queueCapture(make("a"))
    await queueCapture(make("b"))
    expect(await getPendingCount()).toBe(2)
    const sent: string[] = []
    const synced = await syncPendingCaptures(async (c) => {
      sent.push(c.id)
      return true
    })
    expect(synced).toBe(2)
    expect(sent.sort()).toEqual(["a", "b"])
    expect(await getPendingCount()).toBe(0)
  })

  it("keeps a capture whose upload fails and tries it again on the next sync", async () => {
    await queueCapture(make("a"))
    expect(await syncPendingCaptures(async () => false)).toBe(0)
    expect(await getPendingCount()).toBe(1)
    expect(await syncPendingCaptures(async () => true)).toBe(1)
    expect(await getPendingCount()).toBe(0)
  })

  it("treats an upload that throws as a failure and keeps the capture", async () => {
    await queueCapture(make("a"))
    await syncPendingCaptures(async () => {
      throw new Error("network")
    })
    expect(await getPendingCount()).toBe(1)
  })

  it("stops retrying a capture after five failures but does not delete it", async () => {
    await queueCapture(make("a"))
    for (let i = 0; i < 5; i++) await syncPendingCaptures(async () => false)
    expect((await getPendingCaptures()).length).toBe(0)
    expect(await getPendingCount()).toBe(1) // still stored, so the user can be told about it
  })

  it("recovers a capture left in the uploading state when the page was closed mid-upload", async () => {
    await queueCapture(make("a"))
    await markUploading("a")
    expect(await getPendingCount()).toBe(1)
    expect(await syncPendingCaptures(async () => true)).toBe(1)
    expect(await getPendingCount()).toBe(0)
  })

  it("does not upload the same capture twice when two syncs start together", async () => {
    await queueCapture(make("a"))
    let uploads = 0
    const slow = async () => {
      uploads++
      await new Promise((r) => setTimeout(r, 30))
      return true
    }
    await Promise.all([syncPendingCaptures(slow), syncPendingCaptures(slow)])
    expect(uploads).toBe(1)
  })
})

describe("manual retry of captures that used up their automatic retries", () => {
  const cap = async (id: string) => {
    await queueCapture(make(id))
    for (let i = 0; i < RETRY_CAP; i++) await syncPendingCaptures(async () => false)
  }

  it("automatic syncs still skip a capped capture, and never upload it", async () => {
    await cap("a")
    let uploads = 0
    expect(await syncPendingCaptures(async () => (uploads++, true))).toBe(0)
    expect(uploads).toBe(0)
    expect(await getCappedCount()).toBe(1)
    expect(await getPendingCount()).toBe(1) // kept
  })

  it("a manual sync uploads a capped capture and removes it only after the upload succeeds", async () => {
    await cap("a")
    expect(await syncPendingCaptures(async () => true, { includeCapped: true })).toBe(1)
    expect(await getPendingCount()).toBe(0)
    expect(await getCappedCount()).toBe(0)
  })

  it("a manual sync that fails keeps the capture, still capped, and does not retry it by itself afterwards", async () => {
    await cap("a")
    expect(await syncPendingCaptures(async () => false, { includeCapped: true })).toBe(0)
    expect(await getPendingCount()).toBe(1)
    expect(await getCappedCount()).toBe(1)
    let uploads = 0
    await syncPendingCaptures(async () => (uploads++, true)) // automatic
    expect(uploads).toBe(0)
  })

  it("a manual sync that throws keeps the capture", async () => {
    await cap("a")
    await syncPendingCaptures(async () => { throw new Error("network") }, { includeCapped: true })
    expect(await getPendingCount()).toBe(1)
    expect(await getCappedCount()).toBe(1)
  })

  it("two manual syncs started together upload the capture once", async () => {
    await cap("a")
    let uploads = 0
    const slow = async () => {
      uploads++
      await new Promise((r) => setTimeout(r, 30))
      return true
    }
    await Promise.all([syncPendingCaptures(slow, { includeCapped: true }), syncPendingCaptures(slow, { includeCapped: true })])
    expect(uploads).toBe(1)
    expect(await getPendingCount()).toBe(0)
  })

  it("a manual sync started during an automatic one does not run beside it", async () => {
    await cap("a")
    let uploads = 0
    const slow = async () => {
      uploads++
      await new Promise((r) => setTimeout(r, 30))
      return true
    }
    const auto = syncPendingCaptures(slow)
    const manual = await syncPendingCaptures(slow, { includeCapped: true })
    await auto
    expect(manual).toBe(0)
    expect(uploads).toBe(0) // the automatic one skipped the capped capture and the manual one was refused while it ran
    expect(await getPendingCount()).toBe(1)
  })

  it("running a manual sync again after it succeeded finds nothing left to upload", async () => {
    await cap("a")
    await syncPendingCaptures(async () => true, { includeCapped: true })
    let uploads = 0
    expect(await syncPendingCaptures(async () => (uploads++, true), { includeCapped: true })).toBe(0)
    expect(uploads).toBe(0)
  })

  it("a manual sync also takes the ordinary waiting captures", async () => {
    await cap("a")
    await queueCapture(make("b"))
    const sent: string[] = []
    expect(await syncPendingCaptures(async (c) => (sent.push(c.id), true), { includeCapped: true })).toBe(2)
    expect(sent.sort()).toEqual(["a", "b"])
  })
})
