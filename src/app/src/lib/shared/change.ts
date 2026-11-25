import { fromMinor, ratio, toMinor } from '#/lib/shared/money'

const DIGITS = 4

export type Change = {
  amount: string
  /** Percent points over the first value's size; null when it was zero. */
  percent: string | null
  /** Set when both are per year: Tout, from this date. */
  perYearFrom?: string
}

/** From one figure to another; no percent from zero. */
export function changeBetween(first: string, last: string): Change | null {
  const a = toMinor(first, DIGITS)
  const b = toMinor(last, DIGITS)
  if (a === null || b === null) return null
  const size = a < 0n ? -a : a
  return {
    amount: fromMinor(b - a, DIGITS),
    percent: ratio((b - a) * 100n, size),
  }
}
