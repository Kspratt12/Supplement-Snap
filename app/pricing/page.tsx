import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { CheckoutButton, CancelBanner, TestModeBanner } from "./checkout-button"
import { SiteFooter } from "../../lib/site-footer"

export const metadata: Metadata = {
  title: "Pricing – Supplement Snap",
  description: "Simple pricing for roofing teams. Starter for solo crews, Pro for growing companies.",
}

const STARTER_FEATURES = [
  "Unlimited roofing projects",
  "Capture damage photos from the field",
  "Voice-to-note damage documentation",
  "AI-generated supplement report drafts",
  "Professional PDF reports",
  "Email reports to adjusters",
  "Mobile-friendly workflow",
  "1 user",
]

const PRO_FEATURES = [
  "Everything in Starter, plus:",
  "Up to 5 team members",
  "Team access — crew, foreman, office",
  "Adjuster email open tracking",
  "Photo annotations (circles, arrows, labels)",
  "Xactimate-ready CSV export",
  "Project search & templates",
  "Priority support",
]

const FAQ = [
  {
    q: "Can I try it before paying?",
    a: "Yes! Create a free account and complete your first project at no cost — no credit card required. You'll be able to capture damage, generate an AI supplement draft, and see a sample PDF report. When you're ready to send reports and unlock unlimited projects, choose a plan.",
  },
  {
    q: "What's the difference between Starter and Pro?",
    a: "Starter is for solo contractors or single-crew operations. Pro adds team access so your foreman, office staff, and crew can all see projects in real-time, plus email tracking, photo annotations, and Xactimate export.",
  },
  {
    q: "Can I upgrade from Starter to Pro later?",
    a: "Yes. Contact us and we'll move you to Pro. Your projects and data stay exactly the same.",
  },
  {
    q: "Do I need special equipment?",
    a: "No. Any smartphone with a camera works. Your crew is already carrying everything they need.",
  },
  {
    q: "What if my crew speaks Spanish?",
    a: "Voice notes are automatically translated to English. Your crew speaks in their language, and the system converts it for the supplement report.",
  },
  {
    q: "Is it worth the investment?",
    a: "One approved supplement typically recovers $1,500–$3,200. Both plans pay for themselves on the first job.",
  },
]

export default function PricingPage() {
  return (
    <div className="bg-white text-zinc-900">
      {/* Nav */}
      <nav className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</div>
            <span className="text-lg font-bold tracking-tight">Supplement Snap</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:block">Home</Link>
            <Link href="/demo" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Book a Demo</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-20 pb-4 text-center sm:pt-28">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
          Simple pricing for roofing teams
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-500 sm:text-lg">
          One approved supplement pays for the entire platform. Choose the plan that fits your team.
        </p>
      </section>

      <Suspense fallback={null}>
        <CancelBanner />
      </Suspense>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Free */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-7 sm:p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wider text-green-600">Free</p>
            <p className="mt-1 text-xs text-zinc-400">Try it on your next job</p>
            <div className="mt-5">
              <span className="text-4xl font-extrabold text-zinc-900">$0</span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">No credit card required</p>

            <div className="mt-6 border-t border-zinc-100 pt-6 space-y-2.5">
              {["1 demo project", "Capture damage photos", "Voice-to-note documentation", "AI supplement draft", "See sample PDF report"].map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-zinc-700">{f}</span>
                </div>
              ))}
            </div>

            <Link
              href="/signup"
              className="mt-8 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Start Free Project
            </Link>
          </div>

          {/* Starter */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-7 sm:p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Starter</p>
            <p className="mt-1 text-xs text-zinc-400">For solo crews — first project free</p>
            <div className="mt-5">
              <span className="text-4xl font-extrabold text-zinc-900">$497</span>
              <span className="ml-1 text-sm text-zinc-500">setup</span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Then <span className="font-semibold text-zinc-900">$49</span>/month
            </p>

            <div className="mt-6 border-t border-zinc-100 pt-6 space-y-2.5">
              {STARTER_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-zinc-700">{f}</span>
                </div>
              ))}
            </div>

            <CheckoutButton plan="starter" label="Start with Starter" />
          </div>

          {/* Pro */}
          <div className="rounded-2xl border-2 border-indigo-600 bg-white p-7 sm:p-8 shadow-xl relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
              Most Popular
            </div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Pro</p>
            <p className="mt-1 text-xs text-zinc-400">For teams up to 5</p>
            <div className="mt-5">
              <span className="text-4xl font-extrabold text-zinc-900">$979</span>
              <span className="ml-1 text-sm text-zinc-500">setup</span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Then <span className="font-semibold text-zinc-900">$249</span>/month
            </p>

            <div className="mt-6 border-t border-zinc-100 pt-6 space-y-2.5">
              {PRO_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-zinc-700">{f}</span>
                </div>
              ))}
            </div>

            <CheckoutButton plan="pro" label="Start with Pro" />
            <p className="mt-3 text-center text-xs text-zinc-400">
              Best value for companies with multiple crews.
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-zinc-500">
          Need more than 5 users? <Link href="/demo" className="font-medium text-indigo-600 hover:text-indigo-500">Contact us</Link> for custom team pricing.
        </p>
      </section>

      {/* ROI */}
      <section className="mx-auto max-w-2xl px-6 pb-16">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center sm:p-8">
          <h2 className="text-lg font-bold text-zinc-900">One approved supplement pays for the entire platform.</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-zinc-500">
            Crews discover $1,500–$3,200 in hidden damage on a typical job. Proper documentation means that money gets approved instead of left on the table.
          </p>
        </div>
      </section>

      {/* Compare */}
      <section className="border-t border-zinc-100 bg-zinc-50 py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Compare plans</h2>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="py-3 text-left font-medium text-zinc-500">Feature</th>
                  <th className="py-3 text-center font-medium text-zinc-500">Starter</th>
                  <th className="py-3 text-center font-medium text-indigo-600">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {[
                  ["Unlimited projects", true, true],
                  ["Damage photo capture", true, true],
                  ["Voice notes (any language)", true, true],
                  ["AI supplement drafts", true, true],
                  ["PDF reports", true, true],
                  ["Email to adjusters", true, true],
                  ["Users", "1", "Up to 5"],
                  ["Team access", false, true],
                  ["Email open tracking", false, true],
                  ["Photo annotations", false, true],
                  ["Xactimate CSV export", false, true],
                  ["Project templates", false, true],
                  ["Priority support", false, true],
                ].map(([feature, starter, pro]) => (
                  <tr key={feature as string}>
                    <td className="py-3 text-zinc-700">{feature as string}</td>
                    <td className="py-3 text-center">
                      {starter === true ? (
                        <svg className="mx-auto h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) : starter === false ? (
                        <span className="text-zinc-300">—</span>
                      ) : (
                        <span className="text-zinc-700">{starter as string}</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {pro === true ? (
                        <svg className="mx-auto h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) : pro === false ? (
                        <span className="text-zinc-300">—</span>
                      ) : (
                        <span className="font-medium text-indigo-600">{pro as string}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-zinc-100 py-20">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Common questions</h2>
          <div className="mt-10 space-y-0 divide-y divide-zinc-200">
            {FAQ.map((item) => (
              <div key={item.q} className="py-5">
                <h3 className="text-sm font-semibold text-zinc-900">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-zinc-100 bg-zinc-50 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to stop leaving supplement money behind?
          </h2>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/demo" className="w-full rounded-lg bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto">
              Book a Demo
            </Link>
            <Link href="/signup" className="w-full rounded-lg border border-zinc-300 bg-white px-7 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:w-auto">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
