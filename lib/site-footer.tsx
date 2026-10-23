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
              <Link href="/pricing" className="text-xs text-zinc-500 hover:text-zinc-700">Pricing</Link>
              <Link href="/demo" className="text-xs text-zinc-500 hover:text-zinc-700">Book a Demo</Link>
              <Link href="/about" className="text-xs text-zinc-500 hover:text-zinc-700">About</Link>
              <Link href="/blog" className="text-xs text-zinc-500 hover:text-zinc-700">Blog</Link>
              <Link href="/terms" className="text-xs text-zinc-500 hover:text-zinc-700">Terms of Service</Link>
              <Link href="/privacy" className="text-xs text-zinc-500 hover:text-zinc-700">Privacy Policy</Link>
              <Link href="/refund-policy" className="text-xs text-zinc-500 hover:text-zinc-700">Refund Policy</Link>
              <Link href="/login" className="text-xs text-zinc-500 hover:text-zinc-700">Log In</Link>
            </div>
          </div>

          {/* Resources links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Resources</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/roofing-supplement-software" className="text-xs text-zinc-500 hover:text-zinc-700">Roofing Supplement Software</Link>
              <Link href="/how-roofing-supplements-work" className="text-xs text-zinc-500 hover:text-zinc-700">How Supplements Work</Link>
              <Link href="/hidden-roof-damage-tear-off" className="text-xs text-zinc-500 hover:text-zinc-700">Hidden Damage During Tear-Off</Link>
              <Link href="/roofing-supplement-documentation" className="text-xs text-zinc-500 hover:text-zinc-700">Supplement Documentation</Link>
              <Link href="/roofing-supplement-report-example" className="text-xs text-zinc-500 hover:text-zinc-700">Supplement Report Example</Link>
              <Link href="/free-roofing-supplement-checklist" className="text-xs text-zinc-500 hover:text-zinc-700">Free Supplement Checklist</Link>
              <Link href="/roofing-supplement-software-vs-spreadsheets" className="text-xs text-zinc-500 hover:text-zinc-700">Software vs. Spreadsheets</Link>
            </div>
          </div>

          {/* Popular articles */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Popular Articles</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/blog/roof-tear-off-cost" className="text-xs text-zinc-500 hover:text-zinc-700">Roof Tear-Off Cost in 2026</Link>
              <Link href="/blog/best-roof-estimating-software" className="text-xs text-zinc-500 hover:text-zinc-700">Best Roof Estimating Software</Link>
              <Link href="/blog/hail-damage-roof-inspection" className="text-xs text-zinc-500 hover:text-zinc-700">Hail Damage Roof Inspection</Link>
              <Link href="/blog/xactimate-roofing-estimate-approved" className="text-xs text-zinc-500 hover:text-zinc-700">Xactimate Roofing Estimate Guide</Link>
              <Link href="/blog/roofing-software-comparison" className="text-xs text-zinc-500 hover:text-zinc-700">Roofing Software Comparison</Link>
              <Link href="/blog/xactimate-roof-estimate-supplements" className="text-xs text-zinc-500 hover:text-zinc-700">Xactimate Roof Estimate Guide</Link>
            </div>
          </div>
        </div>

        {/* Service areas */}
        <div className="mt-8 border-t border-zinc-100 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Roofing Supplement Software by City</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/roofing-supplement-software/raleigh-nc" className="text-xs text-zinc-500 hover:text-zinc-700">Raleigh, NC</Link>
            <Link href="/roofing-supplement-software/apex-nc" className="text-xs text-zinc-500 hover:text-zinc-700">Apex, NC</Link>
            <Link href="/roofing-supplement-software/cary-nc" className="text-xs text-zinc-500 hover:text-zinc-700">Cary, NC</Link>
            <Link href="/roofing-supplement-software/durham-nc" className="text-xs text-zinc-500 hover:text-zinc-700">Durham, NC</Link>
            <Link href="/roofing-supplement-software/wake-forest-nc" className="text-xs text-zinc-500 hover:text-zinc-700">Wake Forest, NC</Link>
            <Link href="/roofing-supplement-software/fuquay-varina-nc" className="text-xs text-zinc-500 hover:text-zinc-700">Fuquay Varina, NC</Link>
            <Link href="/roofing-supplement-software/garner-nc" className="text-xs text-zinc-500 hover:text-zinc-700">Garner, NC</Link>
            <Link href="/roofing-supplement-software/chapel-hill-nc" className="text-xs text-zinc-500 hover:text-zinc-700">Chapel Hill, NC</Link>
            <Link href="/roofing-supplement-software/clayton-nc" className="text-xs text-zinc-500 hover:text-zinc-700">Clayton, NC</Link>
            <Link href="/roofing-supplement-software/holly-springs-nc" className="text-xs text-zinc-500 hover:text-zinc-700">Holly Springs, NC</Link>
            <Link href="/roofing-supplement-software/zebulon-nc" className="text-xs text-zinc-500 hover:text-zinc-700">Zebulon, NC</Link>
            <Link href="/roofing-supplement-software/dunn-nc" className="text-xs text-zinc-500 hover:text-zinc-700">Dunn, NC</Link>
            <Link href="/roofing-supplement-software/pittsboro-nc" className="text-xs text-zinc-500 hover:text-zinc-700">Pittsboro, NC</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
