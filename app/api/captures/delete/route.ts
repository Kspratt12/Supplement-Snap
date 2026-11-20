import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getAuthenticatedUser } from "../../../../lib/auth-utils"
import { deleteCaptureWithFiles } from "../../../../lib/capture-delete"
import { removePhotoFiles } from "../../../../lib/storage-paths"

const BUCKET = "test-uploads"
const NO_STORE = { "Cache-Control": "no-store" }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * POST { captureId } — the project owner deletes one finding and its photo files.
 * Permission is read as the caller (their token, the row rules). The service key is used only to remove the files the
 * finding's own record lists, after the record is deleted, and to note any file whose removal was not confirmed.
 */
export async function POST(request: Request) {
  const authed = await getAuthenticatedUser(request)
  const header = request.headers.get("Authorization") || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : ""
  if (!authed || !token) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE })

  let captureId = ""
  try {
    const body = await request.json()
    captureId = typeof body?.captureId === "string" ? body.captureId : ""
  } catch {
    // handled below
  }
  if (!UUID.test(captureId)) return NextResponse.json({ error: "Bad request" }, { status: 400, headers: NO_STORE })

  const asUser = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const service = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

  const result = await deleteCaptureWithFiles(authed.id, captureId, {
    readCapture: async (id) => {
      const { data, error } = await asUser.from("captures").select("id, project_id, image_url, image_urls").eq("id", id).maybeSingle()
      return error ? null : (data as never)
    },
    readProjectOwner: async (projectId) => {
      const { data, error } = await asUser.from("projects").select("user_id").eq("id", projectId).maybeSingle()
      return error || !data ? null : ((data as { user_id: string }).user_id ?? null)
    },
    deleteRow: async (id) => {
      const { data, error } = await asUser.from("captures").delete().eq("id", id).select("id")
      return !error && Array.isArray(data) && data.length === 1
    },
    removeFiles: (paths) => removePhotoFiles(service().storage.from(BUCKET), paths),
    recordUnremoved: async (projectId, paths) => {
      await service().from("activity_log").insert({ user_id: authed.id, project_id: projectId, action: "Photo files not confirmed removed", details: paths.join(", ").slice(0, 1500) })
    },
  })
  return NextResponse.json(result, { status: result.status, headers: NO_STORE })
}
