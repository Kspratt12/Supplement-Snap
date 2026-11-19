import { describe, it, expect } from "vitest"
import {
  hasColumn,
  orderForReport,
  moveInReport,
  parseAmount,
  formatAmount,
  amountValue,
  followUpState,
  localToday,
  normalizePin,
  pinFromPoint,
  numberedPins,
} from "../lib/report-tracking"

const f = (id: string, created_at: string, report_order: number | null = null, diagram_pin: unknown = null) => ({ id, created_at, report_order, diagram_pin })

describe("report order", () => {
  it("keeps the given order until someone reorders", () => {
    const list = [f("c", "3"), f("b", "2"), f("a", "1")]
    expect(orderForReport(list).map((c) => c.id)).toEqual(["c", "b", "a"])
  })

  it("puts placed findings in their positions and unplaced ones after, in the given order", () => {
    const list = [f("new", "4"), f("c", "3", 1), f("b", "2", 0), f("a", "1")]
    expect(orderForReport(list).map((c) => c.id)).toEqual(["b", "c", "new", "a"])
  })

  it("moving numbers every finding and returns only the changed ones", () => {
    const ordered = [f("a", "1"), f("b", "2"), f("c", "3")]
    expect(moveInReport(ordered, "b", -1)).toEqual([{ id: "b", report_order: 0 }, { id: "a", report_order: 1 }, { id: "c", report_order: 2 }])
    const placed = [f("a", "1", 0), f("b", "2", 1), f("c", "3", 2)]
    expect(moveInReport(placed, "c", -1)).toEqual([{ id: "c", report_order: 1 }, { id: "b", report_order: 2 }])
    expect(moveInReport(placed, "a", -1)).toEqual([])
    expect(moveInReport(placed, "c", 1)).toEqual([])
    expect(moveInReport(placed, "missing", 1)).toEqual([])
  })
})

describe("amounts and follow-up", () => {
  it("reads typed amounts and refuses anything ambiguous", () => {
    expect(parseAmount("$12,450.50")).toBe(12450.5)
    expect(parseAmount(" 900 ")).toBe(900)
    expect(parseAmount("")).toBeNull()
    expect(parseAmount("-5")).toBe("invalid")
    expect(parseAmount("12.345")).toBe("invalid")
    expect(parseAmount("about 3k")).toBe("invalid")
    expect(parseAmount("100000000")).toBe("invalid")
    expect(formatAmount(12450.5)).toBe("$12,450.50")
    expect(formatAmount(null)).toBe("")
    expect(amountValue("12450.50")).toBe(12450.5)
    expect(amountValue(null)).toBeNull()
  })

  it("a follow-up is due on or after its date", () => {
    expect(followUpState("2026-11-19", "2026-11-19")).toBe("due")
    expect(followUpState("2026-11-01", "2026-11-19")).toBe("due")
    expect(followUpState("2026-11-20", "2026-11-19")).toBe("upcoming")
    expect(followUpState(null, "2026-11-19")).toBe("none")
    expect(localToday(new Date(2026, 0, 5))).toBe("2026-01-05")
  })
})

describe("diagram pins", () => {
  it("accepts only positions on the diagram", () => {
    expect(normalizePin({ x: 0.5, y: 0.25 })).toEqual({ x: 0.5, y: 0.25 })
    expect(normalizePin({ x: 1.2, y: 0.5 })).toBeNull()
    expect(normalizePin({ x: "0.5", y: 0.5 })).toBeNull()
    expect(normalizePin(null)).toBeNull()
  })

  it("stores a tap as a share of the diagram's size, so it stays in place at any screen size", () => {
    expect(pinFromPoint(110, 70, { left: 10, top: 20, width: 200, height: 100 })).toEqual({ x: 0.5, y: 0.5 })
    expect(pinFromPoint(500, -5, { left: 10, top: 20, width: 200, height: 100 })).toEqual({ x: 1, y: 0 })
    expect(pinFromPoint(1, 1, { left: 0, top: 0, width: 0, height: 0 })).toBeNull()
  })

  it("numbers pins the same as the findings in the report", () => {
    const ordered = [f("a", "1", null, { x: 0.1, y: 0.1 }), f("b", "2"), f("c", "3", null, { x: 0.9, y: 0.9 })]
    expect(numberedPins(ordered)).toEqual([{ n: 1, pin: { x: 0.1, y: 0.1 } }, { n: 3, pin: { x: 0.9, y: 0.9 } }])
  })

  it("detects whether the database has a column from the loaded row", () => {
    expect(hasColumn({ report_order: null }, "report_order")).toBe(true)
    expect(hasColumn({ id: "x" }, "report_order")).toBe(false)
    expect(hasColumn(undefined, "report_order")).toBe(false)
  })
})
