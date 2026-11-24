import type { CategoryKind } from '#/lib/categories/category'
import { DIGITS, Sum } from '#/lib/dashboard/dashboard'
import { dailySpending } from '#/lib/dashboard/daily-spending'
import type { DaySpent } from '#/lib/dashboard/daily-spending'
import { toMinor } from '#/lib/shared/money'

// One year's days and transactions at my share (ADR-063, ADR-066). Argent's Dépenses par
// jour reads the days; the transactions wait for the year in review (improvements.md).

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
