import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { mayReclaim, runReminders, sendingEnabled, type ReminderProject } from "../../../lib/follow-up-reminders"

/**
 * Daily job for opt-in follow-up reminders to project owners (see lib/follow-up-reminders.ts).
 * Requires the cron secret. Sends only when FOLLOWUP_REMINDERS_SEND is exactly "true"; otherwise it reports what it would
 * send and writes nothing. Needs supabase-migration-v18; without it there are no opted-in projects to read.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const send = sendingEnabled(process.env.FOLLOWUP_REMINDERS_SEND)
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")
  const resend = send ? new Resend(process.env.RESEND_API_KEY) : null

  const result = await runReminders(
    {
      candidates: async () => {
        const { data, error } = await db
          .from("projects")
          .select("id, user_id, project_name, follow_up_on, reminder_opt_in, reminder_tz")
          .eq("reminder_opt_in", true)
          .not("follow_up_on", "is", null)
          .limit(500)
        return error || !Array.isArray(data) ? [] : (data as ReminderProject[])
      },
      claim: async (projectId, date) => {
        const ins = await db.from("follow_up_reminder_sends").insert({ project_id: projectId, follow_up_on: date, status: "claimed", attempts: 1 }).select("project_id")
        if (!ins.error && ins.data?.length === 1) return "claimed"
        if (ins.error?.code !== "23505") return "skip"
        // Already claimed: re-open a failed one, or one left "claimed" for over 30 minutes (a run that stopped mid-send),
        // while attempts remain. The attempts match makes it one-winner; the same idempotency key makes a re-send of an
        // already accepted message a no-op at the provider within 24 hours.
        const { data: row } = await db.from("follow_up_reminder_sends").select("status, attempts, updated_at").eq("project_id", projectId).eq("follow_up_on", date).maybeSingle()
        if (!row || !mayReclaim(row, Date.now())) return "skip"
        const upd = await db
          .from("follow_up_reminder_sends")
          .update({ status: "claimed", attempts: row.attempts + 1, updated_at: new Date().toISOString() })
          .eq("project_id", projectId).eq("follow_up_on", date).eq("status", row.status).eq("attempts", row.attempts)
          .select("project_id")
        return !upd.error && upd.data?.length === 1 ? "claimed" : "skip"
      },
      ownerEmail: async (userId) => {
        const { data } = await db.auth.admin.getUserById(userId)
        return data?.user?.email_confirmed_at && data.user.email ? data.user.email : null
      },
      send: async (msg, idempotencyKey) => {
        const { data, error } = await (resend as Resend).emails.send({ from: process.env.RESEND_FROM_EMAIL || "", ...msg }, { idempotencyKey })
        if (error || !data?.id) throw new Error(error?.message || "provider did not accept the message")
        return { id: data.id }
      },
      markSent: async (projectId, date, providerId) => {
        await db.from("follow_up_reminder_sends").update({ status: "sent", provider_message_id: providerId, last_error: null, updated_at: new Date().toISOString() }).eq("project_id", projectId).eq("follow_up_on", date)
      },
      markFailed: async (projectId, date, err) => {
        await db.from("follow_up_reminder_sends").update({ status: "failed", last_error: err, updated_at: new Date().toISOString() }).eq("project_id", projectId).eq("follow_up_on", date)
      },
    },
    { now: new Date(), send, siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://supplementsnap.io" },
  )
  // Counts only (no addresses or project names), so each run is visible in the runtime logs
  console.log(JSON.stringify({ job: "follow-up-reminders", sending: send, ...result }))
  return NextResponse.json({ sending: send, ...result }, { headers: { "Cache-Control": "no-store" } })
}
