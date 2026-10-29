"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { supabase } from "../../lib/supabase"

type Step = { label: string; description: string; href: string; cta: string }

// Free accounts only get the demo project, so their steps are about trying it and upgrading.
const FREE_STEPS: Step[] = [
  { label: "Open your demo project", description: "See how a project, its findings and photos fit together.", href: "/app", cta: "Open" },
  { label: "Add a damage photo", description: "Take or upload a photo and save it as a capture.", href: "/app", cta: "Add photo" },
  { label: "Generate an AI supplement draft", description: "Turn one finding into a professional paragraph.", href: "/app", cta: "Try it" },
  { label: "Upgrade to unlock reports", description: "Unlimited projects, PDF reports and email to adjusters.", href: "/pricing", cta: "View plans" },
]

const PAID_STEPS: Step[] = [
  { label: "Create your first project", description: "Set up a project for a property you're working on.", href: "/app", cta: "Create" },
  { label: "Capture damage photos", description: "Document concealed damage found during tear-off.", href: "/app", cta: "Capture" },
  { label: "Generate your first supplement draft", description: "Turn your findings into supplement-ready text.", href: "/app", cta: "Generate" },
  { label: "Send your first report to an adjuster", description: "Create the PDF report and email it from the field.", href: "/app", cta: "Send" },
]

type Props = {
  mode: "free" | "paid"
  /** Whether each of the four steps is complete */
  done: boolean[]
  userId: string
  /** Saved on the account, so it follows the person to any device */
  savedState?: string | null
}

type Saved = "" | "minimized" | "dismissed"

export function OnboardingChecklist({ mode, done, userId, savedState }: Props) {
  const steps = mode === "free" ? FREE_STEPS : PAID_STEPS
  const completedCount = done.filter(Boolean).length

  // Free and paid have different steps, so each remembers its own dismiss
  const storageKey = `ss_onboarding:${userId}:${mode}`
  // The browser's own copy. It covers the moment before the account setting arrives.
  const local = useSyncExternalStore<Saved>(
    () => () => {},
    () => {
      try {
        const v = localStorage.getItem(storageKey)
        return v === "dismissed" || v === "minimized" ? v : ""
      } catch {
        return "" // storage unavailable
      }
    },
    () => ""
  )
  // False while the page is being prepared on the server, so nothing flashes before the real state is known
  const loaded = useSyncExternalStore(() => () => {}, () => true, () => false)
  // What the person just chose on this page. A newer account setting replaces it.
  const [chosen, setChosen] = useState<Saved | null>(null)
  const [seenSaved, setSeenSaved] = useState(savedState)
  if (seenSaved !== savedState) {
    setSeenSaved(savedState)
    setChosen(null)
  }
  // The account setting wins; then what was just chosen; then the browser copy
  const state: Saved = chosen ?? ((savedState as Saved) || local)

  function persist(next: Saved) {
    setChosen(next)
    try {
      if (next) localStorage.setItem(storageKey, next)
      else localStorage.removeItem(storageKey)
    } catch {
      // storage unavailable
    }
    // Save on the account so it follows this person to every device
    const data = next === "dismissed" ? { ss_onboarding_free: next, ss_onboarding_paid: next } : { [`ss_onboarding_${mode}`]: next }
    supabase.auth.updateUser({ data }).catch(() => {})
  }

  if (!loaded) return null
  if (state === "dismissed") return null
  if (done.every(Boolean)) return null

  if (state === "minimized") {
    return (
      <div className="mb-8 rounded-xl border border-zinc-200 bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-zinc-900">Getting Started</h2>
            <span className="text-xs text-zinc-500">{completedCount} of {steps.length} completed</span>
            <div className="flex items-center gap-1">
              {steps.map((_, i) => (
                <div key={i} className={`h-1.5 w-4 rounded-full ${done[i] ? "bg-indigo-600" : "bg-zinc-200"}`} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => persist("")} aria-label="Expand checklist" title="Expand" className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <button onClick={() => persist("dismissed")} aria-label="Dismiss checklist" title="Dismiss" className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // The first step that is not done is the one to nudge
  const nextIndex = done.findIndex((d) => !d)

  return (
    <div className="mb-8 rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Getting Started</h2>
          <p className="mt-0.5 text-xs text-zinc-500">{completedCount} of {steps.length} steps completed</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1 sm:flex">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 w-8 rounded-full ${done[i] ? "bg-indigo-600" : "bg-zinc-200"}`} />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => persist("minimized")} aria-label="Minimize checklist" title="Minimize" className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
            </button>
            <button onClick={() => persist("dismissed")} aria-label="Dismiss checklist" title="Dismiss" className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      </div>

      <ul className="border-t border-zinc-100">
        {steps.map((step, i) => (
          <li key={step.label} className={`flex items-center gap-3 px-5 py-3.5 ${i > 0 ? "border-t border-zinc-50" : ""}`}>
            <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${done[i] ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-300 text-transparent"}`}>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${done[i] ? "text-zinc-500 line-through" : "text-zinc-900"}`}>{step.label}</p>
              {!done[i] && <p className="mt-0.5 text-xs text-zinc-500">{step.description}</p>}
            </div>
            {!done[i] && (
              <Link
                href={step.href}
                className={`flex-shrink-0 rounded-md px-3 py-1.5 text-xs font-medium ${i === nextIndex ? "bg-indigo-600 text-white hover:bg-indigo-500" : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
              >
                {step.cta}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
