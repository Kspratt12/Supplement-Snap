import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getAuthenticatedUser } from "../../../lib/auth-utils"
import { decidePhotoAccess, PHOTO_URL_TTL_SECONDS, MAX_URLS_PER_REQUEST, type PhotoReader } from "../../../lib/photo-access-core"

const BUCKET = "test-uploads"
const NO_STORE = { "Cache-Control": "no-store" }

/**
 * POST { urls: string[], projectId?: string }
 * Returns short-lived links for the stored files the signed-in user is allowed to see.
 *
 * The permission check runs as the user (their own token, the database's row rules), not with the service key, so the
 * existing owner and read-only team rules decide. The service key is used for one thing only: creating the links, after
 * the decision.
 */
export async function POST(request: Request) {
  const authed = await getAuthenticatedUser(request)
  const header = request.headers.get("Authorization") || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : ""
  if (!authed || !token) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE })

  let body: { urls?: unknown; projectId?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400, headers: NO_STORE })
  }
  const urls = Array.isArray(body.urls) ? body.urls.filter((u): u is string => typeof u === "string") : null
  if (!urls || urls.length === 0 || urls.length > MAX_URLS_PER_REQUEST) {
    return NextResponse.json({ error: "Bad request" }, { status: 400, headers: NO_STORE })
  }
  const projectId = typeof body.projectId === "string" ? body.projectId : null

  const asUser = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const reader: PhotoReader = {
    projectDiagramUrl: async (id) => {
      const { data, error } = await asUser.from("projects").select("id, diagram_url").eq("id", id).maybeSingle()
      if (error || !data) return { visible: false, diagramUrl: null }
      return { visible: true, diagramUrl: (data as { diagram_url?: string | null }).diagram_url ?? null }
    },
    projectPhotoUrls: async (id) => {
      const { data, error } = await asUser.from("captures").select("image_url, image_urls").eq("project_id", id)
      if (error || !Array.isArray(data)) return []
      return (data as Array<{ image_url?: string | null; image_urls?: string[] | null }>).flatMap((r) => [r.image_url, ...(Array.isArray(r.image_urls) ? r.image_urls : [])])
    },
    ownLogoUrl: async () => {
      const { data } = await asUser.from("company_settings").select("logo_url").eq("user_id", authed.id).maybeSingle()
      return (data as { logo_url?: string | null } | null)?.logo_url ?? null
    },
  }

  const decision = await decidePhotoAccess({ reader, projectId, urls })
  const signed: Record<string, string> = {}

  if (decision.allowed.length > 0) {
    const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")
    const { data, error } = await service.storage.from(BUCKET).createSignedUrls(decision.allowed.map((a) => a.path), PHOTO_URL_TTL_SECONDS)
    if (error || !Array.isArray(data)) {
      return NextResponse.json({ error: "Could not create links" }, { status: 502, headers: NO_STORE })
    }
    const byPath = new Map(data.map((d) => [d.path, d.signedUrl]))
    for (const a of decision.allowed) {
      const link = byPath.get(a.path)
      if (link) signed[a.url] = link
    }
  }

  return NextResponse.json(
    { signed, denied: decision.denied.map((d) => d.url), expiresIn: PHOTO_URL_TTL_SECONDS },
    { headers: NO_STORE },
  )
}
