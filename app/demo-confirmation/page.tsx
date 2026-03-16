import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Demo Request Received – Supplement Snap",
}

export default function DemoConfirmationPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</div>
            <span className="text-lg font-bold tracking-tight text-zinc-900">Supplement Snap</span>
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            Pricing
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-lg px-4 py-20 sm:px-6">
        {/* Confirmation card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center sm:p-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Demo Request Received</h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-500">
            We&apos;ll review your request and reach out shortly to schedule your walkthrough.
          </p>

          <div className="mt-6 rounded-xl border border-zinc-100 bg-zinc-50 p-5 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">What happens next</p>
            <div className="mt-3 space-y-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">1</span>
                <p className="text-sm text-zinc-600">We review your request within 1 business day</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">2</span>
                <p className="text-sm text-zinc-600">We reach out to schedule a 15-minute walkthrough</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">3</span>
                <p className="text-sm text-zinc-600">You see the product live and ask any questions</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-zinc-100 bg-zinc-50 p-5 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">What you&apos;ll see in the demo</p>
            <div className="mt-3 space-y-2">
              {[
                "How crews capture damage during tear-off",
                "How supplement documentation is generated with AI",
                "How PDF reports are sent directly to adjusters",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-zinc-600">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="w-full rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 sm:w-auto"
            >
              Back to Home
            </Link>
            <Link
              href="/pricing"
              className="w-full rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:w-auto"
            >
              Explore the Product
            </Link>
          </div>

          <p className="mt-6 text-xs text-zinc-400">
            A confirmation email has been sent to your inbox.
          </p>
        </div>
      </main>
    </div>
  )
}
