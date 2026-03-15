import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Nav */}
      <nav className="border-b border-zinc-100 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              S
            </div>
            <span className="text-lg font-bold tracking-tight">Supplement Snap</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/app"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
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
      <section className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center sm:pt-28 sm:pb-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-400">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
          Built for roofing restoration contractors
        </div>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl lg:text-6xl">
          Stop leaving supplement
          <br className="hidden sm:block" />
          <span className="text-indigo-600 dark:text-indigo-400"> money on the table</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-xl">
          Supplement Snap helps roofing crews capture damage during tear-off and
          generate professional supplement documentation in seconds — so you recover
          every dollar your jobs are owed.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/demo"
            className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto"
          >
            Book a Demo
          </Link>
          <a
            href="#how-it-works"
            className="w-full rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750 sm:w-auto"
          >
            See How It Works
          </a>
        </div>
      </section>

      {/* Screenshot / Product Preview */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-1.5 border-b border-zinc-200 bg-zinc-100 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          </div>
          <div className="p-6 sm:p-10">
            <div className="grid gap-6 sm:grid-cols-3">
              {/* Mock card 1 */}
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                <div className="mb-3 h-32 rounded-lg bg-gradient-to-br from-zinc-200 to-zinc-100 dark:from-zinc-700 dark:to-zinc-800" />
                <div className="flex gap-1.5">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">Decking</span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">Front</span>
                </div>
                <p className="mt-2 text-xs text-zinc-400">Rotted decking found along eave edge, 4x8 section requires full replacement...</p>
              </div>
              {/* Mock card 2 */}
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                <div className="mb-3 h-32 rounded-lg bg-gradient-to-br from-zinc-200 to-zinc-100 dark:from-zinc-700 dark:to-zinc-800" />
                <div className="flex gap-1.5">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">Flashing</span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">Chimney</span>
                </div>
                <p className="mt-2 text-xs text-zinc-400">Step flashing corroded at chimney wall, counter flashing missing top seal...</p>
              </div>
              {/* Mock card 3 */}
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                <div className="mb-3 h-32 rounded-lg bg-gradient-to-br from-zinc-200 to-zinc-100 dark:from-zinc-700 dark:to-zinc-800" />
                <div className="flex gap-1.5">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">Ice &amp; Water</span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">Valley</span>
                </div>
                <p className="mt-2 text-xs text-zinc-400">No ice and water shield present in valley, code requires I&amp;W in all valleys...</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-zinc-100 bg-zinc-50 py-20 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">How It Works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps from roof to supplement
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-zinc-500 dark:text-zinc-400">
              Your crew captures damage on-site. The office gets a professional supplement draft — ready to submit.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {/* Step 1 */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                1
              </div>
              <h3 className="text-base font-semibold">Snap the damage</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                During tear-off, your crew photographs each area of damage — decking, flashing, pipe boots, code violations — right from their phone.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                2
              </div>
              <h3 className="text-base font-semibold">Tag and note</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Select the damage type and roof area, add a quick field note. Everything is organized by project and saved to the cloud instantly.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                3
              </div>
              <h3 className="text-base font-semibold">Generate the supplement</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                One click generates a professional supplement draft using AI — written in insurance language, ready to copy into Xactimate or your carrier submission.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="border-t border-zinc-100 py-20 dark:border-zinc-800">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Why It Matters</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Every undocumented item is lost revenue
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-zinc-500 dark:text-zinc-400">
              Most roofing companies leave thousands on the table because field damage is never properly captured or communicated to the office.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {/* Benefit 1 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold">Better field documentation</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Photos, damage types, roof areas, and field notes — all captured in real time and organized by project. No more lost photos or forgotten details.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold">Less missed supplement money</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                When every item is documented and drafted into supplement language, you stop leaving money behind. Capture it on the roof, collect it from the carrier.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold">Faster office workflow</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                No more deciphering blurry photos and handwritten notes. The office gets organized captures and ready-to-submit supplement drafts the same day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof placeholder */}
      <section className="border-t border-zinc-100 bg-zinc-50 py-16 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
            Trusted by roofing restoration contractors across the U.S.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {["Storm Pro Roofing", "Apex Restoration", "Summit Exteriors", "Ridgeline Contractors"].map((name) => (
              <div key={name} className="text-base font-semibold text-zinc-300 dark:text-zinc-700">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section id="demo" className="border-t border-zinc-100 py-20 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to capture what you&apos;re owed?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-500 dark:text-zinc-400">
            Book a 15-minute demo and see how Supplement Snap helps your crew
            document damage and generate supplement drafts from the field.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/demo"
              className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto"
            >
              Book a Demo
            </Link>
            <Link
              href="/app"
              className="w-full rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750 sm:w-auto"
            >
              Try It Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-10 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-xs font-bold text-white">
              S
            </div>
            <span className="text-sm font-semibold">Supplement Snap</span>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            &copy; {new Date().getFullYear()} Supplement Snap. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
