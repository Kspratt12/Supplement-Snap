"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "./supabase"

type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "inactive"
type SubscriptionPlan = "starter" | "team" | "pro" | "enterprise" | "none"

type SubscriptionResult = { status: string; plan: string; viaOwner: boolean; hasBilling: boolean; admin: boolean }

type AuthContextType = {
  user: User | null
  loading: boolean
  subscriptionStatus: SubscriptionStatus
  subscriptionPlan: SubscriptionPlan
  subscriptionLoading: boolean
  /**
   * The latest check of this account's plan failed (server and direct lookup both), so the status shown is either empty
   * or the last answer that did succeed for the same account. It says nothing about whether the plan is inactive.
   * Cleared when a check succeeds, and whenever the account changes or signs out.
   */
  subscriptionUnverified: boolean
  /** access comes from a team owner's plan */
  subscriptionViaOwner: boolean
  /** this account has its own Stripe billing */
  subscriptionHasBilling: boolean
  /** this login is the site admin (decided by the server) */
  isAdmin: boolean
  signOut: () => Promise<void>
  signOutEverywhere: () => Promise<void>
  refreshSubscription: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  subscriptionStatus: "inactive",
  subscriptionPlan: "none",
  subscriptionLoading: true,
  subscriptionUnverified: false,
  subscriptionViaOwner: false,
  subscriptionHasBilling: false,
  isAdmin: false,
  signOut: async () => {},
  signOutEverywhere: async () => {},
  refreshSubscription: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>("inactive")
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>("none")
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [subscriptionUnverified, setSubscriptionUnverified] = useState(false)
  const [subscriptionViaOwner, setSubscriptionViaOwner] = useState(false)
  const [subscriptionHasBilling, setSubscriptionHasBilling] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // Which account's subscription is being tracked, and the bookkeeping that keeps overlapping requests apart.
  // Everything here is reset when the account changes or signs out, so nothing earlier can land afterwards.
  const accountRef = useRef<string | null>(null)
  const epochRef = useRef(0)
  const seqRef = useRef(0)
  const appliedSeqRef = useRef(0) // the newest request whose answer is on screen
  const pendingRef = useRef<Set<number>>(new Set())
  const heldRef = useRef<{ seq: number; result: SubscriptionResult } | null>(null) // a success waiting on a newer request

  function applyResult(result: SubscriptionResult | null) {
    setSubscriptionStatus((result?.status as SubscriptionStatus) || "inactive")
    setSubscriptionPlan((result?.plan as SubscriptionPlan) || "none")
    setSubscriptionViaOwner(!!result?.viaOwner)
    setSubscriptionHasBilling(!!result?.hasBilling)
    setIsAdmin(!!result?.admin)
    setSubscriptionLoading(false)
    setSubscriptionUnverified(false)
  }

  /** Invalidates every earlier request and forgets the account (sign-out, or before another account loads) */
  function resetAccount(next: string | null) {
    epochRef.current++
    accountRef.current = next
    appliedSeqRef.current = 0
    pendingRef.current.clear()
    heldRef.current = null
    applyResult(null)
    setSubscriptionLoading(next !== null)
  }

  /**
   * Asks the server for the plan. Returns null when the request FAILED, which says nothing about access.
   * A completed answer is returned even when it is "no access".
   *  - /api/subscription 200 with a status: authoritative (including inactive and canceled)
   *  - /api/subscription 401/403/429/5xx, a network error, or a 200 without a status: failed, so the direct
   *    lookup is tried
   *  - the direct lookup finding a row: used; finding no row or erroring: failed
   */
  async function requestSubscription(userId: string): Promise<SubscriptionResult | null> {
    try {
      // The server also covers team members who inherit their owner's plan
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch("/api/subscription", {
        cache: "no-store",
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      })
      if (res.ok) {
        const json = await res.json()
        if (json.status) {
          return { status: json.status, plan: json.plan, viaOwner: !!json.viaOwner, hasBilling: !!json.hasBilling, admin: !!json.isAdmin }
        }
      }
    } catch {
      // fall through to the direct lookup below
    }
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status, plan, stripe_customer_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!error && data?.status) {
        return { status: data.status, plan: data.plan, viaOwner: false, hasBilling: !!data.stripe_customer_id, admin: false }
      }
    } catch {
      // failed
    }
    return null
  }

  async function loadSubscription(userId: string, silent = false) {
    if (accountRef.current !== userId) resetAccount(userId)
    const epoch = epochRef.current
    const seq = ++seqRef.current
    pendingRef.current.add(seq)
    if (!silent) setSubscriptionLoading(true)

    const result = await requestSubscription(userId)

    // The account changed or signed out while this was waiting: nothing about it is current any more
    if (epoch !== epochRef.current) return
    pendingRef.current.delete(seq)
    const newerPending = [...pendingRef.current].some((s) => s > seq)

    if (result) {
      if (seq < appliedSeqRef.current) return // a newer answer is already on screen
      if (newerPending) {
        // Keep it in case the newer request fails; the newer answer replaces it if it succeeds
        if (!heldRef.current || heldRef.current.seq < seq) heldRef.current = { seq, result }
        return
      }
      heldRef.current = null
      appliedSeqRef.current = seq
      applyResult(result)
      return
    }

    // The request failed
    if (pendingRef.current.size > 0) return // another request for this account is still to answer
    const held = heldRef.current
    heldRef.current = null
    if (held && held.seq > appliedSeqRef.current) {
      appliedSeqRef.current = held.seq
      applyResult(held.result)
      return
    }
    if (appliedSeqRef.current > 0) {
      // Something for this account is already on screen: a failed refresh leaves it as it is
      setSubscriptionLoading(false)
      setSubscriptionUnverified(true)
      return
    }
    // Nothing succeeded for this account: no access is shown until a request succeeds
    applyResult(null)
    setSubscriptionUnverified(true)
  }

  useEffect(() => {
    if (!user) return
    const onVisible = () => {
      if (document.visibilityState === "visible") loadSubscription(user.id, true)
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  async function refreshSubscription() {
    if (user) await loadSubscription(user.id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) {
        loadSubscription(session.user.id, session.user.id === accountRef.current)
      } else {
        setSubscriptionLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
      // Only reload subscription on real auth changes, not token refreshes (prevents tab-switch flicker)
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        if (session?.user) {
          // The same account again (the library reports SIGNED_IN whenever a hidden tab is shown) refreshes in the
          // background so the dashboard stays mounted; a different account starts clean
          loadSubscription(session.user.id, session.user.id === accountRef.current)
        } else {
          resetAccount(null)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    resetAccount(null)
    setUser(null)
  }

  // "global" revokes the login on every device, not just this one
  async function signOutEverywhere() {
    await supabase.auth.signOut({ scope: "global" })
    resetAccount(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, subscriptionStatus, subscriptionPlan, subscriptionLoading, subscriptionUnverified, subscriptionViaOwner, subscriptionHasBilling, isAdmin, signOut, signOutEverywhere, refreshSubscription }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export function hasActiveSubscription(status: SubscriptionStatus): boolean {
  // past_due: a renewal failed and Stripe is retrying, so access continues until the retries run out
  return status === "active" || status === "trialing" || status === "past_due"
}
