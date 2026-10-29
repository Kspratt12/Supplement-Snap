// @vitest-environment node
// SYNTHETIC random inputs with a fixed seed. Checks the engine's arithmetic against an independent decimal implementation on random inputs.
import { it, expect } from "vitest"
import { expectedTotalTt, parseDocument, compareEstimates, parseMoneyTt, parseQuantityMilli } from "../lib/estimate-gap"

// Independent oracle: exact decimal arithmetic on digit strings with BigInt, round half away from zero at 4 decimals
function oracle(qty: string, price: string): string {
  const split = (s: string) => { const [i, f = ""] = s.split("."); return { digits: BigInt(i + f), scale: f.length } }
  const q = split(qty), p = split(price)
  const prod = q.digits * p.digits
  const scale = q.scale + p.scale
  const target = 4
  if (scale <= target) return (prod * BigInt(10) ** BigInt(target - scale)).toString()
  const div = BigInt(10) ** BigInt(scale - target)
  const r = prod / div, rem = prod % div
  return (rem * BigInt(2) >= div ? r + BigInt(1) : r).toString()
}

let seed = 123456789
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 }
const dec = (maxInt: number, places: number) => `${Math.floor(rnd() * maxInt)}.${String(Math.floor(rnd() * 10 ** places)).padStart(places, "0")}`

it("matches an independent decimal implementation on 20,000 random quantity x price pairs", () => {
  let bad = 0
  for (let n = 0; n < 20000; n++) {
    const qty = dec(100000, 3), price = dec(5000, 2 + Math.floor(rnd() * 3))
    const got = expectedTotalTt(parseQuantityMilli(qty)!.milli, parseMoneyTt(price)!)
    if (String(got) !== oracle(qty, price)) { bad++; if (bad < 4) console.log("MISMATCH", qty, price, got, oracle(qty, price)) }
  }
  expect(bad).toBe(0)
})

it("flags exactly the rows whose printed total differs by more than one cent, on random rows", () => {
  const lines: string[] = [], expectedBad = new Set<number>()
  for (let n = 0; n < 400; n++) {
    const qty = dec(500, 2), price = dec(300, 2)
    const exact = BigInt(oracle(qty, price)) // in 1/10000 dollar
    const cents = (exact + BigInt(50)) / BigInt(100)
    const wrong = rnd() < 0.3
    const delta = wrong ? BigInt(2 + Math.floor(rnd() * 500)) : BigInt(Math.floor(rnd() * 2)) // wrong: 2+ cents off; right: 0 or 1 cent (rounding)
    const printed = Number(cents + delta) / 100
    if (wrong) expectedBad.add(n)
    lines.push(`${n + 1}. Item number ${n} synthetic ${qty} EA ${price} ${printed.toFixed(2)}`)
  }
  const doc = parseDocument("contractor", [{ page: 1, text: lines.join("\n") }])
  const ins = parseDocument("insurer", [{ page: 1, text: "1. Something else entirely 1.00 EA 1.00 1.00" }])
  const found = new Set(compareEstimates(ins, doc).findings.filter((f) => f.kind === "arithmetic_discrepancy").map((f) => Number(f.evidence[0].raw.match(/Item number (\d+)/)![1])))
  expect([...found].sort((a, b) => a - b)).toEqual([...expectedBad].sort((a, b) => a - b))
})
