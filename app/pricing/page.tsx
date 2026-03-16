import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { CheckoutButton, CancelBanner, TestModeBanner } from "./checkout-button"
import { SiteFooter } from "../../lib/site-footer"

export const metadata: Metadata = {
  title: "Pricing – Supplement Snap",
  description: "Simple pricing for roofing teams. Get started with Supplement Snap.",
}

const FEATURES = [
  "Unlimited projects",
  "Capture field photos on mobile or desktop",
  "Voice-to-note capture",
  "AI supplement draft generation",
  "Project report generation",
  "PDF export",
  "Email reports to adjusters",
  "Project status workflow",
  "Mobile-friendly interface",
]

const WHO_FOR = [
  "Contractors documenting hidden damage during tear-off",
  "Teams that want cleaner supplement writeups",
  "Offices that need reports sent faster to adjusters",
  "Companies tired of messy photo and note workflows",
]

const STEPS = [
  { num: "1", text: "Book a quick onboarding call" },
  { num: "2", text: "We help set up your workflow" },
  { num: "3", text: "Your team starts capturing and sending reports" },
]

const FAQ = [
  {
    q: "Do I need my crew to install anything?",
    a: "No, Supplement Snap works in the browser on mobile and desktop. No app store downloads required.",
  },
  {
    q: "Can I send reports the same day?",
    a: "Yes, reports can be generated, exported, and emailed as soon as findings are captured.",
  },
  {
    q: "Is this only for large roofing companies?",
    a: "No, it works for owner-operators, small teams, and growing roofing companies.",
  },
]

export default function PricingPage() {
  return (
    <div className="bg-white text-zinc-900">
      {/* Nav */}
      <nav className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              S
            </div>
            <span className="text-lg font-bold tracking-tight">Supplement Snap</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:block">
              Home
            </Link>
            <Link href="/app" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Open App
            </Link>
            <Link
              href="/demo"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-20 pb-4 text-center sm:pt-28">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
          Simple pricing for roofing teams
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-500 sm:text-lg">
          Get your crew set up with Supplement Snap and start documenting supplement-worthy damage faster from the field.
        </p>
      </section>

      <Suspense fallback={null}>
        <CancelBanner />
      </Suspense>
      <TestModeBanner isTestMode={(process.env.STRIPE_SECRET_KEY || "").startsWith("sk_test_")} />

      {/* Pricing Card */}
      <section className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-2xl border-2 border-indigo-600 bg-white p-8 shadow-xl sm:p-10">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Starter Plan</p>
            <div className="mt-5">
              <span className="text-5xl font-extrabold text-zinc-900">$497</span>
              <span className="ml-2 text-sm text-zinc-500">one-time setup</span>
            </div>
            <p className="mt-2 text-base text-zinc-500">
              Then <span className="font-semibold text-zinc-900">$49</span>/month
            </p>
          </div>

          <div className="mt-8 border-t border-zinc-100 pt-8">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">Everything included</p>
            <div className="space-y-3">
              {FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-zinc-700">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <CheckoutButton />
          <p className="mt-3 text-center text-xs text-zinc-400">
            We&apos;ll help set up your team and get you running fast.
          </p>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="border-t border-zinc-100 bg-zinc-50 py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Who This Is For</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Built for roofing teams that need speed in the field
            </h2>
          </div>
          <div className="mx-auto mt-10 max-w-lg">
            {WHO_FOR.map((item) => (
              <div key={item} className="flex items-start gap-3 border-b border-zinc-200 py-4 last:border-0">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-zinc-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Happens Next */}
      <section className="border-t border-zinc-100 py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Getting Started</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              What happens after you get started
            </h2>
          </div>
          <div className="mx-auto mt-12 flex max-w-lg flex-col gap-6 sm:flex-row sm:gap-0">
            {STEPS.map((step, i) => (
              <div key={step.num} className="flex flex-1 flex-col items-center text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                  {step.num}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden h-px w-full bg-zinc-200 sm:block sm:mt-5" />
                )}
                <p className="mt-4 text-sm font-medium text-zinc-700">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-zinc-100 bg-zinc-50 py-20">
        <div className="mx-auto max-w-2xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">FAQ</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Common questions
            </h2>
          </div>
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
      <section className="border-t border-zinc-100 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to stop leaving supplement money behind?
          </h2>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/demo"
              className="w-full rounded-lg bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto"
            >
              Book a Demo
            </Link>
            <Link
              href="/app"
              className="w-full rounded-lg border border-zinc-300 bg-white px-7 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:w-auto"
            >
              Open App
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
