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
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      // Portal failed silently
    } finally {
      setPortalLoading(false)
    }
  }

  if (authLoading || !user) return null

  const isActive = hasActiveSubscription(subscriptionStatus)
  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "there"

  const statusLabel: Record<string, { text: string; color: string }> = {
    active: { text: "Active", color: "bg-green-50 text-green-700" },
    trialing: { text: "Trial", color: "bg-blue-50 text-blue-700" },
    past_due: { text: "Past Due", color: "bg-amber-50 text-amber-700" },
    canceled: { text: "Canceled", color: "bg-red-50 text-red-600" },
    inactive: { text: "No Plan", color: "bg-zinc-100 text-zinc-600" },
  }
  const badge = statusLabel[subscriptionStatus] || statusLabel.inactive

  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
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

      <main className="mx-auto max-w-3xl px-6 py-10">
        <Suspense fallback={null}>
          <LockedBanner />
        </Suspense>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Your Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">Welcome back, {userName}</p>
        </div>

        {/* Subscription status card */}
        {!subscriptionLoading && (
          <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Subscription</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-900">Starter Plan</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.color}`}>
                    {badge.text}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {isActive ? (
                  <button
                    onClick={openBillingPortal}
                    disabled={portalLoading}
                    className="rounded-lg border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                  >
                    {portalLoading ? "Loading..." : "Manage Billing"}
                  </button>
                ) : (
                  <Link
                    href="/pricing"
                    className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                  >
                    Subscribe
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Paywall message */}
        {!subscriptionLoading && !isActive && (
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
            <p className="text-sm font-medium text-amber-800">
              An active subscription is required to use Supplement Snap.
            </p>
            <Link
              href="/pricing"
              className="mt-3 inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              View Plans
            </Link>
          </div>
        )}

        {/* Projects section — only show if subscribed */}
        {isActive && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">Your Projects</h2>
              <Link
                href="/app"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                + New Project
              </Link>
            </div>

            {loadingProjects ? (
              <div className="flex items-center gap-2 py-12 justify-center text-zinc-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                <span className="text-sm">Loading projects...</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
                <svg className="mx-auto h-10 w-10 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <h3 className="mt-3 text-sm font-semibold text-zinc-900">No projects yet</h3>
                <p className="mt-1 text-sm text-zinc-500">Create your first project to start capturing damage.</p>
                <Link
                  href="/app"
                  className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Create Project
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/app?project=${p.id}`}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-indigo-200 hover:shadow-md"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">{p.project_name}</h3>
                      <p className="mt-0.5 text-xs text-zinc-500">{p.property_address || "No address"}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
                        <span>{p.capture_count} capture{p.capture_count !== 1 ? "s" : ""}</span>
                        <span>{new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-indigo-600">Open &rarr;</span>
                  </Link>
                ))}
              </div>
            )}
          </>
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
