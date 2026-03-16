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
            <div className="relative bg-gradient-to-br from-indigo-50 to-zinc-50 p-4">
              {/* Browser frame */}
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
                <div className="flex items-center gap-1 border-b border-zinc-100 bg-zinc-50 px-2.5 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                </div>
                <div className="p-3">
                  <div className="mb-2 flex items-center gap-1.5">
                    <div className="flex h-4 w-4 items-center justify-center rounded bg-indigo-600 text-[6px] font-bold text-white">S</div>
                    <span className="text-[8px] font-bold text-zinc-700">Welcome back, Kelvin</span>
                  </div>
                  <div className="mb-2 rounded border border-zinc-100 p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[7px] font-semibold text-zinc-500">PLAN</span>
                      <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[6px] font-medium text-green-700">Active</span>
                    </div>
                    <p className="mt-1 text-[8px] font-semibold text-zinc-800">Starter</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between rounded border border-zinc-100 px-2 py-1.5">
                      <div>
                        <p className="text-[7px] font-semibold text-zinc-700">Smith Residence</p>
                        <p className="text-[6px] text-zinc-400">3 captures</p>
                      </div>
                      <span className="text-[6px] font-medium text-indigo-600">Open →</span>
                    </div>
                    <div className="flex items-center justify-between rounded border border-zinc-100 px-2 py-1.5">
                      <div>
                        <p className="text-[7px] font-semibold text-zinc-700">Johnson Property</p>
                        <p className="text-[6px] text-zinc-400">5 captures</p>
                      </div>
                      <span className="text-[6px] font-medium text-indigo-600">Open →</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-sm font-semibold text-zinc-900">Dashboard</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                Manage projects, track subscription status, and jump into any job.
              </p>
            </div>
          </div>

          {/* Card 2 — Capture */}
          <div className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm hover:shadow-md">
            <div className="relative bg-gradient-to-br from-indigo-50 to-zinc-50 p-4">
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
                <div className="flex items-center gap-1 border-b border-zinc-100 bg-zinc-50 px-2.5 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                </div>
                <div className="p-3">
                  <p className="mb-2 text-[7px] font-semibold uppercase tracking-wider text-zinc-400">New Capture</p>
                  <div className="mb-2 text-[7px] font-medium text-zinc-600">Photos (2)</div>
                  <div className="mb-2 grid grid-cols-3 gap-1">
                    <div className="aspect-square rounded bg-gradient-to-br from-amber-100 to-amber-50 border border-zinc-200" />
                    <div className="aspect-square rounded bg-gradient-to-br from-red-100 to-red-50 border border-zinc-200" />
                    <div className="flex aspect-square items-center justify-center rounded border-2 border-dashed border-zinc-200 bg-zinc-50">
                      <span className="text-[7px] text-zinc-400">+ Add</span>
                    </div>
                  </div>
                  <div className="mb-1.5 flex gap-1">
                    <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[6px] font-medium text-indigo-700">Decking</span>
                    <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[6px] font-medium text-zinc-600">Front</span>
                  </div>
                  <div className="rounded border border-zinc-100 px-1.5 py-1">
                    <p className="text-[6px] text-zinc-400">3 sheets of rotted decking found...</p>
                  </div>
                  <div className="mt-1.5 h-4 rounded bg-indigo-600 flex items-center justify-center">
                    <span className="text-[6px] font-semibold text-white">Save Capture</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-sm font-semibold text-zinc-900">Capture workflow</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                Photograph damage, tag roof areas, and add field notes from the field.
              </p>
            </div>
          </div>

          {/* Card 3 — Report */}
          <div className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm hover:shadow-md">
            <div className="relative bg-gradient-to-br from-indigo-50 to-zinc-50 p-4">
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
                <div className="bg-indigo-600 px-3 py-1.5">
                  <p className="text-[7px] font-semibold text-white">Supplement Snap — Project Report</p>
                </div>
                <div className="p-3">
                  <p className="text-[8px] font-bold text-zinc-800">Smith Residence</p>
                  <p className="text-[6px] text-zinc-400">742 Evergreen Terrace • Mar 12, 2026</p>
                  <div className="mt-2 h-px bg-zinc-100" />
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-start gap-1.5">
                      <span className="mt-0.5 flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[5px] font-bold text-indigo-700">1</span>
                      <div>
                        <p className="text-[7px] font-semibold text-zinc-700">Decking — Front</p>
                        <p className="text-[5px] text-zinc-400 leading-relaxed">Rotted OSB discovered along eave edge...</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="mt-0.5 flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[5px] font-bold text-indigo-700">2</span>
                      <div>
                        <p className="text-[7px] font-semibold text-zinc-700">Flashing — Chimney</p>
                        <p className="text-[5px] text-zinc-400 leading-relaxed">Step flashing corroded at chimney wall...</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="mt-0.5 flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[5px] font-bold text-indigo-700">3</span>
                      <div>
                        <p className="text-[7px] font-semibold text-zinc-700">Ice &amp; Water — Valley</p>
                        <p className="text-[5px] text-zinc-400 leading-relaxed">No I&amp;W shield present in valley...</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-1">
                    <div className="h-5 flex-1 rounded bg-gradient-to-br from-amber-100 to-amber-50 border border-zinc-200" />
                    <div className="h-5 flex-1 rounded bg-gradient-to-br from-red-100 to-red-50 border border-zinc-200" />
                    <div className="h-5 flex-1 rounded bg-gradient-to-br from-blue-100 to-blue-50 border border-zinc-200" />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-sm font-semibold text-zinc-900">Supplement report</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                Generate PDF reports with findings, narratives, and photos for adjusters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Damage Gets Documented */}
      <section className="border-t border-zinc-100 bg-zinc-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Documentation</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              What damage gets documented
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-zinc-500">
              During tear-off, crews capture the hidden issues that insurance supplements often miss.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {/* Rotten Decking */}
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex h-40 items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
                <svg className="h-14 w-14 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </div>
              <div className="p-5">
                <h3 className="text-sm font-semibold text-zinc-900">Rotten Decking</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                  Decking rot discovered during tear-off often requires additional sheathing replacement that must be documented for supplements.
                </p>
                <div className="mt-3 flex gap-1.5">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">Decking</span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">Front slope</span>
                </div>
              </div>
            </div>

            {/* Flashing Failure */}
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex h-40 items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
                <svg className="h-14 w-14 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div className="p-5">
                <h3 className="text-sm font-semibold text-zinc-900">Flashing Failure</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                  Step flashing or counter flashing failures around chimneys and walls require proper documentation for adjuster approval.
                </p>
                <div className="mt-3 flex gap-1.5">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">Flashing</span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">Chimney</span>
                </div>
              </div>
            </div>

            {/* Ice & Water Shield */}
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex h-40 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                <svg className="h-14 w-14 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div className="p-5">
                <h3 className="text-sm font-semibold text-zinc-900">Ice &amp; Water Shield Missing</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                  Code compliance issues like missing ice and water shield can be documented and added to supplement requests.
                </p>
                <div className="mt-3 flex gap-1.5">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">Ice &amp; Water</span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">Valley</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Report Preview */}
      <section className="border-t border-zinc-100 py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Output</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Adjuster-ready supplement reports
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-zinc-500">
              Generate clean documentation that can be sent directly to insurance adjusters.
            </p>
          </div>

          {/* Report document preview */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
            {/* Report header bar */}
            <div className="bg-indigo-600 px-6 py-3 sm:px-8">
              <p className="text-xs font-semibold text-white tracking-wide">Supplement Snap — Project Report</p>
            </div>

            <div className="px-6 py-6 sm:px-8 sm:py-8">
              {/* Project info */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-zinc-900">Smith Residence</h3>
                <div className="mt-2 space-y-0.5 text-sm text-zinc-500">
                  <p>Property Address: 742 Evergreen Terrace, Springfield</p>
                  <p>Date of Inspection: March 12, 2026</p>
                  <p>Findings: 3</p>
                </div>
              </div>

              <div className="h-px bg-zinc-200" />

              {/* Findings */}
              <div className="mt-6 mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Findings</p>
              </div>

              {/* Finding 1 */}
              <div className="mb-5">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">1</span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Decking — Front Slope</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                      During tear-off of the front slope, three sheets of rotted OSB decking were discovered along the eave edge. Wood was soft and deteriorated from prolonged moisture exposure. This damage was concealed beneath the existing shingles and underlayment.
                    </p>
                  </div>
                </div>
              </div>

              {/* Finding 2 */}
              <div className="mb-5">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">2</span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Flashing — Chimney</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                      Step flashing along the chimney wall was found to be severely corroded with multiple separation points. Counter flashing seal at the mortar joint had failed, allowing water intrusion behind the flashing system.
                    </p>
                  </div>
                </div>
              </div>

              {/* Finding 3 */}
              <div className="mb-6">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">3</span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Ice &amp; Water Shield — Valley</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                      No ice and water shield membrane was present in the main valley. Current building code requires ice and water shield in all valley areas. Installation is necessary to bring the roof system into compliance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-zinc-200" />

              {/* Photos section */}
              <div className="mt-6 mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Supporting Photos</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 border border-zinc-200" />
                  <p className="mt-1.5 text-[10px] text-zinc-400">Photo 1 — Decking rot exposure</p>
                </div>
                <div>
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-red-100 to-red-50 border border-zinc-200" />
                  <p className="mt-1.5 text-[10px] text-zinc-400">Photo 2 — Flashing corrosion</p>
                </div>
                <div>
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 border border-zinc-200" />
                  <p className="mt-1.5 text-[10px] text-zinc-400">Photo 3 — Valley underlayment absence</p>
                </div>
              </div>

              <div className="mt-6 h-px bg-zinc-200" />

              {/* Summary */}
              <div className="mt-6 rounded-lg bg-zinc-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Summary</p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                  3 supplement items documented during tear-off inspection. All findings represent concealed conditions not visible during initial inspection. Documentation and supporting photos are ready for adjuster review and supplement submission.
                </p>
              </div>

              {/* Footer */}
              <p className="mt-6 text-center text-[10px] text-zinc-300">Generated by Supplement Snap</p>
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

      {/* Real Supplement Examples */}
      <section className="border-t border-zinc-100 bg-zinc-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Proven Results</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Real supplement approvals from documented damage
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-zinc-500">
              When hidden conditions are properly documented during tear-off, adjusters approve the additional work. Here are examples of what crews recover.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-zinc-500">Hidden damage</p>
              <h3 className="mt-1 text-sm font-semibold text-zinc-900">Rotten decking discovered during tear-off</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-green-700">$3,200</span>
                <span className="text-sm font-medium text-green-600">approved</span>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-zinc-500">Hidden damage</p>
              <h3 className="mt-1 text-sm font-semibold text-zinc-900">Chimney flashing failure</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-green-700">$1,850</span>
                <span className="text-sm font-medium text-green-600">approved</span>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-zinc-500">Hidden damage</p>
              <h3 className="mt-1 text-sm font-semibold text-zinc-900">Ice and water shield missing in valley</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-green-700">$2,400</span>
                <span className="text-sm font-medium text-green-600">approved</span>
              </div>
            </div>
          </div>

          <p className="mt-10 text-center text-sm text-zinc-500">
            Documenting hidden conditions with photos and field notes helps increase the value of approved supplement claims.
          </p>
        </div>
      </section>

      {/* For Roofing Company Owners */}
      <section className="border-t border-zinc-100 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Business Impact</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Built for roofing companies that want to<br className="hidden sm:block" /> recover more supplement revenue
            </h2>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">1</div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900">Crews capture damage during tear-off</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                  Field crews document hidden damage the moment it&apos;s exposed — photos, damage type, location, and field notes captured on-site.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">2</div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900">Office receives organized documentation</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                  All findings are saved by project, organized with tags, and accessible from any device. No more hunting through text messages or photo rolls.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">3</div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900">Reports are ready to submit to adjusters</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                  Generate professional PDF reports with AI-written supplement language and email them directly to insurance adjusters the same day.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">4</div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900">More approved supplements means more revenue per job</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                  Every documented finding is a recoverable line item. Proper documentation turns missed damage into approved supplement dollars.
                </p>
              </div>
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
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-xs font-bold text-white">S</div>
              <span className="text-sm font-semibold">Supplement Snap</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400">
              <Link href="/terms" className="hover:text-zinc-600">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-zinc-600">Privacy Policy</Link>
              <Link href="/refund-policy" className="hover:text-zinc-600">Refund Policy</Link>
              <Link href="/demo" className="hover:text-zinc-600">Book a Demo</Link>
            </div>
            <p className="text-xs text-zinc-400">
              &copy; {new Date().getFullYear()} Supplement Snap
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
