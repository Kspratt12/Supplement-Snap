"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "../../lib/auth-context"

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@supplementsnap.com"

type Totals = {
  users: number
  activeSubscriptions: number
  trialSubscriptions: number
  inactiveUsers: number
  projects: number
  captures: number
  reports: number
}

type RecentUser = {
  name: string
  email: string
  created_at: string
  subscription_status: string
}

type RecentProject = {
  project_name: string
  user_email: string
  created_at: string
  capture_count: number
}

export default function AdminPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [totals, setTotals] = useState<Totals | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      router.replace("/dashboard")
      return
    }
    loadStats()
  }, [user, authLoading, router])

  async function loadStats() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: user?.email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || `Request failed (${res.status})`)
      }
      const data = await res.json()
      setTotals(data.totals)
      setRecentUsers(data.recentUsers)
      setRecentProjects(data.recentProjects)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !user) return null
  if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null

  const statusColors: Record<string, string> = {
    active: "bg-green-50 text-green-700",
    trialing: "bg-blue-50 text-blue-700",
    past_due: "bg-amber-50 text-amber-700",
    canceled: "bg-red-50 text-red-600",
    inactive: "bg-zinc-100 text-zinc-500",
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Nav */}
      <nav className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</div>
            <span className="text-lg font-bold tracking-tight text-zinc-900">Supplement Snap</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">Dashboard</Link>
            <button
              onClick={async () => { await signOut(); router.push("/") }}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">Platform overview and activity.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-center">
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button onClick={loadStats} className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-zinc-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <span className="text-sm">Loading stats...</span>
          </div>
        ) : totals && (
          <>
            {/* Stats cards */}
            <div className="mb-8 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard label="Total Users" value={totals.users} icon={
                <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              } bgColor="bg-indigo-50" />
              <StatCard label="Active Subscriptions" value={totals.activeSubscriptions} icon={
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              } bgColor="bg-green-50" />
              <StatCard label="Total Projects" value={totals.projects} icon={
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              } bgColor="bg-amber-50" />
              <StatCard label="Total Captures" value={totals.captures} icon={
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              } bgColor="bg-blue-50" />
              <StatCard label="Reports Generated" value={totals.reports} icon={
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              } bgColor="bg-purple-50" />
            </div>

            {/* Subscription breakdown */}
            <div className="mb-8 grid gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Active</p>
                <p className="mt-2 text-2xl font-bold text-green-700">{totals.activeSubscriptions}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Trialing</p>
                <p className="mt-2 text-2xl font-bold text-blue-700">{totals.trialSubscriptions}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Inactive / No Plan</p>
                <p className="mt-2 text-2xl font-bold text-zinc-500">{totals.inactiveUsers}</p>
              </div>
            </div>

            {/* Recent Users */}
            <div className="mb-8">
              <h2 className="mb-3 text-base font-semibold text-zinc-900">Recent Users</h2>
              <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Name</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Email</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Signed Up</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-zinc-400">No users yet</td>
                      </tr>
                    ) : (
                      recentUsers.map((u, i) => (
                        <tr key={i} className="border-b border-zinc-50 last:border-0">
                          <td className="px-5 py-3 font-medium text-zinc-900">{u.name || "—"}</td>
                          <td className="px-5 py-3 text-zinc-600">{u.email}</td>
                          <td className="px-5 py-3 text-zinc-500">
                            {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[u.subscription_status] || statusColors.inactive}`}>
                              {u.subscription_status === "active" ? "Active" :
                               u.subscription_status === "trialing" ? "Trial" :
                               u.subscription_status === "past_due" ? "Past Due" :
                               u.subscription_status === "canceled" ? "Canceled" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Projects */}
            <div className="mb-8">
              <h2 className="mb-3 text-base font-semibold text-zinc-900">Recent Projects</h2>
              <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Project</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">User</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Created</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Captures</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProjects.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-zinc-400">No projects yet</td>
                      </tr>
                    ) : (
                      recentProjects.map((p, i) => (
                        <tr key={i} className="border-b border-zinc-50 last:border-0">
                          <td className="px-5 py-3 font-medium text-zinc-900">{p.project_name}</td>
                          <td className="px-5 py-3 text-zinc-600">{p.user_email}</td>
                          <td className="px-5 py-3 text-zinc-500">
                            {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td className="px-5 py-3 text-zinc-900">{p.capture_count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function StatCard({ label, value, icon, bgColor }: { label: string; value: number; icon: React.ReactNode; bgColor: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bgColor}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-zinc-900">{value}</p>
          <p className="text-xs text-zinc-500">{label}</p>
        </div>
      </div>
    </div>
  )
}
