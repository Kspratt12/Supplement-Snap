import type { Metadata } from "next"
import Link from "next/link"
import { TrackedLink } from "../../lib/tracked-link"
import { NavLinks } from "../../lib/nav-links"
import { SiteFooter } from "../../lib/site-footer"
import { RoiCalculator } from "./calculator"

const URL = "https://supplementsnap.io/roofing-supplement-roi-calculator"
const TITLE = "Roofing Supplement Software ROI Calculator"
const DESCRIPTION =
  "Free break-even calculator for roofing supplement software. Enter your own supplements per month and recovery, and see what it would take to pay for itself."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Supplement Snap" }] },
}

const FAQ = [
  { q: "Where do the numbers come from?", a: "Only from what you type in. The calculator has no built-in averages and does not predict what a carrier will pay." },
  { q: "What should I put for extra recovered per supplement?", a: "Use your own records, such as the average amount added after a supplement. If you do not track it, start with a low number or use the free supplement tracker." },
  { q: "Does the calculator guarantee a result?", a: "No. Carriers decide what to pay, and every job is different. It is a way to check your own assumptions." },
  { q: "Is my information saved?", a: "No. The calculation happens in your browser and nothing you enter is sent anywhere." },
]

const schemas = [
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://supplementsnap.io" },
      { "@type": "ListItem", position: 2, name: "ROI Calculator", item: URL },
    ],
  },
]

export default function RoiCalculatorPage() {
  return (
    <div className="bg-white text-zinc-900">
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      <nav className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="Supplement Snap home" className="flex min-h-[44px] items-center gap-2.5 sm:min-h-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</div>
            <span className="hidden whitespace-nowrap text-lg font-bold tracking-tight min-[480px]:inline">Supplement Snap</span>
          </Link>
          <NavLinks />
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Free tool</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Roofing Supplement Software ROI Calculator</h1>
        <p className="mt-5 text-base leading-relaxed text-zinc-600">
          Work out whether supplement software would pay for itself at your company. Use your own numbers: how many supplements you send, what you recover, and how much time the paperwork takes. We make Supplement Snap, so check any result against your own records.
        </p>

        <RoiCalculator />

        <section className="mt-14 rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-bold">How the math works</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Extra recovered per month = supplements per month x share the software helps with x extra recovered per supplement. Time value = supplements x hours saved x the value of an hour. Net = extra recovered + time value - the monthly cost. Read the full walk-through in{" "}
            <Link href="/blog/is-roofing-supplement-software-worth-it" className="font-medium text-indigo-600 underline hover:text-indigo-800">Is roofing supplement software worth it?</Link>
          </p>
        </section>

        <section className="mt-10 rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center">
          <h2 className="text-lg font-bold text-zinc-900">Test it on one real job</h2>
          <p className="mt-2 text-sm text-zinc-600">Your first Supplement Snap project is free. Judge the report it produces before you pay for anything.</p>
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <TrackedLink location="roi-calculator-start-free-project" href="/signup?trial=1" className="w-full rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 sm:w-auto">
              Start a Free Project
            </TrackedLink>
            <Link href="/free-roofing-templates" className="w-full rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:w-auto">
              Free Templates
            </Link>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-xl font-bold">Frequently asked questions</h2>
          <div className="mt-4 divide-y divide-zinc-100 rounded-xl border border-zinc-200">
            {FAQ.map((f) => (
              <div key={f.q} className="p-5">
                <h3 className="text-base font-semibold">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
