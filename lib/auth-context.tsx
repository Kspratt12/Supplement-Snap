"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "./supabase"

type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "inactive"

type AuthContextType = {
  user: User | null
  loading: boolean
  subscriptionStatus: SubscriptionStatus
  subscriptionLoading: boolean
  signOut: () => Promise<void>
  refreshSubscription: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  subscriptionStatus: "inactive",
  subscriptionLoading: true,
  signOut: async () => {},
  refreshSubscription: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>("inactive")
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)

  async function loadSubscription(userId: string) {
    setSubscriptionLoading(true)
    const { data } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    setSubscriptionStatus((data?.status as SubscriptionStatus) || "inactive")
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) {
        loadSubscription(session.user.id)
      } else {
        setSubscriptionStatus("inactive")
        setSubscriptionLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setSubscriptionStatus("inactive")
  }

  return (
    <AuthContext.Provider value={{ user, loading, subscriptionStatus, subscriptionLoading, signOut, refreshSubscription }}>
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
