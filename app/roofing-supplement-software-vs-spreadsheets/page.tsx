import type { Metadata } from "next"
import Link from "next/link"
import { TrackedLink } from "../../lib/tracked-link"
import { NavLinks } from "../../lib/nav-links"
import { SiteFooter } from "../../lib/site-footer"

const URL = "https://supplementsnap.io/roofing-supplement-software-vs-spreadsheets"
const TITLE = "Roofing Supplement Software vs. Spreadsheets"
const DESCRIPTION =
  "Compare roofing supplement software with spreadsheets and folders: time, organization, reports and recordkeeping, plus when a spreadsheet is enough."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Supplement Snap" }] },
}

const ROWS = [
  { area: "Capturing photos", sheet: "Photos taken in the phone camera, then moved to a folder by hand", software: "Photos captured and tagged to the project from the roof" },
  { area: "Linking photos to findings", sheet: "File names or a column of notes you maintain yourself", software: "Each photo attached to a finding, roof area and note when captured" },
  { area: "Writing narratives", sheet: "Typed from scratch or copied from an older job", software: "Draft narrative generated from your findings, which you review and edit" },
  { area: "Building the report", sheet: "Assembled in a document or PDF editor", software: "PDF report generated with photos and findings in a consistent layout" },
  { area: "Sending to the adjuster", sheet: "Email attachment sent from your inbox", software: "Report emailed from the project, with the send recorded" },
  { area: "Tracking status", sheet: "Rows you update by hand", software: "Claim details and project status kept with the job" },
  { area: "Cost", sheet: "Free apart from your time", software: "Monthly subscription (see pricing)" },
]

const FAQ = [
  {
    q: "Can I manage roofing supplements in a spreadsheet?",
    a: "Yes. Many contractors do, especially at low volume. A spreadsheet can track claim numbers, dates and status. The harder parts are keeping photos linked to findings and turning them into a clean report.",
  },
  {
    q: "When does roofing supplement software make sense?",
    a: "When paperwork is slowing jobs down, photos are getting lost or mislabeled, or several people need to work from the same record. Test it on one real job and compare the time from photos to a sendable package.",
  },
  {
    q: "Will software get more supplements approved?",
    a: "Software cannot guarantee approval. It can make documentation more complete and consistent, but coverage and approval depend on the claim, policy, carrier and what was found.",
  },
  {
    q: "Can I use both?",
    a: "Yes. Some teams keep a spreadsheet for company-wide tracking and use software to capture and report on each job.",
  },
]

export default function VsSpreadsheetsPage() {
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
        { "@type": "ListItem", position: 2, name: "Roofing Supplement Software", item: "https://supplementsnap.io/roofing-supplement-software" },
        { "@type": "ListItem", position: 3, name: "Software vs. Spreadsheets", item: URL },
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
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Roofing Supplement Software vs. Spreadsheets</h1>
        <p className="mt-6 text-base leading-relaxed text-zinc-600">
          Most roofing companies start managing supplements with a phone camera, a folder of photos and a spreadsheet. That can work. This page compares that setup with{" "}
          <Link href="/roofing-supplement-software" className="text-indigo-600 underline hover:text-indigo-800">roofing supplement software</Link>{" "}
          so you can decide when switching is worth it.
        </p>

        <h2 className="mt-12 text-xl font-bold">Side-by-side comparison</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Spreadsheet and folders</th>
                <th className="px-4 py-3">Supplement software</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {ROWS.map((r) => (
                <tr key={r.area} className="align-top">
                  <td className="px-4 py-3 font-semibold text-zinc-900">{r.area}</td>
                  <td className="px-4 py-3 text-zinc-600">{r.sheet}</td>
                  <td className="px-4 py-3 text-zinc-600">{r.software}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-12 text-xl font-bold">When a spreadsheet is enough</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-zinc-600">
          <li>You file only a few supplements a month.</li>
          <li>One person handles every claim from photos to submission.</li>
          <li>Your reports already go out quickly and adjusters respond without asking for more.</li>
        </ul>

        <h2 className="mt-10 text-xl font-bold">When software starts to pay off</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-zinc-600">
          <li>Crew photos arrive unlabeled and the office spends time matching them to findings.</li>
          <li>Writing the narrative and building the PDF takes longer than the roof visit.</li>
          <li>Several people touch the same claim and the latest version is unclear.</li>
          <li>You want a consistent report format on every job.</li>
        </ul>

        <h2 className="mt-10 text-xl font-bold">How to test it fairly</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-zinc-600">
          <li>Pick one active job with hidden damage.</li>
          <li>Prepare the package your usual way and time it from first photo to sendable PDF.</li>
          <li>Do the same job in Supplement Snap and time it again.</li>
          <li>Compare the two reports and what each costs at your volume.</li>
        </ol>
        <p className="mt-4 text-sm text-zinc-500">
          Software does not guarantee that a supplement is approved. Coverage and approval depend on the claim, policy, carrier and documentation.
        </p>

        <section className="mt-12 rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center">
          <h2 className="text-lg font-bold">Try it on one real job</h2>
          <p className="mt-2 text-sm text-zinc-600">Start a free project, or look at a sample report first.</p>
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <TrackedLink location="vs-spreadsheets-signup" href="/signup" className="w-full rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 sm:w-auto">
              Start Your Free Project
            </TrackedLink>
            <TrackedLink location="vs-spreadsheets-sample-report" href="/roofing-supplement-report-example" className="w-full rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:w-auto">
              View a Sample Report
            </TrackedLink>
          </div>
        </section>

        <h2 className="mt-12 text-xl font-bold">Frequently asked questions</h2>
        <div className="mt-4 divide-y divide-zinc-100 rounded-xl border border-zinc-200">
          {FAQ.map((f) => (
            <div key={f.q} className="p-5">
              <h3 className="text-base font-semibold">{f.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{f.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          {[
            { href: "/free-roofing-supplement-checklist", title: "Free Supplement Checklist" },
            { href: "/blog/roofing-supplement-template", title: "Roofing Supplement Template" },
          ].map((r) => (
            <Link key={r.href} href={r.href} className="rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 hover:border-indigo-200 hover:text-indigo-600">
              {r.title} &rarr;
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
