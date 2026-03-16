import type { Metadata } from "next"
import Link from "next/link"
import { NavLinks } from "../../lib/nav-links"

export const metadata: Metadata = {
  title: "Hidden Roof Damage Found During Tear-Off | Supplement Snap",
  description:
    "Common hidden roof damage discovered during tear-off including rotten decking, flashing failure, and missing ice and water shield. Learn why documentation matters.",
}

export default function HiddenRoofDamagePage() {
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
          Hidden Roof Damage Found During Tear-Off
        </h1>

        <p className="mt-6 text-base leading-relaxed text-zinc-600">
          Some of the most costly roof damage is invisible until the shingles come off. During tear-off, roofing crews regularly discover conditions that were concealed beneath existing materials — damage that was not and could not be identified during the initial insurance inspection. These findings often qualify for supplement claims if properly documented.
        </p>

        <h2 className="mt-12 text-xl font-bold text-zinc-900">Common discoveries during tear-off</h2>

        <div className="mt-6 space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-zinc-900">Rotten decking</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              OSB or plywood sheathing that has deteriorated from prolonged moisture exposure. Rotten decking is often found along eave edges, around penetrations, and in areas where leaks went undetected. The damage is completely hidden beneath the shingle layer until tear-off exposes it. Replacement decking must be installed before new roofing materials can go down.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-zinc-900">Flashing failure</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Step flashing and counter flashing around chimneys, walls, and roof-to-wall transitions often fails over time. Corrosion, separation from mortar joints, and improper original installation are common issues. These failures create water intrusion paths that are only visible once the surrounding shingles and underlayment are removed.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-zinc-900">Missing ice and water shield</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Current building codes require ice and water shield membrane in valleys, along eaves, and around penetrations. Older roofs were often installed without it. When tear-off reveals the absence of required underlayment, the contractor must install it to bring the roof into code compliance — an additional cost that qualifies for supplemental coverage.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-zinc-900">Code compliance issues</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Beyond ice and water shield, tear-off can reveal other code deficiencies — inadequate ventilation, improper drip edge, or insufficient starter strip. When current building codes require corrections, these items can be included in a supplement request with proper documentation.
            </p>
          </div>
        </div>

        <h2 className="mt-12 text-xl font-bold text-zinc-900">Why documenting these conditions matters</h2>
        <p className="mt-3 text-base leading-relaxed text-zinc-600">
          Every hidden condition discovered during tear-off is a potential supplement item — but only if the contractor documents it with clear photos, a description of the damage, and the location on the roof. Without documentation, the damage goes unreported, the supplement is never filed, and the contractor covers the cost out of pocket.
        </p>
        <p className="mt-3 text-base leading-relaxed text-zinc-600">
          The best time to capture this evidence is the moment the damage is exposed, before the new materials go down and the evidence is covered again.
        </p>

        <div className="mt-16 rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center">
          <h2 className="text-xl font-bold text-zinc-900">Capture hidden damage before it gets covered up</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
            Supplement Snap lets crews document concealed damage during tear-off and generate supplement reports for adjusters — right from the roof.
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

      <footer className="border-t border-zinc-100 py-10">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            &larr; Back to Supplement Snap
          </Link>
        </div>
      </footer>
    </div>
  )
}
