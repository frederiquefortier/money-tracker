import { Sum } from '#/lib/dashboard/dashboard'
import { heatSteps } from '#/lib/dashboard/daily-spending'
import type { DaySpent } from '#/lib/dashboard/daily-spending'
import { transactionsByDay } from '#/lib/dashboard/year-activity'
import type {
  DayTransaction,
  YearActivity,
} from '#/lib/dashboard/year-activity'
import { eventsByDay } from '#/lib/events/event-calendar'
import type { EventSummary } from '#/lib/events/event-calendar'
import type { DayRange } from '#/lib/shared/months'

// The events calendar's period: the years loaded so far, cut to the days and names the
// overview, the highlights and the month boxes read (ADR-066).

/** What the events calendar reads per day, over the period shown. */
export type CalendarDays = {
  spent: ReadonlyMap<string, string | null>
  transactions: ReadonlyMap<string, ReadonlyArray<DayTransaction>>
  events: ReadonlyMap<string, ReadonlyArray<EventSummary>>
  /** The heat steps over the period's spending days. */
  steps: ReadonlyArray<number>
  /** Years whose transactions are still on their way, or failed to load. */
  loading: ReadonlySet<string>
  failed: ReadonlySet<string>
}

/** How the calendar names a transaction (its merchant, or its largest category) and a person. */
export type ActivityNames = {
  label: (transaction: DayTransaction) => string
  person: (id: string) => string | undefined
}

/**
 * The period's days and transactions from the years loaded so far, for the calendar and
 * the highlights. `complete` is false while a year is on its way or failed: no ranking on
 * part of the period.
 */
export function periodActivity(
  years: ReadonlyArray<string>,
  activity: Readonly<Record<string, YearActivity | 'failed' | undefined>>,
  until: string,
) {
  const days: Array<DaySpent> = []
  const transactions: Array<DayTransaction> = []
  const loading = new Set<string>()
  const failed = new Set<string>()
  for (const year of years) {
    const state = activity[year]
    if (state === undefined) loading.add(year)
    else if (state === 'failed') failed.add(year)
    else {
      days.push(...state.days.filter((d) => d.day <= until))
      transactions.push(...state.transactions)
    }
  }
  return {
    days,
    transactions,
    loading,
    failed,
    complete: loading.size === 0 && failed.size === 0,
  }
}

/** What each month of the calendar spent, from its days. */
export function monthTotals(
  spent: ReadonlyMap<string, string | null>,
): Map<string, string | null> {
  const sums = new Map<string, Sum>()
  for (const [day, amount] of spent) {
    const sum = sums.get(day.slice(0, 7)) ?? new Sum()
    sum.add(amount)
    sums.set(day.slice(0, 7), sum)
  }
  return new Map([...sums].map(([month, sum]) => [month, sum.value]))
}

type Named = { id: string; name: string }

export function activityNames(
  merchants: ReadonlyArray<Named>,
  categories: ReadonlyArray<Named>,
  people: ReadonlyArray<Named>,
): ActivityNames {
  const merchantName = new Map(merchants.map((m) => [m.id, m.name]))
  const categoryName = new Map(categories.map((c) => [c.id, c.name]))
  const personName = new Map(people.map((p) => [p.id, p.name]))
  return {
    label: (transaction) =>
      (transaction.merchantId && merchantName.get(transaction.merchantId)) ||
      (transaction.categoryId && categoryName.get(transaction.categoryId)) ||
      '—',
    person: (id) => personName.get(id),
  }
}

/** The calendar's days from what has loaded, with the events shown. */
export function calendarDays(
  loaded: ReturnType<typeof periodActivity>,
  shown: ReadonlyArray<EventSummary>,
  range: DayRange,
): CalendarDays {
  return {
    spent: new Map(loaded.days.map((d) => [d.day, d.spent])),
    transactions: transactionsByDay(loaded.transactions),
    events: eventsByDay(shown, range),
    steps: heatSteps(loaded.days),
    loading: loaded.loading,
    failed: loaded.failed,
  }
}
