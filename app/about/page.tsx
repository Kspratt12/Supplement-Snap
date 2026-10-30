import type { Metadata } from "next"
import Link from "next/link"
import { TrackedLink } from "../../lib/tracked-link"
import { NavLinks } from "../../lib/nav-links"
import { SiteFooter } from "../../lib/site-footer"

const URL = "https://supplementsnap.io/about"
const TITLE = "About Supplement Snap | Roofing Supplement Software"
const DESCRIPTION = "Supplement Snap is roofing supplement documentation software built by Kelvin Spratt to help contractors capture hidden damage and report it clearly."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Supplement Snap" }] },
}

export default function AboutPage() {
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Supplement Snap",
      url: "https://supplementsnap.io",
      logo: "https://supplementsnap.io/favicon.png",
      founder: { "@type": "Person", name: "Kelvin Spratt", jobTitle: "Founder" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://supplementsnap.io" },
        { "@type": "ListItem", position: 2, name: "About", item: URL },
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
          <Link href="/" aria-label="Supplement Snap home" className="flex min-h-[44px] items-center gap-2.5 sm:min-h-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</div>
            <span className="hidden whitespace-nowrap text-lg font-bold tracking-tight min-[480px]:inline">Supplement Snap</span>
          </Link>
          <NavLinks />
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">About Supplement Snap</h1>
        <p className="mt-6 text-base leading-relaxed text-zinc-600">
          Supplement Snap is documentation software for roofing contractors. It helps crews capture hidden damage found during tear-off, organize photos and field notes, and generate a clear report for the insurance adjuster.
        </p>

        <h2 className="mt-12 text-xl font-bold">Who builds it</h2>
        <div className="mt-4 flex flex-col items-start gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6 sm:flex-row">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700">KS</div>
          <div>
            <p className="text-lg font-bold">Kelvin Spratt</p>
            <p className="text-sm text-zinc-500">Founder</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Kelvin builds software for roofing contractors who want their supplement paperwork to match the work they did on the roof. His background is in software development and insurance restoration workflows.
            </p>
          </div>
        </div>

        <h2 className="mt-12 text-xl font-bold">What Supplement Snap does</h2>
        <p className="mt-4 text-base leading-relaxed text-zinc-600">
          Crews photograph hidden damage during tear-off, tag the roof area, and add a note by typing or by voice. Supplement Snap keeps each photo and note together by finding, drafts the written description for you to review, and builds a PDF report that can be emailed to the adjuster from the project. Team plans add shared access, adjuster email open tracking and an Xactimate-style CSV export, a starting list you review and price yourself.
        </p>
        <p className="mt-3 text-base leading-relaxed text-zinc-600">
          It is a web app that works from a phone browser, so a crew does not need special equipment. It is built for insurance restoration roofing, not as a replacement for a CRM, aerial measurements or estimating software. You can read how the process works in <Link href="/how-roofing-supplements-work" className="text-indigo-600 underline hover:text-indigo-800">how roofing supplements work</Link>, or see the output in the <Link href="/roofing-supplement-report-example" className="text-indigo-600 underline hover:text-indigo-800">sample supplement report</Link>.
        </p>

        <h2 className="mt-12 text-xl font-bold">What we believe</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-zinc-600">
          <li>Good documentation is factual: what was found, where, and the photos that show it.</li>
          <li>Software can organize evidence and save time, but it cannot guarantee coverage or approval.</li>
          <li>Contractors should see real output before they pay, which is why there is a sample report and a free project.</li>
        </ul>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <TrackedLink location="about-signup" href="/signup" className="rounded-lg bg-indigo-600 px-6 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-500">
            Start Your Free Project
          </TrackedLink>
          <TrackedLink location="about-sample-report" href="/roofing-supplement-report-example" className="rounded-lg border border-zinc-300 px-6 py-2.5 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
            View a Sample Report
          </TrackedLink>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
