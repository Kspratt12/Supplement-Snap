"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "../../lib/supabase"
import { useAuth, hasActiveSubscription } from "../../lib/auth-context"

type ProjectWithCount = {
  id: string
  project_name: string
  property_address: string
  created_at: string
  capture_count: number
}

export default function DashboardPage() {
  const { user, loading: authLoading, signOut, subscriptionStatus, subscriptionLoading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectWithCount[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    loadProjects()
  }, [user])

  async function loadProjects() {
    setLoadingProjects(true)
    const { data: projectsData } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })

    if (!projectsData) {
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
      if (data.url) window.location.href = data.url
    } catch {
      // Portal failed
    } finally {
      setPortalLoading(false)
    }
  }

  if (authLoading || !user) return null

  const isActive = hasActiveSubscription(subscriptionStatus)
  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "there"

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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</div>
            <span className="text-lg font-bold tracking-tight text-zinc-900">Supplement Snap</span>
          </Link>
          <div className="flex items-center gap-4">
            {isActive && (
              <Link href="/app" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">Open App</Link>
            )}
            <button
              onClick={async () => { await signOut(); router.push("/") }}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Locked banner */}
        <Suspense fallback={null}>
          <LockedBanner />
        </Suspense>

        {/* 1. Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Your Projects</h1>
            <p className="mt-1 text-sm text-zinc-500">Manage roofing supplement documentation.</p>
          </div>
          {isActive ? (
            <Link
              href="/app"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Create Project
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-400 cursor-not-allowed">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Create Project
            </span>
          )}
        </div>

        {/* Top row: Subscription + Quick Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {/* 2. Subscription card */}
          {!subscriptionLoading && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Plan</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-base font-bold text-zinc-900">Starter</span>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.color}`}>
                  {badge.text}
                </span>
              </div>
              {isActive && (
                <p className="mt-1 text-xs text-zinc-400">$49/mo after setup</p>
              )}
              <div className="mt-4 flex gap-2">
                {isActive ? (
                  <>
                    <Link
                      href="/app"
                      className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                    >
                      Open App
                    </Link>
                    <button
                      onClick={openBillingPortal}
                      disabled={portalLoading}
                      className="rounded-lg border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                    >
                      {portalLoading ? "Loading..." : "Manage Billing"}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/pricing"
                      className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                    >
                      Start Subscription
                    </Link>
                    <Link
                      href="/pricing"
                      className="rounded-lg border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      View Plans
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 4. Quick Actions */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Quick Actions</p>
            <div className="mt-3 space-y-2">
              {isActive ? (
                <Link
                  href="/app"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                  Capture Damage
                </Link>
              ) : (
                <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400">
                  <svg className="h-5 w-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Capture Damage
                  <span className="ml-auto text-xs text-zinc-300">Locked</span>
                </div>
              )}
              <Link
                href={isActive ? "/app" : "/pricing"}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Report
              </Link>
              <Link
                href="/pricing"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
                View Pricing
              </Link>
            </div>
          </div>
        </div>

        {/* 5. Locked paywall */}
        {!subscriptionLoading && !isActive && (
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
            <svg className="mx-auto h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <p className="mt-3 text-sm font-medium text-amber-800">
              An active subscription is required to capture damage and generate supplement reports.
            </p>
            <Link
              href="/pricing"
              className="mt-4 inline-block rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Start Subscription
            </Link>
          </div>
        )}

        {/* 3. Projects list */}
        {isActive && (
          <>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-zinc-900">Recent Projects</h2>
            </div>

            {loadingProjects ? (
              <div className="flex items-center gap-2 py-12 justify-center text-zinc-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                <span className="text-sm">Loading projects...</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
                <svg className="mx-auto h-10 w-10 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <h3 className="mt-3 text-sm font-semibold text-zinc-900">No projects yet</h3>
                <p className="mt-1 text-sm text-zinc-500">Create your first project to start capturing damage.</p>
                <Link
                  href="/app"
                  className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Create Your First Project
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">{p.project_name}</h3>
                      <p className="mt-0.5 text-xs text-zinc-500">{p.property_address || "No address"}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
                        <span>{p.capture_count} capture{p.capture_count !== 1 ? "s" : ""}</span>
                        <span>{new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/app?project=${p.id}`}
                        className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                      >
                        Open Project
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Welcome note for new users */}
        {!subscriptionLoading && isActive && !loadingProjects && projects.length > 0 && (
          <p className="mt-6 text-center text-xs text-zinc-400">
            Welcome back, {userName}. You have {projects.length} project{projects.length !== 1 ? "s" : ""}.
          </p>
        )}
      </main>
    </div>
  )
}

function LockedBanner() {
  const searchParams = useSearchParams()
  if (searchParams.get("locked") !== "1") return null

  return (
    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-center">
      <p className="text-sm font-medium text-red-700">
        An active subscription is required to use Supplement Snap.
      </p>
      <p className="mt-1 text-xs text-red-500">
        Your account is set up, but app access is locked until you have an active plan.
      </p>
      <Link
        href="/pricing"
        className="mt-3 inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        Start Subscription
      </Link>
    </div>
  )
}
