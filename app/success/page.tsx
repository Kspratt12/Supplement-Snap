"use client"

import Link from "next/link"
import { useAuth } from "../../lib/auth-context"

export default function SuccessPage() {
  const { user, loading } = useAuth()

  if (loading) return null

  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900">
      <nav className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              S
            </div>
            <span className="text-lg font-bold tracking-tight">Supplement Snap</span>
          </Link>
          <Link href={user ? "/dashboard" : "/login"} className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            {user ? "Dashboard" : "Log In"}
          </Link>
        </div>
      </nav>

      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome to Supplement Snap
          </h1>

          <p className="mt-4 text-base leading-relaxed text-zinc-500">
            Your account setup is in progress. We&apos;ll have everything ready for your team shortly.
          </p>

          <div className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            Payment received successfully.
          </div>

          {user ? (
            <>
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
                <p className="text-sm font-semibold text-zinc-700">Next step</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Book your onboarding call so we can get your team set up and running fast.
                </p>
              </div>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/demo"
                  className="w-full rounded-lg bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto"
                >
                  Book Onboarding Call
                </Link>
                <Link
                  href="/dashboard"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-7 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:w-auto"
                >
                  Go to Dashboard
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
                <p className="text-sm font-semibold text-zinc-700">Create your account</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Set up your login so you can access your projects and start capturing damage.
                </p>
              </div>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/signup"
                  className="w-full rounded-lg bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto"
                >
                  Create Account
                </Link>
                <Link
                  href="/login"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-7 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:w-auto"
                >
                  Log In
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
