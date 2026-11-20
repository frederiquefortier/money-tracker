import type { CategoryKind } from '#/lib/categories/category'
import { Sum } from '#/lib/dashboard/dashboard'

// The year's heat map (author, 2026-11-19): what I spent each day, my share net of
// repayments as every dashboard figure (ADR-063), from expense categories only so a day
// adds up to the month's Dépensé. A refund booked in an expense category lowers its day.

export type DaySpent = {
  /** "2026-03-14" */
  day: string
  /** Positive when money went out; null when a rate is missing. */
  spent: string | null
}

export type SpendingLine = {
  occurredOn: string
  categoryId: string | null
  amount: string | null
}

export function dailySpending(
  lines: ReadonlyArray<SpendingLine>,
  kindOf: ReadonlyMap<string, CategoryKind>,
): Array<DaySpent> {
  const byDay = new Map<string, Sum>()
  for (const line of lines) {
    if (!line.categoryId || kindOf.get(line.categoryId) !== 'expense') continue
    const sum = byDay.get(line.occurredOn) ?? new Sum()
    sum.add(line.amount, -1n)
    byDay.set(line.occurredOn, sum)
  }
  return [...byDay]
    .map(([day, sum]) => ({ day, spent: sum.value }))
    .filter((d) => d.spent === null || Number(d.spent) !== 0)
    .sort((a, b) => a.day.localeCompare(b.day))
}

/**
 * The upper bound of each of four levels above nothing, at the quartiles of the year's
 * spending days, so one large day does not wash out the others. Numbers for the colour
 * only.
 */
export function heatSteps(days: ReadonlyArray<DaySpent>): Array<number> {
  const spent = days
    .map((d) => (d.spent === null ? 0 : Number(d.spent)))
    .filter((v) => v > 0)
    .sort((a, b) => a - b)
  if (spent.length === 0) return []
  const at = (q: number) =>
    spent[Math.min(spent.length - 1, Math.floor(q * spent.length))]
  return [at(0.25), at(0.5), at(0.75), spent[spent.length - 1]]
}

/** 0 for nothing spent, then 1 to 4. */
export function heatLevel(spent: number, steps: ReadonlyArray<number>): number {
  if (spent <= 0) return 0
  const index = steps.findIndex((step) => spent <= step)
  return index < 0 ? steps.length : index + 1
}
