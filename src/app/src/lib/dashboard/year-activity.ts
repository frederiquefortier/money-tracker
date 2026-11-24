import type { CategoryKind } from '#/lib/categories/category'
import { DIGITS, Sum } from '#/lib/dashboard/dashboard'
import { dailySpending } from '#/lib/dashboard/daily-spending'
import type { DaySpent } from '#/lib/dashboard/daily-spending'
import type { EventSummary } from '#/lib/events/event-calendar'
import { compareDecimal, fromMinor, toMinor } from '#/lib/shared/money'

// One year's days and transactions at my share (ADR-063, ADR-066): the heat maps, the
// events calendar's day boxes and the year in review's highlights (YR-03, YR-04).

/** A line of my_lines with what the calendar needs to name it. */
export type ActivityLine = {
  transactionId: string
  occurredOn: string
  kind: string
  categoryId: string | null
  eventId: string | null
  amount: string | null
}

/** The transaction's merchant and the people on it, from the transactions table. */
export type TransactionDetail = {
  id: string
  merchantId: string | null
  /** Everyone on it, whatever their role, the seller included. */
  personIds: Array<string>
}

export type DayTransaction = {
  id: string
  day: string
  kind: 'expense' | 'income'
  merchantId: string | null
  /** The split with the largest amount, to name a transaction without a merchant. */
  categoryId: string | null
  eventId: string | null
  /** My share, signed like the transaction; null with a missing rate. */
  amount: string | null
  personIds: Array<string>
}

export type YearActivity = {
  days: Array<DaySpent>
  transactions: Array<DayTransaction>
}

const minor = (amount: string | null) =>
  amount === null ? null : toMinor(amount, DIGITS)

const magnitude = (amount: string | null) => {
  const value = minor(amount)
  if (value === null) return -1n
  return value < 0n ? -value : value
}

export function yearActivity(
  lines: ReadonlyArray<ActivityLine>,
  details: ReadonlyArray<TransactionDetail>,
  kindOf: ReadonlyMap<string, CategoryKind>,
): YearActivity {
  const detailOf = new Map(details.map((d) => [d.id, d]))
  const built = new Map<
    string,
    { transaction: DayTransaction; sum: Sum; largest: bigint }
  >()
  for (const line of lines) {
    if (line.kind !== 'expense' && line.kind !== 'income') continue
    let entry = built.get(line.transactionId)
    if (!entry) {
      const detail = detailOf.get(line.transactionId)
      entry = {
        transaction: {
          id: line.transactionId,
          day: line.occurredOn,
          kind: line.kind,
          merchantId: detail?.merchantId ?? null,
          categoryId: line.categoryId,
          eventId: line.eventId,
          amount: null,
          personIds: detail?.personIds ?? [],
        },
        sum: new Sum(),
        largest: magnitude(line.amount),
      }
      built.set(line.transactionId, entry)
    } else if (magnitude(line.amount) > entry.largest) {
      entry.largest = magnitude(line.amount)
      entry.transaction.categoryId = line.categoryId
    }
    entry.sum.add(line.amount)
  }
  return {
    days: dailySpending(
      lines.map((l) => ({
        occurredOn: l.occurredOn,
        categoryId: l.categoryId,
        amount: l.amount,
      })),
      kindOf,
    ),
    transactions: [...built.values()].map(({ transaction, sum }) => ({
      ...transaction,
      amount: sum.value,
    })),
  }
}

/** Each day's transactions, the largest first, one with a missing rate last. */
export function transactionsByDay(
  transactions: ReadonlyArray<DayTransaction>,
): Map<string, Array<DayTransaction>> {
  const out = new Map<string, Array<DayTransaction>>()
  for (const transaction of transactions) {
    const list = out.get(transaction.day) ?? []
    list.push(transaction)
    out.set(transaction.day, list)
  }
  for (const list of out.values())
    list.sort((a, b) =>
      Math.sign(Number(magnitude(b.amount) - magnitude(a.amount))),
    )
  return out
}

/** YR-03: the costliest days, a day with a missing rate left out. */
export function topDays(
  days: ReadonlyArray<DaySpent>,
  count = 3,
): Array<DaySpent> {
  return days
    .filter((d) => d.spent !== null && Number(d.spent) > 0)
    .sort(
      (a, b) =>
        compareDecimal(b.spent ?? '0', a.spent ?? '0') ||
        a.day.localeCompare(b.day),
    )
    .slice(0, count)
}

export type PersonSpent = { personId: string; spent: string; count: number }

/**
 * YR-04: what the expenses each person was on cost me, the most first. A person with an
 * expense at a missing rate is left out rather than ranked on a partial sum.
 */
export function spentWith(
  transactions: ReadonlyArray<DayTransaction>,
): Array<PersonSpent> {
  const sums = new Map<string, { sum: Sum; count: number }>()
  for (const transaction of transactions) {
    if (transaction.kind !== 'expense') continue
    for (const personId of new Set(transaction.personIds)) {
      const entry = sums.get(personId) ?? { sum: new Sum(), count: 0 }
      entry.sum.add(transaction.amount, -1n)
      entry.count += 1
      sums.set(personId, entry)
    }
  }
  return [...sums]
    .flatMap(([personId, { sum, count }]) =>
      sum.minor === null
        ? []
        : [{ personId, spent: fromMinor(sum.minor, DIGITS), count }],
    )
    .sort(
      (a, b) =>
        compareDecimal(b.spent, a.spent) ||
        a.personId.localeCompare(b.personId),
    )
}

export type PersonEvents = { personId: string; count: number }

/** YR-04: how many of the events each person was on, the most first. */
export function eventsWith(
  summaries: ReadonlyArray<EventSummary>,
): Array<PersonEvents> {
  const counts = new Map<string, number>()
  for (const summary of summaries)
    for (const personId of new Set(summary.event.personIds))
      counts.set(personId, (counts.get(personId) ?? 0) + 1)
  return [...counts]
    .map(([personId, count]) => ({ personId, count }))
    .sort((a, b) => b.count - a.count || a.personId.localeCompare(b.personId))
}

/**
 * Lanes for the events of a stretch of days, so an event's bar keeps one height across
 * the days it covers: each takes the lowest lane free on its first day.
 */
export function eventLanes(
  summaries: ReadonlyArray<EventSummary>,
): Map<string, number> {
  const lanes = new Map<string, number>()
  const ends: Array<string> = []
  const sorted = [...summaries].sort(
    (a, b) => a.from.localeCompare(b.from) || b.to.localeCompare(a.to),
  )
  for (const summary of sorted) {
    let lane = ends.findIndex((end) => end < summary.from)
    if (lane < 0) lane = ends.length
    ends[lane] = summary.to
    lanes.set(summary.event.id, lane)
  }
  return lanes
}
