import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "../../../lib/site-footer"
import { NavLinks } from "../../../lib/nav-links"

const CITIES = [
  { slug: "raleigh-nc", name: "Raleigh", county: "Wake County", state: "NC", nearby: ["Cary", "Garner", "Wake Forest", "Durham", "Apex"] },
  { slug: "apex-nc", name: "Apex", county: "Wake County", state: "NC", nearby: ["Cary", "Holly Springs", "Fuquay-Varina", "Raleigh"] },
  { slug: "cary-nc", name: "Cary", county: "Wake County", state: "NC", nearby: ["Apex", "Raleigh", "Morrisville", "Holly Springs"] },
  { slug: "durham-nc", name: "Durham", county: "Durham County", state: "NC", nearby: ["Chapel Hill", "Raleigh", "Hillsborough", "Cary"] },
  { slug: "wake-forest-nc", name: "Wake Forest", county: "Wake County", state: "NC", nearby: ["Raleigh", "Youngsville", "Rolesville", "Knightdale"] },
  { slug: "fuquay-varina-nc", name: "Fuquay-Varina", county: "Wake County", state: "NC", nearby: ["Holly Springs", "Apex", "Angier", "Garner"] },
  { slug: "garner-nc", name: "Garner", county: "Wake County", state: "NC", nearby: ["Raleigh", "Clayton", "Fuquay-Varina", "Smithfield"] },
  { slug: "chapel-hill-nc", name: "Chapel Hill", county: "Orange County", state: "NC", nearby: ["Durham", "Carrboro", "Pittsboro", "Hillsborough"] },
  { slug: "clayton-nc", name: "Clayton", county: "Johnston County", state: "NC", nearby: ["Garner", "Smithfield", "Raleigh", "Zebulon"] },
  { slug: "holly-springs-nc", name: "Holly Springs", county: "Wake County", state: "NC", nearby: ["Apex", "Fuquay-Varina", "Cary", "Angier"] },
  { slug: "zebulon-nc", name: "Zebulon", county: "Wake County", state: "NC", nearby: ["Knightdale", "Wendell", "Clayton", "Raleigh"] },
  { slug: "dunn-nc", name: "Dunn", county: "Harnett County", state: "NC", nearby: ["Lillington", "Erwin", "Benson", "Fayetteville"] },
  { slug: "pittsboro-nc", name: "Pittsboro", county: "Chatham County", state: "NC", nearby: ["Chapel Hill", "Siler City", "Sanford", "Cary"] },
]

export function generateStaticParams() {
  return CITIES.map((city) => ({ city: city.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city: citySlug } = await params
  const city = CITIES.find((c) => c.slug === citySlug)
  if (!city) return {}
  return {
    title: `Roofing Supplement Software in ${city.name}, NC | Supplement Snap`,
    description: `Roofing contractors in ${city.name}, ${city.state} use Supplement Snap to capture hidden damage during tear-off, generate AI supplement reports, and email adjusters from the field.`,
    openGraph: {
      title: `Roofing Supplement Software in ${city.name}, NC | Supplement Snap`,
      description: `Roofing contractors in ${city.name}, ${city.state} use Supplement Snap to capture hidden damage during tear-off, generate AI supplement reports, and email adjusters.`,
    },
  }
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: citySlug } = await params
  const city = CITIES.find((c) => c.slug === citySlug)
  if (!city) return null

  return (
    <div className="bg-white text-zinc-900">
      <nav className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</div>
            <span className="text-lg font-bold tracking-tight">Supplement Snap</span>
          </Link>
          <NavLinks />
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">{city.name}, {city.state}</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          Roofing supplement software
          <br className="hidden sm:block" />
          <span className="text-indigo-600"> for {city.name} contractors</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-500">
          {city.name} roofing crews find hidden damage on every tear-off. Supplement Snap helps you capture it, document it, and send adjuster-ready reports — before you leave the job site.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/demo" className="w-full rounded-lg bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto">
            Book a Free Walkthrough
          </Link>
          <Link href="/pricing" className="w-full rounded-lg border border-zinc-300 bg-white px-7 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:w-auto">
            See Pricing
          </Link>
        </div>
      </section>

      {/* Problem */}
      <section className="border-t border-zinc-100 bg-zinc-50 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            The supplement problem {city.name} roofers face
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-500">
            During tear-off on homes across {city.name} and {city.county}, crews discover concealed damage — rotted decking, failed flashing, missing ice and water shield. This hidden damage qualifies for insurance supplements worth $1,500–$3,200 per job. But without proper documentation captured in real time, most of that money is left on the table.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { stat: "$2,400", label: "Average supplement recovered", desc: "Per documented tear-off job" },
              { stat: "2 min", label: "Time to capture a finding", desc: "Photo, tag, voice note — done" },
              { stat: "Same day", label: "Report to adjuster", desc: "PDF emailed before you leave" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-zinc-200 bg-white p-5 text-center shadow-sm">
                <p className="text-2xl font-extrabold text-indigo-600">{s.stat}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{s.label}</p>
                <p className="mt-1 text-xs text-zinc-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-zinc-100 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">How It Works</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Three steps from {city.name} roof to supplement
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              { num: "1", title: "Snap the damage", desc: `Your crew photographs hidden damage during tear-off on ${city.name} properties — decking, flashing, pipe boots, code violations — right from their phone.` },
              { num: "2", title: "Tag and describe", desc: "Select the damage type and roof area, add a voice note in any language. Everything syncs to the cloud instantly." },
              { num: "3", title: "Generate and send", desc: "AI writes a professional supplement narrative. Export a PDF and email it to the adjuster — all from the field." },
            ].map((step) => (
              <div key={step.num} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">{step.num}</div>
                <h3 className="text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-100 bg-zinc-50 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            What {city.name} contractors get with Supplement Snap
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              "Capture damage photos during tear-off from any phone",
              "Voice notes auto-translated to English (works in Spanish)",
              "AI-generated professional supplement narratives",
              "PDF reports with photos embedded inline",
              "Email reports directly to insurance adjusters",
              "Xactimate-ready CSV export with real line codes and pricing",
              "Insurance claim tracking (carrier, claim #, adjuster, date of loss)",
              "Claim pipeline — track from tear-off to approval",
              "Team access for crew, foreman, and office staff",
              "Upload EagleView reports and roof diagrams",
            ].map((f) => (
              <div key={f} className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-zinc-700">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local CTA */}
      <section className="border-t border-zinc-100 py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to recover more supplement revenue in {city.name}?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-500">
            Book a free 15-minute walkthrough. I&apos;ll screen share and show you how Supplement Snap works on a real project. No pitch — just a demo.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/demo" className="w-full rounded-lg bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto">
              Book a Free Walkthrough
            </Link>
            <Link href="/pricing" className="w-full rounded-lg border border-zinc-300 bg-white px-7 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:w-auto">
              See Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Nearby cities */}
      <section className="border-t border-zinc-100 bg-zinc-50 py-12">
        <div className="mx-auto max-w-4xl px-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">Also serving nearby areas</p>
          <div className="flex flex-wrap gap-2">
            {city.nearby.map((nearby) => {
              const nearbyCity = CITIES.find((c) => c.name === nearby)
              return nearbyCity ? (
                <Link
                  key={nearby}
                  href={`/roofing-supplement-software/${nearbyCity.slug}`}
                  className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm text-zinc-600 hover:border-indigo-200 hover:text-indigo-600"
                >
                  {nearby}, NC
                </Link>
              ) : (
                <span key={nearby} className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm text-zinc-500">
                  {nearby}, NC
                </span>
              )
            })}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="border-t border-zinc-100 py-12">
        <div className="mx-auto max-w-4xl px-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">Learn More</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { href: "/roofing-supplement-software", title: "Roofing Supplement Software" },
              { href: "/how-roofing-supplements-work", title: "How Supplements Work" },
              { href: "/roofing-supplement-documentation", title: "Supplement Documentation" },
            ].map((r) => (
              <Link key={r.href} href={r.href} className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:border-indigo-200 hover:text-indigo-600">
                {r.title} &rarr;
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
