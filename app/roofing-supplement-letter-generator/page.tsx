import type { Metadata } from "next"
import Link from "next/link"
import { TrackedLink } from "../../lib/tracked-link"
import { NavLinks } from "../../lib/nav-links"
import { SiteFooter } from "../../lib/site-footer"
import { LetterClient } from "./letter-client"

const URL = "https://supplementsnap.io/roofing-supplement-letter-generator"
const TITLE = "Free Roofing Supplement Letter and Email Generator"
const DESCRIPTION =
  "Free tool: fill in the claim details and the items you documented, and get a supplement request, follow-up or reinspection request email to copy or print. No login."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Supplement Snap" }] },
}

const FAQ = [
  {
    q: "What should a roofing supplement request letter include?",
    a: "The claim number, insured name, property address and date of loss; each item you documented with its location, quantity and what you observed; a list of what you are attaching, such as photos and measurements; and a clear request for the adjuster to review it and say what else they need.",
  },
  {
    q: "Does a well-written request guarantee the supplement is approved?",
    a: "No. The carrier decides based on the policy, the claim and the documentation. A clear, complete request makes the review easier, but it cannot guarantee coverage, approval or payment.",
  },
  {
    q: "Is anything I type here saved or sent?",
    a: "No. The letter is built in your browser from what you type. Nothing is sent to Supplement Snap or anyone else, nothing is saved, and it is gone when you close the tab. You copy or print it yourself.",
  },
  {
    q: "Is this written by AI?",
    a: "No. It is a fixed template filled in with your entries, so the letter only says what you typed plus neutral wording asking for a review. Read it and change anything that does not fit your job.",
  },
  {
    q: "Can I send this to the adjuster myself?",
    a: "That depends on your state and your agreement with the homeowner. Some states restrict what contractors can discuss with the insurer. Only use the on-behalf-of line when you have the homeowner's written authorization.",
  },
]

export default function LetterGeneratorPage() {
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
        { "@type": "ListItem", position: 2, name: "Roofing Supplement Letter Generator", item: URL },
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
          <Link href="/" aria-label="Supplement Snap home" className="flex min-h-[44px] items-center gap-2.5 sm:min-h-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</div>
            <span className="hidden whitespace-nowrap text-lg font-bold tracking-tight min-[480px]:inline">Supplement Snap</span>
          </Link>
          <NavLinks />
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="print:hidden">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Free tool</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Roofing Supplement Letter and Email Generator</h1>
          <p className="mt-5 text-base leading-relaxed text-zinc-600">
            Fill in the claim details and the items you documented, and this page writes a supplement request, a follow-up or a reinspection request you can copy into an email or print. It is a plain template: no login, no AI, and nothing you type leaves your browser.
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            A clear request can make the adjuster&apos;s review easier, but it does not guarantee coverage or approval. Requirements vary by carrier, policy and state.
          </p>
        </div>

        <div className="mt-10">
          <LetterClient />
        </div>

        <section className="mt-14 rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center print:hidden">
          <h2 className="text-lg font-bold text-zinc-900">Need the photos and report to go with it?</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Supplement Snap lets your crew photograph and describe each finding on the roof, keeps the photos with their notes, and builds the report you attach to this request. See <Link href="/roofing-supplement-software" className="font-medium text-indigo-600 underline hover:text-indigo-500">how the app captures and organizes findings</Link>.
          </p>
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <TrackedLink location="letter-generator-signup" href="/signup" className="w-full rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 sm:w-auto">
              Start Your Free Project
            </TrackedLink>
            <TrackedLink location="letter-generator-sample-report" href="/roofing-supplement-report-example" className="w-full rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:w-auto">
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
              { href: "/blog/roofing-supplement-email-to-adjuster", title: "How to Write a Supplement Email to an Adjuster" },
              { href: "/blog/how-to-write-a-roofing-supplement", title: "How to Write a Roofing Supplement" },
              { href: "/blog/roof-claim-reinspection-request", title: "How to Request a Roof Claim Reinspection" },
              { href: "/blog/roofing-supplement-follow-up-log", title: "Roofing Supplement Follow-Up Log" },
              { href: "/free-roofing-supplement-checklist", title: "Free Roofing Supplement Checklist" },
              { href: "/free-roofing-templates", title: "Free Roofing Templates (PDF, Word, Excel)" },
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
