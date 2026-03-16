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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setSessionReady(true)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
      } else {
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (s) setSessionReady(true)
            else setSessionError(true)
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
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* Nav */}
      <nav className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</div>
            <span className="text-lg font-bold tracking-tight text-zinc-900">Supplement Snap</span>
          </Link>
          <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            Log In
          </Link>
        </div>
      </nav>

      <div className="flex flex-1 items-start pt-8 sm:items-center sm:pt-0 justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          {success ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-zinc-900">Password updated</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Your password has been changed successfully. A confirmation email has been sent.
              </p>
              <p className="mt-3 text-xs text-zinc-400">Redirecting to dashboard...</p>
            </div>
          ) : sessionError ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-zinc-900">Link expired</h2>
              <p className="mt-2 text-sm text-zinc-500">
                This password reset link is no longer valid. Please request a new one.
              </p>
              <Link
                href="/forgot-password"
                className="mt-5 inline-block rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Request New Link
              </Link>
            </div>
          ) : !sessionReady ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
              <div className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <p className="text-sm font-medium text-zinc-700">Verifying reset link...</p>
              <p className="mt-1 text-xs text-zinc-400">This will only take a moment.</p>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-zinc-900">Choose a new password</h1>
                <p className="mt-2 text-sm text-zinc-500">
                  Enter your new password below.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700">New password</label>
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
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700">Confirm new password</label>
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
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Updating...
                    </span>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-zinc-500">
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
