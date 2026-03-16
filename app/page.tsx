import Link from "next/link"
import { NavLinks } from "../lib/nav-links"

export default function LandingPage() {
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
          <NavLinks />
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center sm:pt-28 sm:pb-20">
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
          Stop losing supplement money
          <br className="hidden sm:block" />
          <span className="text-indigo-600"> during tear-off</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-500 sm:text-xl">
          Supplement Snap helps roofing crews capture hidden damage, generate
          supplement documentation, export clean PDF reports, and email adjusters
          — all in minutes.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/pricing"
            className="w-full rounded-lg bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto"
          >
            Get Started
          </Link>
          <Link
            href="/demo"
            className="w-full rounded-lg border border-zinc-300 bg-white px-7 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:w-auto"
          >
            Book a Demo
          </Link>
        </div>
        <p className="mx-auto mt-6 max-w-lg text-sm text-zinc-400">
          Built for roofing contractors who need faster supplement documentation from the field.
        </p>
      </section>

      {/* Product Preview */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Product</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            See Supplement Snap in action
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-500">
            From roof capture to adjuster-ready report.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {/* Card 1 — Dashboard */}
          <div className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm hover:shadow-md">
            <div className="relative h-48 bg-gradient-to-br from-indigo-50 to-zinc-50 p-5">
              <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-indigo-600" />
                  <div className="h-3 w-20 rounded bg-zinc-200" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="h-2.5 w-24 rounded bg-zinc-100" />
                    <div className="h-4 w-12 rounded-full bg-green-100" />
                  </div>
                  <div className="h-2 w-32 rounded bg-zinc-100" />
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between rounded-lg border border-zinc-100 px-2 py-1.5">
                    <div className="h-2.5 w-20 rounded bg-zinc-200" />
                    <div className="h-2 w-8 rounded bg-indigo-100" />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-100 px-2 py-1.5">
                    <div className="h-2.5 w-16 rounded bg-zinc-200" />
                    <div className="h-2 w-8 rounded bg-indigo-100" />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-sm font-semibold text-zinc-900">Dashboard</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                Manage projects and subscription from one place.
              </p>
            </div>
          </div>

          {/* Card 2 — Capture */}
          <div className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm hover:shadow-md">
            <div className="relative h-48 bg-gradient-to-br from-indigo-50 to-zinc-50 p-5">
              <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
                <div className="mb-2 h-2.5 w-16 rounded bg-zinc-300" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex h-14 flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50">
                    <div className="h-5 w-5 rounded-full bg-zinc-200" />
                    <div className="mt-1 h-1.5 w-10 rounded bg-zinc-200" />
                  </div>
                  <div className="flex h-14 flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50">
                    <div className="h-5 w-5 rounded-full bg-zinc-200" />
                    <div className="mt-1 h-1.5 w-10 rounded bg-zinc-200" />
                  </div>
                </div>
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1.5">
                    <div className="h-4 w-14 rounded-full bg-indigo-100" />
                    <div className="h-4 w-10 rounded-full bg-zinc-100" />
                  </div>
                  <div className="h-6 w-full rounded bg-zinc-50 border border-zinc-100" />
                </div>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-sm font-semibold text-zinc-900">Capture workflow</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                Photograph hidden damage and tag roof areas instantly.
              </p>
            </div>
          </div>

          {/* Card 3 — Report */}
          <div className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm hover:shadow-md">
            <div className="relative h-48 bg-gradient-to-br from-indigo-50 to-zinc-50 p-5">
              <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-indigo-500" />
                  <div className="h-2.5 w-24 rounded bg-zinc-300" />
                </div>
                <div className="h-px bg-zinc-100" />
                <div className="mt-2 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[6px] font-bold text-indigo-600">1</div>
                    <div className="flex-1 space-y-1">
                      <div className="h-2.5 w-20 rounded bg-zinc-200" />
                      <div className="h-2 w-full rounded bg-zinc-50" />
                      <div className="h-2 w-3/4 rounded bg-zinc-50" />
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[6px] font-bold text-indigo-600">2</div>
                    <div className="flex-1 space-y-1">
                      <div className="h-2.5 w-16 rounded bg-zinc-200" />
                      <div className="h-2 w-full rounded bg-zinc-50" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-sm font-semibold text-zinc-900">Supplement report</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                Generate professional documentation ready for adjusters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-zinc-100 bg-zinc-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">How It Works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps from roof to supplement
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-zinc-500">
              Your crew captures damage on-site. The office gets a professional supplement draft — ready to submit.
            </p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">1</div>
              <h3 className="text-base font-semibold">Snap the damage</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                During tear-off, your crew photographs each area of damage — decking, flashing, pipe boots, code violations — right from their phone.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">2</div>
              <h3 className="text-base font-semibold">Tag and note</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Select the damage type and roof area, add a quick field note. Everything is organized by project and saved to the cloud instantly.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">3</div>
              <h3 className="text-base font-semibold">Generate and send</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                One click generates a professional supplement draft, exports a PDF report, and emails it to the adjuster — all from the field.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Helps */}
      <section className="border-t border-zinc-100 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Results</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              What changes when you use Supplement Snap
            </h2>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold">Recover more supplement revenue</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Every documented item is a line item you can recover. Stop leaving money behind because damage wasn&apos;t captured properly.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold">Document hidden damage faster</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Photos, tags, voice notes, and AI-generated supplement language — captured in real time during tear-off.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h3 className="text-base font-semibold">Send cleaner reports to adjusters</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Generate a professional PDF and email it to the adjuster the same day. No more waiting for the office to type it up.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Built for Real Workflows */}
      <section className="border-t border-zinc-100 bg-zinc-50 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Why Roofers Choose It</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Built for real roofing workflows
          </h2>
          <div className="mx-auto mt-10 max-w-md text-left">
            {[
              "Capture findings during tear-off from any phone",
              "Organize documentation by project and address",
              "Generate supplement language in seconds with AI",
              "Export PDF reports and email adjusters the same day",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 py-3 border-b border-zinc-200 last:border-0">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-zinc-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-zinc-100 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Pricing</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Simple pricing for roofing teams
            </h2>
          </div>

          <div className="mx-auto mt-12 max-w-md">
            <div className="rounded-2xl border-2 border-indigo-600 bg-white p-8 shadow-lg">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Starter Plan</p>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-zinc-900">$497</span>
                  <span className="ml-1 text-sm text-zinc-500">one-time setup</span>
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  Then <span className="font-semibold text-zinc-900">$49</span>/month
                </p>
              </div>

              <div className="mt-8 space-y-3">
                {[
                  "Unlimited projects",
                  "Capture photos from the field",
                  "AI supplement draft generation",
                  "Project PDF reports",
                  "Email reports to adjusters",
                  "Mobile-friendly workflow",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <svg className="h-4.5 w-4.5 flex-shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-zinc-700">{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/demo"
                className="mt-8 block w-full rounded-lg bg-indigo-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Book a Demo
              </Link>
              <p className="mt-3 text-center text-xs text-zinc-400">
                We&apos;ll handle setup and get your team running fast.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-zinc-100 bg-zinc-50 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to capture what you&apos;re owed?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-500">
            Book a demo and see how Supplement Snap helps your crew document damage and send supplement reports faster.
          </p>
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

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-xs font-bold text-white">
              S
            </div>
            <span className="text-sm font-semibold">Supplement Snap</span>
          </div>
          <p className="text-xs text-zinc-400">
            &copy; {new Date().getFullYear()} Supplement Snap. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
