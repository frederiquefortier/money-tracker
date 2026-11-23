import { DIGITS } from '#/lib/dashboard/dashboard'
import type { Sum } from '#/lib/dashboard/dashboard'
import type { Span, TableColumn } from '#/lib/dashboard/category-table'
import { changeBetween } from '#/lib/shared/change'
import type { Change } from '#/lib/shared/change'
import { shiftMonth } from '#/lib/shared/months'
import { toMinor } from '#/lib/shared/money'

// DSH-04: each category against a year earlier, as a percent and as last year's line.

/**
 * What the change column compares (DSH-04, author 2026-11-20): the year so far against the
 * same months a year earlier, as the summary does. Null on everything, which compares
 * nothing, as the summary (author, 2026-11-20).
 */
export type ChangeSpans = { now: Span; then: Span }

export function changeSpans(
  columns: ReadonlyArray<TableColumn>,
): ChangeSpans | null {
  const year = columns.find((c) => c.kind === 'thisYear')
  if (!year) return null
  return {
    now: { key: 'change:now', from: year.from, to: year.to },
    then: {
      key: 'change:then',
      from: shiftMonth(year.from, -12),
      to: shiftMonth(year.to, -12),
    },
  }
}

/** The year whose figures the change compares against: "2025". */
export function changeYear(spans: ChangeSpans): string {
  return spans.then.to.slice(0, 4)
}

/** A row's trend a year earlier: the same months shifted back, on a year only. */
export function lastYearSpans(
  columns: ReadonlyArray<TableColumn>,
  trend: ReadonlyArray<Span>,
): Array<Span> {
  if (!columns.some((c) => c.kind === 'thisYear')) return []
  return trend.map(({ key, from, to }) => ({
    key: `last:${key}`,
    from: shiftMonth(from, -12),
    to: shiftMonth(to, -12),
  }))
}

export function changeOf(
  own: Map<string, Sum> | undefined,
  { now, then }: ChangeSpans,
): Change | null {
  const before = own?.get(then.key)?.value
  const sum = own?.get(now.key)
  const after = sum ? sum.value : '0'
  // Nothing a year earlier: no base to measure from, rather than +∞ %.
  if (!before || after === null || toMinor(before, DIGITS) === 0n) return null
  return changeBetween(before, after)
}
