import { z } from 'zod'
import type { LinkedEvent } from '#/lib/events/event'

// The transactions list (spec 14): a period, its days, a page at a time.

export const LISTED_KINDS = [
  'expense',
  'income',
  'transfer',
  'adjustment',
] as const
export type ListedKind = (typeof LISTED_KINDS)[number]

export const PERIOD_UNITS = ['all', 'year', 'month', 'custom'] as const
export type PeriodUnit = (typeof PERIOD_UNITS)[number]

/** As the URL carries them: "2026-11" and "2026". */
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)
export const yearSchema = z.string().regex(/^\d{4}$/)

export function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7)
}

export function shiftMonth(month: string, by: number): string {
  const [year = 0, index = 1] = month.split('-').map(Number)
  const months = year * 12 + index - 1 + by
  return `${Math.floor(months / 12)}-${String((months % 12) + 1).padStart(2, '0')}`
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** The 30 days up to `today`, where a custom period starts. */
export function lastThirtyDays(today: string): { start: string; end: string } {
  const start = new Date(`${today}T00:00:00Z`)
  start.setUTCDate(start.getUTCDate() - 29)
  return { start: isoDay(start), end: today }
}

/**
 * The days a period covers, both ends included; null is open. A custom period runs from
 * `start` to `end`, the last 30 days until they are chosen.
 */
export function periodRange(
  period: PeriodUnit,
  {
    month,
    year,
    start,
    end,
  }: { month: string; year: string; start: string; end: string },
): { from: string | null; to: string | null } {
  if (period === 'all') return { from: null, to: null }
  if (period === 'year') return { from: `${year}-01-01`, to: `${year}-12-31` }
  if (period === 'custom') return { from: start, to: end }
  const [y = 0, m = 1] = month.split('-').map(Number)
  return { from: `${month}-01`, to: isoDay(new Date(Date.UTC(y, m, 0))) }
}

export type AccountName = { name: string; institution: string | null }

/** In a list's event filter, the choice of transactions with no event. */
export const NO_EVENT = 'none'

export type ListedCategory = { name: string; icon: string; color: string }

export type ListedPerson = {
  name: string | null
  count: number
  role: 'invited' | 'owes' | 'from'
  /** An owed part not fully paid back yet, or not known yet (spec 21). */
  open: boolean
}

/** Someone on it still owes me their part (spec 20, 21). */
export const isOwed = (row: { people: ReadonlyArray<ListedPerson> }) =>
  row.people.some((p) => p.open)

export type ListedTransaction = {
  id: string
  transferId: string | null
  kind: ListedKind
  occurredOn: string
  pending: boolean
  merchant: string | null
  note: string | null
  account: AccountName
  /** The two accounts of a transfer leg. */
  transfer: { from: AccountName; to: AccountName } | null
  /** Every category of the transaction, the largest share first (TRX-06). */
  categories: Array<ListedCategory>
  /**
   * Everyone on it but Moi, in the order of their lines (spec 20): a line without a name
   * has no name and a count; `owes` lines colour the row.
   */
  people: Array<ListedPerson>
  /** On an income, the expenses it pays back: merchant or category, and date. */
  reimburses: Array<{ label: string | null; date: string }>
  /** The event it carries as a tag (spec 22). */
  event: LinkedEvent | null
  /** As booked, in the account's currency; a transfer is unsigned in the full list. */
  amount: string
  currency: string
  /** In the display currency; null when the rate is missing. */
  displayAmount: string | null
  rate: string | null
  /** A transfer's fee, on its departure row (spec 16). */
  fee: { amount: string; category: string | null } | null
  /** What arrived in another currency, and its value back in this row's (TRX-11). */
  arrival: { amount: string; currency: string; value: string | null } | null
  /** Money lost to the exchange, in this row's currency; null in one currency. */
  conversionCost: string | null
}

export type TransactionDay = {
  date: string
  /** Incomes minus expenses in the display currency; null when a rate is missing. */
  net: string | null
  rows: Array<ListedTransaction>
}

/** Whole days; `cursor` is the day the next page starts before, null at the end. */
export type TransactionPage = {
  days: Array<TransactionDay>
  cursor: string | null
}

/** What the list is narrowed to: a period's days, an account, a category, a merchant, a text. */
export type ListQuery = {
  from: string | null
  to: string | null
  accountIds?: Array<string>
  categoryIds?: Array<string>
  merchantIds?: Array<string>
  personIds?: Array<string>
  /** Event ids, or NO_EVENT for the transactions with none. */
  eventIds?: Array<string>
  search?: string
  pendingOnly?: boolean
  owedOnly?: boolean
}

/** The filters in use with their names, for their chips; gone ones are left out. */
export type ListFilters = {
  accounts: Array<AccountName & { id: string }>
  categories: Array<ListedCategory & { id: string }>
  merchants: Array<{ id: string; name: string }>
  people: Array<{ id: string; name: string }>
  events: Array<{ id: string; name: string }>
}

export type PageRow = { row: ListedTransaction; dayNet: string | null }

/** Rows come sorted from SQL, newest day first; this only cuts them into days. */
export function groupByDay(
  rows: ReadonlyArray<PageRow>,
  more: boolean,
): TransactionPage {
  const days: Array<TransactionDay> = []
  for (const { row, dayNet } of rows) {
    const last = days.at(-1)
    if (last?.date === row.occurredOn) last.rows.push(row)
    else days.push({ date: row.occurredOn, net: dayNet, rows: [row] })
  }
  return { days, cursor: more ? (days.at(-1)?.date ?? null) : null }
}

export type PeriodChoice = {
  period: PeriodUnit
  month: string
  year: string
  /** A custom period's first and last days. */
  start: string
  end: string
}
