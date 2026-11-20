import type { Category, CategoryKind } from '#/lib/categories/category'
import { isArchived } from '#/lib/categories/category'
import { DIGITS, Sum, readSign } from '#/lib/dashboard/dashboard'
import type { MonthAmount } from '#/lib/dashboard/dashboard'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { monthOf, shiftMonth } from '#/lib/shared/months'
import { treeOrder } from '#/lib/shared/tree-layout'
import { divideRounded, fromMinor, toMinor } from '#/lib/shared/money'

// The sheet's table: each group and its categories. On a year, this month, the year so far
// and the monthly average over that same stretch (author, 2026-11-19: everything from the
// year shown, so in November the year is divided by 11). A past year counts to its
// December, the current one to this month, and a history that starts within the year
// from its first month. On everything, a total per year and the yearly average over every
// year shown, this one included. Each row carries its trend over the same months, or
// each year.

export type TableColumnKind =
  'thisMonth' | 'thisYear' | 'year' | 'averageMonth' | 'averageYear'

/** First and last month counted, "2026-05" to "2026-11". */
type Span = { key: string; from: string; to: string }

export type TableColumn = Span & {
  kind: TableColumnKind
  /** An average divides the sum by this; a total by 1. */
  divisor: number
}

export type TableRow = {
  category: Category
  depth: number
  /** By column key. */
  figures: Record<string, string | null>
  /** Oldest first. */
  trend: Array<string | null>
}

export function tableColumns(
  period: DashboardPeriod,
  {
    today,
    firstYear,
    firstMonth = `${firstYear}-01`,
  }: { today: string; firstYear: number; firstMonth?: string },
): Array<TableColumn> {
  const thisYear = today.slice(0, 4)
  const month =
    period.unit === 'year' && period.year < thisYear
      ? `${period.year}-12`
      : monthOf(today)
  if (period.unit === 'year') {
    const column = (kind: TableColumnKind, from: string, divisor = 1) => ({
      key: kind,
      kind,
      from,
      to: month,
      divisor,
    })
    const january = `${month.slice(0, 4)}-01`
    const from =
      firstMonth > january && firstMonth <= month ? firstMonth : january
    return [
      column('thisMonth', month),
      column('thisYear', from),
      column('averageMonth', from, monthsBetween(from, month)),
    ]
  }
  const last = Number(thisYear)
  const first = Math.min(firstYear, last)
  const years = Array.from({ length: last - first + 1 }, (_, i) =>
    String(first + i),
  )
  return [
    ...years.map((year) => ({
      key: year,
      kind: 'year' as const,
      from: `${year}-01`,
      to: `${year}-12`,
      divisor: 1,
    })),
    {
      key: 'averageYear',
      kind: 'averageYear',
      from: `${first}-01`,
      to: `${last}-12`,
      divisor: years.length,
    },
  ]
}

/** Both months counted. */
function monthsBetween(from: string, to: string): number {
  const index = (month: string) =>
    Number(month.slice(0, 4)) * 12 + Number(month.slice(5))
  return index(to) - index(from) + 1
}

/** The months or years a row's trend draws: the year's months counted, or each year. */
export function trendSpans(columns: ReadonlyArray<TableColumn>): Array<Span> {
  const years = columns.filter((c) => c.kind === 'year')
  if (years.length > 0)
    return years.map(({ key, from, to }) => ({ key, from, to }))
  const year = columns.find((c) => c.kind === 'thisYear')
  if (!year) return []
  return Array.from({ length: monthsBetween(year.from, year.to) }, (_, i) => {
    const month = shiftMonth(year.from, i)
    return { key: month, from: month, to: month }
  })
}

function figureOf(sum: Sum | undefined, divisor: number): string | null {
  if (!sum) return fromMinor(0n, DIGITS)
  if (sum.minor === null) return null
  return fromMinor(divideRounded(sum.minor, BigInt(divisor)), DIGITS)
}

export function categoryTable(
  months: ReadonlyArray<MonthAmount>,
  categories: ReadonlyArray<Category>,
  {
    kind,
    columns,
    locale,
  }: {
    kind: CategoryKind
    columns: ReadonlyArray<TableColumn>
    locale: string
  },
): Array<TableRow> {
  const trend = trendSpans(columns).map((span) => ({
    ...span,
    key: `trend:${span.key}`,
  }))
  const spans: ReadonlyArray<Span> = [...columns, ...trend]
  const byId = new Map(categories.map((c) => [c.id, c]))
  const sign = readSign(kind)
  const sums = new Map<string, Map<string, Sum>>()
  for (const row of months) {
    let category = byId.get(row.categoryId)
    if (category?.kind !== kind) continue
    const hits = spans.filter((c) => row.month >= c.from && row.month <= c.to)
    if (hits.length === 0) continue
    // A category's figures include its sub-categories'.
    while (category) {
      const own = sums.get(category.id) ?? new Map<string, Sum>()
      for (const column of hits) {
        const sum = own.get(column.key) ?? new Sum()
        sum.add(row.amount, sign)
        own.set(column.key, sum)
      }
      sums.set(category.id, own)
      category = category.parentId ? byId.get(category.parentId) : undefined
    }
  }
  const shown = categories.filter(
    (c) => c.kind === kind && (!isArchived(c) || sums.has(c.id)),
  )
  return treeOrder(shown, locale).map(({ item, depth }) => {
    const own = sums.get(item.id)
    return {
      category: item,
      depth,
      figures: Object.fromEntries(
        columns.map((c) => [c.key, figureOf(own?.get(c.key), c.divisor)]),
      ),
      trend: trend.map((t) => figureOf(own?.get(t.key), 1)),
    }
  })
}

/**
 * This month already more than 10 % over the monthly average. Only above counts: the
 * month is not over, so being under the average says nothing yet.
 */
export function isAboveAverage(figures: TableRow['figures']): boolean {
  const month = figures.thisMonth
  const average = figures.averageMonth
  if (month == null || average == null) return false
  const a = toMinor(month, DIGITS)
  const b = toMinor(average, DIGITS)
  return a !== null && b !== null && b > 0n && a * 10n > b * 11n
}

/**
 * The rows to draw with groups folded: a top-level row always, the rows under it only
 * when its group is open. `folds` marks a top-level row with rows under it.
 */
export function shownRows(
  rows: ReadonlyArray<TableRow>,
  open: ReadonlySet<string>,
): Array<{ row: TableRow; folds: boolean }> {
  let group = ''
  return rows.flatMap((row, i) => {
    if (row.depth === 0) {
      group = row.category.id
      return [{ row, folds: (rows[i + 1]?.depth ?? 0) > 0 }]
    }
    return open.has(group) ? [{ row, folds: false }] : []
  })
}
