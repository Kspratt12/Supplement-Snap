"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { useAuth, hasActiveSubscription } from "../../lib/auth-context"
import { trackEvent } from "../../lib/analytics"

export default function SuccessPage() {
  const { user, loading, subscriptionStatus, subscriptionLoading, subscriptionUnverified, refreshSubscription } = useAuth()

  // What this page can honestly say comes only from the plan the server reports for the signed-in account, never from
  // the fact that someone opened /success.
  const state: "signed-out" | "checking" | "unverified" | "active" | "trial" | "none" = !user
    ? "signed-out"
    : subscriptionLoading
      ? "checking"
      : subscriptionUnverified
        ? "unverified"
        : subscriptionStatus === "trialing"
          ? "trial"
          : hasActiveSubscription(subscriptionStatus)
            ? "active"
            : "none"

  // Counted only when the account really has an active or trial plan, and once per visit
  const tracked = useRef(false)
  useEffect(() => {
    if ((state === "active" || state === "trial") && !tracked.current) {
      tracked.current = true
      trackEvent("subscription_active")
    }
  }, [state])

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
            <svg className="h-8 w-8 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome to Supplement Snap
          </h1>

          {state === "active" && (
            <div role="status" className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              Your plan is active.
            </div>
          )}
          {state === "trial" && (
            <div role="status" className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              Your free trial is active.
            </div>
          )}
          {state === "checking" && (
            <p role="status" className="mt-6 text-sm text-zinc-500">
              Checking your plan…
            </p>
          )}
          {state === "unverified" && (
            <div role="status" className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p className="font-medium">We couldn&apos;t check your plan right now.</p>
              <p className="mt-1">This doesn&apos;t mean anything is wrong with your account. Please try again in a moment.</p>
              <button
                type="button"
                onClick={() => void refreshSubscription()}
                className="mt-3 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
              >
                Check again
              </button>
            </div>
          )}
          {state === "none" && (
            <div role="status" className="mt-6 rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
              <p className="font-medium">This account doesn&apos;t show an active plan.</p>
              <p className="mt-1">
                If you just finished checkout, it can take a minute to appear. You can check again, or contact support if it still doesn&apos;t show.
              </p>
              <button
                type="button"
                onClick={() => void refreshSubscription()}
                className="mt-3 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                Check again
              </button>
            </div>
          )}

          {user ? (
            <>
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
                <p className="text-sm font-semibold text-zinc-700">Your account</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Start capturing damage and generating reports. Questions getting started? Email support@supplementsnap.io.
                </p>
              </div>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/dashboard"
                  className="w-full rounded-lg bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto"
                >
                  Go to Dashboard
                </Link>
                <Link
                  href="mailto:support@supplementsnap.io"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-7 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:w-auto"
                >
                  Contact Support
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
                <p className="text-sm font-semibold text-zinc-700">Log in to see your plan</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Log in, or create your account, so you can see your plan and access your projects.
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
