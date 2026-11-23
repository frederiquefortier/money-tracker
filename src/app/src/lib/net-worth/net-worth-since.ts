import type { Change } from '#/lib/shared/change'
import type { SeriesPoint } from '#/lib/net-worth/net-worth-series'
import { daysIn } from '#/lib/shared/months'
import { fromMinor, ratio, toMinor } from '#/lib/shared/money'

const DIGITS = 4
const DAYS_PER_YEAR_X100 = 36525n

/** The hub's headline on Tout: how far the figure came since its first non-zero value. */
export type SinceStart = {
  /** From the first figure to the last, as an amount; no percent (the multiple says it). */
  change: Change
  /** The amount per year on average; null under a year. */
  perYear: string | null
  /** The last figure over the first, a decimal string; null unless both are positive. */
  multiple: string | null
  since: string
}

/**
 * On Tout, the plain change since the first figure, how many times it multiplied and the
 * average per year (author, 2026-11-19: "(56 %) par an" read as a return; a net worth that
 * grows from savings has none to show).
 */
export function changeSinceStart(
  points: ReadonlyArray<SeriesPoint>,
  key: string,
): SinceStart | null {
  const figures = points.flatMap((p) => {
    const value = p.values[key]
    const minor = typeof value === 'string' ? toMinor(value, DIGITS) : null
    return minor === null ? [] : [{ date: p.date, minor }]
  })
  const start = figures.findIndex((f) => f.minor !== 0n)
  if (start < 0 || figures.length - start < 2) return null
  const first = figures[start]
  const last = figures[figures.length - 1]
  const days = daysIn(first.date, last.date) - 1
  const gain = last.minor - first.minor
  return {
    change: { amount: fromMinor(gain, DIGITS), percent: null },
    perYear:
      BigInt(days) * 100n < DAYS_PER_YEAR_X100
        ? null
        : fromMinor(
            (gain * DAYS_PER_YEAR_X100) / (BigInt(days) * 100n),
            DIGITS,
          ),
    multiple:
      first.minor > 0n && last.minor > 0n
        ? ratio(last.minor, first.minor)
        : null,
    since: first.date,
  }
}
