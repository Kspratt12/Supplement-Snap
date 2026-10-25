// Claim lifecycle for a project: where the supplement stands with the carrier.
// Stored in projects.claim_status (a plain text column that has existed since the first migrations).

export const CLAIM_STATUSES = [
  "In Progress",
  "Sent to Adjuster",
  "In Review",
  "Approved",
  "Partially Approved",
  "Denied",
  "Closed",
] as const

export type ClaimStatus = (typeof CLAIM_STATUSES)[number]

export const CLAIM_STATUS_STYLES: Record<ClaimStatus, string> = {
  "In Progress": "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  "Sent to Adjuster": "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "In Review": "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "Approved": "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  "Partially Approved": "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "Denied": "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  "Closed": "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
}

/** Maps whatever is stored (including null, empty or different casing) to a known status. */
export function normalizeClaimStatus(raw?: string | null): ClaimStatus {
  const value = (raw || "").trim().toLowerCase()
  const match = CLAIM_STATUSES.find((s) => s.toLowerCase() === value)
  return match ?? "In Progress"
}

export function countByStatus(projects: Array<{ claim_status?: string | null }>): Record<ClaimStatus, number> {
  const counts = Object.fromEntries(CLAIM_STATUSES.map((s) => [s, 0])) as Record<ClaimStatus, number>
  for (const p of projects) counts[normalizeClaimStatus(p.claim_status)]++
  return counts
}

interface Searchable {
  project_name: string
  property_address?: string | null
  claim_number?: string | null
  insurance_company?: string | null
  adjuster_name?: string | null
  claim_status?: string | null
}

/** Case-insensitive search across the fields a roofer actually remembers, plus an optional status filter. */
export function filterProjects<T extends Searchable>(projects: T[], query: string, status: ClaimStatus | "All"): T[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  return projects.filter((p) => {
    if (status !== "All" && normalizeClaimStatus(p.claim_status) !== status) return false
    if (terms.length === 0) return true
    const haystack = [p.project_name, p.property_address, p.claim_number, p.insurance_company, p.adjuster_name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    return terms.every((t) => haystack.includes(t))
  })
}

/** After a report is emailed to the adjuster, a job that was still in progress moves to "Sent to Adjuster". Later stages are never moved backwards. */
export function statusAfterSend(current?: string | null): ClaimStatus {
  const status = normalizeClaimStatus(current)
  return status === "In Progress" ? "Sent to Adjuster" : status
}

/** Demo project created for brand new accounts. */
export function isDemoProject(p: { project_name: string }): boolean {
  return p.project_name.startsWith("Demo Project")
}

/** True when the account has nothing but the auto-created demo project (or nothing at all). */
export function isFirstRun(projects: Array<{ project_name: string }>): boolean {
  return projects.every(isDemoProject)
}
