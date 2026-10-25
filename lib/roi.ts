// Break-even math for the supplement software calculator. Every input comes from the visitor; nothing here is an industry average.

export interface RoiInputs {
  /** Monthly price of the software. */
  monthlyCost: number
  /** Supplements the company sends in a month. */
  supplementsPerMonth: number
  /** Extra money recovered per supplement that the software helped with. */
  extraPerSupplement: number
  /** Share of those supplements the visitor believes the software helps with, 0 to 100. */
  helpedPercent: number
  /** Hours saved per supplement. */
  hoursSavedPerSupplement: number
  /** What an hour of that person's time is worth. */
  hourlyValue: number
}

export interface RoiResult {
  valid: boolean
  extraRecoveredPerMonth: number
  timeValuePerMonth: number
  totalBenefitPerMonth: number
  netPerMonth: number
  /** Helped supplements per month needed for the extra recovery alone to cover the cost; null when no extra is entered. */
  breakEvenSupplements: number | null
}

const num = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0)

export function calculateRoi(i: RoiInputs): RoiResult {
  const cost = num(i.monthlyCost)
  const count = num(i.supplementsPerMonth)
  const extra = num(i.extraPerSupplement)
  const share = Math.min(num(i.helpedPercent), 100) / 100
  const hours = num(i.hoursSavedPerSupplement)
  const rate = num(i.hourlyValue)

  const extraRecoveredPerMonth = count * share * extra
  const timeValuePerMonth = count * hours * rate
  const totalBenefitPerMonth = extraRecoveredPerMonth + timeValuePerMonth
  return {
    valid: cost > 0,
    extraRecoveredPerMonth,
    timeValuePerMonth,
    totalBenefitPerMonth,
    netPerMonth: totalBenefitPerMonth - cost,
    breakEvenSupplements: extra > 0 ? cost / extra : null,
  }
}
