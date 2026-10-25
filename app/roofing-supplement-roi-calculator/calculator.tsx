"use client"

import { useState } from "react"
import { calculateRoi } from "../../lib/roi"

const money = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`

function Field({ id, label, hint, value, onChange, prefix, suffix }: { id: string; label: string; hint: string; value: string; onChange: (v: string) => void; prefix?: string; suffix?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-zinc-800">{label}</label>
      <p id={`${id}-hint`} className="mt-0.5 text-xs text-zinc-500">{hint}</p>
      <div className="mt-1.5 flex items-center gap-2">
        {prefix && <span aria-hidden="true" className="text-sm text-zinc-500">{prefix}</span>}
        {/* 16px text keeps iPhones from zooming the page when the field is tapped */}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-describedby={`${id}-hint`}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        {suffix && <span aria-hidden="true" className="text-sm text-zinc-500">{suffix}</span>}
      </div>
    </div>
  )
}

export function RoiCalculator() {
  const [cost, setCost] = useState("99")
  const [count, setCount] = useState("")
  const [extra, setExtra] = useState("")
  const [helped, setHelped] = useState("50")
  const [hours, setHours] = useState("")
  const [rate, setRate] = useState("")

  const r = calculateRoi({
    monthlyCost: parseFloat(cost),
    supplementsPerMonth: parseFloat(count),
    extraPerSupplement: parseFloat(extra),
    helpedPercent: parseFloat(helped),
    hoursSavedPerSupplement: parseFloat(hours),
    hourlyValue: parseFloat(rate),
  })
  const entered = r.valid && count !== ""

  return (
    <div className="mt-8 grid gap-8 md:grid-cols-2">
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()} aria-label="Break-even inputs">
        <Field id="roi-cost" label="Software cost per month" hint="Check the vendor's pricing page. The Starter plan was $99 per month when this page was written." value={cost} onChange={setCost} prefix="$" />
        <Field id="roi-count" label="Supplements you send in a month" hint="Look at your last three months and use the average." value={count} onChange={setCount} />
        <Field id="roi-extra" label="Extra you recover per supplement" hint="Use your own records. If you do not know, try a low number." value={extra} onChange={setExtra} prefix="$" />
        <Field id="roi-helped" label="Share of those the software helps with" hint="Be honest and start low. It cannot help with every job." value={helped} onChange={setHelped} suffix="%" />
        <Field id="roi-hours" label="Hours saved per supplement" hint="Time you spend sorting photos and building the report today, minus the time with a better process." value={hours} onChange={setHours} suffix="hours" />
        <Field id="roi-rate" label="What an hour of that time is worth" hint="Optional. The pay or opportunity value of the person doing the paperwork." value={rate} onChange={setRate} prefix="$" />
      </form>

      <div className="h-fit rounded-xl border border-indigo-200 bg-indigo-50 p-5 md:sticky md:top-6" role="region" aria-label="Your result" aria-live="polite">
        <h2 className="text-lg font-bold text-zinc-900">Your rough monthly result</h2>
        {!entered ? (
          <p className="mt-3 text-sm text-zinc-600">Fill in how many supplements you send in a month and the extra you recover on each, and your result appears here.</p>
        ) : (
          <>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-zinc-600">Extra recovered</dt><dd className="font-semibold">{money(r.extraRecoveredPerMonth)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-zinc-600">Time value</dt><dd className="font-semibold">{money(r.timeValuePerMonth)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-zinc-600">Software cost</dt><dd className="font-semibold">-{money(parseFloat(cost) || 0)}</dd></div>
              <div className="flex justify-between gap-4 border-t border-indigo-200 pt-2 text-base"><dt className="font-bold">Net per month</dt><dd className={`font-extrabold ${r.netPerMonth < 0 ? "text-red-700" : "text-green-700"}`}>{money(r.netPerMonth)}</dd></div>
            </dl>
            {r.breakEvenSupplements !== null && (
              <p className="mt-4 text-sm text-zinc-700">
                On extra recovery alone, you break even at about {r.breakEvenSupplements < 0.1 ? "less than 0.1" : r.breakEvenSupplements.toFixed(1)} helped supplements per month.
              </p>
            )}
            {r.netPerMonth < 0 && <p className="mt-3 text-sm text-zinc-700">With these numbers the software would not pay for itself. A free tracker and template may be enough for now.</p>}
          </>
        )}
        <p className="mt-4 text-xs text-zinc-700">Estimates use only the numbers you enter. They are not a promise of results, because carriers decide what to pay.</p>
      </div>
    </div>
  )
}
