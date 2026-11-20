import type { Category, CategoryKind } from '#/lib/categories/category'
import { DIGITS, Sum } from '#/lib/dashboard/dashboard'
import type { MonthAmount } from '#/lib/dashboard/dashboard'
import { bucketOf, inPeriod } from '#/lib/dashboard/dashboard-period'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { shiftMonth } from '#/lib/shared/months'
import { divideRounded, fromMinor, toMinor } from '#/lib/shared/money'

// The sheet's four figures and its two charts over time: earned, spent, invested and
// what remains (earned less spent and invested), per period and per month or year.

export type Flows = {
  earned: string | null
  spent: string | null
  invested: string | null
  remaining: string | null
}

type Sums = { earned: Sum; spent: Sum; invested: Sum }

const emptySums = (): Sums => ({
  earned: new Sum(),
  spent: new Sum(),
  invested: new Sum(),
})

function addTo(sums: Sums, kind: CategoryKind, amount: string | null) {
  if (kind === 'income') sums.earned.add(amount)
  else if (kind === 'expense') sums.spent.add(amount, -1n)
  else sums.invested.add(amount, -1n)
}

function remainingOf(sums: Sums): Sum {
  const left = new Sum()
  left.plus(sums.earned)
  const out = new Sum()
  out.plus(sums.spent)
  out.plus(sums.invested)
  if (left.minor === null || out.minor === null) left.minor = null
  else left.minor -= out.minor
  return left
}

function flowsOf(sums: Sums): Flows {
  return {
    earned: sums.earned.value,
    spent: sums.spent.value,
    invested: sums.invested.value,
    remaining: remainingOf(sums).value,
  }
}

function kinds(categories: ReadonlyArray<Category>) {
  return new Map(categories.map((c) => [c.id, c.kind]))
}

export function periodFlows(
  months: ReadonlyArray<MonthAmount>,
  categories: ReadonlyArray<Category>,
  period: DashboardPeriod,
): Flows {
  const kindOf = kinds(categories)
  const sums = emptySums()
  for (const row of months) {
    const kind = kindOf.get(row.categoryId)
    if (kind && inPeriod(period, row.month)) addTo(sums, kind, row.amount)
  }
  return flowsOf(sums)
}

/** Each flow divided by the months (or years) counted, as the table's average. */
export function averageFlows(flows: Flows, count: number): Flows {
  const per = (amount: string | null) => {
    const minor = amount === null ? null : toMinor(amount, DIGITS)
    return minor === null || count < 1
      ? null
      : fromMinor(divideRounded(minor, BigInt(count)), DIGITS)
  }
  return {
    earned: per(flows.earned),
    spent: per(flows.spent),
    invested: per(flows.invested),
    remaining: per(flows.remaining),
  }
}

/**
 * The same stretch a year earlier, to compare the period with: on the current year, its
 * months so far one year back; on a past year, the whole year before. None on everything.
 */
export function comparedFlows(
  months: ReadonlyArray<MonthAmount>,
  categories: ReadonlyArray<Category>,
  { period, today }: { period: DashboardPeriod; today: string },
): { flows: Flows; year: string } | null {
  if (period.unit === 'all') return null
  const year = String(Number(period.year) - 1)
  const thisMonth = today.slice(0, 7)
  const last = thisMonth.startsWith(`${period.year}-`)
    ? thisMonth.slice(5)
    : '12'
  const kindOf = kinds(categories)
  const sums = emptySums()
  for (const row of months) {
    const kind = kindOf.get(row.categoryId)
    if (kind && row.month >= `${year}-01` && row.month <= `${year}-${last}`)
      addTo(sums, kind, row.amount)
  }
  return { flows: flowsOf(sums), year }
}

/** Earned and spent per month of a year, or per year of everything. */
export function bucketFlows(
  months: ReadonlyArray<MonthAmount>,
  categories: ReadonlyArray<Category>,
  {
    period,
    buckets,
  }: { period: DashboardPeriod; buckets: ReadonlyArray<string> },
): Array<Flows & { bucket: string }> {
  const kindOf = kinds(categories)
  const byBucket = new Map(buckets.map((b) => [b, emptySums()]))
  for (const row of months) {
    const kind = kindOf.get(row.categoryId)
    const sums = byBucket.get(bucketOf(period, row.month))
    if (kind && sums && inPeriod(period, row.month))
      addTo(sums, kind, row.amount)
  }
  return buckets.map((bucket) => ({
    bucket,
    ...flowsOf(byBucket.get(bucket) ?? emptySums()),
  }))
}

export type CumulativePoint = {
  /** "2026-03" */
  month: string
  /** What earlier years left, plus what was earned so far. */
  income: string | null
  spent: string | null
}

/**
 * The year's income on top of what earlier years left, against what was spent, month by
 * month up to this month; everything starts from nothing at the first month.
 */
export function cumulative(
  months: ReadonlyArray<MonthAmount>,
  categories: ReadonlyArray<Category>,
  {
    period,
    firstMonth,
    today,
  }: { period: DashboardPeriod; firstMonth: string; today: string },
): Array<CumulativePoint> {
  const kindOf = kinds(categories)
  const start = period.unit === 'year' ? `${period.year}-01` : firstMonth
  const end =
    period.unit === 'year' && `${period.year}-12` < today.slice(0, 7)
      ? `${period.year}-12`
      : today.slice(0, 7)
  const before = emptySums()
  const byMonth = new Map<string, Sums>()
  for (const row of months) {
    const kind = kindOf.get(row.categoryId)
    if (!kind) continue
    if (row.month < start) addTo(before, kind, row.amount)
    else if (row.month <= end) {
      const sums = byMonth.get(row.month) ?? emptySums()
      addTo(sums, kind, row.amount)
      byMonth.set(row.month, sums)
    }
  }
  const income = remainingOf(before)
  const spent = new Sum()
  const points: Array<CumulativePoint> = []
  for (let month = start; month <= end; month = shiftMonth(month, 1)) {
    const sums = byMonth.get(month)
    if (sums) {
      income.plus(sums.earned)
      spent.plus(sums.spent)
    }
    points.push({ month, income: income.value, spent: spent.value })
  }
  return points
}
