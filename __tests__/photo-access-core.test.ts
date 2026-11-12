import { describe, it, expect } from "vitest"
import { decidePhotoAccess, isSafeStoragePath, MAX_URLS_PER_REQUEST, PHOTO_URL_TTL_SECONDS, type PhotoReader } from "../lib/photo-access-core"
import { storagePathFromUrl, photoPathsForCaptures } from "../lib/storage-paths"

const BASE = "https://example-project.supabase.co/storage/v1/object/public/test-uploads"
const photo = (n: string) => `${BASE}/1700000000000-aaaaaaaa-photo-${n}.jpg`
const SIGNED = (n: string) => `https://example-project.supabase.co/storage/v1/object/sign/test-uploads/1700000000000-aaaaaaaa-photo-${n}.jpg?token=eyJ.fake.token`

function reader(over: Partial<{ visible: boolean; diagram: string | null; photos: string[]; logo: string | null }> = {}): PhotoReader {
  const o = { visible: true, diagram: null, photos: [] as string[], logo: null, ...over }
  return {
    projectDiagramUrl: async () => ({ visible: o.visible, diagramUrl: o.visible ? o.diagram : null }),
    projectPhotoUrls: async () => (o.visible ? o.photos : []),
    ownLogoUrl: async () => o.logo,
  }
}

describe("decidePhotoAccess", () => {
  it("allows a photo that is on a finding of the requested project", async () => {
    const d = await decidePhotoAccess({ reader: reader({ photos: [photo("0"), photo("1")] }), projectId: "p1", urls: [photo("1")] })
    expect(d.allowed).toEqual([{ url: photo("1"), path: "1700000000000-aaaaaaaa-photo-1.jpg" }])
    expect(d.denied).toEqual([])
  })

  it("denies a real file that is not on that project, even though it is in the same bucket", async () => {
    const d = await decidePhotoAccess({ reader: reader({ photos: [photo("0")] }), projectId: "p1", urls: [photo("9")] })
    expect(d.allowed).toEqual([])
    expect(d.denied).toEqual([{ url: photo("9"), reason: "not-yours" }])
  })

  it("denies everything when the user cannot see the project at all", async () => {
    const d = await decidePhotoAccess({ reader: reader({ visible: false, photos: [photo("0")] }), projectId: "p1", urls: [photo("0")] })
    expect(d.allowed).toEqual([])
    expect(d.denied.map((x) => x.reason)).toEqual(["not-yours"])
  })

  it("allows the project's diagram and the user's own logo, and nothing else", async () => {
    const diagram = `${BASE}/diagrams/1700000000000-bbbbbbbb.pdf`
    const logo = `${BASE}/logo-user-cccc-mylogo.png`
    const d = await decidePhotoAccess({ reader: reader({ diagram, logo }), projectId: "p1", urls: [diagram, logo, `${BASE}/diagrams/other.pdf`] })
    expect(d.allowed.map((a) => a.path)).toEqual(["diagrams/1700000000000-bbbbbbbb.pdf", "logo-user-cccc-mylogo.png"])
    expect(d.denied.map((x) => x.url)).toEqual([`${BASE}/diagrams/other.pdf`])
  })

  it("lets the logo be signed without a project id, but never a project photo", async () => {
    const logo = `${BASE}/logo-user-cccc-mylogo.png`
    const d = await decidePhotoAccess({ reader: reader({ photos: [photo("0")], logo }), projectId: undefined, urls: [logo, photo("0")] })
    expect(d.allowed.map((a) => a.url)).toEqual([logo])
    expect(d.denied.map((x) => x.url)).toEqual([photo("0")])
  })

  it("rejects addresses that are not a plain file in our bucket (other hosts, other buckets, traversal, odd characters)", async () => {
    const bad = [
      "https://evil.example/whatever.jpg",
      "https://example-project.supabase.co/storage/v1/object/public/other-bucket/x.jpg",
      `${BASE}/../secret.jpg`,
      `${BASE}/a/b/c.jpg`,
      `${BASE}/%2e%2e/x.jpg`,
      `${BASE}/x.jpg%25`,
      `${BASE}/.hidden`,
      "",
      "not a url",
    ]
    const d = await decidePhotoAccess({ reader: reader({ photos: bad }), projectId: "p1", urls: bad })
    expect(d.allowed).toEqual([])
    for (const x of d.denied) expect(["invalid-address", "not-yours"]).toContain(x.reason)
  })

  it("accepts a signed address as input by its path, so a link that was already signed can be signed again", async () => {
    const d = await decidePhotoAccess({ reader: reader({ photos: [photo("2")] }), projectId: "p1", urls: [SIGNED("2")] })
    expect(d.allowed).toHaveLength(1)
    expect(d.allowed[0].path).toBe("1700000000000-aaaaaaaa-photo-2.jpg")
  })

  it("asks the reader nothing when no address is usable, and caps one request", async () => {
    let calls = 0
    const r: PhotoReader = { projectDiagramUrl: async () => { calls++; return { visible: true, diagramUrl: null } }, projectPhotoUrls: async () => { calls++; return [] }, ownLogoUrl: async () => { calls++; return null } }
    await decidePhotoAccess({ reader: r, projectId: "p1", urls: ["https://evil.example/x.jpg"] })
    expect(calls).toBe(0)
    const many = Array.from({ length: MAX_URLS_PER_REQUEST + 25 }, (_, i) => photo(String(i)))
    const d = await decidePhotoAccess({ reader: reader({ photos: many }), projectId: "p1", urls: many })
    expect(d.allowed.length + d.denied.length).toBe(MAX_URLS_PER_REQUEST)
  })

  it("does not repeat an address asked for twice", async () => {
    const d = await decidePhotoAccess({ reader: reader({ photos: [photo("0")] }), projectId: "p1", urls: [photo("0"), photo("0")] })
    expect(d.allowed).toHaveLength(1)
  })
})

describe("compatibility with what is already stored", () => {
  it("a saved public-form address, the same address once signed, and an address with a query all name the same file, so delete-by-address keeps working", () => {
    const path = "1700000000000-aaaaaaaa-photo-3.jpg"
    expect(storagePathFromUrl(photo("3"))).toBe(path)
    expect(storagePathFromUrl(SIGNED("3"))).toBe(path)
    expect(photoPathsForCaptures([{ image_url: photo("3"), image_urls: [photo("3"), SIGNED("3")] }])).toEqual([path])
  })

  it("the signed-link lifetime is one hour", () => {
    expect(PHOTO_URL_TTL_SECONDS).toBe(3600)
  })

  it("the path check accepts every name the app creates", () => {
    for (const p of ["1700000000000-3f2b8a52-aaaa-4bbb-8ccc-123456789abc-photo-0.jpg", "logo-user-uuid-my_logo.png", "diagrams/1700000000000-3f2b8a52.pdf"]) expect(isSafeStoragePath(p), p).toBe(true)
    for (const p of ["../x", "a/../b", "a/b/c", "/x", "x/", "%2e%2e/x", "a b", ""]) expect(isSafeStoragePath(p), p).toBe(false)
  })
})
