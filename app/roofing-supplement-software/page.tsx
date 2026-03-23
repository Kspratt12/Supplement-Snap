import type { Metadata } from "next"
import Link from "next/link"
import { NavLinks } from "../../lib/nav-links"
import { SiteFooter } from "../../lib/site-footer"

export const metadata: Metadata = {
  title: "Roofing Supplement Software | Supplement Snap",
  description:
    "Capture hidden roofing damage during tear-off and generate supplement documentation for insurance adjusters. Built for roofing contractors.",
}

export default function RoofingSupplementSoftwarePage() {
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

      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Roofing Supplement Software
        </h1>

        <p className="mt-6 text-base leading-relaxed text-zinc-600">
          Insurance supplements are one of the biggest revenue opportunities in roofing restoration, and one of the most commonly missed. When hidden damage is discovered during tear-off and not properly documented, the supplement is never submitted, and the contractor absorbs the cost.
        </p>

        <h2 className="mt-12 text-xl font-bold text-zinc-900">Why supplements get missed</h2>
        <p className="mt-3 text-base leading-relaxed text-zinc-600">
          Most roofing crews discover concealed damage during tear-off: rotten decking, failed flashing, missing ice and water shield. But in the rush to keep the job moving, these findings rarely get documented with enough detail for an adjuster to approve a supplement. Photos end up buried in a phone camera roll. Notes get lost in text threads. By the time the office tries to file, the evidence is scattered or incomplete.
        </p>

        <h2 className="mt-12 text-xl font-bold text-zinc-900">Why documenting hidden damage matters</h2>
        <p className="mt-3 text-base leading-relaxed text-zinc-600">
          Insurance adjusters approve supplements based on evidence. If the damage was concealed under existing materials and discovered during tear-off, it qualifies for additional coverage, but only if it is properly documented with photos, damage descriptions, and location details. Without clear documentation, adjusters have no basis to approve the additional work.
        </p>

        <h2 className="mt-12 text-xl font-bold text-zinc-900">How software helps crews capture findings faster</h2>
        <p className="mt-3 text-base leading-relaxed text-zinc-600">
          Roofing supplement software gives field crews a simple way to photograph damage, tag the roof area and damage type, and add field notes, all from a phone during tear-off. Findings are saved by project and organized automatically. When the crew finishes, the office can generate a professional supplement report with AI-written damage narratives, export it as a PDF, and email it to the adjuster the same day.
        </p>
        <p className="mt-3 text-base leading-relaxed text-zinc-600">
          Instead of chasing photos and rewriting notes after the fact, the documentation is captured at the source, on the roof, in real time.
        </p>

        <div className="mt-16 rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center">
          <h2 className="text-xl font-bold text-zinc-900">Try Supplement Snap</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
            Supplement Snap helps roofing crews capture hidden damage during tear-off and generate adjuster-ready supplement reports, all from the field.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/demo" className="w-full rounded-lg bg-indigo-600 px-7 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto">
              Book a Demo
            </Link>
            <Link href="/pricing" className="w-full rounded-lg border border-zinc-300 bg-white px-7 py-3 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:w-auto">
              View Pricing
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
