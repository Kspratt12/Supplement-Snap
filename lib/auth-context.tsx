"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "./supabase"

type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "inactive"
type SubscriptionPlan = "starter" | "pro" | "none"

type AuthContextType = {
  user: User | null
  loading: boolean
  subscriptionStatus: SubscriptionStatus
  subscriptionPlan: SubscriptionPlan
  subscriptionLoading: boolean
  signOut: () => Promise<void>
  refreshSubscription: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  subscriptionStatus: "inactive",
  subscriptionPlan: "none",
  subscriptionLoading: true,
  signOut: async () => {},
  refreshSubscription: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>("inactive")
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>("none")
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)

  async function loadSubscription(userId: string) {
    setSubscriptionLoading(true)
    const { data } = await supabase
      .from("subscriptions")
      .select("status, plan")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    setSubscriptionStatus((data?.status as SubscriptionStatus) || "inactive")
    setSubscriptionPlan((data?.plan as SubscriptionPlan) || "starter")
    setSubscriptionLoading(false)
  }

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

  return (
    <AuthContext.Provider value={{ user, loading, subscriptionStatus, subscriptionPlan, subscriptionLoading, signOut, refreshSubscription }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export function hasActiveSubscription(status: SubscriptionStatus): boolean {
  return status === "active" || status === "trialing"
}
