"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"
import { authFetch } from "../../lib/auth-fetch"
import { useAuth, hasActiveSubscription } from "../../lib/auth-context"

const PLAN_NAMES: Record<string, string> = { starter: "Starter", team: "Team", pro: "Pro", enterprise: "Enterprise", none: "Free" }

const PLAN_INCLUDES: Record<string, string[]> = {
  none: ["Demo project plus 1 project of your own", "Damage photo capture", "AI supplement draft", "Voice notes", "Sample PDF"],
  starter: ["Unlimited projects", "AI supplement drafts", "PDF reports and email to adjusters", "Photo annotations", "Voice notes", "1 user"],
  team: ["Everything in Starter", "Up to 3 team members", "Xactimate CSV export", "Email open tracking"],
  pro: ["Everything in Team", "Up to 5 team members", "Custom branding", "Priority email replies", "Setup walkthrough for your team"],
  enterprise: ["Everything in Pro"],
}

export default function AccountPage() {
  const router = useRouter()
  const {
    user, loading, signOut, signOutEverywhere,
    subscriptionStatus, subscriptionPlan, subscriptionLoading, subscriptionViaOwner, subscriptionHasBilling, isAdmin,
  } = useAuth()

  // What the person has typed. Until they type, the field shows the saved name.
  const [nameEdit, setNameEdit] = useState<string | null>(null)
  const name = nameEdit ?? ((user?.user_metadata?.full_name as string) || "")
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [savingName, setSavingName] = useState(false)

  const [password, setPassword] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [savingPw, setSavingPw] = useState(false)

  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState("")

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [loading, user, router])

  if (loading || !user) return null

  const isActive = hasActiveSubscription(subscriptionStatus)
  const planKey = isActive ? subscriptionPlan : "none"
  const planName = PLAN_NAMES[planKey] || "Free"
  const statusText =
    subscriptionStatus === "trialing" ? "Free trial"
    : subscriptionStatus === "active" ? "Active"
    : subscriptionStatus === "past_due" ? "Payment past due"
    : subscriptionStatus === "canceled" ? "Canceled"
    : "No subscription"

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    setNameMsg(null)
    const trimmed = name.trim()
    if (!trimmed) { setNameMsg({ ok: false, text: "Please enter your name." }); return }
    setSavingName(true)
    const { error } = await supabase.auth.updateUser({ data: { full_name: trimmed } })
    setSavingName(false)
    setNameMsg(error ? { ok: false, text: error.message } : { ok: true, text: "Name saved." })
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg(null)
    if (password.length < 6) { setPwMsg({ ok: false, text: "Use at least 6 characters." }); return }
    if (password !== confirmPw) { setPwMsg({ ok: false, text: "The two passwords do not match." }); return }
    setSavingPw(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setSavingPw(false)
      setPwMsg({ ok: false, text: error.message })
      return
    }
    // Changing the password signs out every other device
    await supabase.auth.signOut({ scope: "others" })
    setSavingPw(false)
    setPassword(""); setConfirmPw("")
    setPwMsg({ ok: true, text: "Password changed. Other devices were signed out." })
  }

  async function openBilling() {
    setPortalLoading(true); setPortalError("")
    try {
      const res = await authFetch("/api/stripe/portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      const data = await res.json()
      if (data.url) window.open(data.url, "_blank")
      else setPortalError("We could not open billing right now. Please email support@supplementsnap.io.")
    } catch {
      setPortalError("We could not open billing right now. Please try again.")
    }
    setPortalLoading(false)
  }

  const input = "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500"
  const card = "rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm"
  const btn = "rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"

  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <Link href="/dashboard" aria-label="Supplement Snap dashboard" className="flex min-h-[44px] items-center gap-2 sm:min-h-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</div>
            <span className="hidden whitespace-nowrap text-lg font-bold tracking-tight text-zinc-900 min-[480px]:inline">Supplement Snap</span>
          </Link>
          <div className="flex items-center gap-3 whitespace-nowrap">
            <Link href="/dashboard" className="inline-flex min-h-[44px] items-center text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:min-h-0">Dashboard</Link>
            {isAdmin && <Link href="/admin" className="inline-flex min-h-[44px] items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 sm:min-h-0">Admin</Link>}
            <button onClick={async () => { await signOut(); router.push("/") }} className="inline-flex min-h-[44px] items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 sm:min-h-0">Log Out</button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl space-y-5 px-4 sm:px-6 py-6 sm:py-10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">Account</h1>
          <p className="mt-1 text-sm text-zinc-500">Your profile, password, plan and billing.</p>
        </div>

        {/* Plan and billing */}
        <section className={card} aria-labelledby="plan-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="plan-heading" className="text-base font-semibold text-zinc-900">Plan and billing</h2>
              {subscriptionLoading ? (
                <p className="mt-2 text-sm text-zinc-500">Loading...</p>
              ) : (
                <p className="mt-2 text-sm text-zinc-600">
                  <span className="font-semibold text-zinc-900">{planName}</span>
                  <span className="mx-2 text-zinc-300">|</span>
                  {statusText}
                </p>
              )}
            </div>
            {!subscriptionLoading && (
              <div className="flex flex-wrap gap-2">
                {subscriptionHasBilling && (
                  <button onClick={openBilling} disabled={portalLoading} className={btn}>
                    {portalLoading ? "Opening..." : "Manage billing or cancel"}
                  </button>
                )}
                {!subscriptionViaOwner && planKey !== "pro" && planKey !== "enterprise" && (
                  <Link href="/pricing" className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                    {planKey === "none" ? "See plans" : "Change plan"}
                  </Link>
                )}
              </div>
            )}
          </div>

          {!subscriptionLoading && (
            <>
              {subscriptionViaOwner && (
                <p className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
                  Your access comes from your team owner&apos;s {planName} plan. Billing is handled by the owner.
                </p>
              )}
              {isActive && !subscriptionViaOwner && !subscriptionHasBilling && (
                <p className="mt-3 rounded-lg bg-zinc-100 px-3 py-2 text-xs text-zinc-600">
                  This account has complimentary access, so there is no billing to manage.
                </p>
              )}
              {subscriptionStatus === "past_due" && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Your last payment did not go through. You can keep using Supplement Snap while we retry, but please update your card under Manage billing so your plan is not cancelled.
                </p>
              )}
              {subscriptionHasBilling && !subscriptionViaOwner && (
                <p className="mt-3 text-xs text-zinc-500">
                  You can cancel anytime from Manage billing, with no calls and no emails. You keep access until the end of the period you have paid for.
                </p>
              )}
              {portalError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{portalError}</p>}
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Included in {planName}</p>
                <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {(PLAN_INCLUDES[planKey] || PLAN_INCLUDES.none).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-zinc-600">
                      <svg className="h-4 w-4 flex-shrink-0 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </section>

        {/* Profile */}
        <section className={card} aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="text-base font-semibold text-zinc-900">Profile</h2>
          <form onSubmit={saveName} className="mt-4 space-y-4">
            <div>
              <label htmlFor="acct-name" className="mb-1.5 block text-sm font-medium text-zinc-700">Name</label>
              <input id="acct-name" autoComplete="name" value={name} onChange={(e) => setNameEdit(e.target.value)} className={input} placeholder="Your name" maxLength={80} />
            </div>
            <div>
              <label htmlFor="acct-email" className="mb-1.5 block text-sm font-medium text-zinc-700">Email</label>
              <input id="acct-email" value={user.email || ""} readOnly className={`${input} bg-zinc-50 text-zinc-500`} />
              <p className="mt-1.5 text-xs text-zinc-500">
                Your email is tied to your plan and team invites. To change it, email{" "}
                <a href="mailto:support@supplementsnap.io" className="font-medium text-indigo-600 hover:text-indigo-500">support@supplementsnap.io</a>.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={savingName} className={btn}>{savingName ? "Saving..." : "Save name"}</button>
              {nameMsg && <p role="status" className={`text-sm ${nameMsg.ok ? "text-green-700" : "text-red-700"}`}>{nameMsg.text}</p>}
            </div>
          </form>
        </section>

        {/* Password */}
        <section className={card} aria-labelledby="password-heading">
          <h2 id="password-heading" className="text-base font-semibold text-zinc-900">Password</h2>
          <form onSubmit={savePassword} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="acct-pw" className="mb-1.5 block text-sm font-medium text-zinc-700">New password</label>
                <input id="acct-pw" type="password" autoComplete="new-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={input} placeholder="At least 6 characters" />
              </div>
              <div>
                <label htmlFor="acct-pw2" className="mb-1.5 block text-sm font-medium text-zinc-700">Confirm new password</label>
                <input id="acct-pw2" type="password" autoComplete="new-password" minLength={6} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={input} placeholder="Re-enter it" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={savingPw || !password} className={btn}>{savingPw ? "Saving..." : "Change password"}</button>
              {pwMsg && <p role="status" className={`text-sm ${pwMsg.ok ? "text-green-700" : "text-red-700"}`}>{pwMsg.text}</p>}
            </div>
          </form>
        </section>

        {/* Sessions */}
        <section className={card} aria-labelledby="security-heading">
          <h2 id="security-heading" className="text-base font-semibold text-zinc-900">Devices</h2>
          <p className="mt-2 text-sm text-zinc-600">You stay logged in on this device until you log out. If a phone is lost or you used a shared computer, sign out everywhere.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={async () => { await signOut(); router.push("/") }} className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">Log out</button>
            <button
              onClick={async () => {
                if (!confirm("Log out of Supplement Snap on every device, including this one?")) return
                await signOutEverywhere()
                router.push("/")
              }}
              className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Log out of all devices
            </button>
          </div>
        </section>

        <p className="pb-6 text-center text-xs text-zinc-500">
          Need to delete your account or have a privacy request? Email{" "}
          <a href="mailto:privacy@supplementsnap.io" className="font-medium text-indigo-600 hover:text-indigo-500">privacy@supplementsnap.io</a>.
        </p>
      </main>
    </div>
  )
}
