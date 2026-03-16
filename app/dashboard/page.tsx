"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "../../lib/supabase"
import { useAuth, hasActiveSubscription } from "../../lib/auth-context"
import { OnboardingChecklist } from "./onboarding-checklist"
import { QuickVoiceRecord, QuickPhotoCapture } from "./quick-capture"
import { TeamManager } from "./team-manager"
import { ProAnalytics } from "./pro-analytics"
import { AdjusterContacts } from "./adjuster-contacts"
import { CompanySettings } from "./company-settings"

type ProjectWithCount = {
  id: string
  project_name: string
  property_address: string
  created_at: string
  capture_count: number
  insurance_company?: string
  claim_number?: string
  claim_status?: string
  adjuster_name?: string
  date_of_loss?: string
}

export default function DashboardPage() {
  const { user, loading: authLoading, signOut, subscriptionStatus, subscriptionLoading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectWithCount[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [hasSentReport, setHasSentReport] = useState(false)
  const [reportCount, setReportCount] = useState(0)
  const [showSubModal, setShowSubModal] = useState(false)
  const [showSampleReport, setShowSampleReport] = useState(false)
  const [showVoiceRecord, setShowVoiceRecord] = useState(false)
  const [showPhotoCapture, setShowPhotoCapture] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [emailOpens, setEmailOpens] = useState(0)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    loadProjects()
  }, [user])

  async function loadProjects() {
    setLoadingProjects(true)

    // Own projects
    const { data: ownData } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })

    // Team projects (where user is a member)
    let teamData: typeof ownData = []
    try {
      const { data: memberships } = await supabase
        .from("team_members")
        .select("owner_id")
        .eq("member_email", user!.email)
        .eq("status", "active")

      if (memberships && memberships.length > 0) {
        const ownerIds = memberships.map(m => m.owner_id)
        const { data: shared } = await supabase
          .from("projects")
          .select("*")
          .in("user_id", ownerIds)
          .order("created_at", { ascending: false })
        teamData = shared || []
      }
    } catch {
      // team_members table may not exist
    }

    // Merge and deduplicate
    const allProjects = [...(ownData || []), ...(teamData || [])]
    const projectsData = allProjects.filter((p, i) => allProjects.findIndex(x => x.id === p.id) === i)

    if (projectsData.length === 0) {
      setLoadingProjects(false)
      return
    }

    const projectsWithCounts: ProjectWithCount[] = []
    for (const p of projectsData) {
      const { count } = await supabase
        .from("captures")
        .select("*", { count: "exact", head: true })
        .eq("project_id", p.id)
      projectsWithCounts.push({ ...p, capture_count: count || 0 })
    }

    setProjects(projectsWithCounts)

    if (projectsData.length > 0) {
      const projectIds = projectsData.map((p: { id: string }) => p.id)
      const { count: sentCount } = await supabase
        .from("captures")
        .select("*", { count: "exact", head: true })
        .in("project_id", projectIds)
        .in("status", ["Sent", "Ready to Send"])
      const sc = sentCount || 0
      setHasSentReport(sc > 0)
      setReportCount(sc)
    }

    // Check email opens (scoped to user)
    try {
      const { count } = await supabase
        .from("email_tracking")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .gt("open_count", 0)
      setEmailOpens(count || 0)
    } catch {
      // email_tracking table may not exist yet
    }

    setLoadingProjects(false)
  }

  async function openBillingPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert("Unable to open billing portal. Please contact support.")
      }
    } catch {
      alert("Unable to open billing portal. Please try again.")
    } finally {
      setPortalLoading(false)
    }
  }

  if (authLoading || !user) return null

  const isActive = hasActiveSubscription(subscriptionStatus)
  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "there"
  const totalCaptures = projects.reduce((sum, p) => sum + p.capture_count, 0)
  const hasAnyData = projects.length > 0 || totalCaptures > 0 || reportCount > 0

  const statusBadge: Record<string, { text: string; color: string }> = {
    active: { text: "Active", color: "bg-green-50 text-green-700 border-green-200" },
    trialing: { text: "Trial", color: "bg-blue-50 text-blue-700 border-blue-200" },
    past_due: { text: "Past Due", color: "bg-amber-50 text-amber-700 border-amber-200" },
    canceled: { text: "Canceled", color: "bg-red-50 text-red-600 border-red-200" },
    inactive: { text: "Inactive", color: "bg-zinc-100 text-zinc-500 border-zinc-200" },
  }
  const badge = statusBadge[subscriptionStatus] || statusBadge.inactive

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Nav */}
      <nav className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</div>
            <span className="text-lg font-bold tracking-tight text-zinc-900">Supplement Snap</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/app" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">{isActive ? "My Projects" : "Open App"}</Link>
            <button
              onClick={async () => { await signOut(); router.push("/") }}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
        {/* Banners */}
        <Suspense fallback={null}>
          <ResetSuccessBanner />
        </Suspense>

        {/* Header with plan badge */}
        <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">Welcome{hasAnyData ? " back" : ""}, {userName}</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {isActive ? "Ready to capture damage and generate reports." : "Try your free project or upgrade to unlock everything."}
            </p>
          </div>
          {!subscriptionLoading && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.color}`}>
                {badge.text}
              </span>
              {isActive && (
                <button
                  onClick={openBillingPortal}
                  disabled={portalLoading}
                  className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50 transition-colors"
                >
                  {portalLoading ? "..." : "Billing"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── MAIN ACTION BUTTONS (mobile-first, big tap targets) ── */}
        {isActive && (
          <div className="mb-6 sm:mb-8 grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowPhotoCapture(true)}
              className="flex flex-col items-center gap-2 rounded-xl bg-indigo-600 px-4 py-5 sm:py-6 text-white shadow-md hover:bg-indigo-500 active:bg-indigo-700"
            >
              <svg className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              <span className="text-sm sm:text-base font-semibold">Take Photo</span>
            </button>
            <button
              onClick={() => setShowVoiceRecord(true)}
              className="flex flex-col items-center gap-2 rounded-xl bg-white border-2 border-indigo-600 px-4 py-5 sm:py-6 text-indigo-600 shadow-md hover:bg-indigo-50 active:bg-indigo-100"
            >
              <svg className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
              <span className="text-sm sm:text-base font-semibold">Voice Note</span>
            </button>
          </div>
        )}

        {/* Onboarding checklist */}
        {!subscriptionLoading && !loadingProjects && (
          <>
            <OnboardingChecklist
              isActive={isActive}
              hasProjects={projects.length > 0}
              hasCaptures={projects.some((p) => p.capture_count > 0)}
              hasSentReport={hasSentReport}
            />
            {!isActive && (
              <p className="mb-6 -mt-4 text-center text-sm text-zinc-400">
                Start your subscription to begin capturing roof damage and generating supplement reports.
              </p>
            )}
          </>
        )}

        {/* Activity Overview — only show when user has data */}
        {!subscriptionLoading && !loadingProjects && isActive && hasAnyData && (
          <div className="mb-6 sm:mb-8">
            <h2 className="mb-3 text-sm font-semibold text-zinc-500">Your Activity</h2>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm text-center">
                <p className="text-2xl sm:text-3xl font-bold text-zinc-900">{projects.length}</p>
                <p className="mt-1 text-xs sm:text-sm text-zinc-500">Projects</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm text-center">
                <p className="text-2xl sm:text-3xl font-bold text-zinc-900">{totalCaptures}</p>
                <p className="mt-1 text-xs sm:text-sm text-zinc-500">Captures</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm text-center">
                <p className="text-2xl sm:text-3xl font-bold text-zinc-900">{reportCount}</p>
                <p className="mt-1 text-xs sm:text-sm text-zinc-500">Reports</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm text-center">
                <p className={`text-2xl sm:text-3xl font-bold ${emailOpens > 0 ? "text-green-600" : "text-zinc-900"}`}>{emailOpens}</p>
                <p className="mt-1 text-xs sm:text-sm text-zinc-500">Emails Opened</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions — only non-duplicate items */}
        {isActive && (
          <div className="mb-6 sm:mb-8 grid grid-cols-2 gap-3">
            <Link
              href={projects.length > 0 ? `/app?project=${projects[0].id}` : "/app"}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 min-h-[52px] text-sm font-medium text-zinc-700 shadow-sm hover:border-indigo-200 hover:shadow-md active:bg-zinc-50 transition-all"
            >
              <svg className="h-5 w-5 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Report
            </Link>
            <button
              onClick={() => setShowSampleReport(true)}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 min-h-[52px] text-sm font-medium text-zinc-700 shadow-sm hover:border-indigo-200 hover:shadow-md active:bg-zinc-50 transition-all"
            >
              <svg className="h-5 w-5 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Sample Report
            </button>
          </div>
        )}

        {/* Free tier — try the app */}
        {!subscriptionLoading && !isActive && (
          <div className="mb-6 sm:mb-8 grid grid-cols-2 gap-3">
            <Link
              href="/app"
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 min-h-[52px] text-sm font-medium text-zinc-700 shadow-sm hover:border-indigo-200 hover:shadow-md active:bg-zinc-50 transition-all"
            >
              <svg className="h-5 w-5 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              Try Free Project
            </Link>
            <button
              onClick={() => setShowSampleReport(true)}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 min-h-[52px] text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 active:bg-zinc-100"
            >
              <svg className="h-5 w-5 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Sample Report
            </button>
          </div>
        )}

        {/* Upgrade prompt for free users */}
        {!subscriptionLoading && !isActive && (
          <div className="mb-6 sm:mb-8 rounded-xl border border-indigo-200 bg-indigo-50 p-5 sm:p-6 text-center">
            <p className="text-sm font-medium text-indigo-800">
              You&apos;re on the free plan. Upgrade to unlock unlimited projects, PDF downloads, and email reports.
            </p>
            <Link
              href="/pricing"
              className="mt-3 inline-flex items-center rounded-lg bg-indigo-600 px-6 min-h-[44px] text-sm font-semibold text-white hover:bg-indigo-500"
            >
              See Plans
            </Link>
          </div>
        )}

        {/* Projects list */}
        {isActive && (
          <>
          {/* Claim Pipeline */}
          {projects.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h2 className="mb-3 text-sm font-semibold text-zinc-500">Claim Pipeline</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { status: "In Progress", color: "bg-blue-50 border-blue-200 text-blue-700" },
                  { status: "Ready to Submit", color: "bg-amber-50 border-amber-200 text-amber-700" },
                  { status: "Submitted", color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
                  { status: "Approved", color: "bg-green-50 border-green-200 text-green-700" },
                ].map(({ status, color }) => {
                  const count = projects.filter(p => (p.claim_status || "In Progress") === status).length
                  return (
                    <div key={status} className={`rounded-xl border p-3 sm:p-4 text-center ${color}`}>
                      <p className="text-xl sm:text-2xl font-bold">{count}</p>
                      <p className="mt-0.5 text-xs font-medium">{status}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-zinc-900">Your Projects</h2>
              <div className="flex gap-2">
                {projects.length > 0 && (
                  <div className="relative flex-1 sm:flex-none">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search projects..."
                      className="w-full sm:w-48 rounded-lg border border-zinc-300 bg-white pl-9 pr-3 min-h-[44px] text-sm text-zinc-900 placeholder:text-zinc-400"
                    />
                  </div>
                )}
                <Link
                  href="/app"
                  className="rounded-lg bg-indigo-600 px-4 min-h-[44px] flex items-center text-sm font-medium text-white hover:bg-indigo-500 flex-shrink-0"
                >
                  + New Project
                </Link>
              </div>
            </div>

            {loadingProjects ? (
              <div className="flex items-center gap-2 py-12 justify-center text-zinc-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                <span className="text-sm">Loading projects...</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-10 sm:py-12 text-center">
                <svg className="mx-auto h-10 w-10 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <h3 className="mt-3 text-sm sm:text-base font-semibold text-zinc-900">No projects yet</h3>
                <p className="mt-1 text-sm text-zinc-500">Tap <strong>+ New Project</strong> above to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.filter((p) => {
                  if (!searchQuery.trim()) return true
                  const q = searchQuery.toLowerCase()
                  return p.project_name.toLowerCase().includes(q) || (p.property_address || "").toLowerCase().includes(q)
                }).map((p) => (
                  <Link
                    key={p.id}
                    href={`/app?project=${p.id}`}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all active:bg-zinc-50"
                  >
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-zinc-900 truncate">{p.project_name}</h3>
                      <p className="mt-0.5 text-xs sm:text-sm text-zinc-500 truncate">{p.property_address || "No address"}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                        <span>{p.capture_count} capture{p.capture_count !== 1 ? "s" : ""}</span>
                        <span>{new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        {p.insurance_company && (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-500">{p.insurance_company}</span>
                        )}
                        {p.claim_status && p.claim_status !== "In Progress" && (
                          <span className={`rounded-full px-2 py-0.5 font-medium ${
                            p.claim_status === "Approved" ? "bg-green-50 text-green-600" :
                            p.claim_status === "Submitted" ? "bg-indigo-50 text-indigo-600" :
                            p.claim_status === "Ready to Submit" ? "bg-amber-50 text-amber-600" :
                            "bg-zinc-100 text-zinc-500"
                          }`}>{p.claim_status}</span>
                        )}
                      </div>
                    </div>
                    <svg className="h-5 w-5 text-zinc-300 flex-shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pro Features Section */}
        {isActive && user && (
          <div className="mt-6 sm:mt-8 space-y-4">
            {/* Pro Analytics */}
            {hasAnyData && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-zinc-500">Pro Insights</h2>
                <ProAnalytics
                  userId={user.id}
                  projectCount={projects.length}
                  captureCount={totalCaptures}
                  reportCount={reportCount}
                />
              </div>
            )}

            {/* Team + Contacts + Branding */}
            <div className="grid gap-4 sm:grid-cols-2 items-start">
              <div className="space-y-4">
                <TeamManager userId={user.id} />
                <AdjusterContacts userId={user.id} />
              </div>
              <CompanySettings userId={user.id} />
            </div>
          </div>
        )}

        {/* Subscription Required Modal */}
        {showSubModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
            <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl bg-white p-6 shadow-xl">
              <h2 className="text-lg font-bold text-zinc-900">Subscription Required</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Activate your subscription to start capturing damage and generating supplement reports.
              </p>
              <div className="mt-6 flex gap-3">
                <Link
                  href="/pricing"
                  className="flex-1 rounded-lg bg-indigo-600 px-4 min-h-[48px] flex items-center justify-center text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Start Subscription
                </Link>
                <button
                  onClick={() => setShowSubModal(false)}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 min-h-[48px] text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sample Report Modal */}
        {showSampleReport && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
            <div className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-xl bg-white shadow-xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white px-5 sm:px-6 py-4 rounded-t-2xl sm:rounded-t-xl">
                <h2 className="text-base sm:text-lg font-bold text-zinc-900">Sample Report</h2>
                <button
                  onClick={() => setShowSampleReport(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-100"
                >
                  <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-5 sm:px-6 py-4">
                <p className="text-sm leading-relaxed text-zinc-500">
                  This is what your supplement report looks like when sent to an adjuster.
                </p>
              </div>

              <div className="mx-5 sm:mx-6 mb-6 overflow-hidden rounded-xl border border-zinc-200">
                <div className="bg-indigo-600 px-5 py-3">
                  <p className="text-xs font-semibold text-white tracking-wide">Supplement Snap — Project Report</p>
                </div>
                <div className="px-4 sm:px-5 py-5">
                  <p className="text-sm font-bold text-zinc-900">Smith Residence</p>
                  <p className="mt-1 text-xs text-zinc-500">742 Evergreen Terrace, Springfield</p>
                  <p className="text-xs text-zinc-500">Inspection Date: March 12, 2026</p>

                  <div className="mt-4 h-px bg-zinc-200" />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">Findings</p>

                  <div className="mt-3 space-y-4">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">1</span>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">Decking — Front Slope</p>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                          Three sheets of rotted OSB decking discovered along the eave edge during tear-off. Damage was concealed beneath existing shingles.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">2</span>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">Flashing — Chimney</p>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                          Step flashing severely corroded with multiple separation points. Not visible prior to shingle removal.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">3</span>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">Ice &amp; Water Shield — Valley</p>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                          No ice and water shield membrane present in the main valley. Current building code requires installation.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 h-px bg-zinc-200" />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">Supporting Photos</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="aspect-square rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 border border-zinc-200" />
                    <div className="aspect-square rounded-lg bg-gradient-to-br from-red-100 to-red-50 border border-zinc-200" />
                    <div className="aspect-square rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 border border-zinc-200" />
                  </div>

                  <div className="mt-4 h-px bg-zinc-200" />
                  <div className="mt-4 rounded-lg bg-zinc-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Summary</p>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                      3 supplement items documented during tear-off. Documentation and photos ready for adjuster review.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-100 px-5 sm:px-6 py-4">
                <button
                  onClick={() => setShowSampleReport(false)}
                  className="w-full rounded-lg border border-zinc-300 bg-white min-h-[48px] text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Voice Record Modal */}
        {user && (
          <QuickVoiceRecord
            userId={user.id}
            open={showVoiceRecord}
            onClose={() => setShowVoiceRecord(false)}
            onSaved={() => loadProjects()}
          />
        )}

        {/* Quick Photo Capture Modal */}
        {user && (
          <QuickPhotoCapture
            userId={user.id}
            open={showPhotoCapture}
            onClose={() => setShowPhotoCapture(false)}
            onSaved={() => loadProjects()}
          />
        )}

      </main>
    </div>
  )
}

function ResetSuccessBanner() {
  const searchParams = useSearchParams()
  if (searchParams.get("reset") !== "1") return null

  return (
    <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-center">
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-sm font-medium text-green-700">
        Password changed successfully
      </p>
      <p className="mt-1 text-xs text-green-600">
        A confirmation email has been sent to your inbox.
      </p>
    </div>
  )
}
