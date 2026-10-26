import { createClient } from "@supabase/supabase-js"

export type Plan = "free" | "starter" | "team" | "pro"
export type SubStatus = "active" | "trialing" | "past_due" | "canceled" | "inactive"

export type Access = {
  plan: Plan
  status: SubStatus
  /** true when the user (or the team owner they belong to) has an active, trialing or past-due-but-retrying subscription */
  active: boolean
  /** true when the access comes from a team owner's subscription, not the user's own */
  viaOwner: boolean
  /** true when this account has its own Stripe customer (so a billing portal exists) */
  hasBilling: boolean
  ownerId?: string
}

const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

// "past_due" means a renewal payment failed and Stripe is still retrying the card. The customer keeps access during
// that window. If every retry fails, Stripe cancels the subscription and the webhook marks it "canceled".
const isLive = (s?: string | null) => s === "active" || s === "trialing" || s === "past_due"
const normPlan = (p?: string | null): Plan => (p === "team" || p === "pro" || p === "starter" ? p : "starter")

/**
 * Work out what a user is allowed to use. Looks at their own subscription first,
 * then at the subscription of any team owner who invited their email.
 * Also activates pending invites for this email (the invited person just signed in).
 */
export async function getAccess(userId: string, email?: string | null): Promise<Access> {
  const db = admin()

  const { data: own } = await db
    .from("subscriptions")
    .select("status, plan, stripe_customer_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (own && isLive(own.status)) {
    return { plan: normPlan(own.plan), status: own.status as SubStatus, active: true, viaOwner: false, hasBilling: !!own.stripe_customer_id }
  }

  if (email) {
    const lower = email.toLowerCase()

    // An invited person has now signed in: turn their pending invites into active ones
    await db
      .from("team_members")
      .update({ status: "active", member_user_id: userId, accepted_at: new Date().toISOString() })
      .eq("member_email", lower)
      .eq("status", "pending")

    const { data: memberships } = await db
      .from("team_members")
      .select("owner_id")
      .eq("member_email", lower)
      .eq("status", "active")

    for (const m of memberships || []) {
      const { data: ownerSub } = await db
        .from("subscriptions")
        .select("status, plan")
        .eq("user_id", m.owner_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (ownerSub && isLive(ownerSub.status)) {
        return { plan: normPlan(ownerSub.plan), status: ownerSub.status as SubStatus, active: true, viaOwner: true, hasBilling: false, ownerId: m.owner_id }
      }
    }
  }

  return {
    plan: "free",
    status: (own?.status as SubStatus) || "inactive",
    active: false,
    viaOwner: false,
    hasBilling: false,
  }
}

/** What each plan includes. Mirrors the pricing page. */
export const can = {
  emailReports: (a: Access) => a.active,
  xactimateExport: (a: Access) => a.active && (a.plan === "team" || a.plan === "pro"),
  emailTracking: (a: Access) => a.active && (a.plan === "team" || a.plan === "pro"),
  customBranding: (a: Access) => a.active && a.plan === "pro",
}

/** Extra seats an owner can invite, on top of the owner. Team = 3 users, Pro = 5 users. */
export const MAX_INVITES: Record<string, number> = { starter: 0, team: 2, pro: 4 }

/** Map a Stripe price id to our plan name using the price ids configured in the environment. */
export function planFromPriceId(priceId?: string | null): Plan | null {
  if (!priceId) return null
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) return "pro"
  if (priceId === process.env.STRIPE_PRICE_TEAM_MONTHLY) return "team"
  if (priceId === process.env.STRIPE_PRICE_MONTHLY) return "starter"
  return null
}
