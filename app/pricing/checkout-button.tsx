"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "../../lib/auth-context"

/*
 * ─── STRIPE TEST CHECKLIST ───────────────────────────────────────
 * 1. Confirm STRIPE_SECRET_KEY is set (env var, starts with sk_test_ for test mode)
 * 2. Confirm STRIPE_PRICE_SETUP is set (one-time $497 price ID)
 * 3. Confirm STRIPE_PRICE_MONTHLY is set (recurring $49/mo price ID)
 * 4. Click "Get Started" on /pricing
 * 5. Confirm Stripe checkout page opens
 * 6. Use test card: 4242 4242 4242 4242, any future exp, any CVC
 * 7. Confirm success redirect goes to /success
 * 8. Confirm cancel redirect goes to /pricing?canceled=true
 * ─────────────────────────────────────────────────────────────────
 */

export function CheckoutButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { user } = useAuth()

  async function handleCheckout() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email, userId: user?.id }),
      })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || "Unable to start checkout right now. Please try again.")
        setLoading(false)
      }
    } catch {
      setError("Unable to start checkout right now. Please try again.")
      setLoading(false)
    }
  }

  return (
    <>
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600">
          {error}
        </div>
      )}
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
    </>
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

export function TestModeBanner({ isTestMode }: { isTestMode: boolean }) {
  if (!isTestMode) return null

  return (
    <div className="mx-auto max-w-md px-6 pt-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-700">
        Test Mode Active — No real charges will be made
      </div>
    </div>
  )
}
