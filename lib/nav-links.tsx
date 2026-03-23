"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "./auth-context"

export function NavLinks() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  if (loading) {
    return <div className="flex items-center gap-4"><span className="h-4 w-16" /></div>
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          Dashboard
        </Link>
        <Link href="/app" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
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
      <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
        Log In
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
