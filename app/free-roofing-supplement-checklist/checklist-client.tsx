"use client"

import { useMemo, useSyncExternalStore } from "react"
import { trackEvent } from "../../lib/analytics"

type Group = { title: string; items: string[] }

const STORAGE_KEY = "ss-supplement-checklist-v1"

// The checklist lives in the browser's storage. If storage is blocked it still works for this visit, held in memory.
const listeners = new Set<() => void>()
let memory: string | null = null

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener("storage", listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

function readRaw(): string {
  if (memory !== null) return memory
  try {
    return window.localStorage.getItem(STORAGE_KEY) || ""
  } catch {
    return ""
  }
}

function writeRaw(value: string) {
  memory = value
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, value)
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // storage unavailable: the in-memory copy keeps the checklist working for this visit
  }
  listeners.forEach((l) => l())
}

export function ChecklistClient({ groups }: { groups: Group[] }) {
  // The server renders an empty list; the saved ticks appear as soon as the page is in the browser
  const raw = useSyncExternalStore(subscribe, readRaw, () => "")
  const checked = useMemo<Record<string, boolean>>(() => {
    try {
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
    } catch {
      return {} // corrupt copy: start with an empty checklist
    }
  }, [raw])

  function toggle(key: string) {
    writeRaw(JSON.stringify({ ...checked, [key]: !checked[key] }))
  }

  function reset() {
    writeRaw("")
  }

  const total = groups.reduce((n, g) => n + g.items.length, 0)
  const done = Object.values(checked).filter(Boolean).length

  return (
    <div>
      <div className="flex flex-col gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <p className="text-sm font-semibold text-zinc-900">
          {done} of {total} items checked
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { trackEvent("checklist_printed"); window.print() }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Print or save as PDF
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {groups.map((group, gi) => (
          <section key={group.title}>
            <h2 className="text-lg font-bold text-zinc-900">
              {gi + 1}. {group.title}
            </h2>
            <ul className="mt-3 space-y-2">
              {group.items.map((item) => {
                const key = `${gi}:${item}`
                const isOn = !!checked[key]
                return (
                  <li key={key}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 hover:border-indigo-200">
                      <input
                        type="checkbox"
                        checked={isOn}
                        onChange={() => toggle(key)}
                        className="mt-0.5 h-5 w-5 flex-shrink-0 accent-indigo-600"
                      />
                      <span className={`text-sm leading-relaxed ${isOn ? "text-zinc-400 line-through" : "text-zinc-700"}`}>{item}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
