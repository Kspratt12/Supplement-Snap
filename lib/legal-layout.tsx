import Link from "next/link"
import { SiteFooter } from "./site-footer"

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

      <SiteFooter />
    </div>
  )
}
