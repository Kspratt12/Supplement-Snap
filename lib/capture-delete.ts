import { photoPathsForCaptures } from "./storage-paths"

/**
 * Deleting a finding and its photo files, decided on the server.
 *
 * The caller names only the finding. Its photo paths come from the finding's own database record (read with the caller's
 * sign-in, so the row rules apply), and only the project's owner may delete it. The record is removed first; then exactly
 * those files are removed through the storage service, including files a team member uploaded (which the owner's own
 * storage rights cannot remove). Files whose removal is not confirmed are recorded so they can be cleaned up later.
 */
export type DeleteDeps = {
  readCapture: (id: string) => Promise<{ id: string; project_id: string; image_url?: string | null; image_urls?: string[] | null } | null>
  readProjectOwner: (projectId: string) => Promise<string | null>
  deleteRow: (id: string) => Promise<boolean>
  removeFiles: (paths: string[]) => Promise<{ notConfirmed: string[] }>
  recordUnremoved: (projectId: string, paths: string[]) => Promise<void>
}

export type DeleteResult =
  | { status: 200; deleted: true; filesRemoved: number; notConfirmed: string[] }
  | { status: 404; deleted: false; reason: "not_found" }
  | { status: 403; deleted: false; reason: "not_owner" }
  | { status: 409; deleted: false; reason: "not_deleted" }

export async function deleteCaptureWithFiles(userId: string, captureId: string, d: DeleteDeps): Promise<DeleteResult> {
  const row = await d.readCapture(captureId)
  if (!row) return { status: 404, deleted: false, reason: "not_found" } // already deleted, or not visible to this person
  const owner = await d.readProjectOwner(row.project_id)
  if (!owner || owner !== userId) return { status: 403, deleted: false, reason: "not_owner" }
  const paths = photoPathsForCaptures([{ image_url: row.image_url, image_urls: row.image_urls }])
  if (!(await d.deleteRow(captureId))) return { status: 409, deleted: false, reason: "not_deleted" }
  let notConfirmed = paths
  try {
    notConfirmed = paths.length > 0 ? (await d.removeFiles(paths)).notConfirmed : []
  } catch {
    notConfirmed = paths
  }
  if (notConfirmed.length > 0) {
    try {
      await d.recordUnremoved(row.project_id, notConfirmed)
    } catch {
      // the record is deleted either way; the caller is told which files were not confirmed
    }
  }
  return { status: 200, deleted: true, filesRemoved: paths.length - notConfirmed.length, notConfirmed }
}
