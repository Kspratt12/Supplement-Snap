import { describe, it, expect, vi, beforeEach } from "vitest"

// A stand-in for Supabase. These tests check what the app does with the answers it is given; they do not show how the
// real database or storage behaves.
const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  remove: vi.fn(),
  insert: vi.fn(),
}))

vi.mock("../lib/supabase", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: mocks.upload,
        remove: mocks.remove,
        getPublicUrl: (name: string) => ({ data: { publicUrl: `https://abc.supabase.co/storage/v1/object/public/test-uploads/${name}` } }),
      }),
    },
    from: () => ({ insert: mocks.insert }),
  },
}))

import { uploadQueuedCapture } from "../lib/sync-capture"
import type { PendingCapture } from "../lib/offline-queue"

const queued = (photos = 2): PendingCapture => ({
  id: "q1",
  projectId: "p1",
  damageType: "Decking",
  roofArea: "Front",
  fieldNote: "Soft decking",
  quantity: 1,
  unit: "",
  photos: Array.from({ length: photos }, () => new ArrayBuffer(8)),
  photoNames: Array.from({ length: photos }, (_, i) => `p${i}.jpg`),
  photoMetadata: [],
  status: "pending",
  retryCount: 0,
  createdAt: 0,
} as unknown as PendingCapture)

const compress = async (f: File) => f as Blob

describe("saving a capture that was queued while offline", () => {
  beforeEach(() => {
    mocks.upload.mockReset().mockResolvedValue({ error: null })
    mocks.remove.mockReset().mockResolvedValue({ data: [], error: null })
    mocks.insert.mockReset().mockResolvedValue({ error: null })
  })

  it("uploads the photos, saves the record and removes nothing", async () => {
    expect(await uploadQueuedCapture(queued(), compress)).toBe(true)
    expect(mocks.upload).toHaveBeenCalledTimes(2)
    expect(mocks.insert).toHaveBeenCalledTimes(1)
    expect(mocks.insert.mock.calls[0][0].image_urls).toHaveLength(2)
    expect(mocks.remove).not.toHaveBeenCalled()
  })

  it("removes the photos it just uploaded when the record cannot be saved (for example the project was deleted meanwhile)", async () => {
    mocks.insert.mockResolvedValue({ error: { message: 'insert or update on table "captures" violates foreign key constraint' } })
    expect(await uploadQueuedCapture(queued(), compress)).toBe(false)
    expect(mocks.upload).toHaveBeenCalledTimes(2)
    expect(mocks.remove).toHaveBeenCalledTimes(1)
    const removed = mocks.remove.mock.calls[0][0] as string[]
    expect(removed).toHaveLength(2)
    // exactly the files that were uploaded
    const uploaded = mocks.upload.mock.calls.map((c) => c[0])
    expect([...removed].sort()).toEqual([...uploaded].sort())
  })

  it("does not upload the same photos again as a second set that stays behind: each failed attempt cleans up after itself", async () => {
    mocks.insert.mockResolvedValue({ error: { message: "violates foreign key constraint" } })
    await uploadQueuedCapture(queued(1), compress)
    await uploadQueuedCapture(queued(1), compress)
    expect(mocks.upload).toHaveBeenCalledTimes(2)
    expect(mocks.remove).toHaveBeenCalledTimes(2)
  })

  it("saves nothing and removes nothing when no photo could be uploaded", async () => {
    mocks.upload.mockResolvedValue({ error: { message: "network down" } })
    vi.useFakeTimers()
    try {
      const pending = uploadQueuedCapture(queued(1), compress)
      await vi.runAllTimersAsync()
      expect(await pending).toBe(false)
    } finally {
      vi.useRealTimers()
    }
    expect(mocks.insert).not.toHaveBeenCalled()
    expect(mocks.remove).not.toHaveBeenCalled()
  })
})
