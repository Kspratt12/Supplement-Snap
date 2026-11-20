import "fake-indexeddb/auto"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { openDB } from "idb"
import { deleteCaptureWithFiles, type DeleteDeps } from "../lib/capture-delete"
import { queueCapture, syncPendingCaptures, getPendingCount, getRefused, discardQueued } from "../lib/offline-queue"

const U = (n: string) => `https://abc.supabase.co/storage/v1/object/public/test-uploads/${n}`
const row = { id: "c1", project_id: "p1", image_url: U("own.jpg"), image_urls: [U("own.jpg"), U("crew.jpg"), U("crew-markup.jpg")] }

function deps(over: Partial<DeleteDeps> = {}) {
  const calls = { removed: [] as string[][], recorded: [] as string[][], deleted: 0 }
  const d: DeleteDeps = {
    readCapture: async (id) => (id === "c1" ? row : null),
    readProjectOwner: async () => "owner",
    deleteRow: async () => { calls.deleted++; return true },
    removeFiles: async (p) => { calls.removed.push(p); return { notConfirmed: [] } },
    recordUnremoved: async (_p, paths) => { calls.recorded.push(paths) },
    ...over,
  }
  return { d, calls }
}

describe("owner deletes a finding with a team member's photos", () => {
  it("removes the record and exactly the files the record lists, including the contributor's original and marked-up copy", async () => {
    const { d, calls } = deps()
    const r = await deleteCaptureWithFiles("owner", "c1", d)
    expect(r).toEqual({ status: 200, deleted: true, filesRemoved: 3, notConfirmed: [] })
    expect(calls.removed).toEqual([["own.jpg", "crew.jpg", "crew-markup.jpg"]])
  })

  it("a team member or another account cannot delete, and nothing is removed", async () => {
    const { d, calls } = deps()
    expect(await deleteCaptureWithFiles("crew", "c1", d)).toMatchObject({ status: 403, deleted: false })
    const hidden = deps({ readCapture: async () => null })
    expect(await deleteCaptureWithFiles("stranger", "c1", hidden.d)).toMatchObject({ status: 404 })
    expect(calls.deleted + calls.removed.length + hidden.calls.removed.length).toBe(0)
  })

  it("the caller cannot name files: only the record's own paths are used, never anything else", async () => {
    const forged = deps({ readCapture: async () => ({ ...row, image_urls: [U("crew.jpg"), "https://evil.example/x.jpg", "../../other-bucket/secret"] }) })
    await deleteCaptureWithFiles("owner", "c1", forged.d)
    expect(forged.calls.removed[0]).toEqual(["own.jpg", "crew.jpg"]) // non-storage addresses are ignored
  })

  it("partial removal is reported and recorded for cleanup, and a failed storage call keeps every path", async () => {
    const part = deps({ removeFiles: async () => ({ notConfirmed: ["crew.jpg"] }) })
    expect(await deleteCaptureWithFiles("owner", "c1", part.d)).toMatchObject({ deleted: true, filesRemoved: 2, notConfirmed: ["crew.jpg"] })
    expect(part.calls.recorded).toEqual([["crew.jpg"]])
    const down = deps({ removeFiles: async () => { throw new Error("storage down") } })
    expect(await deleteCaptureWithFiles("owner", "c1", down.d)).toMatchObject({ deleted: true, filesRemoved: 0, notConfirmed: ["own.jpg", "crew.jpg", "crew-markup.jpg"] })
  })

  it("if the record is not deleted, no file is touched; deleting again finds nothing", async () => {
    const refused = deps({ deleteRow: async () => false })
    expect(await deleteCaptureWithFiles("owner", "c1", refused.d)).toMatchObject({ status: 409 })
    expect(refused.calls.removed).toEqual([])
    const gone = deps({ readCapture: async () => null })
    expect(await deleteCaptureWithFiles("owner", "c1", gone.d)).toMatchObject({ status: 404 })
  })
})

describe("a removed member's queued finding", () => {
  beforeEach(async () => {
    const db = await openDB("supplement-snap-offline", 1, { upgrade(x) { x.createObjectStore("pending-captures", { keyPath: "id" }).createIndex("by-status", "status") } })
    await db.clear("pending-captures")
    db.close()
  })

  it("is marked refused once, never retried, not counted as waiting, kept for its own account, and discarded only on request", async () => {
    const base = { projectId: "p1", damageType: "Decking", roofArea: "Front", fieldNote: "n", quantity: 1, unit: "", photos: [], photoNames: [], photoMetadata: [], createdAt: "2026-11-20T00:00:00Z" }
    await queueCapture({ ...base, id: "q1", userId: "crew" })
    const upload = vi.fn(async () => "refused" as const)
    await syncPendingCaptures(upload, { userId: "crew" })
    await syncPendingCaptures(upload, { userId: "crew", includeCapped: true })
    expect(upload).toHaveBeenCalledTimes(1)
    expect(await getPendingCount("crew")).toBe(0)
    expect((await getRefused("crew")).map((c) => c.id)).toEqual(["q1"])
    expect(await getRefused("someone-else")).toEqual([])
    expect(await discardQueued("q1", "someone-else")).toBe(false)
    expect(await discardQueued("q1", "crew")).toBe(true)
    expect(await getRefused("crew")).toEqual([])
  })
})
