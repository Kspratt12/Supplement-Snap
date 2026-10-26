"use client"

import { useState } from "react"
import { hasCreatedProject, hideGuideThisVisit, isGuideHiddenThisVisit, shouldShowStartGuide } from "../../lib/guide-state"
import {
  CLAIM_STATUSES,
  CLAIM_STATUS_STYLES,
  countByStatus,
  normalizeClaimStatus,
  type ClaimStatus,
} from "../../lib/claim-status"

interface ProjectLike {
  claim_status?: string | null
}

/** Search box plus status filter pills. Only rendered when there is something to search. */
export function ClaimsOverview({
  projects,
  query,
  onQuery,
  filter,
  onFilter,
  matchCount,
}: {
  projects: ProjectLike[]
  query: string
  onQuery: (q: string) => void
  filter: ClaimStatus | "All"
  onFilter: (f: ClaimStatus | "All") => void
  matchCount: number
}) {
  const counts = countByStatus(projects)
  const active = query.trim() !== "" || filter !== "All"
  const pill =
    "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
  const pillOff =
    "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
  const pillOn = "border-indigo-600 bg-indigo-600 text-white"

  return (
    <div className="mb-4 space-y-3" data-testid="claims-overview">
      <div>
        <label htmlFor="project-search" className="sr-only">
          Search projects by name, address, claim number or insurance company
        </label>
        <div className="flex gap-2">
          <input
            id="project-search"
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search by name, address, claim number or carrier"
            autoComplete="off"
            className="min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          {active && (
            <button
              type="button"
              onClick={() => {
                onQuery("")
                onFilter("All")
              }}
              className="min-h-10 shrink-0 rounded-lg border border-zinc-300 px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter projects by claim status">
        <button type="button" aria-pressed={filter === "All"} onClick={() => onFilter("All")} className={`${pill} ${filter === "All" ? pillOn : pillOff}`}>
          All <span className="opacity-70">{projects.length}</span>
        </button>
        {CLAIM_STATUSES.filter((s) => counts[s] > 0 || filter === s).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={filter === s}
            onClick={() => onFilter(filter === s ? "All" : s)}
            className={`${pill} ${filter === s ? pillOn : pillOff}`}
          >
            {s} <span className="opacity-70">{counts[s]}</span>
          </button>
        ))}
      </div>

      {active && (
        <p className="text-xs text-zinc-500" role="status" aria-live="polite">
          {matchCount === 0
            ? "No projects match. Try a different word or clear the filters."
            : `${matchCount} project${matchCount === 1 ? "" : "s"} shown`}
        </p>
      )}
    </div>
  )
}

/** Lets the user move a job through the claim stages. Saving is handled by the parent. */
export function ClaimStatusSelect({
  value,
  onChange,
  saving,
  error,
}: {
  value?: string | null
  onChange: (next: ClaimStatus) => void
  saving: boolean
  error: string
}) {
  const current = normalizeClaimStatus(value)
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <label htmlFor="claim-status" className="font-medium text-zinc-600 dark:text-zinc-400">
        Claim status
      </label>
      <select
        id="claim-status"
        value={current}
        disabled={saving}
        onChange={(e) => onChange(e.target.value as ClaimStatus)}
        className={`min-h-8 rounded-full border-0 px-3 py-1 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60 ${CLAIM_STATUS_STYLES[current]}`}
      >
        {CLAIM_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {saving && <span className="text-zinc-500">Saving...</span>}
      {error && (
        <span role="alert" className="text-red-600">
          {error}
        </span>
      )}
    </span>
  )
}

/**
 * A short guide for accounts that have no project of their own yet.
 * It never shows once the person has created a project, even if they later delete it.
 * Hide only lasts for this visit: it comes back the next time they log in, until they create a project.
 */
export function StartHere({
  userId,
  onlyDemoOrNone,
  onCreateProject,
  isFreeUser,
  freeCaptureLimit,
}: {
  userId: string
  onlyDemoOrNone: boolean
  onCreateProject: () => void
  isFreeUser: boolean
  freeCaptureLimit: number
}) {
  // This only renders after the dashboard has loaded the user's projects in the browser, so storage can be read directly.
  const [hidden, setHidden] = useState(() => isGuideHiddenThisVisit())

  if (!shouldShowStartGuide({ onlyDemoOrNone, createdBefore: hasCreatedProject(userId), hiddenThisVisit: hidden })) return null

  const dismiss = () => {
    setHidden(true)
    hideGuideThisVisit()
  }

  const steps = [
    { n: "1", title: "Start a project for a real job", text: "A name and the property address is enough. You can add the claim details later." },
    { n: "2", title: "Add what you find", text: "Take or upload photos, pick the damage type and roof area, and add a note. You can type it or speak it." },
    { n: "3", title: "Review the report", text: "The app drafts a description for each finding. Read it, fix anything that is not right, then build the report for the adjuster." },
  ]

  return (
    <section
      aria-labelledby="start-here-title"
      className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/40"
      data-testid="start-here"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="start-here-title" className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Start here: your first report in three steps
          </h2>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            The Demo Project below is already filled in so you can see how a finished job looks.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Hide the start guide"
          className="shrink-0 rounded px-3 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:text-zinc-200"
        >
          Hide
        </button>
      </div>

      <ol className="mt-4 space-y-3">
        {steps.map((s) => (
          <li key={s.n} className="flex gap-3">
            <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              {s.n}
            </span>
            <span>
              <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.title}</span>
              <span className="block text-xs text-zinc-600 dark:text-zinc-400">{s.text}</span>
            </span>
          </li>
        ))}
      </ol>

      {isFreeUser && (
        <p className="mt-4 rounded-lg bg-white/70 p-3 text-xs text-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-400">
          On the free plan you can try the demo project and one project of your own, each with up to {freeCaptureLimit} findings. Downloading the PDF, emailing it to an adjuster and the Xactimate export are on paid plans, so you will see the upgrade message there. Nothing is lost when you see it.
        </p>
      )}

      <button
        type="button"
        onClick={onCreateProject}
        className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        Start my first project
      </button>
    </section>
  )
}
