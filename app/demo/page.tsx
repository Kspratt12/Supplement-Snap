import Link from "next/link"

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Nav */}
      <nav className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              S
            </div>
            <span className="text-lg font-bold tracking-tight text-zinc-900">Supplement Snap</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:block">Home</Link>
            <Link href="/pricing" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">Pricing</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Hero */}
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Explore on your own</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            See Supplement Snap in Action
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-500">
            No call needed. Try the interactive demo, read a sample report, or start a free project and see how your crew captures hidden damage and builds adjuster-ready reports from the field.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: What you'll see + who it's for */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-zinc-900">What you&apos;ll see</h2>
              <div className="mt-3 space-y-2.5">
                {[
                  "Crew captures damage photos from the roof",
                  "Voice notes auto-transcribed (works in Spanish)",
                  "AI generates professional supplement narrative",
                  "PDF report emailed to adjuster in one click",
                  "Xactimate-style CSV starting list (item codes and prices are left for you to enter)",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs text-zinc-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-zinc-900">Try it at your own pace</h2>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">The interactive demo walks through a job in four steps. The sample report shows what an adjuster receives. A free project lets you try your own photos and notes: the free plan covers the demo project plus one project of your own, and PDF download and email are on paid plans.</p>
            </div>

            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <p className="text-xs font-semibold text-green-800">Built for roofing contractors</p>
              <p className="mt-1 text-sm font-medium text-green-700">Document concealed damage during tear-off, then turn it into a supplement narrative and PDF report.</p>
            </div>
          </div>

          {/* Right: self-service ways to see the product */}
          <div className="lg:col-span-2">
            <div className="space-y-3">
              <Link href="/#see-it-in-action" className="block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-indigo-300">
                <p className="text-sm font-semibold text-zinc-900">Interactive demo</p>
                <p className="mt-1 text-sm text-zinc-600">From roof to report in four steps, on the homepage.</p>
              </Link>
              <Link href="/roofing-supplement-report-example" className="block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-indigo-300">
                <p className="text-sm font-semibold text-zinc-900">Sample report</p>
                <p className="mt-1 text-sm text-zinc-600">See what the finished supplement documentation looks like.</p>
              </Link>
              <Link href="/signup?trial=1" className="block rounded-xl bg-indigo-600 p-5 shadow-sm hover:bg-indigo-500">
                <p className="text-sm font-semibold text-white">Start a free project</p>
                <p className="mt-1 text-sm text-indigo-100">Demo project plus one project of your own. No card needed.</p>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
