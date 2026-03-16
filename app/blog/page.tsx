import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "../../lib/site-footer"
import { NavLinks } from "../../lib/nav-links"

export const metadata: Metadata = {
  title: "Roofing Supplement Blog | Supplement Snap",
  description: "Guides, tips, and resources for roofing contractors on supplements, insurance claims, Xactimate codes, and damage documentation.",
}

const ARTICLES = [
  { slug: "how-to-write-a-roofing-supplement", title: "How to Write a Roofing Supplement That Gets Approved", desc: "Step-by-step guide to writing supplements that insurance adjusters approve — with documentation tips and Xactimate codes.", date: "2026-03-10" },
  { slug: "roofing-supplement-denied-what-to-do", title: "Roofing Supplement Denied? Here's What to Do Next", desc: "Your supplement was denied. Here's how to appeal, re-document, and prevent it from happening on the next job.", date: "2026-03-12" },
  { slug: "xactimate-codes-for-roofing-supplements", title: "Xactimate Codes for Roofing Supplements: Complete Reference", desc: "Complete list of Xactimate line codes for supplements — decking, flashing, ice & water shield, pipe boots, and more.", date: "2026-03-08" },
  { slug: "how-much-do-roofing-supplements-pay", title: "How Much Do Roofing Supplements Pay? Real Numbers", desc: "Real revenue data — average supplement values, what gets approved, and how to maximize recovery per job.", date: "2026-03-14" },
  { slug: "roofing-supplement-process-explained", title: "The Roofing Supplement Process: From Tear-Off to Approval", desc: "Complete guide from discovering hidden damage during tear-off to getting insurance approval.", date: "2026-03-06" },
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
