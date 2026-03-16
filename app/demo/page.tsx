"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { trackEvent } from "../../lib/analytics"

const ROLES = ["Owner", "Project Manager", "Sales Rep", "Estimator", "Other"] as const

export default function DemoPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return

    setSubmitting(true)
    setError("")

    try {
      const body = [
        `Name: ${name}`,
        `Company: ${company || "N/A"}`,
        `Email: ${email}`,
        `Phone: ${phone || "N/A"}`,
        `Role: ${role || "N/A"}`,
        message ? `Message: ${message}` : "",
      ].filter(Boolean).join("\n")

      const res = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "admin@supplementsnap.com",
          subject: "New Demo Request – Supplement Snap",
          message: body,
          projectName: "Demo Request",
          propertyAddress: company || "",
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || `Request failed (${res.status})`)
      }

      // Send confirmation email to the user
      fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: "Your Supplement Snap Demo Request",
          message: `Hi ${name},\n\nThank you for requesting a demo of Supplement Snap. We received your request and will reach out within 1 business day to schedule a walkthrough.\n\nDuring the demo, you'll see:\n• How crews capture damage during tear-off\n• How supplement documentation is generated with AI\n• How PDF reports are sent directly to adjusters\n\nWe look forward to showing you how Supplement Snap helps roofing teams recover more supplement revenue.\n\n— The Supplement Snap Team`,
          projectName: "Demo Confirmation",
          propertyAddress: "",
        }),
      }).catch(() => {})

      trackEvent("demo_request_submitted")
      router.push("/demo-confirmation")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Nav */}
      <nav className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              S
            </div>
            <span className="text-lg font-bold tracking-tight text-zinc-900">Supplement Snap</span>
          </Link>
          <Link
            href="/app"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Open App
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        {/* Hero */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            See Supplement Snap in Action
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-500">
            Book a quick walkthrough to see how roofing crews capture hidden damage during tear-off and generate supplement reports for insurance adjusters.
          </p>
        </div>

        {/* Info cards */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2">
          {/* What you'll see */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">What you&apos;ll see in the demo</h2>
            <div className="mt-4 space-y-3">
              {[
                "Capturing hidden damage photos during tear-off",
                "Adding damage notes using voice dictation",
                "Automatically generating a supplement report",
                "Exporting a clean PDF ready for adjusters",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-zinc-600">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Who it's for */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Who this demo is for</h2>
            <div className="mt-4 space-y-3">
              {[
                "Roofing contractors",
                "Project managers",
                "Supplement specialists",
                "Office staff handling insurance claims",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <span className="text-sm text-zinc-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mb-10 text-center text-sm text-zinc-400">
          The walkthrough takes about 15 minutes and shows the complete workflow from capture to report.
        </p>

        {submitted ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-zinc-900">Demo Request Sent</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Thanks! We&apos;ll reach out shortly to schedule your demo.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                Request your demo
              </h2>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mx-auto max-w-lg space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@smithroofing.com"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Company Name
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Smith Roofing"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="555-123-5555"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900"
                >
                  <option value="">Select your role...</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Message <span className="text-xs text-zinc-400">(optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your business or what you'd like to see..."
                  rows={3}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !name.trim() || !email.trim()}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending...
                  </span>
                ) : (
                  "Request Demo"
                )}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  )
}
