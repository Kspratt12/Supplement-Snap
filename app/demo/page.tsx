"use client"

import Link from "next/link"
import { useEffect } from "react"

const CALENDLY_URL = "https://calendly.com/kelvin-sprattenterprise/30min"

export default function DemoPage() {
  useEffect(() => {
    // Load Calendly widget script
    const script = document.createElement("script")
    script.src = "https://assets.calendly.com/assets/external/widget.js"
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

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
          <div className="flex items-center gap-4">
            <Link href="/" className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:block">Home</Link>
            <Link href="/pricing" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">Pricing</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Hero */}
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Free 15-Minute Walkthrough</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            See Supplement Snap in Action
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-500">
            Pick a time below. I&apos;ll screen share and walk you through how your crew captures hidden damage and sends adjuster-ready reports, all from the field.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: What you'll see + who it's for */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-zinc-900">What you&apos;ll see</h2>
              <div className="mt-3 space-y-2.5">
                {[
                  "Crew captures damage photos from the roof",
                  "Voice notes auto-transcribed (works in Spanish)",
                  "AI generates professional supplement narrative",
                  "PDF report emailed to adjuster in one click",
                  "Xactimate CSV export with real line codes",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs text-zinc-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-zinc-900">No pitch, just a demo</h2>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                This is a 15-minute screen share where I walk you through the tool on a real project. You&apos;ll see exactly how it works and can ask questions. No pressure, no sales pitch.
              </p>
            </div>

            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <p className="text-xs font-semibold text-green-800">Average supplement recovered</p>
              <p className="mt-1 text-2xl font-extrabold text-green-700">$2,400</p>
              <p className="mt-1 text-xs text-green-600">One supplement pays for the platform.</p>
            </div>
          </div>

          {/* Right: Calendly embed */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div
                className="calendly-inline-widget"
                data-url={`${CALENDLY_URL}?hide_gdpr_banner=1&background_color=ffffff&text_color=27272a&primary_color=4f46e5`}
                style={{ minWidth: "320px", height: "660px" }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
