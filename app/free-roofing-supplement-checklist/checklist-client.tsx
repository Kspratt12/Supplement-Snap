"use client"

import { useEffect, useState } from "react"

type Group = { title: string; items: string[] }

const STORAGE_KEY = "ss-supplement-checklist-v1"

export function ChecklistClient({ groups }: { groups: Group[] }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setChecked(JSON.parse(raw) as Record<string, boolean>)
    } catch {
      // storage unavailable or corrupt: start with an empty checklist
    }
  }, [])

  function toggle(key: string) {
    setChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore storage errors
      }
      return next
    })
  }

  function reset() {
    setChecked({})
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore storage errors
    }
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
            onClick={() => window.print()}
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
