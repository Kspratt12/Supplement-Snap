import type { Metadata } from "next"
import Link from "next/link"
import { TrackedLink } from "../../lib/tracked-link"
import { NavLinks } from "../../lib/nav-links"
import { SiteFooter } from "../../lib/site-footer"
import { ChecklistClient } from "./checklist-client"

const URL = "https://supplementsnap.io/free-roofing-supplement-checklist"
const TITLE = "Free Roofing Supplement Checklist (Printable)"
const DESCRIPTION =
  "A free, printable roofing supplement checklist: photos, measurements, damage notes, documents and a final review before you submit to the adjuster."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Supplement Snap" }] },
}

const GROUPS = [
  {
    title: "Claim and job details",
    items: [
      "Carrier name, claim number and date of loss recorded",
      "Adjuster name, phone and email recorded",
      "Property address and homeowner name confirmed",
      "Copy of the carrier's original estimate saved with the job",
      "Date of tear-off and crew members on site noted",
    ],
  },
  {
    title: "Before tear-off photos",
    items: [
      "Overview photo of every slope, labeled by direction or slope name",
      "Close-ups of any visible damage the estimate already covers",
      "Photos of existing flashing, pipe boots, vents and valleys",
      "Photos of drip edge, starter and ridge conditions before removal",
    ],
  },
  {
    title: "Photos during and after tear-off",
    items: [
      "Wide shot of each exposed area, then a close-up of the condition",
      "A tape measure or other scale in frame where size matters",
      "Photos taken before any concealed condition is covered again",
      "Each photo labeled with roof area and what it shows",
      "Decking photos show the soft, rotted or damaged boards, not just the roof",
    ],
  },
  {
    title: "Measurements and quantities",
    items: [
      "Square footage or linear feet of each affected area recorded",
      "Number of decking sheets or boards affected counted",
      "Linear feet of flashing, drip edge or valley affected measured",
      "Pipe boots, vents and other counted items totaled",
      "Measurements match what the written notes and line items say",
    ],
  },
  {
    title: "Written findings",
    items: [
      "One short, factual note per finding: what, where and why it was not visible earlier",
      "Notes describe what was observed, not assumptions about cause or coverage",
      "Code or manufacturer requirements cited only where you can point to the source",
      "Each finding tied to the photo or photos that show it",
    ],
  },
  {
    title: "Line items and supporting documents",
    items: [
      "Each finding mapped to the estimate line item it supports",
      "Quantities and units on line items match the measurements",
      "Aerial measurement report or roof diagram attached if available",
      "Material invoices or receipts attached where relevant",
      "Any carrier request or denial reason saved for reference",
    ],
  },
  {
    title: "Final review before submitting",
    items: [
      "Open the report as the adjuster would and confirm every photo loads and is readable",
      "Spelling, claim number and address checked",
      "Nothing in the package claims more than the photos and notes show",
      "Submission date and method recorded",
      "Follow-up date set so the request does not sit unanswered",
    ],
  },
]

const FAQ = [
  {
    q: "What is a roofing supplement checklist?",
    a: "A checklist of the photos, measurements, notes and documents a roofing contractor gathers before submitting a supplement request to an insurance adjuster, so nothing is missing when the package goes out.",
  },
  {
    q: "Does a complete checklist guarantee the supplement is approved?",
    a: "No. Approval depends on the claim, the policy, the carrier and the documentation together. A checklist helps you submit a complete, organized package, but it cannot guarantee coverage or payment.",
  },
  {
    q: "Is this checklist really free?",
    a: "Yes. You can use it on this page, print it or save it as a PDF from your browser. You do not need an account.",
  },
  {
    q: "How is this different from using Supplement Snap?",
    a: "The checklist tells you what to gather. Supplement Snap helps you capture those photos and notes on the roof and turns them into an organized report for the adjuster.",
  },
]

export default function FreeChecklistPage() {
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://supplementsnap.io" },
        { "@type": "ListItem", position: 2, name: "Free Roofing Supplement Checklist", item: URL },
      ],
    },
  ]

  return (
    <div className="bg-white text-zinc-900">
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      <nav className="border-b border-zinc-100 print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</div>
            <span className="text-lg font-bold tracking-tight">Supplement Snap</span>
          </Link>
          <NavLinks />
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Free tool</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Free Roofing Supplement Checklist</h1>
        <p className="mt-5 text-base leading-relaxed text-zinc-600">
          Use this checklist before you submit a roofing supplement. It covers the photos, measurements, written findings and supporting documents adjusters look for, plus a final review. Check items off as you go, then print it or save it as a PDF.
        </p>
        <p className="mt-3 text-sm text-zinc-500">
          Better documentation can support a claim, but it does not guarantee coverage or approval. Requirements vary by carrier, policy and jurisdiction.
        </p>

        <div className="mt-10">
          <ChecklistClient groups={GROUPS} />
        </div>

        <section className="mt-14 rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center print:hidden">
          <h2 className="text-lg font-bold text-zinc-900">Capture all of this from your phone</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Supplement Snap lets your crew photograph, label and describe findings on the roof, then builds the report for the adjuster.
          </p>
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <TrackedLink location="checklist-signup" href="/signup" className="w-full rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 sm:w-auto">
              Start Your Free Project
            </TrackedLink>
            <TrackedLink location="checklist-sample-report" href="/roofing-supplement-report-example" className="w-full rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:w-auto">
              View a Sample Report
            </TrackedLink>
          </div>
        </section>

        <section className="mt-14 print:hidden">
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

        <section className="mt-14 print:hidden">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Related guides</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { href: "/blog/roofing-photo-documentation-checklist", title: "Roofing Photo Documentation Checklist" },
              { href: "/blog/roofing-supplement-template", title: "Roofing Supplement Template" },
              { href: "/free-roofing-templates", title: "Free Roofing Templates (PDF, Word, Excel)" },
              { href: "/roofing-supplement-documentation", title: "Roofing Supplement Documentation" },
              { href: "/roofing-supplement-software", title: "Roofing Supplement Software" },
            ].map((r) => (
              <Link key={r.href} href={r.href} className="rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 hover:border-indigo-200 hover:text-indigo-600">
                {r.title} &rarr;
              </Link>
            ))}
          </div>
        </section>
      </main>
      <div className="print:hidden">
        <SiteFooter />
      </div>
    </div>
  )
}
