import type { Category, CategoryKind } from '#/lib/categories/category'
import { necessitySource } from '#/lib/categories/category-necessity'
import { Sum, readSign } from '#/lib/dashboard/dashboard'
import type { MonthAmount } from '#/lib/dashboard/dashboard'
import { bucketOf, inPeriod } from '#/lib/dashboard/dashboard-period'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { compareDecimal, ratio, toMinor } from '#/lib/shared/money'

// The income and expense cards: the period's money split three ways (DSH-07, DSH-09), by
// need or want (CAT-10), by group, or by category as booked, drawn as each month (or
// year) stacked or as a donut of the whole (author, 2026-11-20). One table feeds both, so
// they always agree. A series' colour follows it whatever the filter. Every series shows,
// each in its category's colour (author, 2026-11-20: no "Autres").

export const SPLIT_VIEWS = ['necessity', 'groups', 'categories'] as const
export type SplitView = (typeof SPLIT_VIEWS)[number]

export const NECESSITY_KEYS = ['need', 'want', 'unclassified'] as const

/** Each month (or year) stacked, or the whole as a donut. */
export const CHART_KINDS = ['stack', 'donut'] as const
export type ChartKind = (typeof CHART_KINDS)[number]

export type StackSeries = {
  /** A category id or a necessity key. */
  key: string
  category: Category | null
  total: string | null
  /** Percent points of the whole; null when there is no whole to share. */
  share: string | null
}

export type CategoryStacks = {
  series: Array<StackSeries>
  rows: Array<{ bucket: string; values: Record<string, string | null> }>
  total: string | null
}

/** The top-level category a category sits under. */
export function topOf(
  id: string,
  byId: ReadonlyMap<string, Category>,
): Category | undefined {
  let category = byId.get(id)
  while (category?.parentId) {
    const parent = byId.get(category.parentId)
    if (!parent) break
    category = parent
  }
  return category
}

/** Larger first; a missing figure last. */
export function byAmount(a: string | null, b: string | null): number {
  if (a === null) return b === null ? 0 : 1
  if (b === null) return -1
  return compareDecimal(b, a)
}

/** The series a category's money goes to in a view. */
function seriesKey(
  category: Category,
  byId: ReadonlyMap<string, Category>,
  view: SplitView,
): string | undefined {
  if (view === 'categories') return category.id
  if (view === 'groups') return topOf(category.id, byId)?.id
  return (
    category.necessity ??
    necessitySource(category.parentId, byId)?.necessity ??
    'unclassified'
  )
}

type Ranked = { key: string; total: string | null }

/** Needs, wants, then the unmarked; any other view by amount. */
function ranked(
  totals: ReadonlyMap<string, Sum>,
  view: SplitView,
): Array<Ranked> {
  const all = [...totals].map(([key, sum]) => ({ key, total: sum.value }))
  if (view !== 'necessity')
    return all.sort((a, b) => byAmount(a.total, b.total))
  return NECESSITY_KEYS.flatMap((key) => all.filter((r) => r.key === key))
}

function shareOf(amount: string | null, whole: bigint | null): string | null {
  const minor = amount === null ? null : toMinor(amount, 4)
  if (minor === null || whole === null || whole <= 0n) return null
  return ratio(minor * 100n, whole)
}

type Collected = {
  /** Each series' sum per bucket. */
  cells: Map<string, Map<string, Sum>>
  totals: Map<string, Sum>
  total: Sum
}

/** The period's money of a kind, each month to its series and bucket. */
function collect(
  months: ReadonlyArray<MonthAmount>,
  byId: ReadonlyMap<string, Category>,
  {
    period,
    kind,
    picked,
    view,
  }: {
    period: DashboardPeriod
    kind: CategoryKind
    picked: ReadonlySet<string> | null
    view: SplitView
  },
): Collected {
  const sign = readSign(kind)
  const cells = new Map<string, Map<string, Sum>>()
  const totals = new Map<string, Sum>()
  const total = new Sum()
  for (const row of months) {
    const category = byId.get(row.categoryId)
    if (!category || category.kind !== kind || !inPeriod(period, row.month))
      continue
    if (picked && !picked.has(category.id)) continue
    const key = seriesKey(category, byId, view)
    if (!key) continue
    const bucket = bucketOf(period, row.month)
    const cell = cells.get(key) ?? new Map<string, Sum>()
    const sum = cell.get(bucket) ?? new Sum()
    sum.add(row.amount, sign)
    cell.set(bucket, sum)
    cells.set(key, cell)
    const seriesTotal = totals.get(key) ?? new Sum()
    seriesTotal.add(row.amount, sign)
    totals.set(key, seriesTotal)
    total.add(row.amount, sign)
  }
  return { cells, totals, total }
}

export function categoryStacks(
  months: ReadonlyArray<MonthAmount>,
  categories: ReadonlyArray<Category>,
  {
    period,
    buckets,
    kind,
    picked,
    view = 'groups',
  }: {
    period: DashboardPeriod
    buckets: ReadonlyArray<string>
    kind: CategoryKind
    picked: ReadonlySet<string> | null
    view?: SplitView
  },
): CategoryStacks {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const { cells, totals, total } = collect(months, byId, {
    period,
    kind,
    picked,
    view,
  })
  const series: Array<StackSeries> = ranked(totals, view).map((s) => ({
    key: s.key,
    category: byId.get(s.key) ?? null,
    total: s.total,
    share: shareOf(s.total, total.minor),
  }))
  const rows = buckets.map((bucket) => {
    const values: Record<string, string | null> = {}
    for (const [key, cell] of cells) {
      const sum = cell.get(bucket)
      if (sum) values[key] = sum.value
    }
    return { bucket, values }
  })
  return { series, rows, total: total.value }
}
