import Link from "next/link"

export function NavLinks() {
  return (
    <div className="flex items-center gap-4">
      <Link href="/roofing-supplement-software" className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 lg:block">
        How It Works
      </Link>
      <Link href="/blog" className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:block">
        Blog
      </Link>
      <Link href="/pricing" className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:block">
        Pricing
      </Link>
      <Link
        href="/demo"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        Book a Demo
      </Link>
    </div>
  )
}
