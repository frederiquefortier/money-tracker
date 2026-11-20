import type { MonthAmount } from '#/lib/dashboard/dashboard'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { shiftMonth } from '#/lib/shared/months'

// A hole in the history (author, 2026-11-19): a month of the period with no transaction
// at all, between the first month on record and the last month that is over. This month,
// not over yet, is never a hole.

export function missingMonths(
  months: ReadonlyArray<MonthAmount>,
  period: DashboardPeriod,
  { firstMonth, today }: { firstMonth: string; today: string },
): Array<string> {
  const lastOver = shiftMonth(today.slice(0, 7), -1)
  const from =
    period.unit === 'year' && `${period.year}-01` > firstMonth
      ? `${period.year}-01`
      : firstMonth
  const to =
    period.unit === 'year' && `${period.year}-12` < lastOver
      ? `${period.year}-12`
      : lastOver
  const seen = new Set(months.map((m) => m.month))
  const missing: Array<string> = []
  for (let month = from; month <= to; month = shiftMonth(month, 1))
    if (!seen.has(month)) missing.push(month)
  return missing
}
