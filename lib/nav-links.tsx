"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "./auth-context"

// The same three pages the signed-out header shows as inline links from the "sm" breakpoint up. Below that
// breakpoint they were hidden with no other way to reach them from the header, so phones get this small menu.
const MOBILE_MENU_LINKS = [
  { href: "/roofing-supplement-software", label: "How It Works" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
]

function MobileMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    const onPointer = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onPointer)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onPointer)
    }
  }, [open])

  return (
    <div ref={ref} className="relative sm:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="site-mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      <div
        id="site-mobile-menu"
        hidden={!open}
        className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg"
      >
        {MOBILE_MENU_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export function NavLinks() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  if (loading) {
    return <div className="flex min-h-[44px] items-center gap-3 whitespace-nowrap sm:h-9 sm:min-h-0 sm:gap-4"><span className="h-4 w-16" /></div>
  }

  if (user) {
    return (
      <div className="flex min-h-[44px] items-center gap-3 whitespace-nowrap sm:h-9 sm:min-h-0 sm:gap-4">
        <Link href="/dashboard" className="inline-flex min-h-[44px] items-center text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:min-h-0">
          Dashboard
        </Link>
        <Link href="/app" className="inline-flex min-h-[44px] items-center text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:min-h-0">
          Open App
        </Link>
        <button
          onClick={async () => { await signOut(); router.push("/") }}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          Log Out
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-[44px] items-center gap-3 whitespace-nowrap sm:h-9 sm:min-h-0 sm:gap-4">
      <Link href="/roofing-supplement-software" className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 lg:block">
        How It Works
      </Link>
      <Link href="/blog" className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:block">
        Blog
      </Link>
      <Link href="/pricing" className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:block">
        Pricing
      </Link>
      <Link href="/login" className="inline-flex min-h-[44px] items-center text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:min-h-0">
        Log In
      </Link>
      <Link
        href="/signup"
        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 sm:py-2"
      >
        Start Free
      </Link>
      <MobileMenu />
    </div>
  )
}
