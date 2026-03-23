import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "../../../lib/site-footer"
import { NavLinks } from "../../../lib/nav-links"

type Article = {
  slug: string
  title: string
  metaTitle: string
  metaDescription: string
  publishedDate: string
  sections: Array<{ heading: string; content: string }>
}

const ARTICLES: Article[] = [
  {
    slug: "how-to-write-a-roofing-supplement",
    title: "How to Write a Roofing Supplement That Gets Approved",
    metaTitle: "How to Write a Roofing Supplement for Insurance | Step-by-Step Guide",
    metaDescription: "Learn how to write a roofing supplement that insurance adjusters approve. Step-by-step guide with documentation tips, Xactimate codes, and common mistakes to avoid.",
    publishedDate: "2026-03-10",
    sections: [
      {
        heading: "What is a roofing supplement?",
        content: "A roofing supplement is a request for additional payment beyond the original insurance estimate. When your crew tears off an existing roof and discovers concealed damage — rotted decking, failed flashing, missing ice and water shield, deteriorated pipe boots — that damage wasn't visible during the initial adjuster inspection. The supplement documents this hidden damage and requests the insurance carrier to cover the cost of repairing it.\n\nSupplements are one of the most overlooked revenue opportunities in roofing. The average supplement recovers $1,500–$3,200 per job, yet most contractors either skip them entirely or submit weak documentation that gets denied."
      },
      {
        heading: "Why most roofing supplements get denied",
        content: "The number one reason supplements get denied is insufficient documentation. An adjuster who wasn't on your roof needs to see clear evidence of concealed damage. If your supplement is just a line item in Xactimate with no photos, no description of where the damage was found, and no explanation of why it wasn't visible before tear-off — it's going to be denied.\n\nOther common reasons for denial include submitting too late (weeks after the job), using vague descriptions like 'additional work needed,' not referencing building codes that require the repair, and failing to explain why the damage was concealed."
      },
      {
        heading: "Step 1: Document damage during tear-off",
        content: "The most important step happens on the roof during tear-off. When your crew discovers hidden damage, they need to capture it immediately — before it gets covered up by new materials.\n\nFor each finding, document:\n\n• Clear photographs showing the damage in context (wide shot) and up close (detail shot)\n• The exact location on the roof (front slope, back slope, valley, chimney, eave, ridge)\n• The type of damage (rotted decking, corroded flashing, missing ice and water shield, deteriorated pipe boot)\n• A description of the condition — how many sheets of decking, how many linear feet of flashing, etc.\n• Measurements when possible — square footage of affected area, number of sheets to replace\n\nThis is where most contractors fail. The crew finds damage, maybe takes a blurry photo, texts it to the office, and by the time someone writes up the supplement days later, half the details are lost or forgotten."
      },
      {
        heading: "Step 2: Write a professional supplement narrative",
        content: "The supplement narrative is the written explanation that accompanies your photos and Xactimate line items. This is what the adjuster reads to understand what was found and why it needs to be covered.\n\nA strong supplement narrative should include:\n\n• A statement that the damage was concealed and not visible during the initial inspection\n• A description of when and how the damage was discovered (during tear-off operations)\n• Specific details about the damage — type, location, extent, measurements\n• An explanation of why the repair is necessary (structural integrity, building code compliance, manufacturer warranty requirements)\n• Reference to applicable building codes when relevant (e.g., ice and water shield requirements in valleys and eaves)\n\nAvoid vague language. Instead of 'decking was damaged,' write 'Three sheets of 1/2-inch CDX plywood along the eave edge of the front slope were found to be severely deteriorated from prolonged moisture exposure. The wood was soft and crumbling upon removal of the existing shingles, indicating concealed water damage not visible during the initial inspection.'"
      },
      {
        heading: "Step 3: Map to Xactimate line codes",
        content: "Insurance adjusters work in Xactimate. If you want your supplement approved quickly, submit it in their language. Each type of damage maps to specific Xactimate line codes:\n\n• Decking replacement: RFG SHTHN (sheathing - plywood/OSB)\n• Felt/underlayment: RFG RFLT30 (30# roofing felt)\n• Step flashing: RFG FLSH (flashing - step/counter)\n• Pipe boots: RFG VENT (roof vent - pipe jack)\n• Drip edge: RFG DRIP (drip edge - aluminum)\n• Ice and water shield: RFG I&WS (ice & water membrane)\n• Additional layer removal: RFG TEAR (remove additional layer)\n\nInclude accurate quantities and measurements. A supplement that says '1 SQ of decking' when photos show three full sheets of plywood gets flagged. Be precise."
      },
      {
        heading: "Step 4: Submit with photos and PDF report",
        content: "Package everything into a clean, professional report. The best supplement submissions include:\n\n• A cover page with project name, property address, date, insurance company, and claim number\n• Each finding with its photos, description, and supplement narrative\n• A findings summary table\n• Supporting photos labeled with what they show\n• A certification statement that the damage was concealed and discovered during tear-off\n\nEmail the report directly to the adjuster the same day you find the damage. Speed matters — the sooner you submit, the fresher the documentation, and the faster you get paid."
      },
      {
        heading: "How Supplement Snap automates this process",
        content: "Supplement Snap was built to solve this exact workflow. Your crew captures damage photos during tear-off, tags the damage type and roof area, and adds a voice note describing what they found (works in any language — Spanish voice notes are auto-translated to English).\n\nThe system uses AI to generate a professional supplement narrative from the field data. You can export an Xactimate-ready CSV with the correct line codes and pricing, and email a complete PDF report to the adjuster — all from the field, the same day.\n\nOne tap from the roof to a professional supplement submission. No more lost photos, forgotten details, or supplements that sit in the office for weeks."
      },
    ],
  },
  {
    slug: "roofing-supplement-denied-what-to-do",
    title: "Roofing Supplement Denied? Here's What to Do Next",
    metaTitle: "Roofing Supplement Denied? What to Do Next | Contractor Guide",
    metaDescription: "Your roofing supplement was denied by the insurance company. Here's what to do next — from re-documenting damage to filing appeals and preventing future denials.",
    publishedDate: "2026-03-12",
    sections: [
      {
        heading: "Why your roofing supplement was denied",
        content: "Getting a supplement denied is frustrating, especially when you know the damage is real and the repair was necessary. But understanding why it was denied is the first step to getting it approved on appeal or preventing it from happening on the next job.\n\nThe most common denial reasons are:\n\n• Insufficient documentation — photos are blurry, too few, or don't show the damage clearly\n• Vague or missing narrative — no written explanation of what was found and why it should be covered\n• Late submission — the supplement was filed weeks or months after the work was done\n• Not clearly concealed — the adjuster argues the damage should have been visible during the initial inspection\n• Incorrect Xactimate codes — line items don't match what's standard for the repair\n• Missing building code reference — the repair is required by code but you didn't cite it"
      },
      {
        heading: "Step 1: Review the denial reason",
        content: "Read the denial letter carefully. Insurance companies are required to state why the supplement was denied. The reason tells you exactly what to fix in your appeal.\n\nIf the denial says 'insufficient documentation,' you need better photos and a more detailed narrative. If it says 'pre-existing damage,' you need to explain why the damage was concealed and couldn't have been identified before tear-off. If it says 'not in scope,' you may need to reference building codes that require the repair."
      },
      {
        heading: "Step 2: Gather additional evidence",
        content: "Go back to your documentation. Do you have:\n\n• Clear photos of the damage taken during tear-off?\n• Photos showing the damage was under the existing shingles/materials (proving concealment)?\n• Measurements and quantities?\n• A description of the location on the roof?\n\nIf your original documentation was weak, this is why tools like Supplement Snap exist — they force proper documentation at the point of discovery, so you never end up in this situation."
      },
      {
        heading: "Step 3: Write a stronger narrative",
        content: "Your appeal narrative should directly address the denial reason. If the adjuster said 'insufficient evidence of concealed damage,' your narrative should explain:\n\n• The damage was located beneath existing roofing materials and could not be identified during a standard visual inspection\n• The damage was discovered during tear-off operations on [specific date]\n• Attached photos show the condition of the area after removal of existing materials\n• The repair is necessary to restore the roof system to its pre-loss condition\n\nBe specific, be professional, and reference your photos by number."
      },
      {
        heading: "Step 4: Resubmit with a complete package",
        content: "Resubmit the supplement as a complete package — not just a reply to the denial. Include a fresh PDF report with all photos, narratives, Xactimate line items, and a cover letter referencing the original claim number and explaining why the supplement should be reconsidered.\n\nRequest a re-inspection if the denial was based on the adjuster not seeing the damage. You may also escalate to a supervisor or file a complaint with your state's Department of Insurance if you believe the denial was unjustified."
      },
      {
        heading: "How to prevent supplement denials in the future",
        content: "The best defense against supplement denials is proper documentation captured in real time during tear-off. This means:\n\n• Photograph every finding immediately — multiple angles, context and detail shots\n• Document the location, damage type, and extent before covering it with new materials\n• Write or record a description of what was found (voice notes work great for this)\n• Submit the supplement the same day — don't wait\n• Use Xactimate-standard line codes and accurate quantities\n• Reference building codes when the repair is code-required\n\nSuplement Snap automates all of this. Your crew captures damage from the roof, the system generates the documentation, and you email it to the adjuster before the crew leaves the job site."
      },
    ],
  },
  {
    slug: "xactimate-codes-for-roofing-supplements",
    title: "Xactimate Codes for Roofing Supplements: Complete Reference",
    metaTitle: "Xactimate Codes for Roofing Supplements | Complete Code List",
    metaDescription: "Complete list of Xactimate line codes for roofing supplements — decking, flashing, ice & water shield, pipe boots, drip edge, tear-off, and more.",
    publishedDate: "2026-03-08",
    sections: [
      {
        heading: "Why Xactimate codes matter for supplements",
        content: "Insurance adjusters use Xactimate to estimate repair costs. When you submit a supplement using the same line codes and format the adjuster works in, your supplement gets processed faster and has a higher approval rate.\n\nSubmitting a supplement as a plain-text description forces the adjuster to translate your findings into Xactimate themselves — which means they might use lower-cost codes, miss line items, or simply deny the supplement because it's too much work to process."
      },
      {
        heading: "Decking and sheathing codes",
        content: "When rotted or damaged decking is found during tear-off:\n\n• RFG SHTHN — Sheathing, plywood/OSB, 1/2\" CDX — used for replacing damaged decking. Measured in SF (square feet). National average: ~$2.18/SF\n• RFG RFLT30 — Roofing felt, 30# — underlayment that goes over new decking. Measured in SF. National average: ~$0.52/SF\n\nAlways measure the actual area of damaged decking. Count sheets if possible — a standard sheet is 4x8 (32 SF). Include photos showing the rotted wood with context of where it sits on the roof."
      },
      {
        heading: "Flashing codes",
        content: "For failed or corroded flashing:\n\n• RFG FLSH — Flashing, step/counter, aluminum — remove and replace. Measured in LF (linear feet). National average: ~$8.75/LF\n• RFG FLSHC — Flashing, counter/cap — remove and replace. Measured in LF. National average: ~$6.50/LF\n\nDocument the type of flashing (step, counter, valley), the material (aluminum, galvanized), and the location (chimney, wall, skylight). Photograph both the removed flashing and the area it was protecting."
      },
      {
        heading: "Ice and water shield codes",
        content: "For missing or deteriorated ice and water membrane:\n\n• RFG I&WS — Ice & water shield membrane, install. Measured in SF. National average: ~$1.85/SF\n\nThis is one of the most common supplement items because many older roofs were installed without ice and water shield in areas where current building codes now require it (valleys, eaves, around penetrations). Always reference the applicable building code in your supplement narrative."
      },
      {
        heading: "Vent and pipe boot codes",
        content: "For damaged pipe boots and roof vents:\n\n• RFG VENT — Roof vent, pipe jack/boot, remove and replace. Measured in EA (each). National average: ~$85.00/EA\n\nPipe boots deteriorate over time and are often cracked or separated when discovered during tear-off. Document each pipe boot individually with photos."
      },
      {
        heading: "Drip edge codes",
        content: "For missing or damaged drip edge:\n\n• RFG DRIP — Drip edge, aluminum, remove and replace. Measured in LF (linear feet). National average: ~$4.25/LF\n\nDrip edge is required by most building codes and is a common supplement item when the original installation didn't include it or it has corroded."
      },
      {
        heading: "Additional layer removal codes",
        content: "For roofs with multiple layers:\n\n• RFG TEAR — Remove additional layer of roofing. Measured in SQ (squares, 100 SF). National average: ~$45.00/SQ\n• RFG HAUL — Haul debris, additional roofing layer. Measured in SQ. National average: ~$22.50/SQ\n\nMultiple layers are only discovered during tear-off. Document the number of layers found and photograph the cross-section showing multiple layers of shingles."
      },
      {
        heading: "How Supplement Snap handles Xactimate codes",
        content: "Supplement Snap automatically maps each damage type to the correct Xactimate line codes with sub-items and unit pricing. When you export the Xactimate CSV, each capture generates the appropriate line items with quantities and national average pricing.\n\nFor example, a 'Decking' capture automatically generates both the sheathing replacement line (RFG SHTHN) and the felt underlayment line (RFG RFLT30). A 'Multiple Layers' capture generates both the tear-off line (RFG TEAR) and the haul debris line (RFG HAUL).\n\nThis saves your office staff from manually looking up codes and pricing, and ensures nothing gets missed in the export."
      },
    ],
  },
  {
    slug: "how-much-do-roofing-supplements-pay",
    title: "How Much Do Roofing Supplements Pay? Real Numbers for Contractors",
    metaTitle: "How Much Do Roofing Supplements Pay? | Real Revenue Numbers",
    metaDescription: "How much do roofing supplements actually pay? Real revenue data from contractors — average supplement values, what gets approved, and how to maximize recovery.",
    publishedDate: "2026-03-14",
    sections: [
      {
        heading: "The short answer: $1,500–$3,200 per job",
        content: "On a typical residential roof replacement with an insurance claim value of $10,000–$15,000, the average supplement recovery is $1,500–$3,200. This represents hidden damage found during tear-off that wasn't included in the original adjuster estimate.\n\nSome jobs yield more, some less. A simple re-roof on a ranch-style home might only produce $800–$1,200 in supplementable items. A complex roof with multiple penetrations, valleys, and older construction can produce $4,000–$6,000 in supplements."
      },
      {
        heading: "What items contribute to supplement value",
        content: "The most valuable supplement items by average recovery:\n\n• Decking replacement (3+ sheets): $200–$600 — the most common supplement item\n• Step and counter flashing (chimney or wall): $300–$800 — often corroded and hidden\n• Ice and water shield (valleys + eaves): $200–$500 — code-required, often missing on older roofs\n• Multiple layer removal: $400–$1,000 — only discovered during tear-off\n• Pipe boot replacement (multiple): $85–$340 — cracked boots are extremely common\n• Drip edge (full perimeter): $150–$400 — missing on many older homes\n\nOn a single job, a crew might find 3–5 of these items, pushing the total supplement value into the $1,500–$3,200 range."
      },
      {
        heading: "How many jobs have supplementable damage?",
        content: "Experienced restoration contractors report that 70–90% of insurance tear-offs have at least one supplementable finding. The damage is almost always there — the question is whether your crew documents it.\n\nThe problem isn't finding the damage. The problem is that most crews don't have a system to capture it properly in the moment. By the time someone in the office tries to write up the supplement from memory and a few blurry photos, the opportunity is lost."
      },
      {
        heading: "The math: what supplements mean for your business",
        content: "Let's say your company does 10 insurance roof replacements per month:\n\n• Without supplements: 10 jobs × $12,000 average = $120,000/month\n• With supplements ($2,400 avg): 10 jobs × $14,400 average = $144,000/month\n• Additional annual revenue: $288,000\n\nThat's $288,000 in revenue that was already there — on jobs you were already doing. You're not finding new customers. You're just capturing the money that was hiding under the shingles.\n\nEven a solo crew doing 4 jobs per month recovers an additional $115,200/year with proper supplement documentation."
      },
      {
        heading: "Why most contractors leave this money on the table",
        content: "The gap between 'finding damage' and 'recovering supplement money' is documentation. Most contractors fall into one of these traps:\n\n• Crew finds damage but doesn't photograph it properly\n• Photos get lost in text messages between crew and office\n• Office doesn't have time to write up supplements for every job\n• Supplement gets submitted weeks later with weak documentation\n• Adjuster denies it due to insufficient evidence\n\nThe solution is capturing documentation at the point of discovery — on the roof, during tear-off, in real time. That's exactly what Supplement Snap was built for."
      },
      {
        heading: "How to start recovering supplements today",
        content: "You don't need to change your entire workflow. Start with your next tear-off:\n\n1. When your crew finds hidden damage, have them photograph it and tag what it is\n2. Add a quick voice note describing the damage\n3. Generate an AI supplement narrative from the field data\n4. Email a PDF report to the adjuster before you leave the job site\n\nSupplement Snap handles all four steps. The platform starts at $99/month with a 14-day free trial — and pays for itself on the first job with a single approved supplement."
      },
    ],
  },
  {
    slug: "roofing-supplement-process-explained",
    title: "The Roofing Supplement Process Explained: From Tear-Off to Approval",
    metaTitle: "Roofing Supplement Process Explained | From Tear-Off to Approval",
    metaDescription: "Complete guide to the roofing supplement process — from discovering hidden damage during tear-off to getting insurance approval. Written for contractors.",
    publishedDate: "2026-03-06",
    sections: [
      {
        heading: "What happens when your crew finds hidden damage",
        content: "It happens on almost every tear-off. Your crew pulls back the shingles and discovers something the adjuster didn't — and couldn't — see during the initial inspection. Rotted decking along the eave. Corroded step flashing at the chimney. Missing ice and water shield in the valley. A pipe boot that crumbled when they pulled the old shingles off.\n\nThis concealed damage is legitimate additional work that the insurance policy should cover. The process for getting it covered is called a supplement — and it starts the moment your crew discovers the damage."
      },
      {
        heading: "Phase 1: Discovery and documentation",
        content: "The most critical phase happens on the roof. When damage is discovered during tear-off, it needs to be documented immediately — before new materials cover it up.\n\nEffective documentation includes:\n• Multiple photographs per finding (wide context shot + close-up detail)\n• Identification of damage type (decking, flashing, ice & water, pipe boot, drip edge)\n• Location on the roof (front slope, back slope, valley, chimney, eave, ridge)\n• Estimated quantity (number of sheets, linear feet, square footage)\n• Field notes describing the condition\n\nThe biggest mistake contractors make is waiting until they get back to the office to document findings. By then, photos are buried in camera rolls, details are fuzzy, and the urgency is gone."
      },
      {
        heading: "Phase 2: Writing the supplement",
        content: "The supplement is a formal request to the insurance carrier for additional payment. It includes:\n\n• A narrative explaining what was found, where, and why it wasn't visible before tear-off\n• Xactimate line items with the appropriate codes, quantities, and pricing\n• Supporting photographs\n• Reference to applicable building codes (when relevant)\n\nThe narrative is the heart of the supplement. It needs to clearly communicate that the damage was concealed, was discovered during tear-off operations, and requires additional work beyond the original scope to restore the roof system properly.\n\nMany contractors either skip the narrative entirely (just submitting Xactimate line items) or write something so vague that the adjuster can't justify approval. The narrative should be specific, professional, and reference your photographic evidence."
      },
      {
        heading: "Phase 3: Submission to the insurance carrier",
        content: "Submit the supplement to the insurance adjuster as quickly as possible — ideally the same day the damage is found. Speed matters for two reasons:\n\n1. Fresh documentation is more credible. A supplement submitted the same day as the tear-off carries more weight than one submitted three weeks later.\n2. The adjuster may want to re-inspect. If you've already installed new materials over the damage, a re-inspection is impossible.\n\nThe best submission format is a professional PDF report with an attached Xactimate-compatible spreadsheet. Email it directly to the adjuster with the claim number in the subject line."
      },
      {
        heading: "Phase 4: Adjuster review and negotiation",
        content: "After submission, the adjuster reviews your supplement. This can take 3–14 business days depending on the carrier. Possible outcomes:\n\n• Approved in full — the carrier agrees with your findings and adjusts the claim\n• Partially approved — some items approved, others denied or reduced\n• Re-inspection requested — the adjuster wants to see the damage in person\n• Denied — the carrier rejects the supplement (see our guide on what to do when this happens)\n\nIf partially approved, review which items were denied and why. You can resubmit with additional documentation or escalate to a supervisor. If a re-inspection is requested, coordinate with the adjuster and be prepared to show the documented evidence."
      },
      {
        heading: "How Supplement Snap streamlines the entire process",
        content: "Supplement Snap was designed around this exact workflow:\n\n• Phase 1 (Discovery): Your crew captures photos, tags damage type and roof area, adds voice notes — all from the roof during tear-off\n• Phase 2 (Writing): AI generates professional supplement narratives from the field data. Xactimate CSV export with correct line codes and pricing.\n• Phase 3 (Submission): One-click PDF report generation and email to the adjuster — same day, from the field\n• Phase 4 (Tracking): Claim pipeline tracks each project from In Progress through Submitted to Approved\n\nThe entire process that used to take days of office work now happens in minutes, right from the job site."
      },
    ],
  },
]

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const article = ARTICLES.find((a) => a.slug === params.slug)
  if (!article) return {}
  return {
    title: article.metaTitle,
    description: article.metaDescription,
  }
}

export default function BlogArticle({ params }: { params: { slug: string } }) {
  const article = ARTICLES.find((a) => a.slug === params.slug)
  if (!article) return null

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.publishedDate,
    dateModified: article.publishedDate,
    author: {
      "@type": "Organization",
      name: "Supplement Snap",
      url: "https://supplementsnap.io",
    },
    publisher: {
      "@type": "Organization",
      name: "Supplement Snap",
      url: "https://supplementsnap.io",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://supplementsnap.io/blog/${article.slug}`,
    },
  }

  return (
    <div className="bg-white text-zinc-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <nav className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</div>
            <span className="text-lg font-bold tracking-tight">Supplement Snap</span>
          </Link>
          <NavLinks />
        </div>
      </nav>

      <article className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <Link href="/blog" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">&larr; All Articles</Link>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{article.title}</h1>
          <p className="mt-3 text-sm text-zinc-400">Published {new Date(article.publishedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        </div>

        <div className="space-y-10">
          {article.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900">{section.heading}</h2>
              <div className="mt-3 text-base leading-relaxed text-zinc-600 whitespace-pre-line">{section.content}</div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center">
          <h3 className="text-lg font-bold text-zinc-900">Ready to streamline your supplement process?</h3>
          <p className="mt-2 text-sm text-zinc-600">
            Supplement Snap helps your crew capture hidden damage during tear-off and generate adjuster-ready reports in minutes.
          </p>
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/demo" className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
              Book a Free Walkthrough
            </Link>
            <Link href="/pricing" className="rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              See Pricing
            </Link>
          </div>
        </div>

        {/* Related articles */}
        <div className="mt-16 border-t border-zinc-100 pt-10">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">More Articles</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {ARTICLES.filter((a) => a.slug !== params.slug).slice(0, 4).map((a) => (
              <Link key={a.slug} href={`/blog/${a.slug}`} className="rounded-lg border border-zinc-200 bg-white p-4 hover:border-indigo-200 hover:shadow-sm">
                <h4 className="text-sm font-semibold text-zinc-900">{a.title}</h4>
                <p className="mt-1 text-xs text-indigo-600">Read more &rarr;</p>
              </Link>
            ))}
          </div>
        </div>
      </article>

      <SiteFooter />
    </div>
  )
}
