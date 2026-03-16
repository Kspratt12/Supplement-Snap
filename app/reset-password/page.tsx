"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "../../lib/supabase"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true)
      }
    })

    // Also check if we already have a session (user clicked link and session was set)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
      } else {
        // Give Supabase a moment to process the recovery token from the URL hash
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (s) {
              setSessionReady(true)
            } else {
              setSessionError(true)
            }
          })
        }, 1500)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Send confirmation email
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        fetch("/api/send-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: user.email,
            subject: "Password Changed – Supplement Snap",
            message: `Your Supplement Snap password was successfully changed on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} at ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.\n\nIf you did not make this change, please contact support immediately.`,
            projectName: "Account Security",
            propertyAddress: "",
          }),
        }).catch(() => {})
      }

      setSuccess(true)
      setLoading(false)
      setTimeout(() => router.push("/dashboard?reset=1"), 2500)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              S
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">Supplement Snap</span>
          </Link>
          <h1 className="mt-6 text-xl font-bold text-zinc-900">Choose a new password</h1>
        </div>

        {success ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-zinc-900">Password updated successfully</h2>
            <p className="mt-2 text-sm text-zinc-500">Redirecting you to login...</p>
          </div>
        ) : sessionError ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-zinc-900">Reset link expired</h2>
            <p className="mt-2 text-sm text-zinc-500">
              This password reset link is no longer valid. Please request a new one.
            </p>
            <Link
              href="/forgot-password"
              className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Request New Link
            </Link>
          </div>
        ) : !sessionReady ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm text-center">
            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <p className="mt-3 text-sm text-zinc-500">Verifying reset link...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
