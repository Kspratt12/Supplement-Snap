import Link from "next/link"
import { NavLinks } from "../lib/nav-links"
import { SiteFooter } from "../lib/site-footer"
import { InteractiveDemo } from "./components/interactive-demo"
import { CheckoutButton } from "./pricing/checkout-button"

const homepageFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "How long does it take to set up?", acceptedAnswer: { "@type": "Answer", text: "About 5 minutes. Create an account, start a project, and your crew can begin capturing damage immediately from any phone." } },
    { "@type": "Question", name: "Does it work without cell service?", acceptedAnswer: { "@type": "Answer", text: "Photos and voice notes are saved on your phone. Once you have signal, everything syncs automatically. You just need a connection to generate the AI supplement draft." } },
    { "@type": "Question", name: "Do I need special equipment?", acceptedAnswer: { "@type": "Answer", text: "No. Any smartphone with a camera works. Your crew is already carrying everything they need." } },
    { "@type": "Question", name: "Can my office staff see what the crew captures?", acceptedAnswer: { "@type": "Answer", text: "Yes. Everything is saved to the cloud by project. Office staff can log in from any device and see all captures, notes, and reports." } },
    { "@type": "Question", name: "What if my crew speaks Spanish?", acceptedAnswer: { "@type": "Answer", text: "Voice notes are automatically translated to English. Your crew speaks in their language, and the system converts it for the supplement report." } },
    { "@type": "Question", name: "Is $99/month worth it for one crew?", acceptedAnswer: { "@type": "Answer", text: "One approved supplement typically recovers $1,500–$3,200. At $99/month with no setup fees, the platform pays for itself on the first job." } },
  ],
}

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Supplement Snap",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, iOS, Android",
  description: "Roofing supplement software that helps contractors capture hidden damage during tear-off, generate AI supplement drafts, and send adjuster-ready PDF reports in minutes.",
  url: "https://supplementsnap.io",
  offers: [
    { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free", description: "1 demo project" },
    { "@type": "Offer", price: "99", priceCurrency: "USD", name: "Starter", description: "Unlimited projects, 1 user", priceSpecification: { "@type": "UnitPriceSpecification", price: "99", priceCurrency: "USD", unitText: "MONTH" } },
    { "@type": "Offer", price: "199", priceCurrency: "USD", name: "Team", description: "Up to 3 users, Xactimate export", priceSpecification: { "@type": "UnitPriceSpecification", price: "199", priceCurrency: "USD", unitText: "MONTH" } },
    { "@type": "Offer", price: "299", priceCurrency: "USD", name: "Pro", description: "Up to 5 users, priority support", priceSpecification: { "@type": "UnitPriceSpecification", price: "299", priceCurrency: "USD", unitText: "MONTH" } },
  ],
  author: { "@type": "Organization", name: "Supplement Snap", url: "https://supplementsnap.io" },
}

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Supplement Snap",
  url: "https://supplementsnap.io",
  logo: "https://supplementsnap.io/favicon.png",
  description: "Roofing supplement software for contractors. Capture hidden damage, generate reports, recover more revenue.",
  founder: { "@type": "Person", name: "Kelvin Spratt" },
  sameAs: [],
}

export default function LandingPage() {
  return (
    <div className="bg-white text-zinc-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageFaqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
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
          Capture Damage, Generate Reports,
          <br className="hidden sm:block" />
          <span className="text-indigo-600">Recover More on Every Roof</span>
        </h1>
        <p className="mx-auto mt-4 text-sm font-medium text-zinc-400">Join roofing teams recovering $2,400+ per supplement</p>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-zinc-500 sm:text-xl">
          Stop leaving money on the table during tear-off. Supplement Snap helps roofing crews
          capture hidden damage, generate supplement documentation, and email adjuster-ready
          PDF reports, all in minutes.
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
        <div className="mx-auto mt-6 flex items-center gap-2 justify-center">
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">New</span>
          <span className="text-sm text-zinc-500">Try your first project free, no credit card required</span>
        </div>
      </section>

      {/* Revenue Impact — moved up for maximum persuasion */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
          <div className="border-b border-zinc-100 px-6 py-4 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Typical Roof Claim</p>
            <p className="mt-1 text-2xl font-extrabold text-zinc-900 sm:text-3xl">$12,000</p>
          </div>
          <div className="border-b border-zinc-100 px-6 py-4 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Hidden Damage Found During Tear-Off</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Rotten decking", "Flashing failure", "Missing ice & water shield"].map((item) => (
                <span key={item} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">{item}</span>
              ))}
            </div>
          </div>
          <div className="border-b border-zinc-100 bg-green-50 px-6 py-4 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-700">Supplement Approved</p>
            <p className="mt-1 text-2xl font-extrabold text-green-700 sm:text-3xl">+$3,200</p>
          </div>
          <div className="px-6 py-4 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Final Claim Value</p>
            <p className="mt-1 text-2xl font-extrabold text-indigo-600 sm:text-3xl">$15,200</p>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Every documented item is a line item the adjuster can approve. When damage goes undocumented, the money stays on the table.
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
                  <p className="text-[7px] font-semibold text-white">Supplement Snap | Project Report</p>
                </div>
                <div className="p-3">
                  <p className="text-[8px] font-bold text-zinc-800">Smith Residence</p>
                  <p className="text-[6px] text-zinc-400">742 Evergreen Terrace • Mar 12, 2026</p>
                  <div className="mt-2 h-px bg-zinc-100" />
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-start gap-1.5">
                      <span className="mt-0.5 flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[5px] font-bold text-indigo-700">1</span>
                      <div>
                        <p className="text-[7px] font-semibold text-zinc-700">Decking: Front</p>
                        <p className="text-[5px] text-zinc-400 leading-relaxed">Rotted OSB discovered along eave edge...</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="mt-0.5 flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[5px] font-bold text-indigo-700">2</span>
                      <div>
                        <p className="text-[7px] font-semibold text-zinc-700">Flashing: Chimney</p>
                        <p className="text-[5px] text-zinc-400 leading-relaxed">Step flashing corroded at chimney wall...</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="mt-0.5 flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[5px] font-bold text-indigo-700">3</span>
                      <div>
                        <p className="text-[7px] font-semibold text-zinc-700">Ice &amp; Water: Valley</p>
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

      {/* Interactive Walkthrough */}
      <section className="mx-auto max-w-3xl px-6 pb-20">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">See It In Action</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            From roof to report in 4 steps
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-500">
            Watch how your crew captures damage and sends a professional supplement report, all from the field.
          </p>
        </div>
        <InteractiveDemo />
      </section>

      {/* Social Proof */}
      <section className="border-t border-zinc-100 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Trusted by Contractors</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Roofers are recovering more with Supplement Snap
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              {
                quote: "We used to lose supplement money on every tear-off because nobody had time to document it properly. Now my crew snaps photos, adds a voice note, and the report is in the adjuster's inbox before we leave the job site.",
                name: "Marcus T.",
                role: "Owner, 12-man crew",
                metric: "$3,200 recovered on first job",
              },
              {
                quote: "The AI draft saves my office manager 2 hours per supplement. She used to type everything from scratch. Now she just reviews what Supplement Snap generates and hits send.",
                name: "David R.",
                role: "Project Manager",
                metric: "2+ hours saved per supplement",
              },
              {
                quote: "My guys speak Spanish on the roof. They record a voice note in Spanish, and it shows up in English in the report. That alone was worth the subscription. No more miscommunication between field and office.",
                name: "Carlos M.",
                role: "Restoration Company Owner",
                metric: "Zero lost-in-translation issues",
              },
            ].map((t) => (
              <div key={t.name} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-zinc-600">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-4 border-t border-zinc-100 pt-4">
                  <p className="text-sm font-semibold text-zinc-900">{t.name}</p>
                  <p className="text-xs text-zinc-500">{t.role}</p>
                  <p className="mt-2 inline-block rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">{t.metric}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-zinc-400">
            <span>Used by roofing teams across NC, TX, FL, and CO</span>
            <span className="hidden sm:inline text-zinc-200">|</span>
            <span className="font-medium text-zinc-600">Average supplement recovered: $2,400</span>
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className="border-t border-zinc-100 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">The Difference</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Without Supplement Snap vs. with it
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {/* Without */}
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-red-900">Without Supplement Snap</h3>
              </div>
              <div className="space-y-3">
                {[
                  "Crew texts blurry photos to the office",
                  "Field notes scribbled on paper or forgotten",
                  "Office spends hours writing supplement from memory",
                  "Documentation submitted days or weeks later",
                  "Adjuster denies supplement due to insufficient evidence",
                  "You leave $1,500–$3,200 on the table per job",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-red-800">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* With */}
            <div className="rounded-xl border border-green-200 bg-green-50/50 p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-green-900">With Supplement Snap</h3>
              </div>
              <div className="space-y-3">
                {[
                  "Crew captures labeled photos from the roof",
                  "Voice notes auto-transcribed (any language)",
                  "AI generates professional supplement narrative",
                  "PDF report emailed to adjuster the same day",
                  "Adjuster gets clear evidence with every finding",
                  "You recover $1,500–$3,200 more per job",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-green-800">{item}</span>
                  </div>
                ))}
              </div>
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
              <p className="text-xs font-semibold text-white tracking-wide">Supplement Snap | Project Report</p>
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
                    <p className="text-sm font-semibold text-zinc-900">Decking: Front Slope</p>
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
                    <p className="text-sm font-semibold text-zinc-900">Flashing: Chimney</p>
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
                    <p className="text-sm font-semibold text-zinc-900">Ice &amp; Water Shield: Valley</p>
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
                  <p className="mt-1.5 text-[10px] text-zinc-400">Photo 1: Decking rot exposure</p>
                </div>
                <div>
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-red-100 to-red-50 border border-zinc-200" />
                  <p className="mt-1.5 text-[10px] text-zinc-400">Photo 2: Flashing corrosion</p>
                </div>
                <div>
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 border border-zinc-200" />
                  <p className="mt-1.5 text-[10px] text-zinc-400">Photo 3: Valley underlayment absence</p>
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

      {/* Built for Insurance Restoration */}
      <section className="border-t border-zinc-100 bg-zinc-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Insurance-Ready</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Built for insurance restoration workflows
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-zinc-500">
              Track claims from tear-off to approval. Everything adjusters need, organized the way your team works.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Claim Tracking",
                desc: "Insurance company, claim number, policy, date of loss, and adjuster contact, all attached to every project.",
                icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
              },
              {
                title: "Photos in Reports",
                desc: "Damage photos are embedded directly in your PDF report. Adjusters see the evidence right next to the narrative.",
                icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z",
              },
              {
                title: "Xactimate Pricing",
                desc: "CSV export maps to real Xactimate line codes with unit pricing. Import directly, no manual entry.",
                icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
              },
              {
                title: "Roof Diagrams",
                desc: "Attach EagleView reports or roof sketches to any project. Everything the adjuster needs in one place.",
                icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                  <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-zinc-900">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{item.desc}</p>
              </div>
            ))}
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
              Your crew captures damage on-site. The office gets a professional supplement draft, ready to submit.
            </p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">1</div>
              <h3 className="text-base font-semibold">Snap the damage</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                During tear-off, your crew photographs each area of damage (decking, flashing, pipe boots, code violations) right from their phone.
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
                One click generates a professional supplement draft, exports a PDF report, and emails it to the adjuster, all from the field.
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
                Photos, tags, voice notes, and AI-generated supplement language, captured in real time during tear-off.
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
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-12 sm:grid-cols-2 sm:items-start">
            {/* Left — title and description */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Why Roofers Choose It</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Built for real roofing workflows
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-500">
                Supplement Snap was designed around real roofing supplement workflows. From tear-off inspections to adjuster documentation, every step is built to help crews capture hidden damage and generate clear supplement reports.
              </p>
            </div>

            {/* Right — feature list */}
            <div>
              <div className="space-y-0">
                {[
                  "Capture hidden damage during tear-off from any phone",
                  "Document decking rot, flashing failure, and code violations",
                  "Organize findings by roof area and project address",
                  "Generate professional supplement language instantly",
                  "Export clean reports ready for adjuster review",
                  "Send documentation to the office or adjuster the same day",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 border-b border-zinc-200 py-3 last:border-0">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-zinc-700">{item}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-zinc-400">
                Designed to work in the field during real roofing tear-offs.
              </p>
            </div>
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
            <p className="mx-auto mt-4 max-w-xl text-base text-zinc-500">
              One approved supplement pays for the entire platform.
            </p>
          </div>

          <div className="mx-auto mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl">
            {/* Free */}
            <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wider text-green-600">Free</p>
              <p className="mt-1 text-xs text-zinc-400">Try it on your next job</p>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-zinc-900">$0</span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">No credit card required</p>
              <div className="mt-5 flex-1 space-y-2.5">
                {["1 demo project", "Damage photo capture", "AI supplement draft", "Voice notes", "See sample PDF"].map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <svg className="h-4 w-4 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span className="text-sm text-zinc-700">{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/signup" className="mt-6 block w-full rounded-lg border border-zinc-300 bg-white px-6 py-3 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                Start Free Project
              </Link>
            </div>

            {/* Starter */}
            <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Starter</p>
              <p className="mt-1 text-xs text-zinc-400">For solo crews</p>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-zinc-900">$99</span>
                <span className="ml-1 text-sm text-zinc-500">/month</span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">14-day free trial, no credit card</p>
              <div className="mt-5 flex-1 space-y-2.5">
                {["Unlimited projects", "AI supplement drafts", "PDF reports & email", "Photo annotations", "Voice notes", "1 user"].map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <svg className="h-4 w-4 flex-shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span className="text-sm text-zinc-700">{f}</span>
                  </div>
                ))}
              </div>
              <CheckoutButton plan="starter" label="Buy Now" />
            </div>

            {/* Team */}
            <div className="flex flex-col rounded-2xl border-2 border-indigo-600 bg-white p-7 shadow-lg relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">Most Popular</div>
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Team</p>
              <p className="mt-1 text-xs text-zinc-400">For small crews (2-3)</p>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-zinc-900">$199</span>
                <span className="ml-1 text-sm text-zinc-500">/month</span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">14-day free trial, no credit card</p>
              <div className="mt-5 flex-1 space-y-2.5">
                {["Everything in Starter", "Up to 3 team members", "PDF reports & email", "Xactimate CSV export", "Email open tracking"].map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <svg className="h-4 w-4 flex-shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span className="text-sm text-zinc-700">{f}</span>
                  </div>
                ))}
              </div>
              <CheckoutButton plan="team" label="Buy Now" />
            </div>

            {/* Pro */}
            <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Pro</p>
              <p className="mt-1 text-xs text-zinc-400">For teams up to 5</p>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-zinc-900">$299</span>
                <span className="ml-1 text-sm text-zinc-500">/month</span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">14-day free trial, no credit card</p>
              <div className="mt-5 flex-1 space-y-2.5">
                {["Everything in Team", "Up to 5 team members", "Priority support", "Dedicated onboarding", "Custom branding"].map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <svg className="h-4 w-4 flex-shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span className="text-sm text-zinc-700">{f}</span>
                  </div>
                ))}
              </div>
              <CheckoutButton plan="pro" label="Buy Now" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-zinc-100 py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">FAQ</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Common questions from contractors
            </h2>
          </div>
          <div className="mt-12 space-y-0 divide-y divide-zinc-200">
            {[
              {
                q: "How long does it take to set up?",
                a: "About 5 minutes. Create an account, start a project, and your crew can begin capturing damage immediately from any phone."
              },
              {
                q: "Does it work without cell service?",
                a: "Photos and voice notes are saved on your phone. Once you have signal, everything syncs automatically. You just need a connection to generate the AI supplement draft."
              },
              {
                q: "Do I need special equipment?",
                a: "No. Any smartphone with a camera works. Your crew is already carrying everything they need."
              },
              {
                q: "Can my office staff see what the crew captures?",
                a: "Yes. Everything is saved to the cloud by project. Office staff can log in from any device and see all captures, notes, and reports."
              },
              {
                q: "What if my crew speaks Spanish?",
                a: "Voice notes are automatically translated to English. Your crew speaks in their language, and the system converts it for the supplement report."
              },
              {
                q: "Is $99/month worth it for one crew?",
                a: "One approved supplement typically recovers $1,500–$3,200. At $99/month with no setup fees, the platform pays for itself on the first job."
              },
            ].map((faq) => (
              <div key={faq.q} className="py-5">
                <h3 className="text-sm font-semibold text-zinc-900">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{faq.a}</p>
              </div>
            ))}
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
            Try your first project free, or book a demo to see how Supplement Snap helps your crew document damage and recover more supplement revenue.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup?trial=1"
              className="w-full rounded-lg bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto"
            >
              Start Free Project
            </Link>
            <Link
              href="/demo"
              className="w-full rounded-lg border border-zinc-300 bg-white px-7 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:w-auto"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Roofing Supplement Resources */}
      <section className="border-t border-zinc-100 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Learn More</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Roofing Supplement Resources
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-zinc-500">
              Learn how roofing supplements work, what documentation adjusters expect, and how contractors capture hidden damage during tear-off.
            </p>
          </div>

          {/* Resource Pages */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: "/roofing-supplement-software", title: "Roofing Supplement Software", desc: "Why supplements get missed and how software helps crews capture findings faster." },
              { href: "/roofing-supplement-report-example", title: "Supplement Report Example", desc: "See what a professional supplement report looks like and what it includes." },
              { href: "/how-roofing-supplements-work", title: "How Roofing Supplements Work", desc: "The step-by-step process from hidden damage discovery to adjuster approval." },
              { href: "/hidden-roof-damage-tear-off", title: "Hidden Damage During Tear-Off", desc: "Common concealed conditions crews find when shingles come off." },
              { href: "/roofing-supplement-documentation", title: "Supplement Documentation", desc: "What documentation adjusters expect and how to capture it during tear-off." },
            ].map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
              >
                <h3 className="text-sm font-semibold text-zinc-900">{r.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{r.desc}</p>
                <p className="mt-3 text-xs font-medium text-indigo-600">Read more &rarr;</p>
              </Link>
            ))}
          </div>

          {/* Featured Blog Articles */}
          <div className="mt-16">
            <h3 className="text-center text-lg font-bold text-zinc-900">From the Blog</h3>
            <p className="mt-2 text-center text-sm text-zinc-500">Guides and real numbers for roofing contractors</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { href: "/blog/roof-tear-off-cost", title: "Roof Tear-Off Cost in 2026", desc: "What tear-offs actually cost by size, material, and pitch, plus hidden costs and how to recover them." },
                { href: "/blog/best-roof-estimating-software", title: "Best Roof Estimating Software", desc: "Compare satellite measurement, estimating, CRM, and supplement tools for roofing contractors." },
                { href: "/blog/roof-replacement-estimate-vs-final-cost", title: "Estimate vs. Final Cost", desc: "Why the initial estimate is always lower and how supplements bridge the gap." },
                { href: "/blog/hail-damage-roof-inspection", title: "Hail Damage Roof Inspection", desc: "What adjusters miss, hidden damage found during tear-off, and how to document for supplements." },
                { href: "/blog/roofing-software-comparison", title: "CRM vs. Estimating vs. Supplement Tools", desc: "The three categories of roofing software and where the revenue gap hides." },
                { href: "/blog/xactimate-roof-estimate-supplements", title: "Xactimate Roof Estimate Guide", desc: "Line codes, pricing benchmarks, and how to format supplements adjusters approve fast." },
              ].map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
                >
                  <h3 className="text-sm font-semibold text-zinc-900">{r.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{r.desc}</p>
                  <p className="mt-3 text-xs font-medium text-indigo-600">Read article &rarr;</p>
                </Link>
              ))}
            </div>
          </div>

          {/* View All Button */}
          <div className="mt-12 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              View All Guides & Resources
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}
