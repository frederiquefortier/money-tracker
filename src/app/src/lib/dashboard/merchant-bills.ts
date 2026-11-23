import { changeSpans, lastYearSpans } from '#/lib/dashboard/category-change'
import { trendSpans } from '#/lib/dashboard/category-table'
import type { Span, TableColumn } from '#/lib/dashboard/category-table'
import { DIGITS } from '#/lib/dashboard/dashboard'
import { changeBetween } from '#/lib/shared/change'
import { compareNames } from '#/lib/shared/collections'
import type { Change } from '#/lib/shared/change'
import {
  compareDecimal,
  divideRounded,
  fromMinor,
  toMinor,
} from '#/lib/shared/money'

// MER-04, ADR-064: what a merchant's bill costs me and how it changed, at my share as
// every dashboard figure (author, 2026-11-20).

export type MerchantMonth = {
  /** "2026-03" */
  month: string
  merchantId: string
  visits: number
  /** Positive; null when a bill of the month misses a rate. */
  total: string | null
  min: string | null
  max: string | null
}

export type Merchant = { id: string; name: string }

export type BillFigures = {
  visits: number
  total: string | null
  /** The total over the visits; null without a visit or with a missing rate. */
  average: string | null
  min: string | null
  max: string | null
}

export type MerchantRow = {
  merchant: Merchant
  /** The category table's columns, by key: the total, or the average per month or year. */
  columns: Record<string, string | null>
  figures: BillFigures
  /** The average bill a year earlier (on everything, the year before the last full one). */
  before: BillFigures | null
  change: Change | null
  /** The total per month (or year), oldest first, as a category's trend: 0 without a visit. */
  trend: Array<string | null>
  lastYearTrend: Array<string | null> | null
}

/** A running total, smallest and largest bill; a missing figure poisons all three. */
class Bills {
  visits = 0
  total = 0n
  min: bigint | null = null
  max: bigint | null = null
  missing = false

  add(row: MerchantMonth) {
    this.visits += row.visits
    const [total, min, max] = [row.total, row.min, row.max].map((v) =>
      v === null ? null : toMinor(v, DIGITS),
    )
    if (this.missing || total == null || min == null || max == null) {
      this.missing = true
      return
    }
    this.total += total
    this.min = this.min === null || min < this.min ? min : this.min
    this.max = this.max === null || max > this.max ? max : this.max
  }

  get figures(): BillFigures {
    const show = (v: bigint | null) =>
      this.missing || v === null ? null : fromMinor(v, DIGITS)
    const average =
      this.missing || this.visits === 0
        ? null
        : fromMinor(divideRounded(this.total, BigInt(this.visits)), DIGITS)
    return {
      visits: this.visits,
      total: show(this.total),
      average,
      min: show(this.min),
      max: show(this.max),
    }
  }
}

/** The stretch the period's figures cover: the year so far, or every year. */
function periodSpan(columns: ReadonlyArray<TableColumn>): Span | null {
  const year = columns.find((c) => c.kind === 'thisYear')
  if (year) return { key: 'period', from: year.from, to: year.to }
  const years = columns.filter((c) => c.kind === 'year')
  const [first, last] = [years.at(0), years.at(-1)]
  return first && last ? { key: 'period', from: first.from, to: last.to } : null
}

function averageChange(
  before: BillFigures | undefined,
  now: BillFigures | undefined,
): Change | null {
  if (!before?.average || !now?.average) return null
  return changeBetween(before.average, now.average)
}

/** A column's total over its divisor, as the category table's; 0 without a bill. */
function perColumn(
  figures: BillFigures | undefined,
  divisor: number,
): string | null {
  if (!figures) return fromMinor(0n, DIGITS)
  const total = figures.total === null ? null : toMinor(figures.total, DIGITS)
  return total === null
    ? null
    : fromMinor(divideRounded(total, BigInt(divisor)), DIGITS)
}

/**
 * Each merchant with a bill in the period: the category table's columns, its transactions, average,
 * smallest and largest bill, the average's change against a year earlier (the category
 * table's comparison), and its total per month or year.
 */
export function merchantBills(
  months: ReadonlyArray<MerchantMonth>,
  merchants: ReadonlyArray<Merchant>,
  columns: ReadonlyArray<TableColumn>,
): Array<MerchantRow> {
  const period = periodSpan(columns)
  if (!period) return []
  const trend = trendSpans(columns)
  const lastYear = lastYearSpans(columns, trend)
  const compared = changeSpans(columns)
  const spans = [
    period,
    ...columns.map((c) => ({ ...c, key: `col:${c.key}` })),
    ...trend.map((s) => ({ ...s, key: `trend:${s.key}` })),
    ...lastYear,
    ...(compared ? [compared.now, compared.then] : []),
  ]
  const byMerchant = new Map<string, Map<string, Bills>>()
  for (const row of months) {
    const own = byMerchant.get(row.merchantId) ?? new Map<string, Bills>()
    for (const span of spans) {
      if (row.month < span.from || row.month > span.to) continue
      const bills = own.get(span.key) ?? new Bills()
      bills.add(row)
      own.set(span.key, bills)
    }
    byMerchant.set(row.merchantId, own)
  }
  const rows = merchants.flatMap((merchant): Array<MerchantRow> => {
    const own = byMerchant.get(merchant.id)
    const figures = own?.get(period.key)?.figures
    if (!own || !figures) return []
    const of = (key: string) => own.get(key)?.figures
    return [
      {
        merchant,
        columns: Object.fromEntries(
          columns.map((c) => [
            c.key,
            perColumn(own.get(`col:${c.key}`)?.figures, c.divisor),
          ]),
        ),
        figures,
        before: compared ? (of(compared.then.key) ?? null) : null,
        change: compared
          ? averageChange(of(compared.then.key), of(compared.now.key))
          : null,
        trend: trend.map((s) => perColumn(of(`trend:${s.key}`), 1)),
        lastYearTrend:
          lastYear.length > 0
            ? lastYear.map((s) => perColumn(of(s.key), 1))
            : null,
      },
    ]
  })
  return rows
}

export const MERCHANT_SORTS = [
  'name',
  'nameDesc',
  'amountDesc',
  'amountAsc',
  'countDesc',
  'countAsc',
] as const
export type MerchantSort = (typeof MERCHANT_SORTS)[number]

/** Two decimals in order; a missing one last whatever the direction. */
function byDecimal(x: string | null, y: string | null, desc: boolean): number {
  if (x === null || y === null)
    return (x === null ? 1 : 0) - (y === null ? 1 : 0)
  return desc ? compareDecimal(y, x) : compareDecimal(x, y)
}

/**
 * As the category table's sorts without the colour, plus the number of transactions
 * (author, 2026-11-20). An amount sort reads the period's total, as the categories'.
 */
export function sortMerchants(
  rows: ReadonlyArray<MerchantRow>,
  sort: MerchantSort,
  locale: string,
): Array<MerchantRow> {
  const names = compareNames(locale)
  const byName = (a: MerchantRow, b: MerchantRow) =>
    names(a.merchant, b.merchant)
  const compare = (a: MerchantRow, b: MerchantRow): number => {
    if (sort === 'name') return byName(a, b)
    if (sort === 'nameDesc') return byName(b, a)
    if (sort === 'countDesc' || sort === 'countAsc') {
      const diff = a.figures.visits - b.figures.visits
      return (sort === 'countDesc' ? -diff : diff) || byName(a, b)
    }
    return (
      byDecimal(a.figures.total, b.figures.total, sort === 'amountDesc') ||
      byName(a, b)
    )
  }
  return [...rows].sort(compare)
}
