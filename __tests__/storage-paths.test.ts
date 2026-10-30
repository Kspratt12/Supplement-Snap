import { describe, expect, it } from "vitest"
import { photoPathsForCaptures, removePhotoFiles, storagePathFromUrl } from "../lib/storage-paths"

const url = (name: string) => `https://abc.supabase.co/storage/v1/object/public/test-uploads/${name}`

describe("photo paths used when deleting a project", () => {
  it("reads one path from one address and decodes it", () => {
    expect(storagePathFromUrl(url("1-abc-photo-0.jpg"))).toBe("1-abc-photo-0.jpg")
    expect(storagePathFromUrl(url("my%20photo.jpg?t=1"))).toBe("my photo.jpg")
  })

  it("ignores empty values and addresses that are not in the photo bucket", () => {
    expect(storagePathFromUrl("")).toBeNull()
    expect(storagePathFromUrl(null)).toBeNull()
    expect(storagePathFromUrl("https://example.com/other/photo.jpg")).toBeNull()
  })

  it("returns every photo of a finding that has several, not just the first", () => {
    const paths = photoPathsForCaptures([
      { image_url: url("a-0.jpg"), image_urls: [url("a-0.jpg"), url("a-1.jpg"), url("a-2.jpg")] },
    ])
    expect(paths.sort()).toEqual(["a-0.jpg", "a-1.jpg", "a-2.jpg"])
  })

  it("returns every photo of every finding in a project", () => {
    const paths = photoPathsForCaptures([
      { image_url: url("a-0.jpg"), image_urls: [url("a-0.jpg"), url("a-1.jpg")] },
      { image_url: url("b-0.jpg"), image_urls: [url("b-0.jpg"), url("b-1.jpg"), url("b-2.jpg")] },
      { image_url: url("c-0.jpg"), image_urls: [url("c-0.jpg")] },
    ])
    expect(paths.sort()).toEqual(["a-0.jpg", "a-1.jpg", "b-0.jpg", "b-1.jpg", "b-2.jpg", "c-0.jpg"])
  })

  it("still finds the photo of an older finding that only has image_url", () => {
    expect(photoPathsForCaptures([{ image_url: url("old.jpg"), image_urls: null }])).toEqual(["old.jpg"])
    expect(photoPathsForCaptures([{ image_url: url("old.jpg") }])).toEqual(["old.jpg"])
  })

  it("lists a photo once when it appears in both fields", () => {
    expect(photoPathsForCaptures([{ image_url: url("a.jpg"), image_urls: [url("a.jpg")] }])).toEqual(["a.jpg"])
  })

  it("handles findings with no photos and an empty project", () => {
    expect(photoPathsForCaptures([{ image_url: "", image_urls: [] }])).toEqual([])
    expect(photoPathsForCaptures([])).toEqual([])
  })
})

// These use a stand-in for the storage service. They check how the answers are read, not what real Supabase returns.
describe("checking that photo files were really removed", () => {
  const bucket = (answer: unknown) => ({ remove: async () => answer as never })

  it("confirms nothing is missing when the service lists every file it removed", async () => {
    const r = await removePhotoFiles(bucket({ data: [{ name: "a.jpg" }, { name: "b.jpg" }], error: null }), ["a.jpg", "b.jpg"])
    expect(r.notConfirmed).toEqual([])
  })

  it("reports the files the service did not list, even though it returned no error", async () => {
    const r = await removePhotoFiles(bucket({ data: [{ name: "a.jpg" }], error: null }), ["a.jpg", "b.jpg"])
    expect(r.notConfirmed).toEqual(["b.jpg"])
  })

  it("reports every file when the service lists none (not allowed, or not found)", async () => {
    const r = await removePhotoFiles(bucket({ data: [], error: null }), ["a.jpg", "b.jpg"])
    expect(r.notConfirmed).toEqual(["a.jpg", "b.jpg"])
  })

  it("reports every file when the service returns an error", async () => {
    const r = await removePhotoFiles(bucket({ data: null, error: { message: "boom" } }), ["a.jpg", "b.jpg"])
    expect(r.notConfirmed).toEqual(["a.jpg", "b.jpg"])
  })

  it("reports every file when the call throws", async () => {
    const r = await removePhotoFiles({ remove: async () => { throw new Error("offline") } }, ["a.jpg"])
    expect(r.notConfirmed).toEqual(["a.jpg"])
  })

  it("asks for each file once and does not call the service when there is nothing to remove", async () => {
    let asked: string[][] = []
    const spy = { remove: async (p: string[]) => { asked.push(p); return { data: p.map((name) => ({ name })), error: null } } }
    expect((await removePhotoFiles(spy, ["a.jpg", "a.jpg", "b.jpg"])).notConfirmed).toEqual([])
    expect(asked).toEqual([["a.jpg", "b.jpg"]])
    asked = []
    expect((await removePhotoFiles(spy, [])).notConfirmed).toEqual([])
    expect(asked).toEqual([])
  })

  it("known limitation: on a retry, a file already removed earlier is reported as not confirmed, because the service cannot tell it apart from a file it was not allowed to remove", async () => {
    // first attempt removed a.jpg; the retry asks for both and the service lists only b.jpg
    const r = await removePhotoFiles(bucket({ data: [{ name: "b.jpg" }], error: null }), ["a.jpg", "b.jpg"])
    expect(r.notConfirmed).toEqual(["a.jpg"]) // a.jpg is reported as not confirmed: it cannot be told apart from "not allowed"
  })
})
