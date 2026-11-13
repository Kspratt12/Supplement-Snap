import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-100 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand + copyright */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-xs font-bold text-white">S</div>
              <span className="text-sm font-semibold">Supplement Snap</span>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              &copy; {new Date().getFullYear()} Supplement Snap
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Xactimate is a trademark of Verisk Analytics. Supplement Snap is not affiliated with or endorsed by Verisk.
            </p>
          </div>

          {/* Company links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Company</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/pricing" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">Pricing</Link>
              <Link href="/about" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">About</Link>
              <Link href="/blog" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">Blog</Link>
              <Link href="/terms" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">Terms of Service</Link>
              <Link href="/privacy" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">Privacy Policy</Link>
              <Link href="/refund-policy" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">Refund Policy</Link>
              <Link href="/login" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">Log In</Link>
            </div>
          </div>

          {/* Resources links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Resources</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/roofing-supplement-software" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">Roofing Supplement Software</Link>
              <Link href="/how-roofing-supplements-work" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">How Supplements Work</Link>
              <Link href="/hidden-roof-damage-tear-off" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">Hidden Damage During Tear-Off</Link>
              <Link href="/roofing-supplement-documentation" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">Supplement Documentation</Link>
              <Link href="/roofing-supplement-report-example" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">Supplement Report Example</Link>
              <Link href="/free-roofing-supplement-checklist" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">Free Supplement Checklist</Link>
              <Link href="/free-roofing-templates" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">Free Roofing Templates</Link>
              <Link href="/roofing-supplement-software-vs-spreadsheets" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">Software vs. Spreadsheets</Link>
            </div>
          </div>

          {/* Popular articles */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Popular Articles</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/blog/roof-tear-off-cost" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">Roof Tear-Off Cost</Link>
              <Link href="/blog/best-roof-estimating-software" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">Best Roof Estimating Software</Link>
              <Link href="/blog/hail-damage-roof-inspection" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">Hail Damage Roof Inspection</Link>
              <Link href="/blog/xactimate-roofing-estimate-approved" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">Xactimate Roofing Estimate Guide</Link>
              <Link href="/blog/roofing-software-comparison" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">Roofing Software Comparison</Link>
              <Link href="/blog/xactimate-roof-estimate-supplements" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">Xactimate Supplements Guide</Link>
              <Link href="/blog/supplemental-roofing-estimate-explained" className="inline-block py-1.5 text-xs text-zinc-600 hover:text-zinc-800">What Is a Supplemental Roofing Estimate?</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
