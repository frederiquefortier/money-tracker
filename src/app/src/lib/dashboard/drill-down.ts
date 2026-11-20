import type { z } from 'zod'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { monthEnd } from '#/lib/shared/months'
import type { searchSchema } from '#/lib/transactions/transaction-search'

// From a dashboard figure to the transactions behind it (author, 2026-11-20). Every
// period is a range the list's calendar names. A category filter takes its sub-categories
// too, as the list's filter does. Each carries the dashboard's period, for the list's
// link back to it.

type TransactionsSearch = z.infer<typeof searchSchema>

/** The dashboard's period as the list's `dashboard` keeps it: a year or "all". */
const backTo = (period: DashboardPeriod) =>
  period.unit === 'all' ? 'all' : period.year

const range = (
  from: DashboardPeriod,
  start: string,
  end: string,
): TransactionsSearch => ({
  period: 'custom',
  start,
  end,
  dashboard: backTo(from),
})

/** A month ("2026-03") or a year ("2026") of a chart, narrowed to some categories. */
export function bucketSearch(
  from: DashboardPeriod,
  bucket: string,
  categoryIds: ReadonlyArray<string> = [],
): TransactionsSearch {
  const when =
    bucket.length === 4
      ? range(from, `${bucket}-01-01`, `${bucket}-12-31`)
      : range(from, `${bucket}-01`, monthEnd(bucket))
  return categoryIds.length ? { ...when, category: [...categoryIds] } : when
}

export function daySearch(
  from: DashboardPeriod,
  day: string,
): TransactionsSearch {
  return range(from, day, day)
}

/** The dashboard's period, narrowed to one category when given. */
export function periodSearch(
  period: DashboardPeriod,
  categoryId?: string,
): TransactionsSearch {
  const when =
    period.unit === 'all'
      ? { period: 'all' as const, dashboard: backTo(period) }
      : bucketSearch(period, period.year)
  return categoryId ? { ...when, category: [categoryId] } : when
}
