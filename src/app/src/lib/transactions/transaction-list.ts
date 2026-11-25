import { z } from 'zod'
import { addDays, monthEnd, monthsStart } from '#/lib/shared/months'
import type { LinkedEvent } from '#/lib/events/event'
import type { HoldingParts } from '#/lib/holdings/holding'
import type { FilterKind } from '#/lib/transactions/transaction-filters'

// The transactions list: a period, its days, a page at a time.

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

/** The 30 days up to `today`, where a custom period starts. */
export function lastThirtyDays(today: string): { start: string; end: string } {
  return { start: addDays(today, -29), end: today }
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
  return { from: `${month}-01`, to: monthEnd(month) }
}

export type AccountName = { name: string; institution: string | null }

/** In a list's event filter, the choice of transactions with no event. */
export const NO_EVENT = 'none'

export type ListedCategory = { name: string; icon: string; color: string }

export type ListedPerson = {
  name: string | null
  count: number
  role: 'invited' | 'owes' | 'from'
  /** An owed part not fully paid back yet, or not known yet. */
  open: boolean
}

/** Someone on it still owes me their part. */
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
   * Everyone on it but Moi, in the order of their lines: a line without a name
   * has no name and a count; `owes` lines colour the row.
   */
  people: Array<ListedPerson>
  /** On an income, the expenses it pays back: merchant or category, and date. */
  reimburses: Array<{ label: string | null; date: string }>
  /** The event it carries as a tag. */
  event: LinkedEvent | null
  /** The holding an investment transaction pays into, as the parts of its name. */
  holding: HoldingParts | null
  /** As booked, in the account's currency; a transfer is unsigned in the full list. */
  amount: string
  currency: string
  /** In the display currency; null when the rate is missing. */
  displayAmount: string | null
  rate: string | null
  /** A transfer's fee, on its departure row. */
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
  kinds?: Array<FilterKind>
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

/**
 * The period tabs above the list: the last 1, 3, 6 or 12 months to
 * today, and everything. Each is a custom range, so the calendar shows it; any other
 * range is the calendar's.
 */
export const PERIOD_PRESETS = ['m1', 'm3', 'm6', 'm12', 'all'] as const
export type PeriodPreset = (typeof PERIOD_PRESETS)[number]

export function presetMonths(preset: Exclude<PeriodPreset, 'all'>): number {
  return Number(preset.slice(1))
}

/** The tab a period is, or null for one only the calendar names. */
export function presetOf(
  choice: PeriodChoice,
  today: string,
): PeriodPreset | null {
  if (choice.period === 'all') return 'all'
  if (choice.period !== 'custom' || choice.end !== today) return null
  return (
    PERIOD_PRESETS.find(
      (one) =>
        one !== 'all' && choice.start === monthsStart(today, presetMonths(one)),
    ) ?? null
  )
}

/** The period a tab stands for, keeping the rest of the choice. */
export function presetChoice(
  preset: PeriodPreset,
  choice: PeriodChoice,
  today: string,
): PeriodChoice {
  if (preset === 'all') return { ...choice, period: 'all' }
  return {
    ...choice,
    period: 'custom',
    start: monthsStart(today, presetMonths(preset)),
    end: today,
  }
}
