import "fake-indexeddb/auto"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { openDB } from "idb"

/**
 * Offline capture integrity: the real queue (an in-memory IndexedDB) and the real sync code, with Supabase replaced by a
 * small in-memory fake. The fake keeps its findings by id, refuses a second finding with the same id (like the
 * database's primary key), and can be told to fail photo uploads, refuse a save, or save a finding but lose the answer.
 * These tests show what the app does with those answers. They do not show how the live database or storage behave, and
 * everything here is made up.
 */

const publicUrlOf = (name: string) => `https://abc.supabase.co/storage/v1/object/public/test-uploads/${name}`
const server = vi.hoisted(() => ({
  rows: new Map<string, Record<string, unknown>>(),
  inserts: 0,
  uploads: [] as string[],
  removed: [] as string[],
  failPhoto: (index: number): boolean => index < 0,
  insertMode: "ok" as "ok" | "refuse" | "save-but-lose-answer",
  lookupBroken: false,
  lookupThrows: false,
  hidden: new Set<string>(), // findings that exist but that the signed-in user may not read
  lookups: 0,
  okLookups: 0, // lookups that really answered
  removeMode: "ok" as "ok" | "error" | "throw",
  removeAttempts: [] as string[], // every path asked to be removed, whether or not the removal worked
  lookupScript: [] as string[], // per lookup, in order: "no" answers not-saved, "error" fails; anything else (or none left) answers for real
  savedImageUrls: { set: false, value: undefined as unknown }, // when set, a found finding reports this as its photo list
  gate: null as null | Promise<void>, // when set, lookups answer only once it resolves (answers are read before waiting)
}))

vi.mock("../lib/supabase", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: async (name: string) => {
          const index = Number(name.match(/photo-(\d+)\.jpg$/)?.[1])
          if (server.failPhoto(index)) return { error: { message: "network down" } }
          server.uploads.push(name)
          return { error: null }
        },
        remove: async (names: string[]) => {
          server.removeAttempts.push(...names)
          if (server.removeMode === "throw") throw new Error("storage unreachable")
          if (server.removeMode === "error") return { data: null, error: { message: "storage refused" } }
          server.removed.push(...names)
          return { data: [], error: null }
        },
        getPublicUrl: (name: string) => ({ data: { publicUrl: `https://abc.supabase.co/storage/v1/object/public/test-uploads/${name}` } }),
      }),
    },
    from: (table: string) => {
      if (table !== "captures") throw new Error("unexpected table " + table)
      return {
        insert: async (row: Record<string, unknown>) => {
          server.inserts++
          if (server.insertMode === "refuse") return { error: { message: 'violates foreign key constraint "captures_project_id_fkey"', code: "23503" } }
          if (server.rows.has(row.id as string)) return { error: { message: "duplicate key value violates unique constraint", code: "23505" } }
          server.rows.set(row.id as string, row)
          if (server.insertMode === "save-but-lose-answer") return { error: { message: "TypeError: Failed to fetch" } }
          return { error: null }
        },
        select: () => ({
          eq: (_col: string, id: string) => ({
            maybeSingle: async () => {
              server.lookups++
              if (server.lookupThrows) throw new Error("socket closed")
              if (server.lookupBroken) return { data: null, error: { message: "TypeError: Failed to fetch" } }
              const step = server.lookupScript.shift()
              if (step === "error") return { data: null, error: { message: "TypeError: Failed to fetch" } }
              server.okLookups++
              const row = server.hidden.has(id) || step === "no" ? undefined : server.rows.get(id)
              if (server.gate) await server.gate
              return { data: row ? { id, project_id: row.project_id, image_urls: server.savedImageUrls.set ? (typeof server.savedImageUrls.value === "function" ? (server.savedImageUrls.value as (uploaded: string[]) => unknown)(server.uploads.map(publicUrlOf)) : server.savedImageUrls.value) : row.image_urls } : null, error: null }
            },
          }),
        }),
      }
    },
  },
}))

import { queueCapture, getPendingCount, syncPendingCaptures, type PendingCapture } from "../lib/offline-queue"
import { uploadQueuedCapture, serverCaptureId } from "../lib/sync-capture"

const bytes = (text: string) => new TextEncoder().encode(text).buffer as ArrayBuffer
const make = (id: string, photos: string[], note = "Soft decking along the north eave"): Omit<PendingCapture, "status" | "retryCount"> => ({
  id,
  projectId: "p1",
  damageType: "Decking",
  roofArea: "Front slope",
  fieldNote: note,
  quantity: 3,
  unit: "SF",
  photos: photos.map(bytes),
  photoNames: photos.map((_, i) => `photo-${i}.jpg`),
  photoMetadata: photos.map(() => ({ latitude: 35.1, longitude: -78.2 })),
  createdAt: "2026-10-25T00:00:00Z",
})

const compress = async (f: File) => f as Blob
const sync = () => syncPendingCaptures((c) => uploadQueuedCapture(c, compress))

/** Runs a sync while the retry waits inside the photo upload code are skipped */
async function syncSkippingWaits() {
  vi.useFakeTimers({ toFake: ["setTimeout"] })
  try {
    let result: number | undefined
    sync().then((r) => { result = r })
    for (let i = 0; i < 120 && result === undefined; i++) await vi.advanceTimersByTimeAsync(1000)
    expect(result).not.toBeUndefined()
    return result as number
  } finally {
    vi.useRealTimers()
  }
}

async function queueRows() {
  const db = await openDB("supplement-snap-offline", 1)
  const rows = (await db.getAll("pending-captures")) as PendingCapture[]
  db.close()
  return rows
}

beforeEach(async () => {
  const db = await openDB("supplement-snap-offline", 1, { upgrade(d) { d.createObjectStore("pending-captures", { keyPath: "id" }).createIndex("by-status", "status") } })
  await db.clear("pending-captures")
  db.close()
  server.rows.clear()
  server.inserts = 0
  server.uploads = []
  server.removed = []
  server.failPhoto = () => false
  server.insertMode = "ok"
  server.lookupBroken = false
  server.lookupThrows = false
  server.hidden.clear()
  server.lookups = 0
  server.okLookups = 0
  server.gate = null
  server.removeMode = "ok"
  server.removeAttempts = []
  server.lookupScript = []
  server.savedImageUrls = { set: false, value: undefined }
})
afterEach(() => vi.useRealTimers())

describe("a note-only capture made offline", () => {
  it("syncs without any photo: one finding with the note, no upload, queue emptied", async () => {
    await queueCapture(make("offline-note-1", []))
    expect(await sync()).toBe(1)
    expect(server.uploads).toEqual([])
    expect(server.rows.size).toBe(1)
    const row = [...server.rows.values()][0]
    expect(row).toMatchObject({ project_id: "p1", field_note: "Soft decking along the north eave", image_url: "", image_urls: [], damage_type: "Decking", roof_area: "Front slope", quantity: 3, unit: "SF" })
    expect(await getPendingCount()).toBe(0)
  })

  it("an entry with neither photos nor a note is not saved as an empty finding and stays queued", async () => {
    await queueCapture(make("offline-empty", [], "   "))
    expect(await sync()).toBe(0)
    expect(server.rows.size).toBe(0)
    expect((await queueRows()).map((r) => r.id)).toEqual(["offline-empty"])
  })
})

describe("a capture with photos made offline", () => {
  it("syncs when every photo uploads: one finding with all of them, queue emptied", async () => {
    await queueCapture(make("offline-photos-1", ["a", "b"]))
    expect(await sync()).toBe(1)
    const row = [...server.rows.values()][0]
    expect((row.image_urls as string[]).length).toBe(2)
    expect(row.image_url).toBe((row.image_urls as string[])[0])
    expect(await getPendingCount()).toBe(0)
    expect(server.removed).toEqual([])
  })

  it("partial photo failure: nothing is saved, the uploaded photo is removed, and the queued note and photos are kept exactly", async () => {
    await queueCapture(make("offline-partial", ["first", "second"]))
    server.failPhoto = (i) => i === 1
    expect(await syncSkippingWaits()).toBe(0)

    expect(server.rows.size).toBe(0)
    expect(server.uploads).toHaveLength(1)
    expect(server.removed).toHaveLength(1) // the one that did upload
    const [kept] = await queueRows()
    expect(kept.status).toBe("failed")
    expect(kept.retryCount).toBe(1)
    expect(kept.fieldNote).toBe("Soft decking along the north eave")
    expect(kept.photos.map((p) => new TextDecoder().decode(p))).toEqual(["first", "second"])
    expect(kept.photoNames).toEqual(["photo-0.jpg", "photo-1.jpg"])
    expect(await getPendingCount()).toBe(1) // still counted as waiting, not presented as synced
  })

  it("retry after the partial failure sends all the photos and saves exactly one finding", async () => {
    await queueCapture(make("offline-retry", ["first", "second"]))
    server.failPhoto = (i) => i === 1
    await syncSkippingWaits()
    server.failPhoto = () => false
    server.uploads = []
    server.removed = []

    expect(await sync()).toBe(1)
    expect(server.rows.size).toBe(1)
    expect(((([...server.rows.values()][0]).image_urls) as string[]).length).toBe(2)
    expect(server.uploads).toHaveLength(2)
    expect(server.removed).toEqual([])
    expect(await getPendingCount()).toBe(0)
  })

  it("every photo failing keeps the capture queued and saves nothing", async () => {
    await queueCapture(make("offline-allfail", ["a"]))
    server.failPhoto = () => true
    expect(await syncSkippingWaits()).toBe(0)
    expect(server.rows.size).toBe(0)
    expect(await queueRows()).toHaveLength(1)
  })
})

describe("the server refuses or loses the save", () => {
  it("refused save: the photos just uploaded are removed, nothing is saved, the queue entry is kept intact", async () => {
    await queueCapture(make("offline-refused", ["a", "b"]))
    server.insertMode = "refuse"
    expect(await sync()).toBe(0)
    expect(server.rows.size).toBe(0)
    expect(server.removed).toHaveLength(2)
    const [kept] = await queueRows()
    expect(kept.status).toBe("failed")
    expect(kept.photos).toHaveLength(2)
    expect(kept.fieldNote).toBe("Soft decking along the north eave")
  })

  it("the save works but its answer is lost: it is found on the server, counted as saved, and its photos are not removed", async () => {
    await queueCapture(make("offline-lost-answer", ["a", "b"]))
    server.insertMode = "save-but-lose-answer"
    expect(await sync()).toBe(1)
    expect(server.rows.size).toBe(1)
    expect(server.removed).toEqual([])
    expect(await getPendingCount()).toBe(0)
  })

  it("the answer is lost and the server cannot be asked either: the photos are kept (they may belong to the saved finding), the entry stays queued, and the retry does not create a second finding", async () => {
    await queueCapture(make("offline-unknown", ["a", "b"]))
    server.insertMode = "save-but-lose-answer"
    server.lookupBroken = true
    expect(await sync()).toBe(0)
    expect(server.removed).toEqual([]) // nothing deleted that a saved finding might use
    expect(await getPendingCount()).toBe(1)
    expect(server.rows.size).toBe(1)

    server.lookupBroken = false
    server.insertMode = "ok"
    const uploadsBefore = server.uploads.length
    expect(await sync()).toBe(1)
    expect(server.rows.size).toBe(1) // still one finding
    expect(server.inserts).toBe(1) // the retry found it and did not insert again
    expect(server.uploads.length).toBe(uploadsBefore) // and did not upload the photos again
    expect(await getPendingCount()).toBe(0)
  })

  it("syncing the same entry twice never creates a second finding", async () => {
    const entry = make("offline-twice", ["a"])
    await queueCapture(entry)
    expect(await sync()).toBe(1)
    await queueCapture(entry) // the same queued capture shows up again, as after a failed cleanup of the queue
    expect(await sync()).toBe(1)
    expect(server.rows.size).toBe(1)
    expect(server.inserts).toBe(1)
  })

  it("an existing finding with this id that belongs to another project is never reported as this capture's save", async () => {
    const id = await serverCaptureId("offline-clash")
    server.rows.set(id, { id, project_id: "someone-elses-project" })
    await queueCapture(make("offline-clash", ["a"]))
    expect(await sync()).toBe(0)
    expect(server.rows.size).toBe(1)
    expect(server.rows.get(id)?.project_id).toBe("someone-elses-project")
    expect(server.removed).toEqual([]) // unknown, so nothing is deleted
    expect(await queueRows()).toHaveLength(1)
  })

  it("the saved finding belongs to the queued capture's own project", async () => {
    await queueCapture({ ...make("offline-owner", []), projectId: "project-77" })
    await sync()
    expect([...server.rows.values()][0].project_id).toBe("project-77")
  })
})

describe("captures stranded earlier", () => {
  it("are neither retried nor deleted by a sync, and keep their note, photos and count", async () => {
    await queueCapture(make("stranded-photo", ["a"]))
    await queueCapture(make("stranded-note", []))
    const db = await openDB("supplement-snap-offline", 1)
    for (const id of ["stranded-photo", "stranded-note"]) {
      const row = await db.get("pending-captures", id)
      await db.put("pending-captures", { ...row, status: "failed", retryCount: 5 })
    }
    db.close()
    await queueCapture(make("fresh", []))

    expect(await sync()).toBe(1) // only the fresh one
    const left = (await queueRows()).sort((a, b) => a.id.localeCompare(b.id))
    expect(left.map((r) => r.id)).toEqual(["stranded-note", "stranded-photo"])
    expect(left.every((r) => r.status === "failed" && r.retryCount === 5)).toBe(true)
    expect(left.find((r) => r.id === "stranded-photo")!.photos).toHaveLength(1)
    expect(left.find((r) => r.id === "stranded-note")!.fieldNote).toBe("Soft decking along the north eave")
    expect(await getPendingCount()).toBe(2) // still reported as waiting, not hidden
    expect(server.rows.size).toBe(1)
  })
})

describe("critical retry cases", () => {
  it("two attempts at the same queue entry at the same moment (two tabs) save one finding and neither deletes the saved finding's photos", async () => {
    const entry = { ...make("offline-race", ["a", "b"]), status: "pending", retryCount: 0 } as PendingCapture
    // Hold both first lookups until both attempts have asked, so both are told "not saved yet" and both go on to save
    let release!: () => void
    server.gate = new Promise<void>((r) => { release = r })
    const both = Promise.all([uploadQueuedCapture(entry, compress), uploadQueuedCapture(entry, compress)])
    await vi.waitFor(() => expect(server.lookups).toBe(2))
    release()
    const [first, second] = await both
    expect(server.inserts).toBe(2) // both really reached the save, so this was a genuine race
    expect(server.rows.size).toBe(1)
    expect([first, second]).toEqual([true, true])
    const saved = [...server.rows.values()][0].image_urls as string[]
    expect(saved).toHaveLength(2)
    // the winner's photos are never removed; the loser's two distinct uploads are the ones removed
    for (const url of saved) expect(server.removeAttempts.some((r) => url.endsWith(r))).toBe(false)
    expect(server.uploads).toHaveLength(4)
    expect(server.removed).toHaveLength(2)
    const winnerNames = server.uploads.filter((name) => saved.some((u) => u.endsWith(name)))
    expect(winnerNames).toHaveLength(2)
    expect([...server.removed].sort()).toEqual(server.uploads.filter((n) => !winnerNames.includes(n)).sort())
  })

  it("two syncs started together on one device run one at a time: one finding", async () => {
    await queueCapture(make("offline-race-sync", ["a"]))
    const [x, y] = await Promise.all([sync(), sync()])
    expect(x + y).toBe(1)
    expect(server.rows.size).toBe(1)
    expect(server.inserts).toBe(1)
  })

  it("the save works and both the answer and the follow-up lookup are lost: the queue stays intact until a later retry confirms the finding", async () => {
    await queueCapture(make("offline-confirm", ["a", "b"]))
    server.insertMode = "save-but-lose-answer"
    server.lookupBroken = true
    expect(await sync()).toBe(0)
    expect(server.rows.size).toBe(1)
    expect(await getPendingCount()).toBe(1)

    // the retry cannot confirm it either: still intact, still one finding, nothing deleted
    server.insertMode = "ok"
    expect(await sync()).toBe(0)
    expect(await getPendingCount()).toBe(1)
    expect(server.rows.size).toBe(1)
    expect(server.okLookups).toBe(0)
    expect(server.removed).toEqual([])
    const [kept] = await queueRows()
    expect(kept.photos).toHaveLength(2)
    expect(kept.fieldNote).toBe("Soft decking along the north eave")

    // once the lookup works, the existing finding is confirmed, and only then does the entry leave the queue
    server.lookupBroken = false
    expect(await sync()).toBe(1)
    expect(server.okLookups).toBeGreaterThan(0)
    expect(await getPendingCount()).toBe(0)
    expect(server.rows.size).toBe(1)
    expect(server.removed).toEqual([])
  })

  it("an existing finding the signed-in user may not read is not taken as this capture's save: the entry stays queued and the other finding is untouched", async () => {
    const id = await serverCaptureId("offline-hidden")
    server.rows.set(id, { id, project_id: "p1", note: "someone else's" })
    server.hidden.add(id)
    await queueCapture(make("offline-hidden", ["a"]))
    expect(await sync()).toBe(0)
    expect(server.rows.get(id)).toMatchObject({ note: "someone else's" })
    expect(await getPendingCount()).toBe(1)
    expect(server.removed).toHaveLength(1) // only the photo this attempt uploaded and nothing references
  })

  it("a lookup that errors is not proof that no finding exists: no photos are removed", async () => {
    await queueCapture(make("offline-lookup-error", ["a"]))
    server.insertMode = "refuse"
    server.lookupBroken = true
    expect(await sync()).toBe(0)
    expect(server.removed).toEqual([])
    expect(await getPendingCount()).toBe(1)
  })

  it("a lookup that throws is not proof that no finding exists either", async () => {
    await queueCapture(make("offline-lookup-throws", ["a"]))
    server.insertMode = "refuse"
    server.lookupThrows = true
    expect(await sync()).toBe(0)
    expect(server.lookups).toBeGreaterThan(0)
    expect(server.removed).toEqual([])
    expect(await getPendingCount()).toBe(1)
  })

  it("a lookup that answers no is the only thing that allows removing the photos just uploaded", async () => {
    await queueCapture(make("offline-lookup-no", ["a"]))
    server.insertMode = "refuse"
    expect(await sync()).toBe(0)
    expect(server.okLookups).toBeGreaterThan(0)
    expect(server.removed).toHaveLength(1)
  })

  it("entries at the retry cap stay exactly as they are, even when their finding already exists on the server", async () => {
    await queueCapture(make("capped", ["a"]))
    const id = await serverCaptureId("capped")
    server.rows.set(id, { id, project_id: "p1" })
    const db = await openDB("supplement-snap-offline", 1)
    await db.put("pending-captures", { ...(await db.get("pending-captures", "capped")), status: "failed", retryCount: 5 })
    db.close()
    expect(await sync()).toBe(0)
    const [kept] = await queueRows()
    expect(kept).toMatchObject({ id: "capped", status: "failed", retryCount: 5 })
    expect(kept.photos).toHaveLength(1)
    expect(server.lookups).toBe(0) // not touched at all
  })
})

describe("simultaneous save: cleanup after the other attempt saved first", () => {
  const WINNER_URLS = ["https://abc.supabase.co/storage/v1/object/public/test-uploads/winner-1.jpg", "https://abc.supabase.co/storage/v1/object/public/test-uploads/winner-2.jpg"]
  async function withWinnerAlreadySaved(queueId: string, photos = ["a", "b"]) {
    const id = await serverCaptureId(queueId)
    server.rows.set(id, { id, project_id: "p1", image_urls: WINNER_URLS })
    server.lookupScript = ["no"] // the first look (before uploading) still says not saved; the next look answers for real
    await queueCapture(make(queueId, photos))
    return id
  }

  it("the losing attempt's own distinct uploads are removed, the winner's photos never are, and one finding remains", async () => {
    await withWinnerAlreadySaved("offline-loser")
    expect(await sync()).toBe(1) // confirmed saved, so the entry leaves the queue
    expect(server.rows.size).toBe(1)
    expect(server.inserts).toBe(1) // refused as a duplicate
    expect(server.uploads).toHaveLength(2)
    expect([...server.removed].sort()).toEqual([...server.uploads].sort())
    expect(server.removeAttempts.some((p) => p.includes("winner"))).toBe(false)
    expect(await getPendingCount()).toBe(0)
  })

  it("a photo of this attempt that the saved finding does use is kept; only the unused one is removed", async () => {
    await withWinnerAlreadySaved("offline-partly-used")
    server.savedImageUrls = { set: true, value: (uploaded: string[]) => [...WINNER_URLS, uploaded[0]] }
    expect(await sync()).toBe(1)
    expect(server.uploads).toHaveLength(2)
    expect(server.removed).toEqual([server.uploads[1]])
  })

  it("removes nothing when the saved photo list cannot be read as a list of text (not a list, missing, or mixed)", async () => {
    for (const bad of ["not-a-list", null, undefined, {}, [1, 2], [WINNER_URLS[0], null]]) {
      server.rows.clear(); server.uploads = []; server.removed = []; server.removeAttempts = []
      await withWinnerAlreadySaved("offline-malformed")
      server.savedImageUrls = { set: true, value: bad }
      expect(await sync(), JSON.stringify(bad)).toBe(1) // still a confirmed save
      expect(server.uploads).toHaveLength(2)
      expect(server.removeAttempts, JSON.stringify(bad)).toEqual([])
      expect(await getPendingCount()).toBe(0)
    }
  })

  it("(control) a readable list that does not contain this attempt's photos is what makes them removable", async () => {
    await withWinnerAlreadySaved("offline-control")
    server.savedImageUrls = { set: true, value: [] }
    expect(await sync()).toBe(1)
    expect(server.removed).toHaveLength(2)
  })

  it("a lookup that errors after the refused save removes nothing and keeps the entry queued", async () => {
    await withWinnerAlreadySaved("offline-loser-lookup-error")
    server.lookupScript = ["no", "error"]
    expect(await sync()).toBe(0)
    expect(server.uploads).toHaveLength(2)
    expect(server.removeAttempts).toEqual([])
    expect(await getPendingCount()).toBe(1)
    expect(server.rows.size).toBe(1)
  })

  it("a lookup that throws after the refused save removes nothing either", async () => {
    await withWinnerAlreadySaved("offline-loser-lookup-throws")
    server.lookupScript = []
    server.lookupThrows = true
    expect(await sync()).toBe(0)
    expect(server.removeAttempts).toEqual([])
    expect(await getPendingCount()).toBe(1)
  })

  it("a saved finding in another project is not this capture's: nothing is removed and the entry stays queued", async () => {
    const id = await withWinnerAlreadySaved("offline-loser-other-project")
    server.rows.set(id, { id, project_id: "someone-elses-project", image_urls: WINNER_URLS })
    expect(await sync()).toBe(0)
    expect(server.removeAttempts).toEqual([])
    expect(await getPendingCount()).toBe(1)
  })

  it("a cleanup that fails (storage refuses or is unreachable) does not undo the confirmed save", async () => {
    for (const mode of ["error", "throw"] as const) {
      server.rows.clear(); server.uploads = []; server.removed = []; server.removeAttempts = []
      server.removeMode = mode
      await withWinnerAlreadySaved("offline-cleanup-fails-" + mode)
      expect(await sync(), mode).toBe(1)
      expect(server.rows.size).toBe(1)
      expect(server.removeAttempts, mode).toHaveLength(2) // it tried, only with its own uploads
      expect(server.removeAttempts.some((p) => p.includes("winner"))).toBe(false)
      expect(await getPendingCount(), mode).toBe(0)
    }
  })

  it("a note-only capture has no uploads to clean up and is still saved once", async () => {
    await withWinnerAlreadySaved("offline-loser-note-only", [])
    expect(await sync()).toBe(1)
    expect(server.uploads).toEqual([])
    expect(server.removeAttempts).toEqual([])
  })
})

describe("serverCaptureId", () => {
  it("is the same every time for one queue entry, differs between entries, and is a valid uuid", async () => {
    const a = await serverCaptureId("offline-1")
    expect(await serverCaptureId("offline-1")).toBe(a)
    expect(await serverCaptureId("offline-2")).not.toBe(a)
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })
})
