import { z } from 'zod'
import { yearSchema } from '#/lib/transactions/transaction-list'

// The dashboard's period (DSH-01, DSH-08): one calendar year, or everything. A year
// counts by month, everything by year (author, 2026-11-19).

export const DASHBOARD_PERIODS = ['year', 'all'] as const
export type DashboardPeriodUnit = (typeof DASHBOARD_PERIODS)[number]

export type DashboardPeriod = { unit: DashboardPeriodUnit; year: string }

export const dashboardSearchSchema = z.object({
  unit: z.enum(DASHBOARD_PERIODS).optional().catch(undefined),
  year: yearSchema.optional().catch(undefined),
})
export type DashboardSearch = z.infer<typeof dashboardSearchSchema>

export function periodFromSearch(
  search: DashboardSearch,
  today: string,
): DashboardPeriod {
  return { unit: search.unit ?? 'year', year: search.year ?? today.slice(0, 4) }
}

export function searchOfPeriod(period: DashboardPeriod): DashboardSearch {
  return period.unit === 'all' ? { unit: 'all' } : { year: period.year }
}

/** The bars and points of the period: "2026-01".."2026-12", or "2018".."2026". */
export function bucketsOf(
  period: DashboardPeriod,
  firstYear: number,
  today: string,
): Array<string> {
  if (period.unit === 'year')
    return Array.from(
      { length: 12 },
      (_, i) => `${period.year}-${String(i + 1).padStart(2, '0')}`,
    )
  const last = Number(today.slice(0, 4))
  return Array.from({ length: Math.max(last - firstYear + 1, 1) }, (_, i) =>
    String(Math.min(firstYear, last) + i),
  )
}

/** The bucket a month ("2026-03") falls in. */
export function bucketOf(period: DashboardPeriod, month: string): string {
  return period.unit === 'year' ? month : month.slice(0, 4)
}

export function inPeriod(period: DashboardPeriod, month: string): boolean {
  return period.unit === 'all' || month.startsWith(`${period.year}-`)
}
