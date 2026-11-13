/**
 * The plan a visitor chose before being asked to sign up or log in. It travels in the address as ?plan=starter|team|pro and
 * is only ever used to decide where to go AFTER authentication; it never grants anything and never starts a purchase by itself.
 * Anything that is not exactly one of the known plans is ignored, so the address cannot be used to inject a path or a plan.
 */
export const PLAN_INTENTS = ["starter", "team", "pro"] as const
export type PlanIntent = (typeof PLAN_INTENTS)[number]

export function parsePlanIntent(search: string | null | undefined): PlanIntent | null {
  if (!search) return null
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
  const raw = params.get("plan") ?? params.get("start")
  return (PLAN_INTENTS as readonly string[]).includes(raw ?? "") ? (raw as PlanIntent) : null
}

/** Where to go once signed in: back to the pricing page with the chosen plan ready to continue, else the dashboard. */
export function afterAuthPath(plan: PlanIntent | null): string {
  return plan ? `/pricing?start=${plan}` : "/dashboard"
}

/** A link to the other auth page that keeps the chosen plan. */
export function withPlan(path: "/login" | "/signup", plan: PlanIntent | null): string {
  return plan ? `${path}?plan=${plan}` : path
}

export const PLAN_LABELS: Record<PlanIntent, string> = { starter: "Starter", team: "Team", pro: "Pro" }
