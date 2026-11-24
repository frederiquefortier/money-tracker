import type { Category } from '#/lib/categories/category'
import type {
  EventCategoryTotal,
  EventSummary,
} from '#/lib/events/event-calendar'
import { divideRounded, fromMinor, toMinor } from '#/lib/shared/money'

// EVT-05: what each event cost per day in each top-level category, for the comparison's
// stacked columns. Folded from leaf totals so a column's parts add up to its whole.

const DIGITS = 4

/** One top-level category's share of an event, per day, spending positive. */
export type EventPart = { categoryId: string; perDay: string }

function topOf(categories: ReadonlyArray<Category>) {
  const byId = new Map(categories.map((c) => [c.id, c]))
  return (id: string) => {
    let category = byId.get(id)
    while (category?.parentId) category = byId.get(category.parentId)
    return category?.id ?? id
  }
}

/**
 * Each event's parts, largest first. Null for an event with a missing rate, as its total,
 * so a column never shows a partial sum.
 */
export function eventParts(
  summaries: ReadonlyArray<EventSummary>,
  totals: ReadonlyArray<EventCategoryTotal>,
  categories: ReadonlyArray<Category>,
): Map<string, Array<EventPart> | null> {
  const top = topOf(categories)
  const sums = new Map<string, Map<string, bigint> | null>()
  for (const row of totals) {
    if (sums.get(row.eventId) === null) continue
    const minor = row.total === null ? null : toMinor(row.total, DIGITS)
    if (minor === null) {
      sums.set(row.eventId, null)
      continue
    }
    const parts = sums.get(row.eventId) ?? new Map<string, bigint>()
    const group = top(row.categoryId)
    parts.set(group, (parts.get(group) ?? 0n) - minor)
    sums.set(row.eventId, parts)
  }
  return new Map(
    summaries.map((s) => {
      const parts = sums.get(s.event.id)
      if (parts === null) return [s.event.id, null]
      const days = BigInt(s.days)
      return [
        s.event.id,
        [...(parts ?? new Map<string, bigint>())]
          .filter(([, minor]) => minor !== 0n)
          .sort(([, a], [, b]) => (a > b ? -1 : Number(a < b)))
          .map(([categoryId, minor]) => ({
            categoryId,
            perDay: fromMinor(divideRounded(minor, days), DIGITS),
          })),
      ]
    }),
  )
}
