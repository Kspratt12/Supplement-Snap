"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "./supabase"

type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "inactive"
type SubscriptionPlan = "starter" | "team" | "pro" | "enterprise" | "none"

type AuthContextType = {
  user: User | null
  loading: boolean
  subscriptionStatus: SubscriptionStatus
  subscriptionPlan: SubscriptionPlan
  subscriptionLoading: boolean
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
  const [subscriptionViaOwner, setSubscriptionViaOwner] = useState(false)
  const [subscriptionHasBilling, setSubscriptionHasBilling] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  async function loadSubscription(userId: string, silent = false) {
    if (!silent) setSubscriptionLoading(true)
    let status: string | undefined
    let plan: string | undefined
    let viaOwner = false
    let hasBilling = false
    let admin = false
    try {
      // The server also covers team members who inherit their owner's plan
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch("/api/subscription", {
        cache: "no-store",
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      })
      if (res.ok) {
        const json = await res.json()
        status = json.status
        plan = json.plan
        viaOwner = !!json.viaOwner
        hasBilling = !!json.hasBilling
        admin = !!json.isAdmin
      }
    } catch {
      // fall through to the direct lookup below
    }
    if (!status) {
      const { data } = await supabase
        .from("subscriptions")
        .select("status, plan, stripe_customer_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      status = data?.status
      plan = data?.plan
      hasBilling = !!data?.stripe_customer_id
    }

    setSubscriptionStatus((status as SubscriptionStatus) || "inactive")
    setSubscriptionPlan((plan as SubscriptionPlan) || "none")
    setSubscriptionViaOwner(viaOwner)
    setSubscriptionHasBilling(hasBilling)
    setIsAdmin(admin)
    setSubscriptionLoading(false)
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
        loadSubscription(session.user.id)
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
          loadSubscription(session.user.id)
        } else {
          setSubscriptionStatus("inactive")
          setSubscriptionPlan("none")
          setSubscriptionLoading(false)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setSubscriptionStatus("inactive")
    setSubscriptionPlan("none")
  }

  // "global" revokes the login on every device, not just this one
  async function signOutEverywhere() {
    await supabase.auth.signOut({ scope: "global" })
    setUser(null)
    setSubscriptionStatus("inactive")
    setSubscriptionPlan("none")
  }

  return (
    <AuthContext.Provider value={{ user, loading, subscriptionStatus, subscriptionPlan, subscriptionLoading, subscriptionViaOwner, subscriptionHasBilling, isAdmin, signOut, signOutEverywhere, refreshSubscription }}>
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
