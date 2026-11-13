import type { Metadata } from "next"
import Link from "next/link"
import { NavLinks } from "../../lib/nav-links"
import { SiteFooter } from "../../lib/site-footer"

export const metadata: Metadata = {
  alternates: { canonical: "https://supplementsnap.io/roofing-supplement-report-example" },
  title: "Roofing Supplement Report Example | Supplement Snap",
  description:
    "A fictional example of a roofing supplement report: findings, photo placement and explanations, and how a Supplement Snap report is built and reviewed.",
}

export default function SupplementReportExamplePage() {
  return (
    <div className="bg-white text-zinc-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://supplementsnap.io" },
              { "@type": "ListItem", position: 2, name: "Roofing Supplement Report Example", item: "https://supplementsnap.io/roofing-supplement-report-example" },
            ],
          }),
        }}
      />
      <nav className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="Supplement Snap home" className="flex min-h-[44px] items-center gap-2.5 sm:min-h-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</div>
            <span className="hidden whitespace-nowrap text-lg font-bold tracking-tight min-[480px]:inline">Supplement Snap</span>
          </Link>
          <NavLinks />
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Roofing Supplement Report Example
        </h1>

        <p className="mt-6 text-base leading-relaxed text-zinc-600">
          A supplement report is the document roofing contractors submit to insurance adjusters when hidden damage is discovered during tear-off. A clear, well-organized report gives the adjuster specific findings and photos to review. It does not guarantee coverage or approval.
        </p>

        <h2 className="mt-12 text-xl font-bold text-zinc-900">What a supplement report includes</h2>
        <div className="mt-4 space-y-3">
          {[
            { title: "Damage description", text: "A clear, factual explanation of what was found: the type of damage, severity, and why it was not visible before tear-off." },
            { title: "Supporting photos", text: "Photos taken during tear-off showing the exposed damage. These serve as primary evidence for the adjuster." },
            { title: "Location of damage", text: "The specific roof area where the damage was found: front slope, valley, chimney, eave edge, etc." },
            { title: "Explanation for adjusters", text: "A factual narrative of what was found and where, in the contractor's own words. Say the damage was concealed only when your notes support it." },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">{item.text}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-bold text-zinc-900">Sample report structure</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Demonstration report, not a customer claim. This is a web-page illustration with fictional names, addresses and findings, not an exported PDF from the app, and no insurer has reviewed or approved it.
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md">
          <div className="bg-indigo-600 px-6 py-3">
            <p className="text-xs font-semibold text-white tracking-wide">Supplement Snap | Project Report</p>
          </div>
          <div className="px-6 py-6">
            <p className="text-sm font-bold text-zinc-900">Smith Residence</p>
            <p className="mt-1 text-xs text-zinc-500">742 Evergreen Terrace, Springfield</p>
            <p className="text-xs text-zinc-500">Inspection Date: March 12, 2026</p>

            <div className="mt-5 h-px bg-zinc-200" />

            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Findings</p>

            <div className="mt-4 space-y-4">
              {[
                { num: "1", title: "Decking: Front Slope", desc: "Three sheets of rotted OSB decking discovered along the eave edge during tear-off. Wood was soft and deteriorated from prolonged moisture exposure." },
                { num: "2", title: "Flashing: Chimney", desc: "Step flashing along the chimney wall was severely corroded with multiple separation points. Counter flashing seal had failed at the mortar joint." },
                { num: "3", title: "Ice & Water Shield: Valley", desc: "No ice and water shield membrane present in the main valley. Local code and the shingle maker's instructions may require installation." },
              ].map((f) => (
                <div key={f.num} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">{f.num}</span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{f.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 h-px bg-zinc-200" />

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="aspect-square rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 border border-zinc-200" />
              <div className="aspect-square rounded-lg bg-gradient-to-br from-red-100 to-red-50 border border-zinc-200" />
              <div className="aspect-square rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 border border-zinc-200" />
            </div>
            <p className="mt-2 text-[10px] text-zinc-500">Photos attached to each finding appear in this area (placeholder squares in this illustration)</p>
          </div>
        </div>

        <p className="mt-8 text-base leading-relaxed text-zinc-600">
          On paid plans, Supplement Snap builds a PDF report from the photos and field notes you capture during tear-off. The app drafts a description for each finding with AI. You review and correct it, and check photos, quantities and any code references, before you download the PDF or email it to the adjuster.
        </p>

        <p className="mt-4 text-base leading-relaxed text-zinc-600">
          See how capture, review and sending fit together, and what each plan includes, on the <Link href="/roofing-supplement-software" className="font-medium text-indigo-600 underline hover:text-indigo-500">roofing supplement software workflow page</Link>.
        </p>

        <div className="mt-16 rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center">
          <h2 className="text-xl font-bold text-zinc-900">Build a report from your own findings</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
            Capture findings on a phone, review the drafted descriptions, and build a report to send when you are ready.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/signup?trial=1" className="w-full rounded-lg bg-indigo-600 px-7 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto">
              Start Free Project
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
