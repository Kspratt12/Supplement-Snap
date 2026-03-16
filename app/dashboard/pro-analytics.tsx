"use client"

import { useState, useEffect } from "react"

type ActivityItem = {
  id: string
  action: string
  details: string | null
  created_at: string
}

type EmailRecord = {
  id: string
  recipient_email: string
  subject: string
  sent_at: string
  opened_at: string | null
  open_count: number
}

export function ProAnalytics({ userId, projectCount, captureCount, reportCount }: {
  userId: string
  projectCount: number
  captureCount: number
  reportCount: number
}) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [emails, setEmails] = useState<EmailRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [actRes, emailRes] = await Promise.all([
        fetch(`/api/activity-log?userId=${userId}&limit=10`),
        fetch(`/api/email-track/status?projectId=all&userId=${userId}`),
      ])
      const actData = await actRes.json()
      const emailData = await emailRes.json()
      setActivities(actData.activities || [])
      setEmails(emailData.records || [])
    } catch {
      // Fail silently
    }
    setLoading(false)
  }

  const emailsOpened = emails.filter(e => e.opened_at).length
  const emailsSent = emails.length

  // Estimate supplement value documented (avg $2,400 per report)
  const estimatedValue = reportCount * 2400

  return (
    <div className="space-y-4">
      {/* Pro Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-indigo-600">{projectCount}</p>
          <p className="mt-1 text-xs text-zinc-500">Total Projects</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-indigo-600">{captureCount}</p>
          <p className="mt-1 text-xs text-zinc-500">Captures</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-green-600">{reportCount}</p>
          <p className="mt-1 text-xs text-zinc-500">Reports Sent</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-green-600">${estimatedValue.toLocaleString()}</p>
          <p className="mt-1 text-xs text-zinc-500">Est. Documented</p>
        </div>
      </div>

      {/* Email Tracking Summary */}
      {emailsSent > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900">Adjuster Email Tracking</h3>
          <div className="mt-3 flex items-center gap-6">
            <div>
              <p className="text-xl font-bold text-zinc-900">{emailsSent}</p>
              <p className="text-xs text-zinc-500">Sent</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{emailsOpened}</p>
              <p className="text-xs text-zinc-500">Opened</p>
            </div>
            <div>
              <p className="text-xl font-bold text-amber-600">{emailsSent - emailsOpened}</p>
              <p className="text-xs text-zinc-500">Not Opened</p>
            </div>
          </div>
          {emails.length > 0 && (
            <div className="mt-4 space-y-2">
              {emails.slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-center justify-between text-xs">
                  <div className="min-w-0 truncate text-zinc-600">
                    {e.recipient_email} — {e.subject}
                  </div>
                  <span className={`flex-shrink-0 ml-2 rounded-full px-2 py-0.5 font-medium ${
                    e.opened_at
                      ? "bg-green-50 text-green-700"
                      : "bg-zinc-100 text-zinc-500"
                  }`}>
                    {e.opened_at ? `Opened ${e.open_count}x` : "Not opened"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Activity */}
      {!loading && activities.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900">Recent Activity</h3>
          <div className="mt-3 space-y-2">
            {activities.map((a) => (
              <div key={a.id} className="flex items-start gap-2.5 text-xs">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="font-medium text-zinc-700">{a.action}</span>
                  {a.details && <span className="text-zinc-400"> — {a.details}</span>}
                </div>
                <span className="flex-shrink-0 text-zinc-400 ml-auto">
                  {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
