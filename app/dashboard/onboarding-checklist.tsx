"use client"

import Link from "next/link"

type ChecklistProps = {
  isActive: boolean
  hasProjects: boolean
  hasCaptures: boolean
  hasSentReport: boolean
}

const STEPS = [
  {
    label: "Start your subscription",
    description: "Activate your plan to unlock all features.",
    href: "/pricing",
    key: "subscription" as const,
  },
  {
    label: "Create your first project",
    description: "Set up a project for a property you're working on.",
    href: "/app",
    key: "project" as const,
  },
  {
    label: "Capture damage photos",
    description: "Document concealed damage found during tear-off.",
    href: "/app",
    key: "capture" as const,
  },
  {
    label: "Generate your first supplement report",
    description: "Create and send a professional supplement to the adjuster.",
    href: "/app",
    key: "report" as const,
  },
]

export function OnboardingChecklist({ isActive, hasProjects, hasCaptures, hasSentReport }: ChecklistProps) {
  const completed = [isActive, hasProjects, hasCaptures, hasSentReport]
  const completedCount = completed.filter(Boolean).length

  if (completedCount === 4) return null

  function isStepComplete(index: number) {
    return completed[index]
  }

  function isStepLocked(index: number) {
    if (index === 0) return false
    return !isActive
  }

  return (
    <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Getting Started</h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            {completedCount} of {STEPS.length} steps completed
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full ${
                isStepComplete(i) ? "bg-indigo-600" : "bg-zinc-200"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-1">
        {STEPS.map((step, i) => {
          const done = isStepComplete(i)
          const locked = isStepLocked(i)

          return (
            <div
              key={step.key}
              className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${
                done ? "opacity-60" : locked ? "opacity-40" : ""
              }`}
            >
              {/* Checkbox indicator */}
              <div className="mt-0.5 flex-shrink-0">
                {done ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : locked ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-zinc-200 bg-zinc-50">
                    <svg className="h-3 w-3 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-zinc-300" />
                )}
              </div>

              {/* Label + description */}
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${done ? "text-zinc-500 line-through" : "text-zinc-900"}`}>
                  {step.label}
                </p>
                {!done && !locked && (
                  <p className="mt-0.5 text-xs text-zinc-400">{step.description}</p>
                )}
              </div>

              {/* Action link */}
              {!done && !locked && (
                <Link
                  href={step.href}
                  className="flex-shrink-0 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                >
                  {i === 0 ? "View Plans" : "Go"}
                </Link>
              )}
              {locked && (
                <span className="flex-shrink-0 text-xs text-zinc-300">Locked</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
