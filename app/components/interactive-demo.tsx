"use client"

import { useState, useEffect } from "react"

const STEPS = [
  {
    label: "1. Snap the damage",
    description: "Crew photographs hidden damage during tear-off",
    screen: "capture",
  },
  {
    label: "2. Tag & describe",
    description: "Select damage type, roof area, add voice note",
    screen: "tag",
  },
  {
    label: "3. AI generates report",
    description: "Professional supplement narrative in seconds",
    screen: "generate",
  },
  {
    label: "4. Email to adjuster",
    description: "PDF report sent with one tap",
    screen: "send",
  },
]

export function InteractiveDemo() {
  const [step, setStep] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [isPaused])

  return (
    <div
      className="rounded-2xl border border-zinc-200 bg-white shadow-lg overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Step indicator */}
      <div className="flex border-b border-zinc-100">
        {STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`flex-1 px-3 py-3 text-xs font-medium transition-all ${
              i === step
                ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">Step {i + 1}</span>
          </button>
        ))}
      </div>

      {/* Screen area */}
      <div className="relative bg-gradient-to-br from-zinc-50 to-white" style={{ height: "400px" }}>
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-100 z-10">
          <div
            className="h-full bg-indigo-600 transition-all duration-[4000ms] ease-linear"
            style={{ width: isPaused ? `${((step + 0.5) / STEPS.length) * 100}%` : `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step 1: Capture */}
        <div className={`absolute inset-0 p-6 sm:p-8 transition-opacity duration-500 ${step === 0 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <div className="mx-auto max-w-sm">
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              {/* Phone camera mockup */}
              <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400">Camera</span>
                <div className="flex gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] text-zinc-400">REC</span>
                </div>
              </div>
              <div className="relative h-40 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-sm">
                    <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-amber-700">Rotted decking found</p>
                  <p className="text-[10px] text-amber-600">Front slope — eave area</p>
                </div>
                {/* Animated cursor */}
                <div className="absolute bottom-4 right-4 animate-bounce">
                  <div className="h-10 w-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center border-2 border-indigo-500">
                    <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-xs font-medium text-zinc-500">Photo captured from the roof</p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Tag */}
        <div className={`absolute inset-0 p-6 sm:p-8 transition-opacity duration-500 ${step === 1 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <div className="mx-auto max-w-sm">
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">New Capture</p>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="aspect-square rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 border border-zinc-200" />
                <div className="aspect-square rounded-lg bg-gradient-to-br from-amber-100 to-orange-50 border border-zinc-200" />
                <div className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 text-xs text-zinc-400">+</div>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 ring-2 ring-indigo-300 animate-pulse">Decking</span>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">Flashing</span>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">Ice & Water</span>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 ring-2 ring-indigo-300 animate-pulse">Front</span>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">Back</span>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">Valley</span>
                </div>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-zinc-500">3 sheets of rotted decking along eave...</span>
                </div>
              </div>
              <div className="h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <span className="text-xs font-semibold text-white">Save Capture</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Generate */}
        <div className={`absolute inset-0 p-6 sm:p-8 transition-opacity duration-500 ${step === 2 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <div className="mx-auto max-w-sm">
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-indigo-600 px-4 py-2">
                <p className="text-[10px] font-semibold text-white">Supplement Snap — AI Draft</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                  <span className="text-xs font-medium text-indigo-600">Generating supplement narrative...</span>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3 space-y-2">
                  <p className="text-[11px] leading-relaxed text-zinc-600 animate-pulse">
                    During tear-off operations on the front slope, three sheets of rotted OSB decking were discovered along the eave edge. The damage was concealed beneath existing shingles and underlayment. Wood was soft and deteriorated from prolonged moisture exposure, requiring full replacement to maintain structural integrity...
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-7 rounded bg-indigo-600 flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-white">Copy Draft</span>
                  </div>
                  <div className="flex-1 h-7 rounded border border-zinc-200 flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-zinc-600">Regenerate</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Send */}
        <div className={`absolute inset-0 p-6 sm:p-8 transition-opacity duration-500 ${step === 3 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <div className="mx-auto max-w-sm">
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Send Report</p>
              <div className="space-y-2">
                <div className="rounded-lg border border-zinc-200 px-3 py-2">
                  <p className="text-[10px] text-zinc-400">To</p>
                  <p className="text-xs text-zinc-700">adjuster@insuranceco.com</p>
                </div>
                <div className="rounded-lg border border-zinc-200 px-3 py-2">
                  <p className="text-[10px] text-zinc-400">Subject</p>
                  <p className="text-xs text-zinc-700">Supplement Request — Smith Residence</p>
                </div>
                <div className="rounded-lg border border-zinc-200 px-3 py-2 flex items-center gap-2">
                  <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 18H17V16H7V18ZM7 14H17V12H7V14ZM5 22C4.45 22 3.979 21.804 3.587 21.413C3.196 21.021 3 20.55 3 20V4C3 3.45 3.196 2.979 3.587 2.587C3.979 2.196 4.45 2 5 2H14L20 8V20C20 20.55 19.804 21.021 19.413 21.413C19.021 21.804 18.55 22 18 22H5Z" />
                  </svg>
                  <div>
                    <p className="text-xs font-medium text-zinc-700">Smith-Residence-Report.pdf</p>
                    <p className="text-[10px] text-zinc-400">3 findings, 4 photos attached</p>
                  </div>
                </div>
              </div>
              <div className="h-9 rounded-lg bg-indigo-600 flex items-center justify-center gap-2 animate-pulse">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <span className="text-xs font-semibold text-white">Send to Adjuster</span>
              </div>
              <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-center">
                <p className="text-xs font-medium text-green-700">Report sent! Adjuster notified.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Step description — outside the fixed-height area */}
      <div className="px-6 py-4 text-center border-t border-zinc-100">
        <p className="text-base font-semibold text-zinc-900">{STEPS[step].label}</p>
        <p className="mt-1 text-sm text-zinc-500">{STEPS[step].description}</p>
      </div>
    </div>
  )
}
