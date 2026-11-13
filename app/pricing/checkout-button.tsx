"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { trackEvent } from "../../lib/analytics"
import { authFetch } from "../../lib/auth-fetch"
import { useAuth } from "../../lib/auth-context"
import { PLAN_LABELS, parsePlanIntent, withPlan, type PlanIntent } from "../../lib/plan-intent"

export function CheckoutButton({ plan = "starter", label = "Get Started" }: { plan?: string; label?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [manageBilling, setManageBilling] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    setError("")
    setManageBilling(false)
    try {
      const res = await authFetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()

      if (res.status === 401 || data.code === "sign-in-required") {
        // Not signed in: create the account (or log in) first. The chosen plan travels with the visitor and is offered again after.
        const known = parsePlanIntent(`?plan=${plan}`)
        window.location.href = withPlan("/signup", known)
        return
      }
      if (data.url) {
        trackEvent("checkout_started")
        window.location.href = data.url
      } else {
        setError(data.error || "Unable to start checkout right now. Please try again.")
        setManageBilling(data.action === "manage_billing")
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
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          {error}
          {manageBilling && (
            <a href="/account" className="mt-2 block font-semibold underline">Go to your account</a>
          )}
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
          label
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
    <div className="mx-auto max-w-3xl px-6 pt-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-700">
        Test Mode Active — No real charges will be made
      </div>
    </div>
  )
}

/**
 * After signing up or logging in with a plan chosen, the pricing page offers that plan again. It never starts checkout by itself:
 * the customer presses Continue.
 */
export function PlanResumeBanner() {
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const plan: PlanIntent | null = parsePlanIntent(`?start=${searchParams.get("start") ?? ""}`)
  if (!plan || loading) return null
  return (
    <div className="mx-auto max-w-md px-6 pt-6">
      <div className="rounded-lg bg-indigo-50 px-4 py-3 text-center text-sm text-indigo-800" role="status">
        {user ? (
          <>
            <p>You chose the {PLAN_LABELS[plan]} plan. Continue when you are ready.</p>
            <CheckoutButton plan={plan} label={`Continue with ${PLAN_LABELS[plan]}`} />
          </>
        ) : (
          <p>
            To start the {PLAN_LABELS[plan]} plan, <a className="font-semibold underline" href={withPlan("/signup", plan)}>create an account</a> or{" "}
            <a className="font-semibold underline" href={withPlan("/login", plan)}>log in</a>.
          </p>
        )}
      </div>
    </div>
  )
}
