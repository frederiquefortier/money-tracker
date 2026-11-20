import type { EventItem, EventType } from '#/lib/events/event'
import {
  addDays,
  daysIn,
  monthEnd,
  monthOf,
  shiftMonth,
} from '#/lib/shared/months'
import type { DayRange } from '#/lib/shared/months'
import {
  compareDecimal,
  divideRounded,
  fromMinor,
  negateDecimal,
  toMinor,
} from '#/lib/shared/money'

// EVT-04, EVT-05: the events of a period on month grids with what each cost, and the
// events of one type side by side.

const DIGITS = 4

/** An event's total at my share, net (event_totals), signed like a transaction. */
export type EventTotal = {
  eventId: string
  total: string | null
  transactionCount: number
}

export type EventSummary = {
  event: EventItem
  color: string | null
  from: string
  to: string
  days: number
  /** What it cost me, positive; an event that brought money in is negative. Null with a missing rate. */
  spent: string | null
  perDay: string | null
  transactionCount: number
}

function perDayOf(spent: string | null, days: number): string | null {
  if (spent === null) return null
  const minor = toMinor(spent, DIGITS)
  return minor === null
    ? null
    : fromMinor(divideRounded(minor, BigInt(days)), DIGITS)
}

/** Every dated event with its figures. An event with no dates has no place on a calendar. */
export function eventSummaries(
  events: ReadonlyArray<EventItem>,
  types: ReadonlyArray<EventType>,
  totals: ReadonlyArray<EventTotal>,
): Array<EventSummary> {
  const colorOf = new Map(types.map((t) => [t.id, t.color]))
  const totalOf = new Map(totals.map((t) => [t.eventId, t]))
  return events.flatMap((event) => {
    if (event.startsOn === null) return []
    const from = event.startsOn
    const to = event.endsOn ?? event.startsOn
    const days = daysIn(from, to)
    const total = totalOf.get(event.id)
    let spent: string | null = '0'
    if (total) spent = total.total === null ? null : negateDecimal(total.total)
    return [
      {
        event,
        color: event.typeId ? (colorOf.get(event.typeId) ?? null) : null,
        from,
        to,
        days,
        spent,
        perDay: perDayOf(spent, days),
        transactionCount: total?.transactionCount ?? 0,
      },
    ]
  })
}

/** Those overlapping the range, in date order. */
export function summariesIn(
  summaries: ReadonlyArray<EventSummary>,
  range: DayRange,
): Array<EventSummary> {
  return summaries
    .filter((s) => s.from <= range.to && s.to >= range.from)
    .sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to))
}

export function monthsOf(range: DayRange): Array<string> {
  const months: Array<string> = []
  for (
    let month = monthOf(range.from);
    month <= monthOf(range.to);
    month = shiftMonth(month, 1)
  )
    months.push(month)
  return months
}

/**
 * A month as weeks of seven days, `firstDay` 1 (Monday) to 7 (Sunday) as Intl gives it;
 * null pads the days outside the month.
 */
export function monthWeeks(
  month: string,
  firstDay: number,
): Array<Array<string | null>> {
  const first = `${month}-01`
  const weekday = new Date(`${first}T00:00:00Z`).getUTCDay() || 7
  const lead = (weekday - firstDay + 7) % 7
  const cells: Array<string | null> = Array.from({ length: lead }, () => null)
  for (let day = first; day <= monthEnd(month); day = addDays(day, 1))
    cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: Array<Array<string | null>> = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/** The events on each day, for the tints. */
export function eventsByDay(
  summaries: ReadonlyArray<EventSummary>,
  range: DayRange,
): Map<string, Array<EventSummary>> {
  const out = new Map<string, Array<EventSummary>>()
  for (const summary of summaries) {
    const from = summary.from > range.from ? summary.from : range.from
    const to = summary.to < range.to ? summary.to : range.to
    for (let day = from; day <= to; day = addDays(day, 1)) {
      const list = out.get(day) ?? []
      list.push(summary)
      out.set(day, list)
    }
  }
  return out
}

/** EVT-05: one type's events over every year, the costliest first. */
export function typeComparison(
  summaries: ReadonlyArray<EventSummary>,
  typeId: string,
): Array<EventSummary> {
  return summaries
    .filter((s) => s.event.typeId === typeId)
    .sort((a, b) => {
      if (a.spent === null) return b.spent === null ? 0 : 1
      if (b.spent === null) return -1
      return compareDecimal(b.spent, a.spent)
    })
}
