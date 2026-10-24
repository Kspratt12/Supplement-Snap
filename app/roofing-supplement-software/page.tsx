import type { Metadata } from "next"
import Link from "next/link"
import { NavLinks } from "../../lib/nav-links"
import { SiteFooter } from "../../lib/site-footer"
import { TrackedLink } from "../../lib/tracked-link"

const URL = "https://supplementsnap.io/roofing-supplement-software"
const TITLE = "Roofing Supplement Software for Contractors | Supplement Snap"
const DESCRIPTION =
  "Roofing supplement software that helps crews capture hidden damage at tear-off, organize photos and notes, and send adjuster-ready PDF reports."

export const metadata: Metadata = {
  alternates: { canonical: URL },
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Supplement Snap" }] },
}

const STEPS = [
  { num: "1", title: "Capture on the roof", desc: "Photograph the damage from a phone, tag the roof area and damage type, and add a note by typing or by voice." },
  { num: "2", title: "Annotate and organize", desc: "Mark photos with circles, arrows and labels. Findings are saved to the project so nothing ends up in a camera roll." },
  { num: "3", title: "Generate the report", desc: "Create an AI-drafted supplement narrative for each finding, then review and edit it before it goes out." },
  { num: "4", title: "Send it to the adjuster", desc: "Export a PDF and email it from the project. Team plans can see when the adjuster opens the email." },
]

const FEATURES = [
  { title: "Field photo capture", text: "Take damage photos during tear-off and keep them attached to the finding they support." },
  { title: "Voice-to-note", text: "Speak the note instead of typing it with gloves on. Voice notes in Spanish are translated to English for the report." },
  { title: "Photo annotations", text: "Circles, arrows and labels point the adjuster to exactly what you want them to see." },
  { title: "AI-drafted narratives", text: "Get a first draft of the written description for each finding. You review and edit every one." },
  { title: "PDF reports", text: "Photos, findings and notes in one consistent document, ready to attach or email." },
  { title: "Xactimate-ready CSV export", text: "On the Team plan, export a starting list of line items to review and bring into your estimate." },
]

const FAQ = [
  {
    q: "What is roofing supplement software?",
    a: "Roofing supplement software helps contractors capture hidden damage found during tear-off, organize photos and notes by finding, and produce a report to send to the insurance adjuster.",
  },
  {
    q: "Will it get my supplements approved?",
    a: "No software can guarantee that. Coverage and approval depend on the claim, the policy and the carrier. Supplement Snap helps you present what you found clearly and completely.",
  },
  {
    q: "Do I need special equipment?",
    a: "No. Any smartphone with a camera works. It is a web app you use in the browser.",
  },
  {
    q: "Does it replace Xactimate?",
    a: "No. You still estimate and price in your own tools. The Team plan exports a starting list of line items you review and bring into your estimate.",
  },
  {
    q: "How much does it cost?",
    a: "Paid plans start at $99 a month, and every paid plan begins with a 14-day free trial (a card is required, and you can cancel before the trial ends). You can also start a free project first. See the pricing page for current details.",
  },
  {
    q: "Is it just for insurance work?",
    a: "It is built for documenting hidden damage and preparing supplement reports for insurance claims. If you mainly need a CRM or aerial measurements, it is not designed to replace those.",
  },
]

export default function RoofingSupplementSoftwarePage() {
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
        { "@type": "ListItem", position: 2, name: "Roofing Supplement Software", item: URL },
      ],
    },
  ]

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

      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Roofing Supplement Software</h1>

        <p className="mt-6 text-base leading-relaxed text-zinc-600">
          Roofing supplement software helps contractors capture hidden damage found at tear-off, keep the photos, notes and measurements together by finding, and send the insurance adjuster a clear report. Supplement Snap is built for that one job, from the roof to the PDF.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <TrackedLink location="software-hero-start-free" href="/signup" className="rounded-lg bg-indigo-600 px-7 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
            Start Your Free Project
          </TrackedLink>
          <TrackedLink location="software-hero-sample-report" href="/roofing-supplement-report-example" className="rounded-lg border border-zinc-300 bg-white px-7 py-3 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
            View a Sample Report
          </TrackedLink>
        </div>
        <p className="mt-3 text-xs text-zinc-500">Coverage and approval depend on the claim, the policy and the carrier. Software cannot guarantee a result.</p>

        <h2 className="mt-14 text-xl font-bold text-zinc-900">Why supplements get missed</h2>
        <p className="mt-3 text-base leading-relaxed text-zinc-600">
          Crews find concealed damage during tear-off: soft decking, failed flashing, missing ice and water barrier. But the job keeps moving, and the evidence rarely gets recorded in a form an adjuster can verify. Photos sit in a camera roll. Notes live in text threads. By the time the office writes the supplement, the roof is covered and the details are gone.
        </p>
        <p className="mt-3 text-base leading-relaxed text-zinc-600">
          Adjusters review requests based on evidence. A request with clear photos, locations, measurements and a factual note is easier to review than one that has to be reconstructed later. Capturing it on the roof, at the moment you see it, is the simplest fix.
        </p>

        <h2 className="mt-14 text-xl font-bold text-zinc-900">How it works</h2>
        <div className="mt-6 space-y-4">
          {STEPS.map((s) => (
            <div key={s.num} className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">{s.num}</div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="mt-14 text-xl font-bold text-zinc-900">What you get</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
              <h3 className="text-sm font-semibold text-zinc-900">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600">{f.text}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-14 text-xl font-bold text-zinc-900">Who it is for, and who it is not</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-green-200 bg-green-50 p-5">
            <h3 className="text-sm font-semibold text-zinc-900">A good fit if you</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-zinc-700">
              <li>Work insurance restoration jobs and find hidden damage at tear-off</li>
              <li>Lose time matching photos to notes after the roof is covered</li>
              <li>Want a consistent report format on every job</li>
              <li>Have a crew that needs a simple, phone-based workflow</li>
            </ul>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-zinc-900">Not built for</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-zinc-700">
              <li>Replacing a roofing CRM or scheduling tool</li>
              <li>Aerial or satellite roof measurements</li>
              <li>Replacing your estimating software</li>
              <li>Guaranteeing a claim outcome</li>
            </ul>
          </div>
        </div>

        <h2 className="mt-14 text-xl font-bold text-zinc-900">Software, spreadsheets or a photo app?</h2>
        <p className="mt-3 text-base leading-relaxed text-zinc-600">
          Plenty of roofers start with a camera roll and a spreadsheet, and that can work at low volume. The trade-offs are covered in <Link href="/roofing-supplement-software-vs-spreadsheets" className="text-indigo-600 underline hover:text-indigo-800">software vs. spreadsheets</Link> and <Link href="/blog/companycam-alternative-roofing-supplements" className="text-indigo-600 underline hover:text-indigo-800">photo apps vs. supplement tools</Link>. If you are not sure what you need yet, start with the <Link href="/free-roofing-supplement-checklist" className="text-indigo-600 underline hover:text-indigo-800">free supplement checklist</Link>.
        </p>

        <h2 className="mt-14 text-xl font-bold text-zinc-900">Learn the workflow</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { href: "/how-roofing-supplements-work", title: "How roofing supplements work" },
            { href: "/hidden-roof-damage-tear-off", title: "Hidden roof damage at tear-off" },
            { href: "/roofing-supplement-documentation", title: "Supplement documentation guide" },
            { href: "/blog/xactimate-roofing-estimate-example", title: "Xactimate roofing estimate example" },
            { href: "/blog/best-roofing-supplement-software", title: "Best roofing supplement software compared" },
          ].map((r) => (
            <Link key={r.href} href={r.href} className="rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 hover:border-indigo-200 hover:text-indigo-600">
              {r.title} &rarr;
            </Link>
          ))}
        </div>

        <h2 className="mt-14 text-xl font-bold text-zinc-900">Frequently asked questions</h2>
        <div className="mt-4 divide-y divide-zinc-100 rounded-xl border border-zinc-200">
          {FAQ.map((f) => (
            <div key={f.q} className="p-5">
              <h3 className="text-base font-semibold text-zinc-900">{f.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{f.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center">
          <h2 className="text-xl font-bold text-zinc-900">Try it on one real job</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
            Start a free project, or book a short demo. Paid plans start at $99 a month with a 14-day free trial.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <TrackedLink location="software-bottom-start-free" href="/signup" className="w-full rounded-lg bg-indigo-600 px-7 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto">
              Start Your Free Project
            </TrackedLink>
            <TrackedLink location="software-bottom-demo" href="/demo" className="w-full rounded-lg border border-zinc-300 bg-white px-7 py-3 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:w-auto">
              Book a Demo
            </TrackedLink>
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
