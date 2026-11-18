import { sumAmounts } from '#/lib/net-worth/net-worth'
import { accountLabel } from '#/lib/accounts/account'
import { holdingLabel } from '#/lib/holdings/holding'
import { fromMinor, toMinor } from '#/lib/shared/money'
import type { HoldingKind, HoldingParts } from '#/lib/holdings/holding'
import type { Locale } from '#/i18n/locales'

// The net worth chart (NW-04, NW-05, ADR-057). The database gives one figure per item per
// month end, already converted; the browser leaves items out, cuts the range and sums.

const DIGITS = 4
const ZERO = '0.0000'

/** Each group's figure at a date; debts negative. Credit cards are debts (author, 2026-11-17). */
export const STACK_KEYS = {
  accounts: 'stack:accounts',
  investments: 'stack:investments',
  assets: 'stack:assets',
  debts: 'stack:debts',
} as const

/** Where an item sits in the list under the chart; credit cards are with the debts. */
export const ITEM_GROUPS = [
  'accounts',
  'investments',
  'assets',
  'debts',
] as const
export type ItemGroup = (typeof ITEM_GROUPS)[number]

export type SeriesRow = {
  onDate: string
  kind: 'account' | HoldingKind
  itemId: string
  /** Debts negative; null when a rate is missing. */
  displayValue: string | null
}

/** Money into an investment on a date (out negative), converted (ADR-062). */
export type FlowRow = {
  onDate: string
  holdingId: string
  displayAmount: string | null
}

/** What the chart can leave out (NW-05), named as on its page. */
export type ChartItem = { id: string; closed: boolean; group: ItemGroup } & (
  | { type: 'account'; name: string; institution: string | null }
  | { type: 'holding'; parts: HoldingParts }
)

/** As on its page; inside an institution's group (`inGroup`) the institution is left out. */
export function chartItemLabel(
  item: ChartItem,
  locale: Locale,
  inGroup = false,
): string {
  if (item.type === 'account')
    return inGroup
      ? item.name
      : accountLabel({ name: item.name, institution: item.institution })
  return holdingLabel(
    inGroup ? { ...item.parts, institution: null } : item.parts,
    locale,
  )
}

/**
 * A date's figures by line: a total line name or an item id. A missing key draws nothing
 * there (no item yet); null is a missing rate.
 */
export type SeriesPoint = {
  date: string
  values: Partial<Record<string, string | null>>
}

function byDate(
  rows: ReadonlyArray<SeriesRow>,
  excluded: ReadonlySet<string>,
): Array<[string, Array<SeriesRow>]> {
  const dates = new Map<string, Array<SeriesRow>>()
  for (const row of rows) {
    const list = dates.get(row.onDate) ?? []
    if (!excluded.has(row.itemId)) list.push(row)
    dates.set(row.onDate, list)
  }
  return [...dates].sort(([a], [b]) => (a < b ? -1 : 1))
}

/** A debt as the amount owed: shown positive, it subtracts from the total (author, 2026-11-17). */
function owed(amount: string | null): string | null {
  const minor = amount === null ? null : toMinor(amount, DIGITS)
  return minor === null ? null : fromMinor(-minor, DIGITS)
}

function groupOf(
  row: SeriesRow,
  groups: ReadonlyMap<string, ItemGroup>,
): ItemGroup {
  const group = groups.get(row.itemId)
  if (group) return group
  if (row.kind === 'account') return 'accounts'
  return row.kind === 'debt' ? 'debts' : `${row.kind}s`
}

function isDebt(row: SeriesRow, groups: ReadonlyMap<string, ItemGroup>) {
  return groupOf(row, groups) === 'debts'
}

/** A line that starts after the first point rises from a 0 at the point before it. */
function riseFromZero(points: Array<SeriesPoint>): Array<SeriesPoint> {
  const keys = new Set(points.flatMap((p) => Object.keys(p.values)))
  for (const key of keys) {
    const first = points.findIndex((p) => key in p.values)
    if (first > 0) points[first - 1].values[key] = ZERO
  }
  return points
}

/**
 * The lines at each date, without the left-out items. A line with no item at a date is
 * absent there, and the total adds the others; a missing rate empties its line and the
 * total, never a partial sum. `groups` places each item.
 */
export function seriesPoints(
  rows: ReadonlyArray<SeriesRow>,
  excluded: ReadonlySet<string>,
  groups: ReadonlyMap<string, ItemGroup>,
): Array<SeriesPoint> {
  return riseFromZero(
    byDate(rows, excluded).map(([date, list]) => {
      const values: SeriesPoint['values'] = {}
      const assets = list.filter((r) => !isDebt(r, groups))
      const debts = list.filter((r) => isDebt(r, groups))
      if (assets.length > 0)
        values.assets = sumAmounts(assets.map((r) => r.displayValue))
      if (debts.length > 0)
        values.debts = owed(sumAmounts(debts.map((r) => r.displayValue)))
      if (list.length > 0)
        values.total = sumAmounts(list.map((r) => r.displayValue))
      for (const group of ITEM_GROUPS) {
        const figures = list.filter((r) => groupOf(r, groups) === group)
        if (figures.length > 0)
          values[STACK_KEYS[group]] = sumAmounts(
            figures.map((r) => r.displayValue),
          )
      }
      return { date, values }
    }),
  )
}

/** Each counted item's own figure at each date (the item list and its lines), debts owed. */
export function itemPoints(
  rows: ReadonlyArray<SeriesRow>,
  excluded: ReadonlySet<string>,
  groups: ReadonlyMap<string, ItemGroup>,
): Array<SeriesPoint> {
  return riseFromZero(
    byDate(rows, excluded).map(([date, list]) => ({
      date,
      values: Object.fromEntries(
        list.map((r) => [
          r.itemId,
          isDebt(r, groups) ? owed(r.displayValue) : r.displayValue,
        ]),
      ),
    })),
  )
}

/** Whether `key` is not zero somewhere: a group worth drawing. */
export function hasFigures(
  points: ReadonlyArray<SeriesPoint>,
  key: string,
): boolean {
  return points.some((p) => {
    const value = p.values[key]
    return typeof value === 'string' && toMinor(value, DIGITS) !== 0n
  })
}

/** What Recharts draws: numbers, used for the drawing only. Every figure shown is the string. */
export function chartRows(
  points: ReadonlyArray<SeriesPoint>,
  keys: ReadonlyArray<string>,
): Array<Record<string, string | number | null>> {
  return points.map((p) => ({
    date: p.date,
    ...Object.fromEntries(
      keys.map((key) => {
        const value = p.values[key]
        return [key, typeof value === 'string' ? Number(value) : null]
      }),
    ),
  }))
}

// Four to six gridlines on a round step, held to the figures so the line fills the chart
// (2026-11-17, replacing a fixed step of the composition chart).
const STEPS = [1, 2, 2.5, 5]
const MAX_LINES = 6

/** The y-axis ticks over `min` to `max`, on the smallest round step giving at most six. */
export function axisTicks(min: number, max: number): Array<number> {
  // A flat line gets a band around it, so it sits mid-chart.
  const pad = min === max ? Math.abs(min) / 10 || 1 : 0
  const low = Math.min(min, max) - pad
  const high = Math.max(min, max) + pad
  const count = (step: number) =>
    Math.ceil(high / step) - Math.floor(low / step) + 1
  let step = 1
  for (let power = 1; count(step) > MAX_LINES; power *= 10)
    step =
      STEPS.map((s) => s * power).find((s) => count(s) <= MAX_LINES) ??
      10 * power
  const first = Math.floor(low / step)
  return Array.from(
    { length: Math.ceil(high / step) - first + 1 },
    (_, i) => (first + i) * step,
  )
}
