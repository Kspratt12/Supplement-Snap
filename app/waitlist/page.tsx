"use client"

import Link from "next/link"
import { useState } from "react"
import { trackEvent } from "../../lib/analytics"

export default function WaitlistPage() {
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("sending")
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company }),
      })
      if (!res.ok) throw new Error()
      trackEvent("waitlist_joined")
      setStatus("done")
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</div>
            <span className="text-lg font-bold tracking-tight text-zinc-900">Supplement Snap</span>
          </Link>
          <Link href="/blog" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">Blog</Link>
        </div>
      </nav>

      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Coming Soon</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900">Join the Waitlist</h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-500">
          We are rebuilding Supplement Snap. Leave your email and we will let you know when roofing supplement documentation is ready.
        </p>

        {status === "done" ? (
          <div className="mt-8 rounded-lg bg-green-50 px-4 py-4 text-sm font-medium text-green-700">
            You are on the list. We will be in touch.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-3 text-left">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@roofingcompany.com"
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name (optional)"
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-indigo-500"
            />
            {status === "error" && (
              <p className="text-sm text-red-600">Something went wrong. Please try again, or request a demo instead.</p>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {status === "sending" ? "Sending..." : "Join the Waitlist"}
            </button>
          </form>
        )}

        <p className="mt-8 text-sm text-zinc-500">
          Want to talk now?{" "}
          <Link href="/demo" className="font-semibold text-indigo-600 hover:text-indigo-500">Request a demo</Link>
        </p>
      </main>
    </div>
  )
}
