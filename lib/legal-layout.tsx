import Link from "next/link"

export function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <nav className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</div>
            <span className="text-lg font-bold tracking-tight">Supplement Snap</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">Home</Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-zinc-400">Last updated: March 15, 2026</p>
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-600">
          {children}
        </div>
      </main>

      <footer className="border-t border-zinc-100 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-xs font-bold text-white">S</div>
            <span className="text-sm font-semibold">Supplement Snap</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
            <Link href="/terms" className="hover:text-zinc-600">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-zinc-600">Privacy Policy</Link>
            <Link href="/refund-policy" className="hover:text-zinc-600">Refund Policy</Link>
            <Link href="/demo" className="hover:text-zinc-600">Book a Demo</Link>
          </div>
          <p className="text-xs text-zinc-400">&copy; {new Date().getFullYear()} Supplement Snap</p>
        </div>
      </footer>
    </div>
  )
}
