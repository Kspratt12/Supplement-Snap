import { describe, it, expect, vi, beforeEach } from "vitest"

// The storage service is a stand-in: these tests show what the app does with the answers it is given.
const remove = vi.hoisted(() => vi.fn())
vi.mock("../lib/supabase", () => ({ supabase: { storage: { from: () => ({ remove }) } } }))

import { writeOutcome } from "../lib/write-result"
import { cleanupOrphanedUploads } from "../lib/upload-utils"

describe("telling a saved write from a refused one", () => {
  it("counts a write as saved only when a changed row comes back", () => {
    expect(writeOutcome({ data: [{ id: "1" }], error: null })).toBe("ok")
  })
  it("treats no error and no rows as refused (what row security does to a change it does not allow)", () => {
    expect(writeOutcome({ data: [], error: null })).toBe("refused")
    expect(writeOutcome({ data: null, error: null })).toBe("refused")
    expect(writeOutcome({ error: null })).toBe("refused")
  })
  it("treats an error as an error, whatever else came back", () => {
    expect(writeOutcome({ data: null, error: { message: "network down" } })).toBe("error")
    expect(writeOutcome({ data: [{ id: "1" }], error: { message: "boom" } })).toBe("error")
  })
})

describe("cleaning up photos uploaded for a write that failed", () => {
  const url = (n: string) => `https://abc.supabase.co/storage/v1/object/public/test-uploads/${n}`
  beforeEach(() => {
    remove.mockReset()
  })

  it("removes only the files it is given and reports nothing when every one is confirmed", async () => {
    remove.mockResolvedValue({ data: [{ name: "new-1.jpg" }, { name: "new-2.jpg" }], error: null })
    expect(await cleanupOrphanedUploads([url("new-1.jpg"), url("new-2.jpg")])).toEqual([])
    expect(remove).toHaveBeenCalledTimes(1)
    expect([...remove.mock.calls[0][0]].sort()).toEqual(["new-1.jpg", "new-2.jpg"]) // nothing else is named
  })
  it("reports the files the storage service did not confirm removing", async () => {
    remove.mockResolvedValue({ data: [{ name: "new-1.jpg" }], error: null })
    expect(await cleanupOrphanedUploads([url("new-1.jpg"), url("new-2.jpg")])).toEqual(["new-2.jpg"])
  })
  it("reports every file when the storage service returns an error or throws", async () => {
    remove.mockResolvedValue({ data: null, error: { message: "unavailable" } })
    expect(await cleanupOrphanedUploads([url("a.jpg")])).toEqual(["a.jpg"])
    remove.mockImplementation(async () => { throw new Error("offline") })
    expect(await cleanupOrphanedUploads([url("a.jpg"), url("b.jpg")])).toEqual(["a.jpg", "b.jpg"])
  })
  it("does nothing, and reports nothing, when there is nothing to remove", async () => {
    expect(await cleanupOrphanedUploads([])).toEqual([])
    expect(await cleanupOrphanedUploads(["https://example.com/not-ours.jpg"])).toEqual([])
    expect(remove).not.toHaveBeenCalled()
  })
})
