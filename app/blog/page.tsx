import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "../../lib/site-footer"
import { NavLinks } from "../../lib/nav-links"

export const metadata: Metadata = {
  title: "Roofing Supplement Blog | Supplement Snap",
  description: "Guides, tips, and resources for roofing contractors on supplements, insurance claims, Xactimate codes, and damage documentation.",
}

const ARTICLES = [
  { slug: "how-to-write-a-roofing-supplement", title: "How to Write a Roofing Supplement That Gets Approved", desc: "Step-by-step guide to writing supplements that insurance adjusters approve, with documentation tips and Xactimate codes.", date: "2026-03-23" },
  { slug: "roofing-supplement-denied-what-to-do", title: "Roofing Supplement Denied? Here's What to Do Next", desc: "Your supplement was denied. Here's how to appeal, re-document, and prevent it from happening on the next job.", date: "2026-03-23" },
  { slug: "xactimate-codes-for-roofing-supplements", title: "Xactimate Codes for Roofing Supplements: Complete Reference", desc: "Complete list of Xactimate line codes for supplements: decking, flashing, ice & water shield, pipe boots, and more.", date: "2026-03-23" },
  { slug: "how-much-do-roofing-supplements-pay", title: "How Much Do Roofing Supplements Pay? Real Numbers", desc: "Real revenue data on average supplement values, what gets approved, and how to maximize recovery per job.", date: "2026-03-23" },
  { slug: "roofing-supplement-process-explained", title: "The Roofing Supplement Process: From Tear-Off to Approval", desc: "Complete guide from discovering hidden damage during tear-off to getting insurance approval.", date: "2026-03-23" },
  { slug: "roof-tear-off-cost", title: "Roof Tear-Off Cost in 2026: What Contractors and Homeowners Should Know", desc: "Breakdown of roof tear-off costs by size, material, and pitch, plus hidden costs discovered during tear-off and how supplements recover them.", date: "2026-03-23" },
  { slug: "best-roof-estimating-software", title: "Best Roof Estimating Software for Contractors in 2026", desc: "Compare satellite measurement, estimating, CRM, and supplement tools. What to look for and how they work together.", date: "2026-03-23" },
  { slug: "hail-damage-roof-inspection", title: "Hail Damage Roof Inspection: What Gets Missed and How to Document It", desc: "How to inspect for hail damage, what adjusters miss, hidden damage found during tear-off, and how to document for supplements.", date: "2026-03-23" },
  { slug: "roofing-software-comparison", title: "Roofing Software Comparison: CRM vs. Estimating vs. Supplement Tools", desc: "Compare the three categories of roofing software. What each does, when you need each one, and where the gaps are costing you money.", date: "2026-03-23" },
  { slug: "xactimate-roof-estimate-supplements", title: "How to Build an Xactimate Roof Estimate for Insurance Supplements", desc: "Key line codes, pricing benchmarks, and common mistakes, plus how to format supplements so adjusters approve them fast.", date: "2026-03-23" },
  { slug: "roof-replacement-estimate-vs-final-cost", title: "Roof Replacement Estimate vs. Final Cost: Why Supplements Close the Gap", desc: "Why the initial estimate is always lower, what gets missed, and how supplements bridge the gap between estimate and actual cost.", date: "2026-03-23" },
  { slug: "storm-damage-roof-repair-near-me", title: "Storm Damage Roof Repair Near Me: How to Find and Hire the Right Contractor", desc: "What to look for in a storm damage contractor, red flags to avoid, how insurance claims work, and what good documentation looks like.", date: "2026-03-23" },
  { slug: "best-roofing-crm", title: "Best Roofing CRM in 2026: What to Look For and What's Missing", desc: "Compare top roofing CRMs, learn what features matter, discover the revenue gap CRMs ignore, and build the complete tech stack.", date: "2026-03-23" },
  { slug: "storm-damage-roof-repair", title: "Storm Damage Roof Repair: What Contractors Need to Know in 2026", desc: "Types of storm damage, how insurance claims work, hidden damage found during tear-off, documentation requirements, and how to maximize recovery.", date: "2026-03-23" },
  { slug: "roof-damage-repair-guide", title: "Roof Damage Repair: Complete Guide for Contractors and Homeowners", desc: "Types of roof damage, repair vs. replace decisions, insurance claim process, hidden damage during repairs, and cost breakdowns by damage type.", date: "2026-03-23" },
  { slug: "roof-inspection-report", title: "Roof Inspection Report: What to Include and How to Write One", desc: "What a roof inspection report is, what to include, step-by-step writing guide, report structure, common mistakes, and how software automates it.", date: "2026-03-23" },
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
              <p className="text-xs text-zinc-400">{new Date(a.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
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
