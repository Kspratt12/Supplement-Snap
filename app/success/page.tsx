import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Welcome – Supplement Snap",
}

export default function SuccessPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900">
      {/* Nav */}
      <nav className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              S
            </div>
            <span className="text-lg font-bold tracking-tight">Supplement Snap</span>
          </Link>
          <Link href="/app" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            Open App
          </Link>
        </div>
      </nav>

      {/* Content */}
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

          <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
            <p className="text-sm font-semibold text-zinc-700">Next step</p>
            <p className="mt-1 text-sm text-zinc-500">
              Book your onboarding demo so we can get your team running fast.
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
              href="/app"
              className="w-full rounded-lg border border-zinc-300 bg-white px-7 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:w-auto"
            >
              Open App
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
