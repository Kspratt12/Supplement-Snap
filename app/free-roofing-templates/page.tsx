import type { Metadata } from "next"
import Link from "next/link"
import { TrackedLink } from "../../lib/tracked-link"
import { NavLinks } from "../../lib/nav-links"
import { SiteFooter } from "../../lib/site-footer"
import { TEMPLATES } from "../../lib/templates"
import { DownloadBox } from "../blog/[slug]/download-box"

const URL = "https://supplementsnap.io/free-roofing-templates"
const TITLE = "Free Roofing Templates: Estimate, Supplement, Report"
const DESCRIPTION =
  "Free roofing templates: estimate, repair estimate, three-option proposal, supplement and damage report as PDF, fillable PDF, Word or Excel. No sign-up."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Supplement Snap" }] },
}

const CHECKLISTS = [
  { href: "/free-roofing-supplement-checklist", title: "Free supplement checklist", text: "Printable list of photos, measurements, notes and documents to have before you submit." },
  { href: "/blog/roof-inspection-checklist", title: "Roof inspection checklist", text: "Exterior, flashing, attic and decking, plus how to document findings." },
  { href: "/blog/roofing-photo-documentation-checklist", title: "Photo documentation checklist", text: "What to photograph before and during tear-off." },
  { href: "/blog/roofing-supplement-follow-up-log", title: "Supplement follow-up log", text: "A simple way to track what you sent and when to follow up." },
  { href: "/roofing-supplement-roi-calculator", title: "Software ROI calculator", text: "Check whether supplement software would pay for itself, using your own numbers." },
]

const FAQ = [
  {
    q: "Are these roofing templates really free?",
    a: "Yes. You can download them without an email address or an account. They are general guidance, not legal advice.",
  },
  {
    q: "Which format should I pick?",
    a: "PDF is for printing and filling in by hand. Fillable PDF lets you type into the blanks on screen and then save or print it; open it in a PDF reader such as Adobe Acrobat Reader, because some phone and browser previews do not support typing into forms. Word is for editing on a computer and adding your logo. The Excel version of the estimate calculates amounts and totals for you.",
  },
  {
    q: "Do I need to change anything before I use them?",
    a: "Yes. Fill in your own details and prices, and adjust the wording to your carrier's, client's and state's requirements. Licensing, written-contract and cancellation rules vary by state.",
  },
  {
    q: "What is the difference between an estimate and a supplement?",
    a: "An estimate is priced before the job and goes to the property owner. A supplement is prepared after tear-off and goes to the adjuster to request money for damage the carrier's estimate left out.",
  },
]

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
      { "@type": "ListItem", position: 2, name: "Free Roofing Templates", item: URL },
    ],
  },
]

export default function FreeRoofingTemplatesPage() {
  return (
    <div className="bg-white text-zinc-900">
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      <nav className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</div>
            <span className="text-lg font-bold tracking-tight">Supplement Snap</span>
          </Link>
          <NavLinks />
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Free tools</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Free Roofing Templates for Contractors</h1>
        <p className="mt-5 text-base leading-relaxed text-zinc-600">
          The templates roofers ask for most: estimates and proposals for the customer, a supplement package for the adjuster, and a damage report that backs up both. Download them as a printable PDF, a fillable PDF, Word or Excel. No email or account needed.
        </p>
        <p className="mt-3 text-sm text-zinc-500">
          These are starting points. Fill in your own details and prices, and adjust them to your carrier&apos;s, client&apos;s and state&apos;s requirements. They are general guidance, not legal advice.
        </p>

        <div className="mt-8">
          <h2 className="sr-only">All free templates</h2>
          {TEMPLATES.map((t) => (
            <div key={t.id}>
              <DownloadBox template={t} />
              <p className="-mt-4 mb-8 text-sm">
                <Link href={t.guideHref} className="font-medium text-indigo-600 underline hover:text-indigo-800">{t.guideLabel} &rarr;</Link>
              </p>
            </div>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-bold">Printable checklists on this site</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {CHECKLISTS.map((c) => (
              <Link key={c.href} href={c.href} className="rounded-lg border border-zinc-200 px-4 py-3 hover:border-indigo-200">
                <span className="block text-sm font-semibold text-zinc-800">{c.title} &rarr;</span>
                <span className="mt-1 block text-xs text-zinc-500">{c.text}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center">
          <h2 className="text-lg font-bold text-zinc-900">Found hidden damage after tear-off?</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Supplement Snap lets your crew photograph, tag and describe findings on the roof, then drafts the explanations for you to review and builds the PDF for the adjuster. Your first project is free.
          </p>
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <TrackedLink location="templates-start-free-project" href="/signup?trial=1" className="w-full rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 sm:w-auto">
              Start a Free Project
            </TrackedLink>
            <TrackedLink location="templates-sample-report" href="/roofing-supplement-report-example" className="w-full rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:w-auto">
              View a Sample Report
            </TrackedLink>
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
