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
            <p className="mt-3 text-xs text-zinc-400">
              &copy; {new Date().getFullYear()} Supplement Snap
            </p>
          </div>

          {/* Company links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Company</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/pricing" className="text-xs text-zinc-500 hover:text-zinc-700">Pricing</Link>
              <Link href="/demo" className="text-xs text-zinc-500 hover:text-zinc-700">Book a Demo</Link>
              <Link href="/blog" className="text-xs text-zinc-500 hover:text-zinc-700">Blog</Link>
              <Link href="/terms" className="text-xs text-zinc-500 hover:text-zinc-700">Terms of Service</Link>
              <Link href="/privacy" className="text-xs text-zinc-500 hover:text-zinc-700">Privacy Policy</Link>
              <Link href="/refund-policy" className="text-xs text-zinc-500 hover:text-zinc-700">Refund Policy</Link>
            </div>
          </div>

          {/* Resources links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Resources</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/roofing-supplement-software" className="text-xs text-zinc-500 hover:text-zinc-700">Roofing Supplement Software</Link>
              <Link href="/how-roofing-supplements-work" className="text-xs text-zinc-500 hover:text-zinc-700">How Supplements Work</Link>
              <Link href="/hidden-roof-damage-tear-off" className="text-xs text-zinc-500 hover:text-zinc-700">Hidden Damage During Tear-Off</Link>
              <Link href="/roofing-supplement-documentation" className="text-xs text-zinc-500 hover:text-zinc-700">Supplement Documentation</Link>
              <Link href="/roofing-supplement-report-example" className="text-xs text-zinc-500 hover:text-zinc-700">Supplement Report Example</Link>
            </div>
          </div>

          {/* Popular articles */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Popular Articles</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/blog/roof-tear-off-cost" className="text-xs text-zinc-500 hover:text-zinc-700">Roof Tear-Off Cost in 2026</Link>
              <Link href="/blog/best-roof-estimating-software" className="text-xs text-zinc-500 hover:text-zinc-700">Best Roof Estimating Software</Link>
              <Link href="/blog/hail-damage-roof-inspection" className="text-xs text-zinc-500 hover:text-zinc-700">Hail Damage Roof Inspection</Link>
              <Link href="/blog/roofing-software-comparison" className="text-xs text-zinc-500 hover:text-zinc-700">Roofing Software Comparison</Link>
              <Link href="/blog/xactimate-roof-estimate-supplements" className="text-xs text-zinc-500 hover:text-zinc-700">Xactimate Roof Estimate Guide</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
