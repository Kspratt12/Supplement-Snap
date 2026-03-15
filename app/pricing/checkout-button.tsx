"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"

export function CheckoutButton() {
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
      })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || "Something went wrong. Please try again.")
        setLoading(false)
      }
    } catch {
      alert("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="mt-8 block w-full rounded-lg bg-indigo-600 px-6 py-3.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Redirecting to checkout...
        </span>
      ) : (
        "Get Started"
      )}
    </button>
  )
}

export function CancelBanner() {
  const searchParams = useSearchParams()
  const canceled = searchParams.get("canceled")

  if (!canceled) return null

  return (
    <div className="mx-auto max-w-md px-6 pt-6">
      <div className="rounded-lg bg-amber-50 px-4 py-3 text-center text-sm text-amber-700">
        Payment canceled. You can start checkout again anytime.
      </div>
    </div>
  )
}
