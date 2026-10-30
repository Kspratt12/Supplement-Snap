import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "../../../lib/auth-utils"
import { getAccess, can } from "../../../lib/plan"
import { buildXactimateCsv } from "../../../lib/xactimate-csv"

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!can.xactimateExport(await getAccess(user.id, user.email))) {
    return NextResponse.json({ error: "Xactimate export is available on the Team and Pro plans." }, { status: 403 })
  }

  try {
    const { projectName, propertyAddress, captures } = await request.json()

    if (!Array.isArray(captures) || captures.length === 0) {
      return NextResponse.json({ error: "No captures to export" }, { status: 400 })
    }

    const csv = buildXactimateCsv({ projectName, propertyAddress, captures })

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${(projectName || "project").replace(/[^a-zA-Z0-9]/g, "_")}_xactimate.csv"`,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Export failed" }, { status: 500 })
  }
}
