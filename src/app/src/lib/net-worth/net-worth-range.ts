import { changeBetween } from '#/lib/shared/change'
import type { Change } from '#/lib/shared/change'
import { fromMinor, toMinor } from '#/lib/shared/money'
import type { SeriesPoint } from '#/lib/net-worth/net-worth-series'

// The chart's range and the changes the hub shows (NW-04).

const DIGITS = 4

/**
 * The hub's one period: what the charts draw and what every change is measured over.
 * Months or years back from this month's start, or everything.
 */
export const RANGE_PRESETS = [
  'm1',
  'm3',
  'm6',
  'y1',
  'y3',
  'y5',
  'y10',
  'all',
] as const
export type SeriesRange = (typeof RANGE_PRESETS)[number]

/** How many months a preset reaches back; null for Tout. */
export function rangeMonths(range: SeriesRange): number | null {
  if (range === 'all') return null
  const count = Number(range.slice(1))
  return range.startsWith('y') ? count * 12 : count
}

const isRange = (value: unknown): value is SeriesRange =>
  RANGE_PRESETS.some((p) => p === value)

/** A stored range; the custom one of 2026-11-16 and 7 ans fall back to Tout. */
export function parseRange(stored: unknown): SeriesRange | undefined {
  return isRange(stored) ? stored : undefined
}

/** "2026-11" moved back by `months`. */
export function monthsBack(month: string, months: number): string {
  const index = Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1
  const back = index - months
  return `${String(Math.floor(back / 12)).padStart(4, '0')}-${String((back % 12) + 1).padStart(2, '0')}`
}

/**
 * The points of the range: from the month end N months back to today, so its first point
 * is the base of every change over it.
 */
export function pointsInRange(
  points: ReadonlyArray<SeriesPoint>,
  range: SeriesRange,
  today: string,
): Array<SeriesPoint> {
  const months = rangeMonths(range)
  if (months === null) return [...points]
  const from = monthsBack(today.slice(0, 7), months)
  return points.filter((p) => p.date.slice(0, 7) >= from)
}

/**
 * From the range's first figure to its last, skipping points with none or a missing rate.
 * An item that starts in the range rises from 0, so it has no percent.
 */
export function changeOver(
  points: ReadonlyArray<SeriesPoint>,
  key: string,
): Change | null {
  const values = points.flatMap((p) => {
    const value = p.values[key]
    return typeof value === 'string' ? [value] : []
  })
  if (values.length < 2) return null
  return changeBetween(values[0], values[values.length - 1])
}

const DAYS_PER_YEAR_X100 = 36525n
const MS_PER_DAY = 86_400_000

/**
 * The change per year from the first non-zero figure to the last: the amount divided by
 * the years, the percent compounded (CAGR), null unless both ends are positive. Under a
 * year it is the plain change, since a few months would extrapolate wildly.
 */
export function annualChangeOver(
  points: ReadonlyArray<SeriesPoint>,
  key: string,
): Change | null {
  const figures = points.flatMap((p) => {
    const value = p.values[key]
    const minor = typeof value === 'string' ? toMinor(value, DIGITS) : null
    return minor === null ? [] : [{ date: p.date, minor }]
  })
  // A line rises from a 0 before its first value; the base is that first value.
  const start = figures.findIndex((f) => f.minor !== 0n)
  if (start < 0 || figures.length - start < 2) return null
  const first = figures[start]
  const last = figures[figures.length - 1]
  const days = Math.round(
    (Date.parse(last.date) - Date.parse(first.date)) / MS_PER_DAY,
  )
  if (days * 100 < Number(DAYS_PER_YEAR_X100)) return changeOver(points, key)
  const perYear =
    ((last.minor - first.minor) * DAYS_PER_YEAR_X100) / (BigInt(days) * 100n)
  // The compounded rate needs a root, so it is a float; it is only ever shown, never
  // summed into an amount (ADR-004).
  const growth =
    first.minor > 0n && last.minor > 0n
      ? (Number(last.minor) / Number(first.minor)) ** (365.25 / days) - 1
      : null
  return {
    amount: fromMinor(perYear, DIGITS),
    percent: growth === null ? null : (growth * 100).toFixed(3),
    perYearFrom: first.date,
  }
}

/** Money into an investment on a date (out negative), in the display currency. */
export type Flow = {
  date: string
  /** Null when a rate is missing. */
  amount: string | null
}

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / MS_PER_DAY)

type Ends = { start: string; end: string; a: bigint; b: bigint }

/** The range's first and last figures; an item not there yet starts at 0. */
function endsOf(points: ReadonlyArray<SeriesPoint>, key: string): Ends | null {
  const start = points.at(0)
  const end = points.at(-1)
  if (!start || !end || start === end) return null
  const first = start.values[key] ?? '0'
  const last = end.values[key]
  const a = typeof first === 'string' ? toMinor(first, DIGITS) : null
  const b = typeof last === 'string' ? toMinor(last, DIGITS) : null
  if (a === null || b === null) return null
  return { start: start.date, end: end.date, a, b }
}

type Flows = { net: bigint; weighted: number }

/**
 * The money put in over the range and its weight by the share of the range it was in.
 * While the holding has no value at the start, earlier flows count from the start.
 */
function flowsOver(flows: ReadonlyArray<Flow>, ends: Ends): Flows | null {
  const span = Date.parse(ends.end) - Date.parse(ends.start)
  const sum: Flows = { net: 0n, weighted: 0 }
  for (const flow of flows) {
    const before = flow.date <= ends.start
    if (flow.date > ends.end || (before && ends.a !== 0n)) continue
    const minor = flow.amount === null ? null : toMinor(flow.amount, DIGITS)
    if (minor === null) return null
    const share = before
      ? 1
      : (Date.parse(ends.end) - Date.parse(flow.date)) / span
    sum.net += minor
    sum.weighted += Number(minor) * share
  }
  return sum
}

/** A holding with no value at the start begins at its first money in, if that is later. */
function startsWithMoney(
  ends: Ends | null,
  flows: ReadonlyArray<Flow>,
): Ends | null {
  if (!ends || ends.a !== 0n) return ends
  const first = flows
    .map((f) => f.date)
    .filter((date) => date <= ends.end)
    .sort()
    .at(0)
  return first && first > ends.start && first < ends.end
    ? { ...ends, start: first }
    : ends
}

/**
 * An investment's return over the range, with deposits and withdrawals left out (ADR-062):
 * the gain is the change in value less the money put in, and the percent is over the start
 * value plus each flow weighted by the share of the range it was in (modified Dietz). On
 * Tout, past a year, both are per year and the percent is compounded.
 */
export function returnOver(
  points: ReadonlyArray<SeriesPoint>,
  key: string,
  { flows, range }: { flows: ReadonlyArray<Flow>; range: SeriesRange },
): Change | null {
  const ends = startsWithMoney(endsOf(points, key), flows)
  const moved = ends && flowsOver(flows, ends)
  if (!ends || !moved) return null
  const gain = ends.b - ends.a - moved.net
  // The weights make the percent a float; it is only shown, never summed (ADR-004).
  const base = Number(ends.a) + moved.weighted
  const rate = base > 0 ? Number(gain) / base : null

  const days = daysBetween(ends.start, ends.end)
  if (range !== 'all' || days * 100 < Number(DAYS_PER_YEAR_X100))
    return {
      amount: fromMinor(gain, DIGITS),
      percent: rate === null ? null : (rate * 100).toFixed(3),
    }
  const annual =
    rate === null || rate <= -1 ? null : (1 + rate) ** (365.25 / days) - 1
  return {
    amount: fromMinor(
      (gain * DAYS_PER_YEAR_X100) / (BigInt(days) * 100n),
      DIGITS,
    ),
    percent: annual === null ? null : (annual * 100).toFixed(3),
    perYearFrom: ends.start,
  }
}

/** The change shown over a range: per year on Tout, else from its first point to today. */
export function rangeChange(
  points: ReadonlyArray<SeriesPoint>,
  key: string,
  range: SeriesRange,
): Change | null {
  return range === 'all'
    ? annualChangeOver(points, key)
    : changeOver(points, key)
}

/** Up to a year and a half of points, the chart reads by month; beyond it, by year. */
export const MONTHLY_UP_TO = 18

export type PeriodChange = {
  /** The period's last date: a month end (or today), or a year's last point. */
  date: string
  /** Each key's change over the period; null with a missing rate at either end. */
  values: Record<string, string | null>
}

function figure(point: SeriesPoint, key: string): bigint | null {
  const value = point.values[key]
  // No item yet counts as 0, so a group that starts adds its whole value.
  if (value === undefined) return 0n
  return value === null ? null : toMinor(value, DIGITS)
}

/**
 * What moved the figures: each month's change, or each calendar year's past
 * `MONTHLY_UP_TO` points (the first and the current year partial), from the range's first
 * point.
 */
export function periodChanges(
  points: ReadonlyArray<SeriesPoint>,
  keys: ReadonlyArray<string>,
): Array<PeriodChange> {
  const byYear = points.length > MONTHLY_UP_TO
  const ends = points.filter(
    (p, i) =>
      i > 0 &&
      (!byYear ||
        i === points.length - 1 ||
        points[i + 1].date.slice(0, 4) !== p.date.slice(0, 4)),
  )
  let base = points[0]
  return ends.map((end) => {
    const values = Object.fromEntries(
      keys.map((key) => {
        const a = figure(base, key)
        const b = figure(end, key)
        return [key, a === null || b === null ? null : fromMinor(b - a, DIGITS)]
      }),
    )
    base = end
    return { date: end.date, values }
  })
}
