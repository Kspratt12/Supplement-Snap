import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "../../lib/site-footer"
import { NavLinks } from "../../lib/nav-links"

export const metadata: Metadata = {
  title: "Roofing Supplement Blog | Guides for Contractors",
  description: "Guides, tips, and resources for roofing contractors on supplements, insurance claims, Xactimate codes, and damage documentation.",
  alternates: {
    canonical: "https://supplementsnap.io/blog",
  },
}

const ARTICLES = [
  { slug: "how-to-write-a-roofing-supplement", title: "How to Write a Roofing Supplement That Gets Approved", desc: "Step-by-step guide to writing supplements that insurance adjusters approve, with documentation tips and Xactimate codes.", date: "2026-01-06" },
  { slug: "roofing-supplement-denied-what-to-do", title: "Roofing Supplement Denied? Here's What to Do Next", desc: "Your supplement was denied. Here's how to appeal, re-document, and prevent it from happening on the next job.", date: "2026-01-13" },
  { slug: "xactimate-codes-for-roofing-supplements", title: "Xactimate Codes for Roofing Supplements: Complete Reference", desc: "Complete list of Xactimate line codes for supplements: decking, flashing, ice & water shield, pipe boots, and more.", date: "2026-01-20" },
  { slug: "how-much-do-roofing-supplements-pay", title: "How Much Do Roofing Supplements Pay? What Affects the Amount", desc: "What affects how much a roofing supplement pays, which items are commonly requested, and how to document them.", date: "2026-01-27" },
  { slug: "roofing-supplement-process-explained", title: "The Roofing Supplement Process: From Tear-Off to Approval", desc: "Complete guide from discovering hidden damage during tear-off to getting insurance approval.", date: "2026-02-03" },
  { slug: "roof-tear-off-cost", title: "Roof Tear-Off Cost in 2026: What Contractors and Homeowners Should Know", desc: "Breakdown of roof tear-off costs by size, material, and pitch, plus hidden costs discovered during tear-off and how supplements recover them.", date: "2026-02-10" },
  { slug: "best-roof-estimating-software", title: "Best Roof Estimating Software for Contractors in 2026", desc: "Compare satellite measurement, estimating, CRM, and supplement tools. What to look for and how they work together.", date: "2026-02-17" },
  { slug: "hail-damage-roof-inspection", title: "Hail Damage Roof Inspection: What Gets Missed and How to Document It", desc: "How to inspect for hail damage, what adjusters miss, hidden damage found during tear-off, and how to document for supplements.", date: "2026-02-24" },
  { slug: "roofing-software-comparison", title: "Roofing Software Comparison: CRM vs. Estimating vs. Supplement Tools", desc: "Compare the three categories of roofing software. What each does, when you need each one, and where the gaps are costing you money.", date: "2026-03-03" },
  { slug: "xactimate-roof-estimate-supplements", title: "How to Build an Xactimate Roof Estimate for Insurance Supplements", desc: "Key line codes, pricing benchmarks, and common mistakes, plus how to format supplements so adjusters approve them fast.", date: "2026-03-07" },
  { slug: "roof-replacement-estimate-vs-final-cost", title: "Roof Replacement Estimate vs. Final Cost: Why Supplements Close the Gap", desc: "Why the initial estimate is always lower, what gets missed, and how supplements bridge the gap between estimate and actual cost.", date: "2026-03-10" },
  { slug: "storm-damage-roof-repair-near-me", title: "Storm Damage Roof Repair Near Me: How Contractors Win Local Storm Jobs", desc: "How roofing contractors can dominate local storm damage repair searches. Lead generation, insurance workflows, and supplement documentation.", date: "2026-03-14" },
  { slug: "best-roofing-crm", title: "Best Roofing CRM in 2026: What to Look For and What's Missing", desc: "Compare top roofing CRMs, learn what features matter, discover the revenue gap CRMs ignore, and build the complete tech stack.", date: "2026-03-17" },
  { slug: "storm-damage-roof-repair", title: "Storm Damage Roof Repair: What Contractors Need to Know in 2026", desc: "Types of storm damage, how insurance claims work, hidden damage found during tear-off, documentation requirements, and how to maximize recovery.", date: "2026-03-20" },
  { slug: "roof-damage-repair-guide", title: "Roof Damage Repair: Contractor Guide to Identifying, Documenting, and Getting Paid", desc: "Contractor guide to roof damage repair: identify all damage types, document for insurance, navigate repair vs. replace, and recover full value through supplements.", date: "2026-03-24" },
  { slug: "roof-inspection-report", title: "Roof Inspection Report: What to Include and How to Write One", desc: "What a roof inspection report is, what to include, step-by-step writing guide, report structure, common mistakes, and how software automates it.", date: "2026-03-27" },
  { slug: "xactimate-roofing-estimate-approved", title: "How to Write an Xactimate Roofing Estimate That Actually Gets Approved", desc: "Measurements, line items, waste and pitch charges, O&P and photo proof: how to write a roof estimate adjusters approve.", date: "2026-10-22" },
  { slug: "roofing-supplement-template", title: "Roofing Supplement Template: Format, Checklist and Example", desc: "A copyable supplement format with cover page, findings, narratives, line items and a checklist.", date: "2026-10-22" },
  { slug: "roofing-photo-documentation-checklist", title: "Roofing Photo Documentation Checklist: What to Photograph at Tear-Off", desc: "What to photograph at inspection and tear-off so every claim item has proof.", date: "2026-10-22" },
  { slug: "roofing-overhead-and-profit-claims", title: "Overhead and Profit on Roofing Claims: When You Can Charge O&P", desc: "When O&P applies on roofing claims, how to document it and how carriers push back.", date: "2026-10-22" },
  { slug: "roofing-code-upgrades-ordinance-and-law", title: "Code Upgrades in Roofing Claims: Ordinance and Law Coverage Explained", desc: "How code upgrade items and Ordinance and Law coverage work on roofing claims.", date: "2026-10-22" },
  { slug: "companycam-alternative-roofing-supplements", title: "CompanyCam Alternative for Roofing Supplements: How to Choose", desc: "Photo apps versus supplement-focused tools, and how to choose for your crew.", date: "2026-10-22" },
  { slug: "document-rotted-roof-decking-tear-off", title: "How to Document Rotted Roof Decking Found During Tear-Off", desc: "What to photograph, measure and write down when you find rotted decking, so the finding is clear to the adjuster.", date: "2026-10-23" },
  { slug: "organize-roofing-supplement-photos-by-claim", title: "How to Organize Roofing Supplement Photos by Claim and Roof Area", desc: "A repeatable system for naming, grouping and labeling supplement photos so reports are fast to build.", date: "2026-10-23" },
  { slug: "supplemental-roofing-estimate-explained", title: "What Is a Supplemental Roofing Estimate? When It Applies and What It Includes", desc: "A supplemental roofing estimate asks the insurer to cover damage found after the first estimate. When it applies and how to submit one.", date: "2026-10-23" },
  { slug: "xactimate-roofing-estimate-example", title: "Xactimate Roofing Estimate Example: How a Supplement Line-Item List Looks", desc: "A sample Xactimate-style layout: sections to include, how to list supplement items, and how to attach photo proof.", date: "2026-10-23" },
  { slug: "xactimate-roofing-software-explained", title: "Xactimate Roofing Software Explained: What It Does and What It Does Not", desc: "What Xactimate does for roofing estimates, what it does not do, and how supplement documentation tools fit alongside it.", date: "2026-10-23" },
  { slug: "roof-inspection-report-software", title: "Roof Inspection Report Software: What to Look For", desc: "What roof inspection report software should do, and how to compare options fairly.", date: "2026-10-23" },
  { slug: "roofing-supplement-follow-up-log", title: "Roofing Supplement Follow-Up Log: Track Submissions and Adjuster Responses", desc: "What to track, when to follow up and a copyable column list for submissions and adjuster responses.", date: "2026-10-23" },
  { slug: "how-insurance-adjusters-determine-roof-damage", title: "How Insurance Adjusters Determine Roof Damage (and What Documentation Helps)", desc: "How adjusters inspect roofs, build estimates and apply policy terms, and what documentation makes a claim easier to review.", date: "2026-10-23" },
  { slug: "what-is-the-25-percent-rule-for-roofing", title: "What Is the 25% Rule for Roofing? It Depends on Where You Are", desc: "What the 25% rule generally means, why it varies by jurisdiction, and how contractors should handle it on insurance claims.", date: "2026-10-23" },
  { slug: "roof-damage-report-template", title: "Roof Damage Report Template: Sections, Example and Checklist", desc: "A copyable roof damage report template with sections, a sample finding and a photo checklist.", date: "2026-10-23" },
  { slug: "how-roofing-contractors-work-insurance-claims", title: "How Roofing Contractors Work Insurance Claims: A Step-by-Step Guide", desc: "From the first inspection to final payment: the workflow, the contractor's role and where documentation matters.", date: "2026-10-23" },
  { slug: "hail-damage-roof-insurance-claim-documentation", title: "Hail Damage Roof Insurance Claims: What Contractors Should Document", desc: "Signs of hail damage, test squares, date of loss and the photos adjusters need.", date: "2026-10-23" },
  { slug: "wind-damage-roof-insurance-claim-documentation", title: "Wind Damage Roof Insurance Claims: What to Document", desc: "Creased and missing shingles, lifted tabs, pattern and date of loss, with photos adjusters can verify.", date: "2026-10-23" },
  { slug: "roof-leak-insurance-claim-contractor-guide", title: "Roof Leak Insurance Claims: What Contractors Should Know", desc: "Finding the source, temporary protection and why coverage depends on the cause.", date: "2026-10-23" },
  { slug: "roofing-supplement-companies-vs-software", title: "Roofing Supplement Companies vs. Doing It In-House: How to Decide", desc: "What each option involves, how pricing models differ and the questions to ask before you choose.", date: "2026-10-23" },
  { slug: "best-roofing-supplement-software", title: "Best Roofing Supplement Software (2026): Tools, Services and How to Choose", desc: "Compare estimating software, documentation tools, photo apps, CRMs and supplement services, with a fair way to test them.", date: "2026-10-23" },
  { slug: "recoverable-depreciation-roof-claims", title: "Recoverable Depreciation on a Roof Claim: How It Works", desc: "ACV vs. RCV, when insurers release held-back depreciation and what paperwork helps.", date: "2026-10-23" },
  { slug: "does-insurance-cover-roof-replacement", title: "Does Insurance Cover Roof Replacement? A Contractor Guide", desc: "When insurance may pay for a roof, when it usually does not, and how to explain it without promising an outcome.", date: "2026-10-23" },
  { slug: "roof-inspection-checklist", title: "Roof Inspection Checklist for Roofing Contractors", desc: "Exterior, flashing, attic and decking checklist, plus how to document findings.", date: "2026-10-23" },
  { slug: "supplement-snap-vs-roofgenius", title: "Supplement Snap vs RoofGenius: Which Fits a Small Roofing Company?", desc: "Price, supplement limits, trial terms and what each does, based on public pages.", date: "2026-10-24" },
  { slug: "ai-roofing-supplement-tools-compared", title: "AI Roofing Supplement Tools Compared: What Each One Actually Does", desc: "Estimate audits, storm CRMs and field documentation compared by job, with gaps marked.", date: "2026-10-24" },
  { slug: "roofing-supplement-software-cost", title: "How Much Does Roofing Supplement Software Cost? A 2026 Price Guide", desc: "Monthly plans, claim credits and per-supplement services, using prices companies publish.", date: "2026-10-24" },
  { slug: "best-app-to-document-roof-damage-for-insurance", title: "Best App to Document Roof Damage for Insurance Claims (2026)", desc: "Photo and documentation apps compared by price, trial and what each is built for.", date: "2026-10-24" },
  { slug: "claimtrax-vs-suppx-vs-supplement-snap", title: "ClaimTrax vs SuppX vs Supplement Snap: Which Supplement Tool Fits?", desc: "Tracking, outsourcing or documenting your supplements, compared on public information.", date: "2026-10-24" },
  { slug: "roofing-supplement-software-for-small-roofing-companies", title: "Roofing Supplement Software for Small Roofing Companies: Do You Need It?", desc: "Spreadsheets, software and services compared by claim volume and cost.", date: "2026-10-24" },
  { slug: "roofing-supplement-email-to-adjuster", title: "How to Write a Roofing Supplement Request Email to an Adjuster (With Template)", desc: "How to email an adjuster a supplement request, what to include, and a copy-and-paste template.", date: "2026-10-25" },
  { slug: "what-can-you-supplement-on-a-roof-claim", title: "What Can You Supplement on a Roof Claim? 12 Items Contractors Commonly Request", desc: "Common items roofers request in a supplement and what to document for each.", date: "2026-10-25" },
  { slug: "roof-claim-reinspection-request", title: "How to Request a Reinspection on a Roof Claim (and When a Supplement Fits Better)", desc: "How to request a roof reinspection, what to prepare, and how it differs from a supplement.", date: "2026-10-25" },
  { slug: "can-a-roofer-talk-to-the-insurance-company", title: "Can a Roofer Talk to the Insurance Company? What Contractors May and May Not Do", desc: "General guidance on what contractors usually can and cannot do on an insurance claim.", date: "2026-10-25" },
  { slug: "how-long-does-a-roofing-supplement-take", title: "How Long Does a Roofing Supplement Take? What to Expect and How to Follow Up", desc: "What affects how long a supplement takes, where delays happen, and how to follow up.", date: "2026-10-25" },
  { slug: "drip-edge-roofing-supplement", title: "Drip Edge on a Roof Claim: How Roofers Document and Request It", desc: "How to check local code, measure and photograph drip edge, and request it in a roofing supplement.", date: "2026-10-25" },
  { slug: "ice-and-water-shield-roofing-supplement", title: "Ice and Water Shield on a Roof Claim: Documenting and Requesting It", desc: "Where ice barrier goes, how to measure it, and how to request it with photos and sources.", date: "2026-10-25" },
  { slug: "roof-shingle-matching-insurance-claim", title: "Shingle Matching on Roof Claims: What Roofers Should Know", desc: "How shingle matching works on roof claims, what varies by state and policy, and how to document it.", date: "2026-10-25" },
  { slug: "steep-roof-charge-roofing-supplement", title: "Steep Roof and High Roof Charges: How to Document Them", desc: "How to measure pitch and height and document steep and high roof charges in a supplement.", date: "2026-10-25" },
  { slug: "roofing-permit-fees-insurance-claim", title: "Roofing Permit Fees on an Insurance Claim: How to Request Them", desc: "How to document permit fees and request them on a roof claim with the right paperwork.", date: "2026-10-25" },
  { slug: "starter-strip-ridge-cap-roofing-supplement", title: "Starter Strip and Ridge Cap on a Roof Claim: What to Check", desc: "How to measure starter strip and ridge cap, compare to the estimate, and document any difference.", date: "2026-10-25" },
  { slug: "roof-flashing-vents-pipe-jacks-insurance-supplement", title: "Flashing, Vents and Pipe Jacks: Documenting Small Items on a Roof Claim", desc: "How to count, photograph and request flashing, vents and pipe boots in a roofing supplement.", date: "2026-10-25" },
  { slug: "roof-debris-removal-dumpster-insurance-claim", title: "Debris Removal and Dumpster Costs on a Roof Claim", desc: "How to document extra layers and disposal and request haul-off costs on a roof claim.", date: "2026-10-25" },
  { slug: "insurance-lowball-roof-estimate-what-to-do", title: "Insurance Lowball Roof Estimate: What Roofers and Homeowners Can Do", desc: "How to compare a low carrier estimate line by line and choose between a supplement, reinspection or other steps.", date: "2026-10-25" },
  { slug: "roof-claim-appraisal-process", title: "The Appraisal Clause on a Roof Claim: How It Works", desc: "A general overview of the appraisal clause on roof claims: what it decides, who takes part and how to prepare.", date: "2026-10-25" },
  { slug: "roofing-supplement-tracker-template", title: "Roofing Supplement Tracker Template (Free PDF, Fillable, Word)", desc: "A free supplement tracker (PDF, fillable PDF, Word) and how to keep follow-ups from slipping.", date: "2026-10-25" },
  { slug: "roof-tear-off-findings-log-template", title: "Roof Tear-Off Findings Log Template (Free PDF and Word)", desc: "A free tear-off findings log and checklist for crews to capture hidden conditions on the roof.", date: "2026-10-25" },
  { slug: "roofing-crew-supplement-documentation-sop", title: "A Crew SOP for Supplement Documentation (Free Checklist)", desc: "A simple crew SOP and one-page checklist for documenting insurance roofing jobs the same way each time.", date: "2026-10-25" },
  { slug: "is-roofing-supplement-software-worth-it", title: "Is Roofing Supplement Software Worth It? The Break-Even Math", desc: "A simple break-even formula for deciding if supplement software is worth the cost, using your own numbers.", date: "2026-10-25" },
  { slug: "roofing-supplement-mistakes-that-delay-payment", title: "9 Roofing Supplement Mistakes That Slow Down or Sink a Request", desc: "Nine common reasons roofing supplements stall and how to avoid each one.", date: "2026-10-25" },
  { slug: "roofing-adjuster-inspection-what-to-bring", title: "Meeting the Insurance Adjuster on the Roof: What to Bring and Do", desc: "What to bring and how to behave when the insurance adjuster inspects the roof.", date: "2026-10-25" },
  { slug: "questions-to-ask-before-buying-roofing-supplement-software", title: "15 Questions to Ask Before You Buy Roofing Supplement Software", desc: "A 15-question buyer's checklist for roofing supplement software, with how to run a one-job test.", date: "2026-10-25" },
  { slug: "how-to-write-roofing-supplements-faster", title: "How to Write Roofing Supplements Faster (Without Cutting Corners)", desc: "A five-step workflow for writing roofing supplements faster by capturing findings completely on the roof.", date: "2026-10-25" },
  { slug: "roof-tear-off-vs-overlay", title: "Roof Tear-Off vs Overlay: Which to Choose and What Gets Missed", desc: "Roof tear-off vs overlay compared, when an overlay may not be allowed, and the damage nobody sees when new shingles go over old ones.", date: "2026-10-24" },
  { slug: "roof-repair-estimate-template", title: "Roof Repair Estimate Template: Free PDF, Fillable PDF and Word", desc: "Free roof repair estimate template as a printable PDF, fillable PDF or Word file, and what a repair estimate should say.", date: "2026-10-24" },
  { slug: "good-better-best-roofing-proposal-template", title: "Good Better Best Roofing Proposal Template: Free PDF and Word", desc: "Free good, better, best roofing proposal template as a printable PDF, fillable PDF or Word file, with how to build three honest options.", date: "2026-10-24" },
  { slug: "roofing-estimate-template", title: "Roofing Estimate Template: Free PDF, Word and Excel Download", desc: "Free download as PDF, Word or Excel, plus the sections every estimate needs and how it differs from an insurance supplement.", date: "2026-10-24" },
  { slug: "supplement-snap-vs-roof-report-pro", title: "Supplement Snap vs Roof Report Pro: Which Documentation Tool Fits?", desc: "Tear-off supplement documentation versus AI-assisted inspection reports, compared on public information.", date: "2026-10-24" },
  { slug: "supplement-snap-vs-acculynx-supplements", title: "Supplement Snap vs AccuLynx for Supplements: Do You Need Both?", desc: "Documenting hidden damage versus tracking claims in a roofing CRM.", date: "2026-10-24" },
  { slug: "roofing-documentation-spanish-speaking-crews", title: "Roofing Damage Documentation for Spanish-Speaking Crews", desc: "Let the crew describe damage in their own language, and what to check in the English text.", date: "2026-10-24" },
  { slug: "free-roofing-supplement-software", title: "Free Roofing Supplement Software: What Is Actually Free?", desc: "Free trials, free apps and free plans compared, with what each includes and what to check.", date: "2026-10-24" },
]

export default function BlogIndex() {
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

      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Blog</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Roofing Supplement Resources</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-500">
            Guides, tips, and reference material for roofing contractors who want to recover more supplement revenue.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {ARTICLES.map((a) => (
            <Link key={a.slug} href={`/blog/${a.slug}`} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all">
              <p className="text-xs text-zinc-500">{new Date(a.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
              <h2 className="mt-2 text-base font-semibold text-zinc-900">{a.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{a.desc}</p>
              <p className="mt-3 text-sm font-medium text-indigo-600">Read more &rarr;</p>
            </Link>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
