import { storagePathFromUrl } from "./storage-paths"

/**
 * Who may get a short-lived link to which stored file. This file holds only the decision; it reads nothing itself.
 *
 * The rule is deliberately not a second permission system. The caller supplies a reader that runs as the SIGNED-IN USER,
 * so the database's own row rules (owner, plus the existing read-only team policies) decide what the user can see.
 * A file is signed only when its path appears on a row the user can already read:
 *   - a photo on a finding of the requested project,
 *   - the diagram of the requested project,
 *   - the user's own company logo.
 * Anything else is denied, including a real file that belongs to someone else, and a path that is not a plain file name.
 */

/** How long a signed link works. Links are fetched again when they get close to this. */
export const PHOTO_URL_TTL_SECONDS = 3600
export const MAX_URLS_PER_REQUEST = 100

/** Upload names are "<timestamp>-<uuid>-photo-<n>.jpg", "logo-<user>-<uuid>-<name>" and "diagrams/<timestamp>-<uuid>.<ext>". */
const SAFE_PATH = /^(?:[A-Za-z0-9][A-Za-z0-9._-]*\/)?[A-Za-z0-9][A-Za-z0-9._-]*$/

export type PhotoReader = {
  /** The requested project's diagram address, or null when the user cannot see that project (or it has no diagram). */
  projectDiagramUrl: (projectId: string) => Promise<{ visible: boolean; diagramUrl: string | null }>
  /** Photo addresses on the findings of that project that the user can see. Empty when the user cannot see the project. */
  projectPhotoUrls: (projectId: string) => Promise<Array<string | null | undefined>>
  /** The user's own saved company logo address. */
  ownLogoUrl: () => Promise<string | null>
}

export type Denial = "invalid-address" | "not-yours"

export type Decision = {
  /** address as sent by the caller -> storage path to sign */
  allowed: Array<{ url: string; path: string }>
  denied: Array<{ url: string; reason: Denial }>
}

export function isSafeStoragePath(path: string): boolean {
  return SAFE_PATH.test(path) && !path.includes("..")
}

export async function decidePhotoAccess(args: { reader: PhotoReader; projectId?: string | null; urls: string[] }): Promise<Decision> {
  const decision: Decision = { allowed: [], denied: [] }
  const wanted = [...new Set(args.urls.filter((u): u is string => typeof u === "string"))].slice(0, MAX_URLS_PER_REQUEST)

  const candidates: Array<{ url: string; path: string }> = []
  for (const url of wanted) {
    const path = storagePathFromUrl(url)
    if (!path || !isSafeStoragePath(path)) decision.denied.push({ url, reason: "invalid-address" })
    else candidates.push({ url, path })
  }
  if (candidates.length === 0) return decision

  // Only what the signed-in user may already read counts as permission
  const permitted = new Set<string>()
  const projectId = typeof args.projectId === "string" && args.projectId ? args.projectId : null
  if (projectId) {
    const [project, photos] = await Promise.all([args.reader.projectDiagramUrl(projectId), args.reader.projectPhotoUrls(projectId)])
    if (project.visible) {
      for (const u of photos) {
        const p = storagePathFromUrl(u)
        if (p) permitted.add(p)
      }
      const d = storagePathFromUrl(project.diagramUrl)
      if (d) permitted.add(d)
    }
  }
  const logo = storagePathFromUrl(await args.reader.ownLogoUrl())
  if (logo) permitted.add(logo)

  for (const c of candidates) {
    if (permitted.has(c.path)) decision.allowed.push(c)
    else decision.denied.push({ url: c.url, reason: "not-yours" })
  }
  return decision
}
