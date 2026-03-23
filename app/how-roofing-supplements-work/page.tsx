import type { Metadata } from "next"
import Link from "next/link"
import { NavLinks } from "../../lib/nav-links"
import { SiteFooter } from "../../lib/site-footer"

export const metadata: Metadata = {
  title: "How Roofing Supplements Work | Supplement Snap",
  description:
    "Learn the roofing supplement process from hidden damage discovery to adjuster approval. Understand how proper documentation improves supplement approval rates.",
}

export default function HowRoofingSupplementsWorkPage() {
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
          How Roofing Supplements Work
        </h1>

        <p className="mt-6 text-base leading-relaxed text-zinc-600">
          A roofing supplement is an additional claim submitted to an insurance company when hidden damage is discovered that was not included in the original estimate. Supplements are a standard part of the roofing restoration process and represent legitimate additional work that the insurance policy covers.
        </p>

        <h2 className="mt-12 text-xl font-bold text-zinc-900">The supplement process</h2>

        <div className="mt-6 space-y-6">
          {[
            {
              step: "1",
              title: "Initial insurance estimate",
              text: "The insurance adjuster inspects the property and writes an initial estimate covering visible damage, typically shingle replacement, felt, and basic materials. This estimate is based on what can be seen from the ground or a non-invasive inspection.",
            },
            {
              step: "2",
              title: "Hidden damage discovered during tear-off",
              text: "Once the roofing crew begins tear-off, they uncover damage that was concealed beneath existing shingles and underlayment. Common discoveries include rotten decking, failed flashing, missing ice and water shield, and code compliance issues.",
            },
            {
              step: "3",
              title: "Documentation required",
              text: "To request additional coverage for these items, the contractor must provide clear evidence: photographs of the exposed damage, written descriptions of each finding, and the specific location on the roof where the damage was found.",
            },
            {
              step: "4",
              title: "Supplement submitted to insurance",
              text: "The contractor submits a supplement report to the adjuster with documentation of the concealed damage. The report explains that the damage was not visible during the initial inspection and was only discovered after materials were removed.",
            },
            {
              step: "5",
              title: "Adjuster review and approval",
              text: "The insurance adjuster reviews the supplement documentation. If the evidence is clear and the damage qualifies under the policy, the adjuster approves additional payment for the work. Supplements with strong documentation (clear photos, professional narratives, and organized findings) have higher approval rates.",
            },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                {item.step}
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-500">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-bold text-zinc-900">Better documentation improves approval rates</h2>
        <p className="mt-3 text-base leading-relaxed text-zinc-600">
          The difference between a supplement that gets approved and one that gets denied often comes down to the quality of the documentation. Adjusters need clear, organized evidence to justify additional payments. When findings are documented with photos, professional damage narratives, and specific roof locations, the adjuster has everything they need to approve the claim.
        </p>
        <p className="mt-3 text-base leading-relaxed text-zinc-600">
          Contractors who document damage in real time during tear-off, rather than trying to reconstruct notes later, consistently produce stronger supplement packages.
        </p>

        <div className="mt-16 rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center">
          <h2 className="text-xl font-bold text-zinc-900">Document supplements the right way</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
            Supplement Snap helps roofing crews capture hidden damage during tear-off and generate adjuster-ready documentation in minutes.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/signup" className="w-full rounded-lg bg-indigo-600 px-7 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto">
              Start Free Trial
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
